
export interface DashboardSummary {
  pulse_score: number | null;
  score_label: string;
  monthly_income: number;
  monthly_expenses: number;
  monthly_savings: number;
  savings_ratio: number;
  score_change: number;
  last_assessment_date: string | null;
}

function isBackendConfigured() {
  return Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_URL &&
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.EXPO_PUBLIC_API_URL
  );
}

export async function getDashboardSummary(): Promise<{
  success: boolean;
  mock?: boolean;
  data: DashboardSummary;
}> {
  if (isBackendConfigured()) {
    const { api } = await import("./api");
    const response = await api.get("/dashboard/summary");

    // The API contract wraps the dashboard fields inside "data".
    return {
      success: response.data.success,
      data: response.data.data,
    };
  }

  // Sample values for frontend development only.
  return {
    success: true,
    mock: true,
    data: {
      pulse_score: 72,
      score_label: "Good",
      monthly_income: 40000,
      monthly_expenses: 25000,
      monthly_savings: 15000,
      savings_ratio: 37.5,
      score_change: 4,
      last_assessment_date: null,
    },
  };
}
