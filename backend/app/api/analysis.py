from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client

from app.db.supabase_client import SUPABASE_URL, SUPABASE_KEY
from app.services.transaction_analysis import analyze_transactions

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


@router.get("/transactions")
def transaction_analysis(
    auth=Depends(get_authenticated_user)
):
    client, user_id = auth

    try:
        response = (
            client.table("transactions")
            .select(
                "transaction_date, amount_paise, transaction_type, "
                "category, is_internal_transfer"
            )
            .eq("user_id", user_id)
            .order("transaction_date")
            .execute()
        )

        if not response.data:
            return {
                "message": "No transactions found. Upload a CSV first.",
                "analysis": None
            }

        result = analyze_transactions(response.data)

        return {
            "message": "Transaction analysis completed",
            "analysis": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Transaction analysis failed: {str(e)}"
        )