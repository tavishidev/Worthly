 # CREDITPULSE — API CONTRACT

**Project:** worthly
**Frontend:** React Native + Expo + TypeScript  
**Backend:** Python + FastAPI  
**Database:** Supabase PostgreSQL  
**Authentication:** Supabase Auth  
**API Version:** v1  
**Base Path:** `/api/v1`

---

## 1. PROJECT OVERVIEW

CreditPulse is a financial wellness and credit-readiness assessment platform designed for students, freelancers, gig workers and thin-file users.

The application collects consented financial information, analyses income and expenses, generates a financial wellness score, and provides AI-assisted financial insights.

**MVP workflow:**

1. User signs up or logs in.
2. User completes their financial profile.
3. User provides consent for financial data processing.
4. User uploads a CSV or enters financial transactions manually.
5. Backend validates and processes financial data.
6. Backend generates a Pulse Score.
7. User views dashboard, insights and financial reports.

**Important:** Pulse Score is an experimental financial wellness indicator, not an official CIBIL score or a validated lending decision.

---

## 2. BASE URL

Development:

`http://YOUR_LAPTOP_IP:8000/api/v1`

For example:

`http://192.168.1.5:8000/api/v1`

Production:

`https://your-domain.com/api/v1`

---

## 3. AUTHENTICATION

Authentication is handled by Supabase Auth.

After login, the frontend sends the Supabase access token with protected API requests.

**Required header:**

`Authorization: Bearer <SUPABASE_ACCESS_TOKEN>`

`Content-Type: application/json`

The FastAPI backend must verify the token and identify the logged-in user. The frontend must not send a trusted user ID to decide whose data can be accessed.

---

## 4. API ENDPOINTS

### A. USER PROFILE

**1. Get current user profile**

`GET /users/me`

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "full_name": "Rahul Sharma",
    "email": "rahul@example.com",
    "phone": "9876543210",
    "occupation": "Student",
    "created_at": "2026-10-31T10:00:00Z"
  }
}
```

**2. Create or update profile**

`PUT /users/me`

Request:
```json
{
  "full_name": "Rahul Sharma",
  "phone": "9876543210",
  "occupation": "Student",
  "monthly_income": 15000
}
```

Response:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid",
    "full_name": "Rahul Sharma",
    "occupation": "Student"
  }
}
```

### B. CONSENT MANAGEMENT

**3. Submit user consent**

`POST /consents`

Request:
```json
{
  "consent_given": true,
  "purpose": "Financial wellness assessment",
  "data_categories": [
    "income",
    "expenses",
    "savings",
    "transactions"
  ]
}
```

Response:
```json
{
  "success": true,
  "message": "Consent recorded successfully",
  "data": {
    "consent_id": "uuid",
    "status": "active"
  }
}
```

**4. Get consent status**

`GET /consents/me`

**5. Revoke consent**

`POST /consents/revoke`

Request:
```json
{
  "reason": "User requested revocation"
}
```

### C. FINANCIAL PROFILE

**6. Get financial profile**

`GET /financial-profile`

**7. Create or update financial profile**

`PUT /financial-profile`

Request:
```json
{
  "monthly_income": 25000,
  "monthly_expenses": 12000,
  "monthly_savings": 5000,
  "monthly_obligations": 2000,
  "employment_type": "Freelancer"
}
```

Response:
```json
{
  "success": true,
  "message": "Financial profile saved"
}
```

### D. TRANSACTIONS

**8. Add manual transaction**

`POST /transactions`

Request:
```json
{
  "transaction_date": "2026-10-30",
  "description": "Monthly freelance payment",
  "amount_paise": 2500000,
  "transaction_type": "income",
  "category": "Freelance"
}
```

**Note:** Amounts are stored in paise. ₹25,000 = 2,500,000 paise.

Response:
```json
{
  "success": true,
  "message": "Transaction added",
  "data": {
    "transaction_id": "uuid"
  }
}
```

**9. Upload transaction CSV**

`POST /transactions/upload`

Content-Type: `multipart/form-data`

Form field:

`file: transactions.csv`

Response:
```json
{
  "success": true,
  "message": "CSV uploaded successfully",
  "data": {
    "upload_id": "uuid",
    "total_rows": 100,
    "successful_rows": 95,
    "failed_rows": 5,
    "status": "processed"
  }
}
```

**10. Get upload status**

`GET /transactions/upload/{upload_id}`

**11. Get transactions**

`GET /transactions?page=1&limit=20`

**12. Get monthly summaries**

`GET /transactions/monthly-summary`

### E. DASHBOARD

**13. Get dashboard summary**

`GET /dashboard/summary`

Response:
```json
{
  "success": true,
  "data": {
    "pulse_score": 720,
    "score_label": "Good",
    "monthly_income": 25000,
    "monthly_expenses": 12000,
    "monthly_savings": 13000,
    "savings_ratio": 52,
    "score_change": 15,
    "last_assessment_date": "2026-10-31"
  }
}
```

### F. PULSE SCORE / ASSESSMENT

**14. Generate financial assessment**

`POST /assessments`

Request:
```json
{
  "period_months": 6
}
```

Response:
```json
{
  "success": true,
  "data": {
    "assessment_id": "uuid",
    "pulse_score": 720,
    "score_label": "Good",
    "factors": {
      "income_consistency": 80,
      "savings_ratio": 75,
      "bill_payment": 90,
      "cash_flow_stability": 70,
      "obligation_burden": 85
    },
    "created_at": "2026-10-31T10:00:00Z"
  }
}
```

**15. Get latest assessment**

`GET /assessments/latest`

**16. Get assessment history**

`GET /assessments/history`

### G. AI INSIGHTS

**17. Generate financial insights**

`POST /insights/generate`

Request:
```json
{
  "assessment_id": "uuid"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "positive",
        "title": "Good savings habit",
        "description": "You are saving a healthy portion of your income."
      },
      {
        "type": "warning",
        "title": "Improve cash flow stability",
        "description": "Try maintaining a consistent monthly income."
      }
    ]
  }
}
```

**18. Get saved insights**

`GET /insights`

### H. REPORTS

**19. Generate financial report**

`POST /reports/generate`

Request:
```json
{
  "assessment_id": "uuid",
  "format": "json"
}
```

**20. Get all reports**

`GET /reports`

**21. Get specific report**

`GET /reports/{report_id}`

---

## 5. STANDARD API RESPONSE FORMAT

Successful response:

```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": []
  }
}
```

### HTTP STATUS CODES

- 200 — Successful request
- 201 — Resource created
- 400 — Invalid request
- 401 — Unauthorized
- 403 — Consent or permission denied
- 404 — Resource not found
- 422 — Validation error
- 500 — Internal server error

---

## 6. DATABASE TABLES

The backend and database team should coordinate around these tables:

1. `profiles`
2. `consents`
3. `financial_profiles`
4. `data_sources`
5. `transactions`
6. `monthly_summaries`
7. `assessments`
8. `assessment_factors`
9. `insights`
10. `reports`

All user-owned financial records must be associated with the authenticated user's UUID.

Row Level Security (RLS) must prevent users from accessing other users' records.

---

## 7. IMPORTANT BUSINESS RULES

1. A user must provide consent before financial data is processed.
2. Users can only access their own financial information.
3. CSV uploads must validate file type, columns, dates and amounts.
4. Duplicate transactions must be handled safely.
5. Financial amounts must use integer paise internally.
6. Pulse Score must be explainable through individual financial factors.
7. AI-generated insights must be based on the user's assessment data.
8. Revoked consent must prevent further processing under that consent.
9. Never expose the Supabase service-role key in the mobile application.
10. Do not represent Pulse Score as an official credit bureau score.

---

## 8. RESPONSIBILITY SPLIT

**Frontend Team**
- React Native screens
- API integration
- Form validation
- CSV upload interface
- Dashboard and report display
- Authentication and consent UI

**Backend Team**
- FastAPI routes
- JWT verification
- Request validation
- CSV processing
- Assessment calculations
- Insights generation
- API responses

**Database Team**
- Supabase configuration
- PostgreSQL tables
- Relationships and constraints
- Row Level Security
- Database testing

---

## 9. API INTEGRATION RULE

The frontend must call APIs through service files.

Example:

`dashboard.tsx` → `dashboard.service.ts` → `api.ts` → FastAPI → Supabase

The frontend must not directly access database tables for protected financial operations.

**END OF API CONTRACT**