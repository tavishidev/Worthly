# Worthly mobile app

Worthly is a React Native and Expo financial wellness app built with TypeScript
and Expo Router. It helps people review financial activity, explore an
experimental Pulse Score, and understand sample or backend-provided insights.

## Run locally

```bash
npm install
npx expo start
```

Set the `EXPO_PUBLIC_*` values shown in `.env.example` to connect Supabase and
the API. Without the required configuration, supported features use their
local preview mode; sample values and mock responses are identified in the UI.
CSV selection in preview mode does not parse or import transactions.

## Main screens

- Welcome, sign in, and account creation
- Consent and financial profile onboarding
- Dashboard, transactions, assessment, and insights
- CSV submission and JSON report history
- Profile and secondary tools

Primary signed-in destinations are available from the bottom navigation.
Reports, profile setup, consent, and CSV submission are available from the
dashboard and the More screen.

## Validation

```bash
npx tsc --noEmit
npx expo lint
```
