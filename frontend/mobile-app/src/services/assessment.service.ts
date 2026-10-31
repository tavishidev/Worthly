
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isBackendConfigured } from "./api";

const MOCK_ASSESSMENT_KEY = "worthly_mock_assessments";

export interface AssessmentFactor {
  name: string;
  score: number;
  description: string;
  evidence_summary?: string;
  evidence_count?: number;
  confidence?: number | string;
  source?: string;
  period?: string;
}

export interface Assessment {
  id: string;
  pulse_score: number;
  score_label: string;
  period_months: number;
  created_at: string;
  factors: AssessmentFactor[];
  confidence_label?: string;
  coverage_percent?: number;
  data_sources?: string[];
  methodology_version?: string;
}

const MOCK_FACTORS: AssessmentFactor[] = [
  {
    name: "Income consistency",
    score: 78,
    description: "Illustrative indicator of regularity in income.",
  },
  {
    name: "Savings ratio",
    score: 82,
    description: "Illustrative indicator of savings relative to income.",
  },
  {
    name: "Bill payment",
    score: 70,
    description: "Illustrative indicator of bill payment behaviour.",
  },
  {
    name: "Cash-flow stability",
    score: 68,
    description: "Illustrative indicator of cash-flow stability.",
  },
  {
    name: "Obligation burden",
    score: 75,
    description: "Illustrative indicator of financial obligations.",
  },
];

function unwrapResponse(response: any) {
  return response?.data?.data ?? response?.data ?? response;
}

function scoreLabel(score: number) {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Good";
  if (score >= 40) return "Developing";
  return "Needs attention";
}

function normalizeAssessment(record: any): Assessment | null {
  const assessment = record?.assessment ?? record;
  const id = assessment?.id ?? assessment?.assessment_id ?? record?.assessment_id;
  if (!id) return null;

  const score = Number(assessment?.pulse_score ?? assessment?.score ?? 0);
  const factors = record?.factors ?? assessment?.factors ?? [];

  return {
    id: String(id),
    pulse_score: score,
    score_label: assessment?.score_label ?? scoreLabel(score),
    period_months: Number(assessment?.data_coverage_months ?? assessment?.period_months ?? 6),
    created_at: assessment?.created_at ?? "",
    factors: Array.isArray(factors) ? factors.map((factor: any) => ({
      name: factor.factor_name ?? factor.name ?? "Financial factor",
      score: Number(factor.factor_score ?? factor.score ?? 0),
      description: factor.explanation ?? factor.description ?? "Based on the transaction history provided.",
      confidence: factor.confidence,
    })) : [],
    coverage_percent: assessment?.data_coverage_months == null
      ? undefined
      : Math.min(100, Number(assessment.data_coverage_months) / 6 * 100),
    methodology_version: assessment?.model_version,
  };
}

function extractHistory(response: any): Assessment[] {
  const body = unwrapResponse(response);
  const records = Array.isArray(body) ? body : body?.history ?? body?.assessments ?? [];
  return records.map(normalizeAssessment).filter((item: Assessment | null): item is Assessment => item !== null);
}

export async function generateAssessment(periodMonths = 6) {
  if (isBackendConfigured()) {
    const { api } = await import("./api");
    const response = await api.post("/assessment/generate");
    const body = unwrapResponse(response);
    const assessment = normalizeAssessment({
      ...(body?.assessment ?? {}),
      id: body?.assessment_id ?? body?.assessment?.id,
    });
    return {
      success: true,
      mock: false,
      message: body?.message ?? `Generated an assessment from ${assessment?.period_months ?? periodMonths} months of transactions.`,
      data: assessment,
    };
  }

  const saved = await AsyncStorage.getItem(MOCK_ASSESSMENT_KEY);
  const history: Assessment[] = saved ? JSON.parse(saved) : [];

  const mockAssessment: Assessment = {
    id: `mock-assessment-${Date.now()}`,
    pulse_score: 72,
    score_label: "Good",
    period_months: periodMonths,
    created_at: new Date().toISOString(),
    factors: MOCK_FACTORS,
  };

  history.unshift(mockAssessment);

  await AsyncStorage.setItem(
    MOCK_ASSESSMENT_KEY,
    JSON.stringify(history)
  );

  return {
    success: true,
    mock: true,
    message: "Sample assessment generated in mock mode.",
    data: mockAssessment,
  };
}

export async function getLatestAssessment() {
  if (isBackendConfigured()) {
    const { api } = await import("./api");
    const response = await api.get("/assessment/history");
    const history = extractHistory(response);
    return { success: true, mock: false, data: history[0] ?? null };
  }

  const saved = await AsyncStorage.getItem(MOCK_ASSESSMENT_KEY);
  const history: Assessment[] = saved ? JSON.parse(saved) : [];

  return {
    success: true,
    mock: true,
    data: history[0] ?? null,
  };
}

export async function getAssessmentHistory() {
  if (isBackendConfigured()) {
    const { api } = await import("./api");
    const response = await api.get("/assessment/history");
    return { success: true, mock: false, data: extractHistory(response) };
  }

  const saved = await AsyncStorage.getItem(MOCK_ASSESSMENT_KEY);
  const history: Assessment[] = saved ? JSON.parse(saved) : [];

  return {
    success: true,
    mock: true,
    data: history,
  };
}
