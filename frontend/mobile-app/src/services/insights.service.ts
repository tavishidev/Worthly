import AsyncStorage from "@react-native-async-storage/async-storage";

const MOCK_INSIGHTS_KEY = "worthly_mock_insights";

export interface Insight {
  type: string;
  title: string;
  description: string;
}

const MOCK_INSIGHTS: Insight[] = [
  {
    type: "positive",
    title: "Healthy Savings Pattern",
    description:
      "Your sample financial profile indicates a positive savings pattern. Continue setting aside a consistent portion of your monthly income.",
  },
  {
    type: "opportunity",
    title: "Improve Cash-Flow Stability",
    description:
      "Review your monthly expenses and identify recurring costs that could be reduced to improve your financial stability.",
  },
  {
    type: "tip",
    title: "Build an Emergency Fund",
    description:
      "Consider gradually building an emergency fund to help manage unexpected expenses without disrupting your regular savings.",
  },
];

function isBackendConfigured() {
  return Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_URL &&
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.EXPO_PUBLIC_API_URL
  );
}

function extractInsights(response: any): Insight[] {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.insights)) return data.insights;
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

export async function generateInsights(assessmentId: string) {
  if (!assessmentId) {
    throw new Error("Generate a financial assessment first.");
  }

  if (isBackendConfigured()) {
    const { api } = await import("./api");

    await api.post("/insights/generate", {
      assessment_id: assessmentId,
    });

    const response = await api.get("/insights");

    return {
      success: true,
      mock: false,
      data: extractInsights(response.data),
    };
  }

  await AsyncStorage.setItem(
    MOCK_INSIGHTS_KEY,
    JSON.stringify(MOCK_INSIGHTS)
  );

  return {
    success: true,
    mock: true,
    message: "Illustrative sample insights generated locally.",
    data: MOCK_INSIGHTS,
  };
}

export async function getInsights() {
  if (isBackendConfigured()) {
    const { api } = await import("./api");
    const response = await api.get("/insights");

    return {
      success: true,
      mock: false,
      data: extractInsights(response.data),
    };
  }

  const savedInsights = await AsyncStorage.getItem(MOCK_INSIGHTS_KEY);

  return {
    success: true,
    mock: true,
    data: savedInsights ? JSON.parse(savedInsights) : [],
  };
}