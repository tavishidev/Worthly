
import AsyncStorage from "@react-native-async-storage/async-storage";

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

function isBackendConfigured() {
  return Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_URL &&
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.EXPO_PUBLIC_API_URL
  );
}

export async function generateAssessment(periodMonths = 6) {
  if (isBackendConfigured()) {
    const { api } = await import("./api");
    const response = await api.post("/assessments", {
      period_months: periodMonths,
    });

    return response.data;
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
    const response = await api.get("/assessments/latest");
    return response.data;
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
    const response = await api.get("/assessments/history");
    return response.data;
  }

  const saved = await AsyncStorage.getItem(MOCK_ASSESSMENT_KEY);
  const history: Assessment[] = saved ? JSON.parse(saved) : [];

  return {
    success: true,
    mock: true,
    data: history,
  };
}
