import { useAppStyles, useAppTheme } from "@/components/app-theme";

import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, router } from "expo-router";

import { BottomNavigation } from "@/components/bottom-navigation";
import { BrandLockup } from "@/components/brand-lockup";
import { AnimatedProgress } from "@/components/animated-progress";
import { useFeedback } from "@/components/feedback";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { MotionPressable, MotionReveal, ScreenEntrance } from "@/components/motion";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";
import {
  DashboardSummary,
  getDashboardSummary,
} from "@/services/dashboard.service";
import { getTransactions } from "@/services/transaction.service";

interface RecentTransaction {
  id?: string;
  transaction_date: string;
  description: string;
  amount_paise: number;
  transaction_type: "income" | "expense";
  category: string;
}

export default function DashboardScreen() {
  const styles = useAppStyles(baseStyles);
  const { colors } = useAppTheme();
  const { notify } = useFeedback();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await getDashboardSummary();

      setSummary(response.data);
      setIsMock(Boolean(response.mock));

      try {
        const transactionResponse = await getTransactions();
        const records = transactionResponse?.data;
        setRecentTransactions(Array.isArray(records) ? records.slice(0, 3) : []);
      } catch (error) {
        notify(
          "Recent activity unavailable",
          error instanceof Error ? error.message : "Could not load recent transactions.",
          "error"
        );
      }
    } catch (error: any) {
      notify(
        "Dashboard unavailable",
        error?.response?.data?.message ||
          error?.message ||
          "Could not load your dashboard.",
        "error"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [notify]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  function formatRupees(amount: number) {
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  }

  function formatDate(value: string | null) {
    if (!value) return "Not assessed yet";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (loading && !summary) {
    return (
      <ScreenEntrance>
        <LoadingSkeleton variant="dashboard" label="Loading your dashboard" />
      </ScreenEntrance>
    );
  }

  if (!summary) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyTitle}>Dashboard could not be loaded</Text>
        <MotionPressable
          style={styles.retryButton}
          onPress={() => loadDashboard()}
        >
          <Text style={styles.retryText}>Try again</Text>
        </MotionPressable>
      </View>
    );
  }

  const savingsRatio = Number.isFinite(summary.savings_ratio)
    ? summary.savings_ratio
    : 0;

  const score = summary.pulse_score;
  const scoreChange = summary.score_change;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <ScreenEntrance>
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDashboard(true)}
            tintColor={colors.primary}
          />
        }
      >
      <View style={styles.brandHeader}>
        <BrandLockup compact />
        <Text style={styles.overviewLabel}>FINANCIAL OVERVIEW</Text>
      </View>
      <Text style={styles.heading}>{greeting}</Text>
      <Text style={styles.subtitle}>
        A snapshot of your financial wellness.
      </Text>

      {isMock && (
        <View style={styles.mockNotice}>
          <Text style={styles.mockNoticeText}>
            Preview mode · Showing sample dashboard data, not your actual
            financial assessment.
          </Text>
        </View>
      )}

      {/* Pulse Score */}
      <MotionReveal style={{ width: "100%" }} delay={60}>
      <LinearGradient colors={[colors.navy, colors.navySurface]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreEyebrow}>YOUR PULSE SCORE</Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreBadgeText}>EXPERIMENTAL</Text>
          </View>
        </View>

        <View style={styles.scoreRow}>
          <Text style={styles.scoreNumber}>
            {score === null ? "--" : score}
          </Text>
          <View style={styles.scoreOutOf}>
            <Text style={styles.scoreOutOfText}>OUT OF 100</Text>
            <Text style={styles.scoreLabel}>
              {summary.score_label || "Not assessed"}
            </Text>
          </View>
        </View>

        <View style={styles.scoreDivider} />
        <AnimatedProgress
          progress={score === null ? 0 : score}
          trackStyle={styles.scoreProgressTrack}
          fillStyle={styles.scoreProgressFill}
          accessibilityLabel="Pulse score"
        />

        <View style={styles.scoreBottomRow}>
          <View>
            <Text style={styles.scoreBottomLabel}>Score change</Text>
            <Text style={styles.scoreBottomValue}>
              {scoreChange > 0 ? "+" : ""}
              {scoreChange} points
            </Text>
          </View>

          <View style={styles.scoreDateContainer}>
            <Text style={styles.scoreBottomLabel}>Last assessment</Text>
            <Text style={styles.scoreBottomValue}>
              {formatDate(summary.last_assessment_date)}
            </Text>
          </View>
        </View>
      </LinearGradient>
      </MotionReveal>

      {/* Financial overview */}
      <Text style={styles.sectionTitle}>Monthly overview</Text>

      <MotionReveal style={{ width: "100%" }} delay={125}>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Monthly income</Text>
          <Text style={styles.metricValue}>
            {formatRupees(summary.monthly_income)}
          </Text>
          <View style={styles.metricIconBox}><Ionicons name="arrow-up" size={17} color={colors.primary} /></View>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Monthly expenses</Text>
          <Text style={styles.metricValue}>
            {formatRupees(summary.monthly_expenses)}
          </Text>
          <View style={styles.metricIconBox}><Ionicons name="arrow-down" size={17} color={colors.danger} /></View>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Monthly savings</Text>
          <Text style={styles.metricValue}>
            {formatRupees(summary.monthly_savings)}
          </Text>
          <View style={styles.metricIconBox}><Ionicons name="wallet-outline" size={16} color={colors.primary} /></View>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Savings ratio</Text>
          <Text style={styles.metricValue}>
            {savingsRatio.toFixed(1)}%
          </Text>
          <View style={styles.metricIconBox}><Ionicons name="pie-chart-outline" size={16} color={colors.primary} /></View>
        </View>
      </View>
      </MotionReveal>

      {/* Savings ratio */}
      <MotionReveal style={{ width: "100%" }} delay={190}>
      <View style={styles.savingsCard}>
        <Text style={styles.sectionTitle}>Savings progress</Text>
        <Text style={styles.savingsDescription}>
          Percentage of monthly income represented by savings.
        </Text>

        <AnimatedProgress
          progress={savingsRatio}
          trackStyle={styles.progressTrack}
          fillStyle={styles.progressFill}
          accessibilityLabel="Savings progress"
        />

        <Text style={styles.progressValue}>
          {savingsRatio.toFixed(1)}% savings ratio
        </Text>
      </View>
      </MotionReveal>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent activity</Text>
        <MotionPressable onPress={() => router.push("/transactions")}>
          <Text style={styles.viewAll}>View all</Text>
        </MotionPressable>
      </View>

      {recentTransactions.length > 0 ? (
        <View style={styles.recentList}>
          {recentTransactions.map((transaction, index) => {
            const income = transaction.transaction_type === "income";
            return (
              <View
                key={transaction.id || `${transaction.transaction_date}-${index}`}
                style={styles.recentRow}
              >
                <View
                  style={[
                    styles.recentIcon,
                    income && styles.recentIconIncome,
                  ]}
                >
                  <Text
                    style={[
                      styles.recentIconText,
                      income && styles.recentIconTextIncome,
                    ]}
                  >
                    {income ? "+" : "−"}
                  </Text>
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentTitle} numberOfLines={1}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.recentMeta}>
                    {transaction.category} · {transaction.transaction_date}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.recentAmount,
                    income && styles.recentAmountIncome,
                  ]}
                >
                  {income ? "+" : "−"}
                  {formatRupees(transaction.amount_paise / 100)}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyActivity}>
          <Text style={styles.emptyActivityText}>
            No activity yet. Add a transaction to start building your overview.
          </Text>
          <MotionPressable onPress={() => router.push("/add-transaction")}>
            <Text style={styles.viewAll}>Add transaction</Text>
          </MotionPressable>
        </View>
      )}

      <MotionReveal style={{ width: "100%" }} delay={255}>
      <View style={styles.quickActions}>
        <MotionPressable
          style={styles.quickAction}
          onPress={() => router.push("/add-transaction")}
        >
          <Text style={styles.quickActionSymbol}>＋</Text>
          <Text style={styles.quickActionText}>Add transaction</Text>
        </MotionPressable>
        <MotionPressable
          style={styles.quickAction}
          onPress={() => router.push("/upload-csv")}
        >
          <Text style={styles.quickActionSymbol}>↑</Text>
          <Text style={styles.quickActionText}>Import CSV</Text>
        </MotionPressable>
      </View>
      </MotionReveal>

      {/* Navigation */}
      <Text style={styles.sectionTitle}>Continue exploring</Text>

      <MotionPressable
        style={styles.actionCard}
        onPress={() => router.push("/transactions")}
      >
        <View style={styles.actionInfo}>
          <Text style={styles.actionTitle}>Transactions</Text>
          <Text style={styles.actionDescription}>
            Review your recorded income and expenses.
          </Text>
        </View>
        <Text style={styles.actionArrow}>›</Text>
      </MotionPressable>
      <MotionPressable
        style={styles.actionCard}
        onPress={() => router.push("/insights")}
      >
        <View style={styles.actionInfo}>
          <Text style={styles.actionTitle}>AI Insights</Text>
          <Text style={styles.actionDescription}>
            Understand opportunities to improve your finances.
          </Text>
        </View>
        <Text style={styles.actionArrow}>›</Text>
      </MotionPressable>
      <MotionPressable
        style={styles.actionCard}
        onPress={() => router.push("/reports")}
      >
        <View style={styles.actionInfo}>
          <Text style={styles.actionTitle}>Reports</Text>
          <Text style={styles.actionDescription}>
            Explore your financial assessment reports.
          </Text>
        </View>
        <Text style={styles.actionArrow}>›</Text>
      </MotionPressable>

      <Text style={styles.disclaimer}>
        This experimental indicator is based on the information shown here. It does not predict repayment, replace CIBIL or another credit bureau, or approve or reject a loan.
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
    maxWidth: 840,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 25,
  },
  loadingText: {
    color: COLORS.muted,
    marginTop: 12,
    fontSize: 13,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 9,
  },
  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 19,
  },
  overviewLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heading: {
    color: COLORS.text,
    fontSize: 29,
    fontWeight: "900",
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 7,
    marginBottom: 20,
  },
  mockNotice: {
    backgroundColor: COLORS.warningSurface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 17,
  },
  mockNoticeText: {
    color: COLORS.warningText,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  scoreCard: {
    borderRadius: 22,
    padding: 21,
    marginBottom: 26,
    overflow: "hidden",
    shadowColor: COLORS.navy,
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  scoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scoreBadge: {
    borderRadius: 20,
    backgroundColor: COLORS.navyOverlay,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  scoreBadgeText: {
    color: COLORS.onNavy,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
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
    marginTop: 12,
    marginBottom: 17,
  },
  scoreNumber: {
    color: "#FFFFFF",
    fontSize: 64,
    fontWeight: "900",
    lineHeight: 74,
  },
  scoreOutOf: {
    marginLeft: 13,
  },
  scoreOutOfText: {
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
  scoreDivider: {
    height: 1,
    backgroundColor: COLORS.navySeparator,
    marginBottom: 15,
  },
  scoreProgressTrack: {
    height: 5,
    backgroundColor: COLORS.navyTrack,
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 15,
  },
  scoreProgressFill: {
    height: "100%",
    backgroundColor: COLORS.emerald,
    borderRadius: 5,
  },
  scoreBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  scoreDateContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  scoreBottomLabel: {
    color: COLORS.onNavy,
    fontSize: 11,
  },
  scoreBottomValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 5,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 13,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewAll: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 25,
  },
  metricCard: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 15,
    minHeight: 124,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.035,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  metricLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  metricValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 12,
  },
  metricIcon: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "900",
    position: "absolute",
    top: 13,
    right: 14,
  },
  metricIconBox: {
    position: "absolute",
    top: 11,
    right: 11,
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  savingsCard: {
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 27,
  },
  recentList: {
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    paddingHorizontal: 14,
    marginBottom: 22,
  },
  recentRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: COLORS.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },
  recentIconIncome: {
    backgroundColor: COLORS.primaryLight,
  },
  recentIconText: {
    color: COLORS.danger,
    fontSize: 20,
    fontWeight: "600",
  },
  recentIconTextIncome: {
    color: COLORS.primary,
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
  },
  recentMeta: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },
  recentAmount: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: "800",
  },
  recentAmountIncome: {
    color: COLORS.primary,
  },
  emptyActivity: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  emptyActivityText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 27,
  },
  quickAction: {
    flex: 1,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
  },
  quickActionSymbol: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "700",
  },
  quickActionText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  savingsDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 15,
  },
  progressTrack: {
    height: 10,
    borderRadius: 10,
    backgroundColor: COLORS.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  progressValue: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 10,
  },
  actionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 13,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  actionDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },
  actionArrow: {
    color: COLORS.primary,
    fontSize: 27,
    marginLeft: 10,
  },
  disclaimer: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 22,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 15,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
