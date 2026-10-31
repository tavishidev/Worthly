
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isBackendConfigured } from "./api";

const MOCK_REPORTS_KEY = "worthly_mock_reports";

export interface WorthlyReport {
  id: string;
  title: string;
  format: string;
  created_at: string;
  assessment_id?: string;
  report_url?: string | null;
  content?: any;
}

export type ReportPdf = ArrayBuffer | Uint8Array;

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
    // This endpoint generates the actual PDF, stores it in the private bucket,
    // and creates/updates the user's report row. The POST endpoint only creates
    // an empty metadata row, which is why it is not used here.
    const response = await api.get(
      `/reports/${encodeURIComponent(assessmentId)}/pdf`,
      { responseType: "arraybuffer", timeout: 60_000 }
    );

    return {
      success: true,
      mock: false as const,
      data: response.data as ReportPdf,
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
    mock: true as const,
    data: report,
  };
}

export async function getReports() {
  if (isBackendConfigured()) {
    const { api } = await import("./api");
    const response = await api.get("/reports/me");

    const data = response.data?.data ?? response.data;
    const reports = Array.isArray(data)
      ? data
      : Array.isArray(data?.reports)
        ? data.reports
        : [];

    return {
      success: true,
      mock: false as const,
      data: reports,
    };
  }

  return {
    success: true,
    mock: true as const,
    data: await getMockReports(),
  };
}

export async function getReportById(assessmentId: string, generateIfMissing = false) {
  if (!assessmentId) {
    throw new Error("An assessment ID is required to retrieve its report.");
  }

  if (isBackendConfigured()) {
    const { api } = await import("./api");
    const path = generateIfMissing ? "pdf" : "download";
    const response = await api.get(
      `/reports/${encodeURIComponent(assessmentId)}/${path}`,
      { responseType: "arraybuffer", timeout: 60_000 }
    );

    return {
      success: true,
      mock: false as const,
      data: response.data as ReportPdf,
    };
  }

  const reports = await getMockReports();
  const report = reports.find((item) => item.assessment_id === assessmentId);

  if (!report) {
    throw new Error("Report not found.");
  }

  return {
    success: true,
    mock: true as const,
    data: report,
  };
}
