import AsyncStorage from "@react-native-async-storage/async-storage";

import { FinancialProfile } from "../types/financial";

const MOCK_FINANCIAL_PROFILE_KEY = "worthly_mock_financial_profile";

export async function saveFinancialProfile(
  profile: FinancialProfile
) {
  if (isBackendConfigured()) {
    const { api } = await import("./api");
    const response = await api.put("/financial-profile/me", profile);
    return response.data;
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
    const response = await api.get("/financial-profile/me");
    return response.data;
  }

  const savedProfile = await AsyncStorage.getItem(MOCK_FINANCIAL_PROFILE_KEY);

  return {
    success: true,
    mock: true,
    data: savedProfile ? (JSON.parse(savedProfile) as FinancialProfile) : null,
  };
}

function isBackendConfigured() {
  return Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_URL &&
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.EXPO_PUBLIC_API_URL
  );
}