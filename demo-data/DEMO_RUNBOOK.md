# Worthly judge demo runbook

The included CSV is synthetic, contains no real person's financial data, and has 72 transactions over six complete months. It is suitable for a dedicated demo account; CSV uploads append records, so upload it only once per account (or create a fresh demo account before rehearsing again).

## Before the demo

1. On the backend laptop, make sure the backend branch/PR containing `POST /api/v1/transactions` and `GET /api/v1/transactions` has been merged into the branch being run. Restart FastAPI after switching branches:

   ```powershell
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. Keep the backend laptop awake and both laptops/phones on the same network. In the app's `.env.local`, set `EXPO_PUBLIC_API_URL` to the backend laptop's reachable LAN address, for example `http://10.53.2.78:8000/api/v1` (never `127.0.0.1` for a phone). Confirm `http://<backend-lan-ip>:8000/health` and `/docs` load from the phone.

3. Start/restart Expo so it reads the environment, clearing stale Metro configuration if needed:

   ```powershell
   npx expo start --clear
   ```

4. In Supabase, confirm the demo project has the required tables, RLS policies, and a private `worthly-reports` Storage bucket. The backend `.env` must contain its server-side Supabase URL/key; never put the service-role key in Expo variables. Allow the backend laptop through its firewall on port 8000.

## Suggested judge walkthrough

1. Register a dedicated demo user, accept the consent screen, and finish onboarding. The current FastAPI profile API stores employment type and an income range; it does not persist the exact expenses/savings/debt fields entered in the app.
2. Go to **Add transactions / Upload CSV** and select `worthly-demo-transactions.csv`. Expected upload: 72 rows, six months from May through October 2026, two income credits and ten expenses in each month. Use a fresh demo account to avoid duplicate uploads.
3. Open the dashboard and transactions view to show the imported records and category/spending summary.
4. Generate the assessment after import; the data includes recurring income in all six months and should satisfy the minimum history requirement.
5. Generate a PDF report after the assessment exists. The app calls the backend `/reports/{assessment_id}/pdf` route, saves the PDF to the private Storage bucket, and opens it on the device. Confirm the bucket and write permissions before the demo.

## CSV contract

Header: `date,description,amount,transaction_type,category`. Dates are ISO `YYYY-MM-DD`; amounts are positive rupee values with at most two decimal places; transaction types are `credit` or `debit`. Do not add a currency symbol or thousands separators. The backend derives user ownership from the signed-in bearer token, so do not add a `user_id` column.
