import { useAppStyles } from "@/components/app-theme";

import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  Alert,
  Platform,
} from "react-native";
import { useFocusEffect, router, type Href } from "expo-router";

import { BottomNavigation } from "@/components/bottom-navigation";
import { BrandLockup } from "@/components/brand-lockup";
import { AnimatedProgress } from "@/components/animated-progress";
import { COLORS } from "@/constants/colors";
import { useFeedback } from "@/components/feedback";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { MotionPressable, ScreenEntrance } from "@/components/motion";
import {
  Assessment,
  AssessmentFactor,
  generateAssessment,
  getAssessmentHistory,
  getLatestAssessment,
} from "@/services/assessment.service";

export default function AssessmentScreen() {
  const styles = useAppStyles(baseStyles);
  const { notify } = useFeedback();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [history, setHistory] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isMock, setIsMock] = useState(false);

  function formatConfidence(confidence: number | string) {
    if (typeof confidence !== "number") return confidence;
    return `${Math.round(confidence <= 1 ? confidence * 100 : confidence)}%`;
  }

  function confirmShareSummary() {
    if (!assessment) return;
    Alert.alert(
      "Share your Worthly summary?",
      "This will open your device’s share sheet with your score, factors, confidence, and data coverage. Choose a recipient only if you want them to see it.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Choose recipient",
          onPress: () => {
            const factors = assessment.factors
              .map((factor) => `• ${factor.name}: ${factor.score}/100 — ${factor.description}`)
              .join("\n");
            const confidence = assessment.confidence_label || "Not reported";
            const coverage = assessment.coverage_percent == null
              ? "Not reported"
              : `${Math.round(assessment.coverage_percent)}%`;
            void Share.share({
              title: "Worthly financial wellness summary",
              message: [
                "Worthly financial wellness summary",
                `Pulse Score: ${assessment.pulse_score}/100 (${assessment.score_label})`,
                `Period: ${assessment.period_months} months`,
                `Evidence confidence: ${confidence}`,
                `Data coverage: ${coverage}`,
                factors,
                "Experimental financial wellness indicator only. Not a CIBIL or other credit bureau score, repayment prediction, or loan approval decision.",
              ].filter(Boolean).join("\n\n"),
            }).catch(() => notify("Could not open sharing", "Please try again.", "error"));
          },
        },
      ]
    );
  }

  const loadAssessments = useCallback(async () => {
    setLoading(true);

    try {
      const [latestResponse, historyResponse] = await Promise.all([
        getLatestAssessment(),
        getAssessmentHistory(),
      ]);

      setAssessment(latestResponse?.data ?? null);

      setHistory(
        Array.isArray(historyResponse?.data)
          ? historyResponse.data
          : []
      );

      setIsMock(
        Boolean(latestResponse?.mock || historyResponse?.mock)
      );
    } catch (error: any) {
      notify(
        "Unable to load assessment",
        error?.response?.data?.message ||
          error?.message ||
          "Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useFocusEffect(
    useCallback(() => {
      loadAssessments();
    }, [loadAssessments])
  );

  async function handleGenerate() {
    setGenerating(true);

    try {
      const response = await generateAssessment(6);

      if (response?.data) {
        setAssessment(response.data);
      }

      setIsMock(Boolean(response?.mock));

      notify(
        "Assessment generated",
        response?.message || "Your assessment request was completed.",
        "success"
      );

      await loadAssessments();
    } catch (error: any) {
      notify(
        "Assessment failed",
        error?.response?.data?.message ||
          error?.message ||
          "Could not generate your assessment.",
        "error"
      );
    } finally {
      setGenerating(false);
    }
  }

  function formatDate(value?: string) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function renderFactor(factor: AssessmentFactor, index: number) {
    const safeScore = Math.max(0, Math.min(factor.score, 100));

    return (
      <View key={`${factor.name}-${index}`} style={styles.factorCard}>
        <View style={styles.factorHeader}>
          <Text style={styles.factorName}>{factor.name}</Text>
          <Text style={styles.factorScore}>{safeScore}/100</Text>
        </View>

        <AnimatedProgress
          progress={safeScore}
          trackStyle={styles.progressTrack}
          fillStyle={styles.progressFill}
          accessibilityLabel={`${factor.name} progress`}
        />

        <Text style={styles.factorDescription}>
          {factor.description}
        </Text>
        <View style={styles.evidenceCard}>
          <Text style={styles.evidenceLabel}>EVIDENCE</Text>
          <Text style={styles.evidenceText}>
            {factor.evidence_summary || "This report does not include the underlying evidence for this factor yet."}
          </Text>
          <View style={styles.evidenceMetaRow}>
            <Text style={styles.evidenceMeta}>
              {factor.evidence_count == null ? "Evidence count not reported" : `${factor.evidence_count} evidence items`}
            </Text>
            <Text style={styles.evidenceMeta}>
              {factor.confidence == null ? "Confidence not reported" : `Confidence: ${formatConfidence(factor.confidence)}`}
            </Text>
          </View>
          {(factor.source || factor.period) && (
            <Text style={styles.evidenceMeta}>
              {[factor.source, factor.period].filter(Boolean).join(" · ")}
            </Text>
          )}
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <ScreenEntrance>
        <LoadingSkeleton variant="assessment" label="Loading assessments" />
      </ScreenEntrance>
    );
  }

  return (
    <ScreenEntrance>
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      <BrandLockup compact />
      <Text style={styles.eyebrow}>WORTHLY · FINANCIAL HEALTH</Text>
      <Text style={styles.heading}>Financial Assessment</Text>

      <Text style={styles.subtitle}>
        See the financial patterns in the information you choose to provide, with clear limits on what this indicator can tell you.
      </Text>

      {isMock && (
        <View style={styles.mockNotice}>
          <Text style={styles.mockNoticeText}>
            Preview mode · Sample assessment values are shown for interface
            testing only.
          </Text>
        </View>
      )}

      <MotionPressable
        style={[
          styles.generateButton,
          generating && styles.disabledButton,
        ]}
        onPress={handleGenerate}
        disabled={generating}
      >
        {generating ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.generateButtonText}>
            Generate 6-month assessment
          </Text>
        )}
      </MotionPressable>

      {assessment ? (
        <>
          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <Text style={styles.scoreEyebrow}>LATEST PULSE SCORE</Text>
              <Text style={styles.scoreBadge}>EXPERIMENTAL INDICATOR</Text>
            </View>

            <View style={styles.scoreRow}>
              <Text style={styles.scoreNumber}>
                {assessment.pulse_score}
              </Text>
              <View>
                <Text style={styles.scoreOutOf}>OUT OF 100</Text>
                <Text style={styles.scoreLabel}>
                  {assessment.score_label}
                </Text>
              </View>
            </View>

            <Text style={styles.scoreDate}>
              Assessment date: {formatDate(assessment.created_at)}
            </Text>

            <Text style={styles.scoreDate}>
              Assessment period: {assessment.period_months} months
            </Text>
            <Text style={styles.scoreDate}>
              {assessment.confidence_label
                ? `Evidence confidence: ${assessment.confidence_label}`
                : "Evidence confidence: not reported"}
              {assessment.coverage_percent == null ? " · Data coverage: not reported" : ` · Data coverage: ${Math.round(assessment.coverage_percent)}%`}
            </Text>
            {assessment.data_sources?.length ? (
              <Text style={styles.scoreDate}>Sources: {assessment.data_sources.join(", ")}</Text>
            ) : (
              <Text style={styles.scoreDate}>Data sources are not listed in this report.</Text>
            )}
          </View>

          <MotionPressable
            accessibilityRole="button"
            accessibilityHint="Opens a private, read-only preview of how your evidence could be presented. Nothing is shared."
            style={styles.previewLenderButton}
            onPress={() => router.push({ pathname: "/lender-preview", params: { assessmentId: assessment.id } } as unknown as Href)}
          >
            <Text style={styles.previewLenderButtonText}>Preview a lender view</Text>
            <Text style={styles.previewLenderHint}>Private preview · nothing is shared</Text>
          </MotionPressable>

          <Text style={styles.sectionTitle}>Assessment factors</Text>

          {Array.isArray(assessment.factors) &&
            assessment.factors.map(renderFactor)}
          {Platform.OS !== "web" && (
            <MotionPressable
              accessibilityRole="button"
              accessibilityHint="Opens the device share sheet after you confirm."
              style={styles.shareButton}
              onPress={confirmShareSummary}
            >
              <Text style={styles.shareButtonText}>Share my summary</Text>
            </MotionPressable>
          )}
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No assessment yet</Text>
          <Text style={styles.emptyText}>
            Generate your first six-month assessment to view your Pulse Score
            and its contributing factors.
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Assessment history</Text>

      {history.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Your previous assessments will appear here.
          </Text>
        </View>
      ) : (
        history.map((item, index) => (
          <View
            key={item.id || `history-${index}`}
            style={styles.historyCard}
          >
            <View style={styles.historyInfo}>
              <Text style={styles.historyDate}>
                {formatDate(item.created_at)}
              </Text>
              <Text style={styles.historyPeriod}>
                {item.period_months}-month assessment
              </Text>
            </View>

            <View style={styles.historyScoreContainer}>
              <Text style={styles.historyScore}>
                {item.pulse_score}
              </Text>
              <Text style={styles.historyLabel}>
                {item.score_label}
              </Text>
            </View>
          </View>
        ))
      )}

      <MotionPressable
        style={styles.dashboardButton}
        onPress={() => router.push("/dashboard")}
      >
        <Text style={styles.dashboardButtonText}>
          Return to Dashboard
        </Text>
      </MotionPressable>

      <Text style={styles.disclaimer}>
        This experimental indicator summarizes the submitted data shown here. It does not predict repayment, replace CIBIL or another credit bureau, or approve or reject a loan.
      </Text>
      </ScrollView>
      <BottomNavigation />
    </View>
    </ScreenEntrance>
  );
}

const baseStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    width: "100%",
    maxWidth: 800,
    alignSelf: "center",
    padding: 21,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.muted,
    marginTop: 12,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  heading: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "900",
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 20,
  },
  mockNotice: {
    backgroundColor: COLORS.warningSurface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 17,
  },
  mockNoticeText: {
    color: COLORS.warningText,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 13,
    alignItems: "center",
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  scoreCard: {
    backgroundColor: COLORS.navy,
    borderRadius: 19,
    padding: 21,
    marginBottom: 27,
  },
  scoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  scoreBadge: {
    color: COLORS.onNavy,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  scoreEyebrow: {
    color: COLORS.onNavy,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginVertical: 12,
  },
  scoreNumber: {
    color: "#FFFFFF",
    fontSize: 60,
    fontWeight: "900",
  },
  scoreOutOf: {
    color: COLORS.onNavy,
    fontSize: 10,
    fontWeight: "700",
  },
  scoreLabel: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 5,
  },
  scoreDate: {
    color: "#D2DDE8",
    fontSize: 12,
    marginTop: 5,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 13,
    marginTop: 5,
  },
  factorCard: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 13,
    marginBottom: 11,
  },
  factorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 11,
  },
  factorName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
    flex: 1,
  },
  factorScore: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  progressTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  factorDescription: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 9,
  },
  evidenceCard: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 13,
    marginTop: 12,
    gap: 6,
  },
  evidenceLabel: { color: COLORS.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  evidenceText: { color: COLORS.text, fontSize: 12, lineHeight: 18 },
  evidenceMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  evidenceMeta: { color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  shareButton: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingHorizontal: 18,
  },
  shareButtonText: { color: COLORS.primary, fontSize: 15, fontWeight: "700" },
  previewLenderButton: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  previewLenderButtonText: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  previewLenderHint: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 20,
    marginBottom: 22,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  historyCard: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 13,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  historyPeriod: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 5,
  },
  historyScoreContainer: {
    alignItems: "flex-end",
  },
  historyScore: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: "900",
  },
  historyLabel: {
    color: COLORS.muted,
    fontSize: 10,
  },
  dashboardButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 15,
  },
  dashboardButtonText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 14,
  },
  disclaimer: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 20,
  },
});
