import AsyncStorage from "@react-native-async-storage/async-storage";

import { FinancialProfile } from "../types/financial";
import { isBackendConfigured } from "./api";

const MOCK_FINANCIAL_PROFILE_KEY = "worthly_mock_financial_profile";

export async function saveFinancialProfile(
  profile: FinancialProfile
) {
  if (isBackendConfigured()) {
    const { api } = await import("./api");
    const response = await api.put("/profile/", {
      employment_type: profile.employment_type,
      monthly_income_range: incomeRange(profile.monthly_income),
    });
    return {
      ...response.data,
      message: "Saved your income range and employment type. Exact income, expenses, savings, and debt are not stored by the current API contract.",
    };
  }

  await AsyncStorage.setItem(
    MOCK_FINANCIAL_PROFILE_KEY,
    JSON.stringify(profile)
  );

  return {
    success: true,
    mock: true,
    message: "Financial profile saved locally in mock mode.",
    data: profile,
  };
}

export async function getFinancialProfile() {
  if (isBackendConfigured()) {
    const { api } = await import("./api");
    const response = await api.get("/profile/");
    const body = response.data?.data ?? response.data;
    const profile = body?.profile ?? body;
    return {
      ...response.data,
      data: {
        ...profile,
        monthly_income: estimateIncome(profile?.monthly_income_range),
      },
    };
  }

  const savedProfile = await AsyncStorage.getItem(MOCK_FINANCIAL_PROFILE_KEY);

  return {
    success: true,
    mock: true,
    data: savedProfile ? (JSON.parse(savedProfile) as FinancialProfile) : null,
  };
}

function incomeRange(income: number) {
  if (income < 15000) return "under_15000";
  if (income < 30000) return "15000_29999";
  if (income < 50000) return "30000_49999";
  if (income < 100000) return "50000_99999";
  return "100000_plus";
}

function estimateIncome(range?: string | null) {
  if (!range) return 0;
  const match = range.match(/\d+/g);
  if (!match?.length) return 1;
  const amounts = match.map(Number);
  return amounts.length > 1 ? (amounts[0] + amounts[1]) / 2 : amounts[0];
}
