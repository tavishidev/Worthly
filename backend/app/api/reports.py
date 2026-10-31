import httpx
import os
from io import BytesIO
from uuid import uuid4
from datetime import datetime
from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from supabase import create_client

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle
)

load_dotenv()

router = APIRouter()
security = HTTPBearer()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


def get_authenticated_client(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    try:
        user_response = client.auth.get_user(token)
        user = user_response.user

        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")

        client.postgrest.auth(token)

        return client, user.id, token

    except HTTPException:
        raise
    except Exception as e:
        print("AUTHENTICATION ERROR:", repr(e))
        raise HTTPException(
            status_code=401,
            detail="Authentication failed"
    )


@router.post("/generate/{assessment_id}")
def generate_report(
    assessment_id: str,
    auth=Depends(get_authenticated_client)
):
    client, user_id, token = auth

    assessment = (
        client.table("assessments")
        .select("id")
        .eq("id", assessment_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not assessment.data:
        raise HTTPException(status_code=404, detail="Assessment not found")

    report_data = {
        "id": str(uuid4()),
        "user_id": user_id,
        "assessment_id": assessment_id,
        "report_url": None
    }

    result = client.table("reports").insert(report_data).execute()

    return {
        "message": "Report record created successfully",
        "report": result.data[0]
    }


@router.get("/me")
def get_my_reports(auth=Depends(get_authenticated_client)):
    client, user_id, token = auth

    result = (
        client.table("reports")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    return {
        "message": "Reports retrieved successfully",
        "total_reports": len(result.data),
        "reports": result.data
    }


@router.get("/{assessment_id}/download")
def download_report(
    assessment_id: str,
    auth=Depends(get_authenticated_client)
):
    client, user_id, token = auth

    # Find this user's report
    result = (
        client.table("reports")
        .select("report_url")
        .eq("assessment_id", assessment_id)
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not result.data or not result.data[0].get("report_url"):
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    file_path = result.data[0]["report_url"]

    # Download PDF from private Supabase Storage
    storage_url = (
        f"{SUPABASE_URL}/storage/v1/object/authenticated/"
        f"worthly-reports/{file_path}"
    )

    response = httpx.get(
        storage_url,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {token}"
        },
        timeout=30.0
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail="Could not download report from storage"
        )

    return StreamingResponse(
        iter([response.content]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="Worthly_Report_{assessment_id}.pdf"'
            )
        }
    )

@router.get("/{assessment_id}/pdf")
def download_assessment_pdf(
    assessment_id: str,
    auth=Depends(get_authenticated_client)
):
    client, user_id, token = auth

    # 1. Fetch the user's assessment
    assessment_result = (
        client.table("assessments")
        .select("*")
        .eq("id", assessment_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not assessment_result.data:
        raise HTTPException(status_code=404, detail="Assessment not found")

    assessment = assessment_result.data[0]

    # 2. Fetch assessment factors
    factors_result = (
        client.table("assessment_factors")
        .select("*")
        .eq("assessment_id", assessment_id)
        .execute()
    )

    factors = factors_result.data or []

    # 3. Fetch this user's transactions
    transactions_result = (
        client.table("transactions")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )

    transactions = [
        t for t in (transactions_result.data or [])
        if not t.get("is_internal_transfer", False)
    ]

    # 4. Calculate financial summary
    total_income = 0
    total_expenses = 0

    for transaction in transactions:
        amount = abs(int(transaction.get("amount_paise") or 0))
        transaction_type = str(
            transaction.get("transaction_type") or ""
        ).lower()

        if transaction_type in ["credit", "income"]:
            total_income += amount
        elif transaction_type in ["debit", "expense"]:
            total_expenses += amount

    net_savings = total_income - total_expenses

    def rupees(amount):
        return f"Rs. {amount / 100:,.2f}"

    # 5. Create PDF in memory
    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=45,
        leftMargin=45,
        topMargin=45,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "WorthlyTitle",
        parent=styles["Title"],
        fontSize=25,
        textColor=colors.HexColor("#263B80"),
        spaceAfter=8
    )

    heading_style = ParagraphStyle(
        "WorthlyHeading",
        parent=styles["Heading2"],
        textColor=colors.HexColor("#263B80"),
        spaceBefore=16,
        spaceAfter=8
    )

    story = []

    story.append(Paragraph("WORTHLY", title_style))
    story.append(Paragraph(
        "Financial Assessment Report",
        styles["Heading2"]
    ))
    story.append(Paragraph(
        f"Generated on: {datetime.now().strftime('%d %B %Y, %I:%M %p')}",
        styles["Normal"]
    ))

    story.append(Spacer(1, 20))

    # Assessment score
    score = assessment.get("pulse_score")

    story.append(Paragraph("Worthly Pulse Score", heading_style))

    score_text = (
        f"{float(score):.2f} / 100"
        if score is not None
        else "Not available"
    )

    score_data = [
        ["Pulse Score", score_text],
        ["Assessment Status", assessment.get("assessment_status", "N/A")],
        ["Data Coverage", f"{assessment.get('data_coverage_months', 0)} month(s)"],
        ["Model Version", assessment.get("model_version", "N/A")]
    ]

    score_table = Table(score_data, colWidths=[180, 270])

    score_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#E8EDF8")),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#222222")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("PADDING", (0, 0), (-1, -1), 9),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
    ]))

    story.append(score_table)

    # Financial summary
    story.append(Paragraph("Financial Summary", heading_style))

    financial_data = [
        ["Metric", "Amount"],
        ["Total Income", rupees(total_income)],
        ["Total Expenses", rupees(total_expenses)],
        ["Net Savings", rupees(net_savings)],
        ["Transactions Analysed", str(len(transactions))]
    ]

    financial_table = Table(financial_data, colWidths=[225, 225])

    financial_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#263B80")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("PADDING", (0, 0), (-1, -1), 9),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ]))

    story.append(financial_table)

    # Assessment factors
    story.append(Paragraph("Assessment Factor Breakdown", heading_style))

    factor_data = [
        ["Factor", "Score", "Weight", "Explanation"]
    ]

    for factor in factors:
        factor_name = str(
            factor.get("factor_name", "N/A")
        ).replace("_", " ").title()

        factor_score = factor.get("factor_score")

        score_value = (
            f"{float(factor_score):.2f}"
            if factor_score is not None
            else "Insufficient data"
        )

        weight = factor.get("weight")
        weight_value = f"{weight}%" if weight is not None else "N/A"

        explanation = escape(
            str(factor.get("explanation") or "No explanation available")
        )

        factor_data.append([
            factor_name,
            score_value,
            weight_value,
            Paragraph(explanation, styles["BodyText"])
        ])

    factor_table = Table(
        factor_data,
        colWidths=[115, 65, 65, 205],
        repeatRows=1
    )

    factor_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#263B80")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("PADDING", (0, 0), (-1, -1), 7),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ]))

    story.append(factor_table)

    # Disclaimer
    story.append(Spacer(1, 25))
    story.append(Paragraph("Important Disclaimer", heading_style))
    story.append(Paragraph(
        "This report is generated using Worthly's prototype assessment "
        "methodology and the financial data provided by the user. "
        "The Worthly Pulse Score is an experimental indicator, not a "
        "validated credit score, credit bureau score, or lending decision. "
        "It should not be used as the sole basis for financial decisions.",
        styles["BodyText"]
    ))

    story.append(Spacer(1, 15))
    story.append(Paragraph(
        "Generated by Worthly | Financial Inclusion Through Alternative Data",
        styles["Italic"]
    ))

    document.build(story)

    # 6. Upload PDF to Supabase Storage
    # 6. Upload PDF to Supabase Storage
    file_path = f"{user_id}/{assessment_id}/{uuid4()}.pdf"
    pdf_bytes = buffer.getvalue()

    try:
        storage_url = (
            f"{SUPABASE_URL}/storage/v1/object/"
            f"worthly-reports/{file_path}"
        )

        response = httpx.post(
            storage_url,
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/pdf"
            },
            content=pdf_bytes,
            timeout=30.0
        )

        if response.status_code not in (200, 201):
            raise Exception(
                f"Storage upload failed: {response.status_code} - {response.text}"
            )

        existing_report = (
            client.table("reports")
            .select("id")
            .eq("assessment_id", assessment_id)
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        if existing_report.data:
            client.table("reports").update({
                "report_url": file_path
            }).eq(
                "id", existing_report.data[0]["id"]
            ).eq("user_id", user_id).execute()

        else:
            client.table("reports").insert({
                "id": str(uuid4()),
                "user_id": user_id,
                "assessment_id": assessment_id,
                "report_url": file_path
            }).execute()

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
        
            
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="Worthly_Report_{assessment_id}.pdf"'
            )
        }
    )
