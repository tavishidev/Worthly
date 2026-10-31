from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from supabase import create_client

from app.db.supabase_client import SUPABASE_URL, SUPABASE_KEY

router = APIRouter()
security = HTTPBearer()


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    occupation: str | None = None
    employment_type: str | None = None
    monthly_income_range: str | None = None


def get_authenticated_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)

        # Verify the user's access token
        response = client.auth.get_user(token)

        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Use the user's JWT for database requests so RLS applies
        client.postgrest.auth(token)

        return client, str(response.user.id)

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired access token"
        )


@router.get("/")
def get_profile(auth=Depends(get_authenticated_user)):
    client, user_id = auth

    response = (
        client.table("profiles")
        .select("*")
        .eq("id", user_id)
        .execute()
    )

    if not response.data:
        return {"message": "Profile not created yet", "profile": None}

    return {"profile": response.data[0]}


@router.put("/")
def update_profile(
    data: ProfileUpdate,
    auth=Depends(get_authenticated_user)
):
    client, user_id = auth

    profile_data = data.model_dump(exclude_unset=True)
    profile_data["id"] = user_id

    existing = (
        client.table("profiles")
        .select("id")
        .eq("id", user_id)
        .execute()
    )

    if existing.data:
        response = (
            client.table("profiles")
            .update(profile_data)
            .eq("id", user_id)
            .execute()
        )
    else:
        response = (
            client.table("profiles")
            .insert(profile_data)
            .execute()
        )

    return {
        "message": "Profile saved successfully",
        "profile": response.data[0] if response.data else None
    }