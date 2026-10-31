from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from supabase import create_client

from app.db.supabase_client import SUPABASE_URL, SUPABASE_KEY

router = APIRouter()
security = HTTPBearer()


class AuthRequest(BaseModel):
    email: str
    password: str


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


@router.post("/register")
def register(data: AuthRequest):
    try:
        client = get_supabase()

        response = client.auth.sign_up({
            "email": data.email,
            "password": data.password
        })

        if not response.user:
            raise HTTPException(
                status_code=400,
                detail="Registration failed"
            )

        return {
            "message": "Registration successful",
            "user_id": str(response.user.id),
            "email": response.user.email,
            "access_token": (
                response.session.access_token
                if response.session else None
            )
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
def login(data: AuthRequest):
    try:
        client = get_supabase()

        response = client.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password
        })

        return {
            "message": "Login successful",
            "user_id": str(response.user.id),
            "email": response.user.email,
            "access_token": response.session.access_token,
            "token_type": "bearer"
        }

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )


@router.get("/me")
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        client = get_supabase()
        token = credentials.credentials

        response = client.auth.get_user(token)

        if not response.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid access token"
            )

        return {
            "user_id": str(response.user.id),
            "email": response.user.email
        }

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired access token"
        )