import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useAppStyles } from "@/components/app-theme";
import { BrandLockup } from "@/components/brand-lockup";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { MotionPressable, ScreenEntrance } from "@/components/motion";
import { useFeedback } from "@/components/feedback";
import { COLORS } from "@/constants/colors";
import { getAssessmentHistory, type Assessment } from "@/services/assessment.service";

export default function LenderPreviewScreen() {
  const styles = useAppStyles(baseStyles);
  const { assessmentId } = useLocalSearchParams<{ assessmentId?: string }>();
  const { notify } = useFeedback();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getAssessmentHistory()
      .then((response) => {
        if (!mounted) return;
        const records = Array.isArray(response?.data) ? response.data as Assessment[] : [];
        setAssessment(records.find((item) => item.id === assessmentId) ?? null);
      })
      .catch((error: unknown) => {
        if (mounted) notify("Preview unavailable", error instanceof Error ? error.message : "Please try again.", "error");
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [assessmentId, notify]);

  return (
    <ScreenEntrance>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <BrandLockup compact />
        <Text style={styles.eyebrow}>LENDER VIEW · PRIVATE PREVIEW</Text>
        <Text style={styles.heading}>Evidence before a label.</Text>
        <Text style={styles.subtitle}>
          A read-only example of how an applicant’s chosen financial signals could be presented. This screen is visible only to you; it does not send or share your data.
        </Text>

        <View style={styles.notice} accessibilityRole="summary">
          <Text style={styles.noticeTitle}>Preview only</Text>
          <Text style={styles.noticeText}>
            Worthly does not approve or reject loans. This app has no lender account, recipient, or live sharing connection.
          </Text>
        </View>

        {loading ? (
          <LoadingSkeleton variant="assessment" label="Loading your assessment preview" />
        ) : assessment ? (
          <>
            <View style={styles.scoreCard}>
              <Text style={styles.cardLabel}>EXPERIMENTAL INDICATOR</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.score}>{assessment.pulse_score}</Text>
                <View>
                  <Text style={styles.outOf}>OUT OF 100</Text>
                  <Text style={styles.scoreLabel}>{assessment.score_label}</Text>
                </View>
              </View>
              <Text style={styles.meta}>Assessment period · {assessment.period_months} months</Text>
              <Text style={styles.meta}>Evidence confidence · {assessment.confidence_label ?? "Not reported"}</Text>
              <Text style={styles.meta}>Data coverage · {assessment.coverage_percent == null ? "Not reported" : `${Math.round(assessment.coverage_percent)}%`}</Text>
              <Text style={styles.meta}>Data sources · {assessment.data_sources?.join(", ") || "Not reported"}</Text>
            </View>

            <Text style={styles.sectionTitle}>What supports this view</Text>
            {assessment.factors?.length ? assessment.factors.map((factor, index) => (
              <View key={`${factor.name}-${index}`} style={styles.factorCard}>
                <View style={styles.factorTop}>
                  <Text style={styles.factorName}>{factor.name}</Text>
                  <Text style={styles.factorScore}>{factor.score}/100</Text>
                </View>
                <Text style={styles.factorDescription}>{factor.description}</Text>
                <View style={styles.evidenceBlock}>
                  <Text style={styles.evidenceLabel}>EVIDENCE</Text>
                  <Text style={styles.evidenceText}>{factor.evidence_summary || "Underlying evidence not provided in this report."}</Text>
                  <Text style={styles.meta}>{factor.source || "Source not reported"}{factor.period ? ` · ${factor.period}` : ""}</Text>
                  <Text style={styles.meta}>{factor.confidence == null ? "Confidence not reported" : `Confidence · ${typeof factor.confidence === "number" ? `${Math.round(factor.confidence <= 1 ? factor.confidence * 100 : factor.confidence)}%` : factor.confidence}`}</Text>
                </View>
              </View>
            )) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Evidence details aren’t available yet</Text>
                <Text style={styles.meta}>A lender view should show supporting data and gaps before presenting a score.</Text>
              </View>
            )}

            <View style={styles.boundaryCard}>
              <Text style={styles.noticeTitle}>Decision boundary</Text>
              <Text style={styles.noticeText}>
                This experimental summary is not a CIBIL or other bureau score, does not predict repayment, and is not a loan approval or rejection. Applicants must choose what to share with a specific recipient.
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No preview for this assessment</Text>
            <Text style={styles.meta}>Generate an assessment first, then open its lender view preview.</Text>
          </View>
        )}

        <MotionPressable accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back to my assessment</Text>
        </MotionPressable>
      </ScrollView>
    </ScreenEntrance>
  );
}

const baseStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { width: "100%", maxWidth: 760, alignSelf: "center", padding: 22, paddingTop: 24, paddingBottom: 44 },
  eyebrow: { color: COLORS.primary, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginTop: 18 },
  heading: { color: COLORS.text, fontSize: 30, lineHeight: 37, fontWeight: "800", marginTop: 8 },
  subtitle: { color: COLORS.muted, fontSize: 15, lineHeight: 23, marginTop: 10, marginBottom: 20 },
  notice: { backgroundColor: COLORS.infoLight, borderRadius: 16, padding: 16, marginBottom: 16, gap: 5 },
  noticeTitle: { color: COLORS.info, fontSize: 14, fontWeight: "800" },
  noticeText: { color: COLORS.text, fontSize: 13, lineHeight: 20 },
  scoreCard: { backgroundColor: COLORS.navy, borderRadius: 22, padding: 20, marginBottom: 22, gap: 8 },
  cardLabel: { color: COLORS.successOnDark, fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 },
  score: { color: COLORS.white, fontSize: 54, lineHeight: 62, fontWeight: "800" },
  outOf: { color: COLORS.onNavyMuted, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  scoreLabel: { color: COLORS.white, fontSize: 16, fontWeight: "700", marginTop: 4 },
  meta: { color: COLORS.muted, fontSize: 12, lineHeight: 18 },
  sectionTitle: { color: COLORS.text, fontSize: 19, fontWeight: "800", marginBottom: 10 },
  factorCard: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12 },
  factorTop: { flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "center" },
  factorName: { color: COLORS.text, fontSize: 15, fontWeight: "700", flex: 1 },
  factorScore: { color: COLORS.primary, fontSize: 13, fontWeight: "800" },
  factorDescription: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 7 },
  evidenceBlock: { backgroundColor: COLORS.surfaceSubtle, borderRadius: 12, padding: 12, marginTop: 12, gap: 5 },
  evidenceLabel: { color: COLORS.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  evidenceText: { color: COLORS.text, fontSize: 12, lineHeight: 18 },
  emptyCard: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 18, padding: 18, gap: 8 },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  boundaryCard: { backgroundColor: COLORS.warningLight, borderRadius: 16, padding: 16, marginTop: 10, gap: 6 },
  backButton: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: COLORS.primary, marginTop: 18, paddingHorizontal: 18 },
  backButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
