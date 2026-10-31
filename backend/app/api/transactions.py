import csv
import io
import uuid
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Literal

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, PositiveInt, field_validator
from supabase import create_client

from app.db.supabase_client import SUPABASE_URL, SUPABASE_KEY

router = APIRouter()
security = HTTPBearer()


class TransactionCreate(BaseModel):
    transaction_date: date
    description: str = Field(min_length=1, max_length=100)
    amount_paise: PositiveInt
    transaction_type: Literal["income", "expense"]
    category: str = Field(min_length=1, max_length=80)

    @field_validator("description", "category")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value


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


@router.post("")
def create_transaction(
    data: TransactionCreate,
    auth=Depends(get_authenticated_user)
):
    client, user_id = auth

    transaction = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "transaction_date": data.transaction_date.isoformat(),
        "description": data.description,
        "amount_paise": data.amount_paise,
        # CSV ingestion and analysis use debit/credit; the app uses expense/income.
        "transaction_type": "credit" if data.transaction_type == "income" else "debit",
        "category": data.category,
        "is_internal_transfer": False,
    }

    try:
        response = client.table("transactions").insert(transaction).execute()
        saved = response.data[0] if response.data else transaction
        return {
            "success": True,
            "message": "Transaction added",
            "data": {
                "transaction_id": saved["id"],
                "transaction": {
                    **saved,
                    "transaction_type": data.transaction_type,
                },
            },
        }
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not save the transaction. Check the transactions table and RLS insert policy.",
        )


@router.get("")
def get_transactions(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    auth=Depends(get_authenticated_user),
):
    client, user_id = auth
    start = (page - 1) * limit
    end = start + limit - 1

    try:
        response = (
            client.table("transactions")
            .select("*")
            .eq("user_id", user_id)
            .order("transaction_date", desc=True)
            .range(start, end)
            .execute()
        )
        records = response.data or []
        for record in records:
            record["transaction_type"] = {
                "credit": "income",
                "debit": "expense",
            }.get(str(record.get("transaction_type", "")).lower(), record.get("transaction_type"))

        return {"success": True, "data": records, "page": page, "limit": limit}
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not load transactions. Check the transactions table and RLS select policy.",
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
