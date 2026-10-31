import { useAppStyles, useAppTheme } from "@/components/app-theme";
import { BrandLockup } from "@/components/brand-lockup";
import { MotionPressable as Pressable, MotionReveal, ScreenEntrance } from "@/components/motion";
import { COLORS } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const CHART_BARS = [24, 32, 28, 45, 40, 56, 51, 72];

const FEATURES = [
  {
    icon: "analytics-outline" as const,
    title: "See the full picture",
    description: "Understand the patterns across income, spending, and savings.",
  },
  {
    icon: "options-outline" as const,
    title: "Choose what you share",
    description: "Review each data category and give consent before use.",
  },
  {
    icon: "sparkles-outline" as const,
    title: "Turn patterns into clarity",
    description: "Get practical context for your financial wellbeing.",
  },
];

export default function HomeScreen() {
  const styles = useAppStyles(baseStyles);
  const { colors } = useAppTheme();

  return (
    <ScreenEntrance>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <MotionReveal style={styles.fullWidth}>
          <View style={styles.topBar}>
            <BrandLockup />
            <View style={styles.privacyBadge}>
              <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
              <Text style={styles.privacyText}>Privacy first</Text>
            </View>
          </View>
        </MotionReveal>

        <View style={styles.heroGrid}>
          <MotionReveal style={styles.heroCopy} delay={60}>
            <View style={styles.eyebrowPill}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.eyebrow}>FINANCIAL WELLBEING, REFRAMED</Text>
            </View>
            <Text style={styles.title}>
              Your money tells a{`\n`}
              <Text style={styles.titleAccent}>bigger story.</Text>
            </Text>
            <Text style={styles.description}>
              Build a fuller picture of your financial health, even if your credit history is just getting started.
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create your Worthly account"
              style={styles.ctaPressable}
              onPress={() => router.push("/signup")}
            >
              <LinearGradient
                colors={[colors.primary, "#075A45"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Create your account</Text>
                <View style={styles.ctaIcon}>
                  <Ionicons name="arrow-forward" size={17} color={colors.primary} />
                </View>
              </LinearGradient>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={styles.signInButton}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.signInCopy}>Already have an account?</Text>
              <Text style={styles.signInLink}>Sign in</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </Pressable>

            <View style={styles.trustRow}>
              <Ionicons name="lock-closed-outline" size={14} color={colors.muted} />
              <Text style={styles.trustCopy}>No credit bureau connection required</Text>
            </View>
          </MotionReveal>

          <MotionReveal style={styles.fullWidth} delay={150}>
            <LinearGradient
              colors={[colors.navy, "#173D36", colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.snapshotCard}
            >
              <View style={styles.snapshotGlow} />
              <View style={styles.snapshotHeader}>
                <View>
                  <Text style={styles.snapshotOverline}>A CLEARER PICTURE</Text>
                  <Text style={styles.snapshotTitle}>Your financial pulse</Text>
                </View>
                <View style={styles.sampleBadge}>
                  <View style={styles.sampleDot} />
                  <Text style={styles.sampleText}>SAMPLE</Text>
                </View>
              </View>

              <View style={styles.pulseSummary}>
                <View>
                  <Text style={styles.pulseValue}>71</Text>
                  <Text style={styles.pulseCaption}>Illustrative score</Text>
                </View>
                <View style={styles.trendBadge}>
                  <Ionicons name="trending-up" size={15} color="#8AF0BC" />
                  <Text style={styles.trendText}>Growing steadily</Text>
                </View>
              </View>

              <View style={styles.chart} accessibilityRole="image" accessibilityLabel="Illustrative sample chart, not your financial data">
                {CHART_BARS.map((height, index) => (
                  <View key={index} style={styles.chartColumn}>
                    <View style={[styles.chartBar, { height }, index === CHART_BARS.length - 1 && styles.chartBarActive]} />
                  </View>
                ))}
              </View>
              <View style={styles.chartLabels}>
                <Text style={styles.chartLabel}>JAN</Text>
                <Text style={styles.chartLabel}>MAR</Text>
                <Text style={styles.chartLabel}>MAY</Text>
                <Text style={styles.chartLabel}>JUN</Text>
              </View>

              <View style={styles.snapshotFooter}>
                <View style={styles.footerIcon}>
                  <Ionicons name="sparkles" size={15} color="#A4F1CB" />
                </View>
                <Text style={styles.snapshotFooterCopy}>A more complete view starts with your choices.</Text>
              </View>
            </LinearGradient>
          </MotionReveal>
        </View>

        <MotionReveal style={styles.fullWidth} delay={230}>
          <View style={styles.sectionIntro}>
            <Text style={styles.sectionEyebrow}>MADE FOR REAL LIFE</Text>
            <Text style={styles.sectionTitle}>A little more clarity, at every step.</Text>
          </View>
          <View style={styles.featureList}>
            {FEATURES.map((feature, index) => (
              <View key={feature.title} style={[styles.featureRow, index === FEATURES.length - 1 && styles.featureRowLast]}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon} size={19} color={colors.primary} />
                </View>
                <View style={styles.featureCopy}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </View>
            ))}
          </View>
        </MotionReveal>

        <MotionReveal style={styles.fullWidth} delay={310}>
          <View style={styles.disclaimerCard}>
            <View style={styles.disclaimerIcon}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.disclaimer}>
              Worthly is an experimental financial wellness indicator. It does not replace CIBIL or another credit bureau, predict repayment, or approve or reject loans.
            </Text>
          </View>
        </MotionReveal>
      </ScrollView>
    </ScreenEntrance>
  );
}

const baseStyles = StyleSheet.create({
  fullWidth: { width: "100%" },
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: {
    width: "100%",
    maxWidth: 1080,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 44,
    gap: 34,
  },
  topBar: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  privacyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  privacyText: { color: COLORS.primary, fontSize: 11, fontWeight: "800" },
  heroGrid: { gap: 26 },
  heroCopy: { width: "100%" },
  eyebrowPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 11,
    paddingVertical: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 999,
    marginBottom: 18,
  },
  eyebrowDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.emerald },
  eyebrow: { color: COLORS.primary, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: COLORS.text, fontSize: 42, lineHeight: 48, fontWeight: "900", letterSpacing: -1.5 },
  titleAccent: { color: COLORS.primary },
  description: { color: COLORS.muted, fontSize: 15, lineHeight: 24, marginTop: 13, maxWidth: 510 },
  ctaPressable: { marginTop: 23, borderRadius: 15, overflow: "hidden" },
  primaryButton: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 13,
    paddingHorizontal: 17,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  ctaIcon: { width: 31, height: 31, borderRadius: 10, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  signInButton: { minHeight: 49, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  signInCopy: { color: COLORS.muted, fontSize: 13 },
  signInLink: { color: COLORS.primary, fontSize: 13, fontWeight: "900" },
  trustRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 4 },
  trustCopy: { color: COLORS.muted, fontSize: 11, fontWeight: "600" },
  snapshotCard: { minHeight: 335, borderRadius: 25, padding: 21, overflow: "hidden", shadowColor: COLORS.navy, shadowOpacity: 0.18, shadowRadius: 25, shadowOffset: { width: 0, height: 14 }, elevation: 8 },
  snapshotGlow: { position: "absolute", width: 190, height: 190, borderRadius: 100, top: -70, right: -40, backgroundColor: "#FFFFFF12" },
  snapshotHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  snapshotOverline: { color: "#A9CFC1", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  snapshotTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "800", marginTop: 7 },
  sampleBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFFFFF18", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999 },
  sampleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#A4F1CB" },
  sampleText: { color: "#D9F2E7", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  pulseSummary: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 20 },
  pulseValue: { color: "#FFFFFF", fontSize: 54, lineHeight: 60, fontWeight: "900", letterSpacing: -2 },
  pulseCaption: { color: "#BCD4CA", fontSize: 10, fontWeight: "600", marginTop: 1 },
  trendBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#FFFFFF17", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 7 },
  trendText: { color: "#C4F5DC", fontSize: 10, fontWeight: "700" },
  chart: { height: 95, flexDirection: "row", alignItems: "flex-end", gap: 7, marginTop: 15 },
  chartColumn: { flex: 1, height: 82, justifyContent: "flex-end", alignItems: "stretch" },
  chartBar: { width: "100%", backgroundColor: "#FFFFFF32", borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  chartBarActive: { backgroundColor: "#8AF0BC" },
  chartLabels: { flexDirection: "row", justifyContent: "space-between", paddingTop: 7 },
  chartLabel: { color: "#A9CFC1", fontSize: 8, fontWeight: "700", letterSpacing: 0.5 },
  snapshotFooter: { flexDirection: "row", alignItems: "center", gap: 9, borderTopWidth: 1, borderTopColor: "#FFFFFF26", marginTop: 15, paddingTop: 13 },
  footerIcon: { width: 27, height: 27, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF19" },
  snapshotFooterCopy: { color: "#E3F3EB", fontSize: 10, fontWeight: "600", flex: 1 },
  sectionIntro: { marginBottom: 15 },
  sectionEyebrow: { color: COLORS.primary, fontSize: 9, fontWeight: "900", letterSpacing: 1.3, marginBottom: 7 },
  sectionTitle: { color: COLORS.text, fontSize: 22, lineHeight: 28, fontWeight: "900", letterSpacing: -0.5 },
  featureList: { backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 15, shadowColor: COLORS.navy, shadowOpacity: 0.04, shadowRadius: 15, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
  featureRow: { minHeight: 84, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  featureRowLast: { borderBottomWidth: 0 },
  featureIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center" },
  featureCopy: { flex: 1 },
  featureTitle: { color: COLORS.text, fontSize: 13, fontWeight: "900" },
  featureDescription: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  disclaimerCard: { flexDirection: "row", alignItems: "flex-start", gap: 9, backgroundColor: COLORS.surfaceSubtle, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 13 },
  disclaimerIcon: { marginTop: 1 },
  disclaimer: { flex: 1, color: COLORS.muted, fontSize: 10, lineHeight: 16 },
});
