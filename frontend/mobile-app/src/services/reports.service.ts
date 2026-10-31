
import AsyncStorage from "@react-native-async-storage/async-storage";

const MOCK_REPORTS_KEY = "worthly_mock_reports";

export interface WorthlyReport {
  id: string;
  title: string;
  format: string;
  created_at: string;
  assessment_id?: string;
  content?: any;
}

function isBackendConfigured() {
  return Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_URL &&
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.EXPO_PUBLIC_API_URL
  );
}

async function getMockReports(): Promise<WorthlyReport[]> {
  const saved = await AsyncStorage.getItem(MOCK_REPORTS_KEY);
  return saved ? JSON.parse(saved) : [];
}

export async function generateReport(assessmentId: string) {
  if (!assessmentId) {
    throw new Error("Generate a financial assessment first.");
  }

  if (isBackendConfigured()) {
    const { api } = await import("./api");

    const response = await api.post("/reports/generate", {
      assessment_id: assessmentId,
      format: "json",
    });

    return {
      success: true,
      mock: false,
      data: response.data?.data ?? response.data,
    };
  }

  const reports = await getMockReports();

  const report: WorthlyReport = {
    id: `mock-report-${Date.now()}`,
    title: "Financial Wellness Report",
    format: "json",
    created_at: new Date().toISOString(),
    assessment_id: assessmentId,
    content: {
      summary:
        "This is an illustrative report generated in local mock mode.",
      pulse_score: 72,
      score_label: "Good",
      recommendations: [
        "Maintain a consistent monthly savings habit.",
        "Review recurring expenses to identify potential savings.",
        "Build an emergency fund for unexpected expenses.",
      ],
    },
  };

  reports.unshift(report);

  await AsyncStorage.setItem(
    MOCK_REPORTS_KEY,
    JSON.stringify(reports)
  );

  return {
    success: true,
    mock: true,
    data: report,
  };
}

export async function getReports() {
  if (isBackendConfigured()) {
    const { api } = await import("./api");
    const response = await api.get("/reports");

    const data = response.data?.data ?? response.data;
    const reports = Array.isArray(data)
      ? data
      : Array.isArray(data?.reports)
        ? data.reports
        : [];

    return {
      success: true,
      mock: false,
      data: reports,
    };
  }

  return {
    success: true,
    mock: true,
    data: await getMockReports(),
  };
}

export async function getReportById(reportId: string) {
  if (!reportId) {
    throw new Error("A report ID is required.");
  }

  if (isBackendConfigured()) {
    const { api } = await import("./api");
    const response = await api.get(
      `/reports/${encodeURIComponent(reportId)}`
    );

    return {
      success: true,
      mock: false,
      data: response.data?.data ?? response.data,
    };
  }

  const reports = await getMockReports();
  const report = reports.find((item) => item.id === reportId);

  if (!report) {
    throw new Error("Report not found.");
  }

  return {
    success: true,
    mock: true,
    data: report,
  };
}
