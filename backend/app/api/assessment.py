import uuid

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client

from app.db.supabase_client import SUPABASE_URL, SUPABASE_KEY
from app.services.assessment_engine import calculate_assessment

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


@router.post("/generate")
def generate_assessment(
    auth=Depends(get_authenticated_user)
):
    client, user_id = auth

    try:
        # Fetch authenticated user's transactions
        response = (
            client.table("transactions")
            .select(
                "transaction_date, amount_paise, transaction_type, "
                "is_internal_transfer"
            )
            .eq("user_id", user_id)
            .order("transaction_date")
            .execute()
        )

        transactions = response.data

        if not transactions:
            raise HTTPException(
                status_code=400,
                detail="Upload transactions before generating an assessment."
            )

        # Calculate score and factors
        result = calculate_assessment(transactions)

        if result["pulse_score"] is None:
            raise HTTPException(
                status_code=400,
                detail="Not enough financial data to generate a score."
            )

        assessment_id = str(uuid.uuid4())

        # Save assessment
        assessment_record = {
            "id": assessment_id,
            "user_id": user_id,
            "pulse_score": result["pulse_score"],
            "score_scale": result["score_scale"],
            "data_coverage_months": result["data_coverage_months"],
            "assessment_status": result["assessment_status"],
            "model_version": result["model_version"]
        }

        client.table("assessments").insert(
            assessment_record
        ).execute()

        # Save individual factors
        factor_records = []

        for factor in result["factors"]:
            factor_records.append({
                "id": str(uuid.uuid4()),
                "assessment_id": assessment_id,
                "factor_name": factor["factor_name"],
                "factor_score": factor["factor_score"],
                "weight": factor["weight"],
                "explanation": factor["explanation"]
            })

        client.table("assessment_factors").insert(
            factor_records
        ).execute()

        return {
            "message": "Worthly assessment generated successfully",
            "assessment_id": assessment_id,
            "assessment": result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Assessment generation failed: {str(e)}"
        )


@router.get("/history")
def get_assessment_history(
    auth=Depends(get_authenticated_user)
):
    client, user_id = auth

    try:
        response = (
            client.table("assessments")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        assessments = response.data or []

        if not assessments:
            return {
                "message": "No assessment history found",
                "total_assessments": 0,
                "history": []
            }

        assessment_ids = [item["id"] for item in assessments]

        factors_response = (
            client.table("assessment_factors")
            .select("*")
            .in_("assessment_id", assessment_ids)
            .execute()
        )

        all_factors = factors_response.data or []

        history = []

        for assessment in assessments:
            assessment_factors = [
                factor for factor in all_factors
                if factor["assessment_id"] == assessment["id"]
            ]

            history.append({
                "assessment": assessment,
                "factors": assessment_factors
            })

        return {
            "message": "Assessment history retrieved successfully",
            "total_assessments": len(history),
            "history": history
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not retrieve assessment history: {str(e)}"
        )


@router.get("/{assessment_id}")
def get_assessment_details(
    assessment_id: str,
    auth=Depends(get_authenticated_user)
):
    client, user_id = auth

    try:
        response = (
            client.table("assessments")
            .select("*")
            .eq("id", assessment_id)
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Assessment not found"
            )

        assessment = response.data[0]

        factors_response = (
            client.table("assessment_factors")
            .select("*")
            .eq("assessment_id", assessment_id)
            .execute()
        )

        return {
            "message": "Assessment details retrieved successfully",
            "assessment": assessment,
            "factors": factors_response.data or []
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not retrieve assessment: {str(e)}"
        )  