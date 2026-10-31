import csv
import io
import uuid
from datetime import date
from decimal import Decimal, InvalidOperation

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client

from app.db.supabase_client import SUPABASE_URL, SUPABASE_KEY

router = APIRouter()
security = HTTPBearer()


def get_authenticated_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        response = client.auth.get_user(token)

        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid token")

        client.postgrest.auth(token)

        return client, str(response.user.id)

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired access token"
        )


@router.post("/upload/csv")
async def upload_csv(
    file: UploadFile = File(...),
    auth=Depends(get_authenticated_user)
):
    client, user_id = auth

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Only CSV files are allowed")

    content = await file.read()

    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(400, "File size must be below 5 MB")

    try:
        text = content.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))

        if not reader.fieldnames:
            raise HTTPException(400, "CSV file is empty")

        reader.fieldnames = [
            name.strip().lower() for name in reader.fieldnames
        ]

        required = {"date", "description", "amount"}

        if not required.issubset(set(reader.fieldnames)):
            raise HTTPException(
                400,
                "CSV must contain date, description and amount columns"
            )

        transactions = []
        dates = []

        for row_number, row in enumerate(reader, start=2):
            try:
                transaction_date = date.fromisoformat(
                    row["date"].strip()
                )

                amount = Decimal(row["amount"].strip())

                if not amount.is_finite() or amount == 0:
                    raise ValueError("Amount must be a non-zero number")

                amount_paise_decimal = abs(amount) * 100

                if amount_paise_decimal != amount_paise_decimal.to_integral_value():
                    raise ValueError("Amount can have at most 2 decimal places")

                amount_paise = int(amount_paise_decimal)

                transaction_type = (
                    row.get("transaction_type") or ""
                ).strip().lower()

                if not transaction_type:
                    transaction_type = (
                        "debit" if amount < 0 else "credit"
                    )

                if transaction_type not in ("debit", "credit"):
                    raise ValueError(
                        "transaction_type must be debit or credit"
                    )

                dates.append(transaction_date)

                transactions.append({
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "transaction_date": transaction_date.isoformat(),
                    "description": (
                        row.get("description") or ""
                    ).strip(),
                    "amount_paise": amount_paise,
                    "transaction_type": transaction_type,
                    "category": (
                        (row.get("category") or "").strip() or None
                    ),
                    "is_internal_transfer": False
                })

            except (ValueError, InvalidOperation, AttributeError) as e:
                raise HTTPException(
                    400,
                    f"Invalid data at CSV row {row_number}: {str(e)}"
                )

        if not transactions:
            raise HTTPException(400, "No transactions found in CSV")

        if len(transactions) > 1000:
            raise HTTPException(
                400,
                "Maximum 1000 transactions allowed per upload"
            )

        source_id = str(uuid.uuid4())

        client.table("data_sources").insert({
            "id": source_id,
            "user_id": user_id,
            "source_type": "csv",
            "file_name": file.filename,
            "period_start": min(dates).isoformat(),
            "period_end": max(dates).isoformat(),
            "status": "processed"
        }).execute()

        for transaction in transactions:
            transaction["source_id"] = source_id

        try:
            client.table("transactions").insert(
                transactions
            ).execute()

        except Exception:
            client.table("data_sources").delete().eq(
                "id", source_id
            ).execute()
            raise

        return {
            "message": "CSV uploaded successfully",
            "source_id": source_id,
            "total_transactions": len(transactions),
            "period_start": min(dates).isoformat(),
            "period_end": max(dates).isoformat()
        }

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            400,
            "CSV processing or database insertion failed. Check your CSV and database."
        )