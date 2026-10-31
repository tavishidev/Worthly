import { useAppStyles, useAppTheme } from "@/components/app-theme";

import { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { BottomNavigation } from "@/components/bottom-navigation";
import { BrandLockup } from "@/components/brand-lockup";
import { useFeedback } from "@/components/feedback";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { MotionPressable as Pressable, ScreenEntrance } from "@/components/motion";
import { COLORS } from "@/constants/colors";
import {
  generateInsights,
  getInsights,
  Insight,
} from "@/services/insights.service";
import { getLatestAssessment } from "@/services/assessment.service";

export default function InsightsScreen() {
  const styles = useAppStyles(baseStyles);
  const { colors } = useAppTheme();
  const router = useRouter();
  const { notify } = useFeedback();

  const [insights, setInsights] = useState<Insight[]>([]);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isMock, setIsMock] = useState(false);

  const loadInsights = useCallback(async () => {
    try {
      setLoading(true);

      const [assessmentResponse, insightsResponse] = await Promise.all([
        getLatestAssessment(),
        getInsights(),
      ]);

      const latestAssessment = assessmentResponse?.data;
      setAssessmentId(latestAssessment?.id ?? null);

      setInsights(insightsResponse?.data ?? []);
      setIsMock(Boolean(insightsResponse?.mock));
    } catch (error: any) {
      notify(
        "Unable to load insights",
        error?.message || "Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useFocusEffect(
    useCallback(() => {
      loadInsights();
    }, [loadInsights])
  );

  const handleGenerate = async () => {
    if (!assessmentId) {
      Alert.alert(
        "Assessment required",
        "Please generate your six-month financial assessment first.",
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

      const response = await generateInsights(assessmentId);

      setInsights(response.data ?? []);
      setIsMock(Boolean(response.mock));

      notify(
        "Insights generated",
        response.mock
          ? "Illustrative sample insights have been generated."
          : "Your insights were updated from your transaction history.",
        "success"
      );
    } catch (error: any) {
      notify(
        "Generation failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to generate insights. Please try again.",
        "error"
      );
    } finally {
      setGenerating(false);
    }
  };

  const getInsightStyle = (type: string) => {
    const normalizedType = type.toLowerCase();

    if (normalizedType === "positive") {
      return {
        icon: "✓",
        color: colors.success,
        background: colors.primaryLight,
      };
    }

    if (
      normalizedType === "warning" ||
      normalizedType === "risk"
    ) {
      return {
        icon: "!",
        color: colors.warning,
        background: colors.warningLight,
      };
    }

    return {
      icon: "✦",
      color: colors.info,
      background: colors.infoLight,
    };
  };

  return (
    <ScreenEntrance>
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      <BrandLockup compact />
      <View style={styles.header}>
        <Text style={styles.eyebrow}>WORTHLY · PERSONALIZED OVERVIEW</Text>
        <Text style={styles.heading}>Financial Insights</Text>
        <Text style={styles.subtitle}>
          Clear observations based on your recorded income, spending and cash flow.
          These are educational indicators, not lending advice.
        </Text>
      </View>

      <View style={styles.assessmentCard}>
        <Text style={styles.cardLabel}>ASSESSMENT STATUS</Text>

        <Text style={styles.assessmentStatus}>
          {assessmentId ? "Assessment available" : "No assessment found"}
        </Text>

        <Text style={styles.assessmentDescription}>
          {assessmentId
            ? "Your latest assessment and transaction history are ready to review."
            : "Generate your six-month assessment before requesting insights."}
        </Text>

        <Pressable
          style={[
            styles.assessmentButton,
            !assessmentId && styles.secondaryButton,
          ]}
          onPress={() => router.push("/assessment")}
        >
          <Text
            style={[
              styles.assessmentButtonText,
              !assessmentId && styles.secondaryButtonText,
            ]}
          >
            {assessmentId ? "View Assessment" : "Generate Assessment"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Financial Insights</Text>

        <Pressable onPress={loadInsights}>
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>

      <Pressable
        style={[
          styles.generateButton,
          (generating || !assessmentId) && styles.disabledButton,
        ]}
        onPress={handleGenerate}
        disabled={generating}
      >
        {generating ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <View style={styles.generateButtonContent}>
            <Ionicons name="sparkles-outline" size={17} color="#FFFFFF" />
            <Text style={styles.generateButtonText}>Refresh Financial Insights</Text>
          </View>
        )}
      </Pressable>

      {isMock && insights.length > 0 && (
        <View style={styles.mockNotice}>
          <Text style={styles.mockNoticeText}>
            SAMPLE MODE: These examples are illustrative and are not based on
            your connected transaction history.
          </Text>
        </View>
      )}

      {loading ? (
        <LoadingSkeleton variant="list" label="Loading insights" />
      ) : insights.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="sparkles-outline" size={30} color={colors.primary} />
          <Text style={styles.emptyTitle}>No insights yet</Text>
          <Text style={styles.emptyDescription}>
            Upload transactions and generate an assessment to see observations
            based on your income and spending patterns.
          </Text>
        </View>
      ) : (
        <View style={styles.insightsList}>
          {insights.map((insight, index) => {
            const visual = getInsightStyle(insight.type);

            return (
              <View key={`${insight.title}-${index}`} style={styles.insightCard}>
                <View style={styles.insightTop}>
                  <View
                    style={[
                      styles.insightIcon,
                      { backgroundColor: visual.background },
                    ]}
                  >
                    <Text style={{ color: visual.color, fontSize: 19 }}>
                      {visual.icon}
                    </Text>
                  </View>

                  <View style={styles.insightTypeContainer}>
                    <Text style={styles.insightType}>
                      {insight.type.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDescription}>
                  {insight.description}
                </Text>
              </View>
            );
          })}
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
    maxWidth: 820,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 120,
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
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  assessmentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  assessmentStatus: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "800",
    marginTop: 10,
  },
  assessmentDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  assessmentButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 11,
    padding: 13,
    alignItems: "center",
    marginTop: 16,
  },
  assessmentButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: COLORS.infoLight,
  },
  secondaryButtonText: {
    color: COLORS.primary,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
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
  generateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 13,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  generateButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  mockNotice: {
    backgroundColor: COLORS.warningLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  mockNoticeText: {
    color: COLORS.warningText,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
  },
  loader: {
    marginTop: 35,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
    marginTop: 8,
  },
  emptyIcon: {
    color: COLORS.primary,
    fontSize: 34,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 12,
  },
  emptyDescription: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
  },
  insightsList: {
    gap: 14,
  },
  insightCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 17,
    padding: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  insightTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  insightIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  insightTypeContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  insightType: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  insightTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  insightDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 21,
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
