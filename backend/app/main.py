from app.api.auth import router as auth_router
from app.api.profile import router as profile_router
from app.api.consent import router as consent_router
from app.api.transactions import router as transactions_router
from app.api.analysis import router as analysis_router
from app.api.assessment import router as assessment_router
from app.api.reports import router as reports_router
from fastapi import FastAPI
from app.db.supabase_client import supabase

app = FastAPI(
    title="Worthly API",
    description="AI-powered alternative credit scoring platform",
    version="1.0.0"
)
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])

app.include_router(
    profile_router,
    prefix="/api/v1/profile",
    tags=["Profile"]
)

app.include_router(
    consent_router,
    prefix="/api/v1/consents",
    tags=["Consent"]
)

app.include_router(
    transactions_router,
    prefix="/api/v1/transactions",
    tags=["Transactions"]
)

app.include_router(
    analysis_router,
    prefix="/api/v1/analysis",
    tags=["Analysis"]
)

app.include_router(
    assessment_router,
    prefix="/api/v1/assessment",
    tags=["Assessment"]
)


app.include_router(
    reports_router,
    prefix="/api/v1/reports",
    tags=["Reports"]
)

@app.get("/")
def home():
    return {
        "message": "Welcome to Worthly API",
        "status": "running"
    }


@app.get("/health")
def health_check():
    try:
        supabase.table("profiles").select("id").limit(1).execute()

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:
        return {
            "status": "error",
            "database": "disconnected",
            "details": str(e)
        }