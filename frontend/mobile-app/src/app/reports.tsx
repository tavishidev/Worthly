import { useAppStyles } from "@/components/app-theme";

import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { BrandLockup } from "@/components/brand-lockup";
import { useFeedback } from "@/components/feedback";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { MotionPressable as Pressable, ScreenEntrance } from "@/components/motion";
import { COLORS } from "@/constants/colors";
import { getLatestAssessment } from "@/services/assessment.service";
import {
  generateReport,
  getReports,
  getReportById,
  WorthlyReport,
} from "@/services/reports.service";
import { openReportPdf } from "@/services/report-file.service";

export default function ReportsScreen() {
  const styles = useAppStyles(baseStyles);
  const router = useRouter();
  const { notify } = useFeedback();

  const [reports, setReports] = useState<WorthlyReport[]>([]);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [selectedReport, setSelectedReport] =
    useState<WorthlyReport | null>(null);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);

      const [assessmentResponse, reportsResponse] = await Promise.all([
        getLatestAssessment(),
        getReports(),
      ]);

      setAssessmentId(assessmentResponse?.data?.id ?? null);
      setReports(reportsResponse?.data ?? []);
      setIsMock(Boolean(reportsResponse?.mock));
      setSelectedReport(null);
    } catch (error: any) {
      notify(
        "Unable to load reports",
        error?.message || "Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  const handleGenerateReport = async () => {
    if (!assessmentId) {
      Alert.alert(
        "Assessment required",
        "Please generate your six-month assessment first.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go to Assessment",
            onPress: () => router.push("/assessment"),
          },
        ]
      );
      return;
    }

    try {
      setGenerating(true);

      const response = await generateReport(assessmentId);

      await loadReports();

      notify(
        "PDF report generated",
        response.mock
          ? "An illustrative sample report is ready."
          : "Your report PDF was generated and saved to your Worthly account.",
        "success"
      );
      if (!response.mock) {
        try {
          await openReportPdf(response.data, assessmentId);
        } catch {
          notify("PDF is ready", "The report was generated and stored, but this device could not open a PDF viewer.", "info");
        }
      }
    } catch (error: any) {
      notify(
        "Generation failed",
        error?.response?.data?.message ||
          error?.response?.data?.detail ||
          error?.message ||
          "Unable to generate the report.",
        "error"
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenReport = async (report: WorthlyReport) => {
    setSelectedReport(report);
    if (!report.assessment_id) {
      notify("Report unavailable", "This report record has no linked assessment.", "error");
      return;
    }

    try {
      const response = await getReportById(report.assessment_id, !report.report_url);
      if (response.mock) {
        setSelectedReport({ ...report, content: response.data.content });
        return;
      }
      setSelectedReport({ ...report, report_url: report.report_url || "generated" });
      await openReportPdf(response.data, report.assessment_id);
    } catch (error: any) {
      notify(
        "Could not open report",
        error?.response?.data?.detail || error?.message || "Check the PDF storage configuration and try again.",
        "error"
      );
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <ScreenEntrance>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <BrandLockup compact />
      <View style={styles.header}>
        <Text style={styles.eyebrow}>WORTHLY · DOCUMENTS</Text>
        <Text style={styles.heading}>Financial Reports</Text>
        <Text style={styles.subtitle}>
          Generate and review reports based on your financial wellness
          assessments.
        </Text>
      </View>

      <View style={styles.generateCard}>
        <Text style={styles.cardLabel}>YOUR FINANCIAL SUMMARY</Text>

        <Text style={styles.generateTitle}>
          Create a new report
        </Text>

        <Text style={styles.generateDescription}>
          Generate a downloadable PDF from your latest six-month financial
          assessment and save it securely to your account.
        </Text>

        <Pressable
          style={[
            styles.generateButton,
            generating && styles.disabledButton,
          ]}
          onPress={handleGenerateReport}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.generateButtonText}>
              +  Generate PDF Report
            </Text>
          )}
        </Pressable>

        {!assessmentId && (
          <Text style={styles.helperText}>
            You need an assessment before generating a report.
          </Text>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Report History</Text>

        <Pressable onPress={loadReports}>
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>

      {loading ? (
        <LoadingSkeleton variant="report" label="Loading reports" />
      ) : reports.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>▤</Text>
          <Text style={styles.emptyTitle}>No reports available</Text>
          <Text style={styles.emptyDescription}>
            Your generated reports will appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.reportList}>
          {reports.map((report, index) => (
            <Pressable
              key={report.id || index}
              style={styles.reportCard}
              onPress={() => handleOpenReport(report)}
            >
              <View style={styles.reportIcon}>
                <Text style={styles.reportIconText}>{report.report_url ? "PDF" : "INFO"}</Text>
              </View>

              <View style={styles.reportInfo}>
                <Text style={styles.reportTitle}>
                  {report.title || "Financial Wellness Report"}
                </Text>

                <Text style={styles.reportDate}>
                  {formatDate(report.created_at)}
                </Text>

                <Text style={styles.reportFormat}>
                  {report.report_url ? "PDF · Tap to open or download" : "PDF not generated · Tap to generate"}
                </Text>
              </View>

              <Text style={styles.openArrow}>›</Text>
            </Pressable>
          ))}
        </View>
      )}

      {selectedReport && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>
              Report Details
            </Text>

            <Pressable onPress={() => setSelectedReport(null)}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>

          <Text style={styles.reportTitle}>
            {selectedReport.title || "Financial Wellness Report"}
          </Text>

          <Text style={styles.reportDate}>
            Generated: {formatDate(selectedReport.created_at)}
          </Text>

          {!selectedReport.report_url && !selectedReport.content && (
            <Text style={styles.detailDescription}>
              This report has not been generated yet. Tap this report to generate its PDF.
            </Text>
          )}

          {selectedReport.content?.summary && (
            <Text style={styles.detailDescription}>
              {selectedReport.content.summary}
            </Text>
          )}

          {selectedReport.content?.pulse_score != null && (
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Pulse Score</Text>
              <Text style={styles.scoreValue}>
                {selectedReport.content.pulse_score}/100
              </Text>
            </View>
          )}

          {selectedReport.content?.score_label && (
            <Text style={styles.detailDescription}>
              Score category: {selectedReport.content.score_label}
            </Text>
          )}

          {Array.isArray(selectedReport.content?.recommendations) && (
            <View style={styles.recommendations}>
              <Text style={styles.recommendationsTitle}>
                Recommendations
              </Text>

              {selectedReport.content.recommendations.map(
                (recommendation: string, index: number) => (
                  <Text
                    key={index}
                    style={styles.recommendationItem}
                  >
                    • {recommendation}
                  </Text>
                )
              )}
            </View>
          )}

          {selectedReport.report_url && !selectedReport.content && (
            <Text style={styles.detailDescription}>
              {selectedReport.report_url
                ? "Your PDF includes your Worthly Pulse score, data coverage, transaction summary, assessment factors and the methodology disclaimer."
                : "This PDF includes your Worthly Pulse score, data coverage, transaction summary, assessment factors and the methodology disclaimer."}
            </Text>
          )}

          {isMock && (
            <Text style={styles.mockDetailNotice}>
              Illustrative sample report — not an actual financial
              assessment report.
            </Text>
          )}
        </View>
      )}

      {isMock && reports.length > 0 && (
        <View style={styles.mockNotice}>
          <Text style={styles.mockNoticeText}>
            MOCK MODE: These reports are illustrative local samples.
            No actual report has been generated by the backend.
          </Text>
        </View>
      )}

      <Pressable
        style={styles.dashboardButton}
        onPress={() => router.push("/dashboard")}
      >
        <Text style={styles.dashboardButtonText}>
          Back to Dashboard
        </Text>
      </Pressable>
    </ScrollView>
    </ScreenEntrance>
  );
}

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    width: "100%",
    maxWidth: 820,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 12,
    marginBottom: 24,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  heading: {
    color: COLORS.text,
    fontSize: 29,
    fontWeight: "800",
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  generateCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 19,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  generateTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 12,
  },
  generateDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 7,
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginTop: 18,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.6,
  },
  helperText: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  refreshText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  loader: {
    marginTop: 30,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 36,
    color: COLORS.primary,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
    marginTop: 12,
  },
  emptyDescription: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 7,
    textAlign: "center",
  },
  reportList: {
    gap: 12,
  },
  reportCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reportIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: COLORS.infoLight,
    justifyContent: "center",
    alignItems: "center",
  },
  reportIconText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "900",
  },
  reportInfo: {
    flex: 1,
    marginLeft: 13,
  },
  reportTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  reportDate: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 5,
  },
  reportFormat: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 5,
  },
  openArrow: {
    color: COLORS.primary,
    fontSize: 27,
    marginLeft: 8,
  },
  detailCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 17,
    padding: 18,
    marginTop: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  detailTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  closeText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  detailDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  scoreLabel: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  scoreValue: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: "900",
  },
  recommendations: {
    marginTop: 18,
  },
  recommendationsTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
  },
  recommendationItem: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 7,
  },
  mockDetailNotice: {
    color: COLORS.warningText,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 15,
  },
  mockNotice: {
    backgroundColor: COLORS.warningLight,
    borderRadius: 10,
    padding: 12,
    marginTop: 18,
  },
  mockNoticeText: {
    color: COLORS.warningText,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
  },
  dashboardButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginTop: 25,
  },
  dashboardButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});
