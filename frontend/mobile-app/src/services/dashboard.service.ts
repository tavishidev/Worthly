import { isBackendConfigured } from "./api";

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

export async function getDashboardSummary(): Promise<{
  success: boolean;
  mock?: boolean;
  data: DashboardSummary;
}> {
  if (isBackendConfigured()) {
    const { api } = await import("./api");
    const [analysisResponse, historyResponse] = await Promise.all([
      api.get("/analysis/transactions"),
      api.get("/assessment/history"),
    ]);
    const analysisBody = analysisResponse.data?.data ?? analysisResponse.data ?? {};
    const analysis = analysisBody?.analysis ?? analysisBody ?? {};
    const historyBody = historyResponse.data?.data ?? historyResponse.data;
    const history = Array.isArray(historyBody) ? historyBody : historyBody?.history ?? historyBody?.assessments ?? [];
    const latestRecord = history[0]?.assessment ?? history[0] ?? null;
    const months = Math.max(1, Array.isArray(analysis.monthly_income) ? analysis.monthly_income.length : Number(latestRecord?.data_coverage_months ?? 1));
    const income = Number(analysis.average_monthly_income_rupees ?? (Number(analysis.total_income_rupees ?? 0) / months));
    const totalExpenses = Number(analysis.total_expenses_rupees ?? Number(analysis.total_expenses ?? 0));
    const expenses = Number(analysis.average_monthly_expenses_rupees ?? (totalExpenses / months));
    const latestScore = Number(latestRecord?.pulse_score ?? latestRecord?.score);
    return {
      success: true,
      data: {
        pulse_score: Number.isFinite(latestScore) ? latestScore : null,
        score_label: latestRecord?.score_label ?? (Number.isFinite(latestScore) ? (latestScore >= 80 ? "Strong" : latestScore >= 60 ? "Good" : latestScore >= 40 ? "Developing" : "Needs attention") : "Awaiting assessment"),
        monthly_income: income,
        monthly_expenses: expenses,
        monthly_savings: Number(analysis.average_monthly_savings_rupees ?? (Number(analysis.net_savings_rupees ?? 0) / months)),
        savings_ratio: Number(analysis.savings_ratio_percent ?? (income > 0 ? (income - expenses) / income * 100 : 0)),
        score_change: 0,
        last_assessment_date: latestRecord?.created_at ?? null,
      },
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
