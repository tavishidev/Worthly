from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from supabase import create_client

from app.db.supabase_client import SUPABASE_URL, SUPABASE_KEY

router = APIRouter()
security = HTTPBearer()


class ConsentRequest(BaseModel):
    purpose: str
    consent_given: bool
    consent_version: str = "1.0"


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
            detail="Invalid or expired token"
        )


@router.post("/")
def save_consent(
    data: ConsentRequest,
    auth=Depends(get_authenticated_user)
):
    client, user_id = auth

    try:
        response = client.table("consents").insert({
            "user_id": user_id,
            "purpose": data.purpose,
            "consent_given": data.consent_given,
            "consent_version": data.consent_version
        }).execute()

        return {
            "message": "Consent saved successfully",
            "consent": response.data[0] if response.data else None
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me")
def get_my_consents(
    auth=Depends(get_authenticated_user)
):
    client, user_id = auth

    response = (
        client.table("consents")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    return {"consents": response.data}