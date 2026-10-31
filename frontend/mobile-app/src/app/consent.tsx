import { useAppStyles } from "@/components/app-theme";
import React, { useEffect, useState } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";

import { BrandLockup } from "@/components/brand-lockup";
import { MotionPressable as Pressable, MotionReveal, ScreenEntrance } from "@/components/motion";
import { useFeedback } from "@/components/feedback";
import {
  saveConsent,
  getConsent,
  revokeConsent,
  ConsentPayload,
} from "../services/consent.service";
import { signOut } from "../services/auth.service";
import { COLORS } from "../constants/colors";

const categories = [
  {
    id: "income",
    title: "Income",
    description: "Information about money you receive.",
  },
  {
    id: "expenses",
    title: "Expenses",
    description: "Information about your spending.",
  },
  {
    id: "savings",
    title: "Savings",
    description: "Information about money you save.",
  },
  {
    id: "transactions",
    title: "Transactions",
    description: "Transaction records you provide.",
  },
  {
    id: "employment",
    title: "Employment type",
    description: "Your selected work arrangement, such as salaried or self-employed.",
  },
  {
    id: "existing_debt",
    title: "Current debt and obligations",
    description: "Repayments or debt amounts you choose to enter in your profile.",
  },
];

export default function ConsentScreen() {
  const styles = useAppStyles(baseStyles);
  const { notify } = useFeedback();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [existingConsent, setExistingConsent] = useState<any>(null);
  const [loadError, setLoadError] = useState(false);
  const isActive = Boolean(
    (existingConsent?.consent_given || existingConsent?.status === "active" || existingConsent?.status === "granted") &&
      existingConsent?.status !== "revoked" &&
      existingConsent?.status !== "withdrawn"
  );

  useEffect(() => {
    let mounted = true;
    getConsent()
      .then((response) => {
        if (!mounted) return;
        const record = response?.data?.consent ?? response?.data ?? response;
        if (!record || typeof record !== "object") return;
        setExistingConsent(record);
        if ((record.consent_given || record.status === "active" || record.status === "granted") && record.status !== "revoked" && record.status !== "withdrawn") {
          setSelectedCategories(Array.isArray(record.data_categories) ? record.data_categories : []);
          setConsentGiven(true);
        }
      })
      .catch(() => {
        if (mounted) setLoadError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((current) =>
      current.includes(categoryId)
        ? current.filter((item) => item !== categoryId)
        : [...current, categoryId]
    );
  };

  const handleSubmit = async () => {
    if (!consentGiven) {
      notify(
        "Consent required",
        "Please read the information and confirm your consent to continue.",
        "error"
      );
      return;
    }

    if (selectedCategories.length === 0) {
      notify(
        "Select data categories",
        "Please select at least one data category.",
        "error"
      );
      return;
    }

    const payload: ConsentPayload = {
      consent_given: true,
      purpose: "Financial wellness assessment",
      data_categories: selectedCategories,
    };

    try {
      setSaving(true);

      await saveConsent(payload);
      setExistingConsent({ ...payload, status: "active", saved_at: new Date().toISOString() });

      notify(
        "Consent recorded",
        "Your consent selection has been saved.",
        "success"
      );
      router.replace("/financial-profile");
    } catch (error: any) {
      notify(
        "Unable to save consent",
        error?.response?.data?.message ||
          error?.message ||
          "Please try again.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmRevoke = () => {
    Alert.alert(
      "Withdraw data consent?",
      "Worthly will stop using these categories for new assessments. Previously generated reports may remain in your account until deleted.",
      [
        { text: "Keep consent", style: "cancel" },
        {
          text: "Withdraw consent",
          style: "destructive",
          onPress: async () => {
            try {
              setRevoking(true);
              await revokeConsent();
              setExistingConsent((current: any) => ({ ...current, consent_given: false, status: "revoked" }));
              setConsentGiven(false);
              setSelectedCategories([]);
              notify("Consent withdrawn", "Worthly will not use these categories for new assessments.", "success");
            } catch (error) {
              notify("Could not withdraw consent", error instanceof Error ? error.message : "Please try again.", "error");
            } finally {
              setRevoking(false);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
      router.replace("/");
    } catch (error) {
      notify("Could not sign out", error instanceof Error ? error.message : "Please try again.", "error");
      setSigningOut(false);
    }
  };

  return (
    <ScreenEntrance>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <BrandLockup compact />
      <View style={styles.header}>
        <View style={styles.stepBadge}>
          <View style={styles.stepDot} />
          <Text style={styles.step}>{isActive ? "PRIVACY CONTROLS" : "ONBOARDING · STEP 1 OF 2"}</Text>
        </View>
        <Text style={styles.title}>{isActive ? "Your consent, your call." : "Your data, your choice."}</Text>
        <Text style={styles.subtitle}>
          Choose which financial information you allow Worthly
          to use for your financial wellness assessment.
        </Text>
      </View>

      {!isActive && (
        <View style={styles.requiredBanner} accessibilityRole="summary">
          <View style={styles.requiredIcon}><Text style={styles.requiredIconText}>!</Text></View>
          <View style={styles.requiredCopy}>
            <Text style={styles.requiredTitle}>Consent is required to continue</Text>
            <Text style={styles.requiredText}>Your dashboard and financial tools stay locked until you choose at least one category and agree.</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.infoCard} accessibilityRole="progressbar" accessibilityLabel="Loading saved consent">
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.infoText}>Checking your saved consent…</Text>
        </View>
      ) : loadError ? (
        <View style={styles.infoCard} accessibilityRole="alert">
          <Text style={styles.infoTitle}>We couldn’t load your saved consent</Text>
          <Text style={styles.infoText}>Try again before changing these settings.</Text>
          <Pressable accessibilityRole="button" onPress={async () => {
            setLoading(true);
            setLoadError(false);
            try {
              const response = await getConsent();
              const record = response?.data?.consent ?? response?.data ?? response;
              setExistingConsent(record && typeof record === "object" ? record : null);
              if ((record?.consent_given || record?.status === "active" || record?.status === "granted") && record.status !== "revoked" && record.status !== "withdrawn") {
                setSelectedCategories(Array.isArray(record.data_categories) ? record.data_categories : []);
                setConsentGiven(true);
              }
            } catch {
              setLoadError(true);
            } finally {
              setLoading(false);
            }
          }} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      ) : isActive ? (
        <View style={styles.savedCard}>
          <Text style={styles.savedTitle}>Consent is active</Text>
          <Text style={styles.savedText}>
            You allowed {selectedCategories.length} data {selectedCategories.length === 1 ? "category" : "categories"} for a financial wellness assessment.
            {(existingConsent?.saved_at || existingConsent?.created_at) ? ` Saved ${new Date(existingConsent.saved_at || existingConsent.created_at).toLocaleDateString("en-IN")}.` : ""}
          </Text>
          <Text style={styles.savedText}>You can update your choices or withdraw consent at any time.</Text>
        </View>
      ) : null}

      <MotionReveal style={{ width: "100%" }} delay={70}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Why do we need your consent?</Text>
        <Text style={styles.infoText}>
          Worthly analyses the financial information you choose
          to provide to help understand your income, expenses,
          savings and transaction patterns.
        </Text>
      </View>
      </MotionReveal>

      <View style={styles.categoryHeading}>
        <View style={styles.categoryHeadingCopy}>
          <Text style={styles.sectionTitle}>
            {isActive ? "Update your categories" : "Choose data categories"}
          </Text>
          <Text style={styles.sectionDescription}>
            Select only the information you agree to share.
          </Text>
        </View>
        <View style={styles.selectedBadge}>
          <Text style={styles.selectedCount}>{selectedCategories.length}</Text>
          <Text style={styles.selectedLabel}>selected</Text>
        </View>
      </View>

      {categories.map((category, index) => {
        const selected = selectedCategories.includes(category.id);

        return (
          <MotionReveal key={category.id} style={{ width: "100%" }} delay={120 + index * 55}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            onPress={() => toggleCategory(category.id)}
            style={[
              styles.categoryCard,
              selected && styles.categorySelected,
            ]}
          >
            <View style={styles.categoryContent}>
              <Text style={styles.categoryTitle}>
                {category.title}
              </Text>

              <Text style={styles.categoryDescription}>
                {category.description}
              </Text>
            </View>

            <View
              style={[
                styles.checkbox,
                selected && styles.checkboxSelected,
              ]}
            >
              {selected && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </Pressable>
          </MotionReveal>
        );
      })}

      <MotionReveal style={{ width: "100%" }} delay={320}>
      <View style={styles.consentCard}>
        <Text style={styles.acknowledgementLabel}>YOUR CONFIRMATION</Text>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consentGiven }}
          style={styles.consentRow}
          onPress={() => setConsentGiven((current) => !current)}
        >
          <View
            style={[
              styles.checkbox,
              consentGiven && styles.checkboxSelected,
            ]}
          >
            {consentGiven && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>

          <Text style={styles.consentText}>
            I voluntarily consent to the processing of the selected
            financial data categories for a financial wellness assessment.
          </Text>
        </Pressable>
      </View>
      </MotionReveal>

      <Text style={styles.disclaimer}>
        You can choose which categories to share. Your financial
        information must not be processed under this consent unless
        you agree. This consent is separate from creating your account.
      </Text>

      <Pressable
        onPress={handleSubmit}
        disabled={loading || saving || loadError || (!isActive && (!consentGiven || selectedCategories.length === 0))}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          (loading || saving || loadError || (!isActive && (!consentGiven || selectedCategories.length === 0))) && styles.buttonDisabled,
        ]}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            {isActive ? "Save my choices" : "I agree & continue"}
          </Text>
        )}
      </Pressable>

      {isActive && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Withdraw data consent"
          disabled={revoking}
          onPress={confirmRevoke}
          style={styles.withdrawButton}
        >
          {revoking ? <ActivityIndicator color={COLORS.danger} /> : <Text style={styles.withdrawText}>Withdraw consent</Text>}
        </Pressable>
      )}

      <Pressable
        accessibilityRole="button"
        disabled={signingOut}
        onPress={handleSignOut}
        style={styles.backButton}
      >
        {signingOut ? <ActivityIndicator color={COLORS.muted} /> : <Text style={styles.signOutText}>Sign out</Text>}
      </Pressable>
    </ScrollView>
    </ScreenEntrance>
  );
}

const baseStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    padding: 22,
    paddingTop: 24,
    paddingBottom: 46,
  },

  header: {
    marginTop: 18,
    marginBottom: 20,
  },

  stepBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginBottom: 14,
  },
  stepDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.emerald },

  step: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  requiredBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    backgroundColor: COLORS.warningSurface,
    borderColor: COLORS.warningLight,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  requiredIcon: { width: 25, height: 25, borderRadius: 9, backgroundColor: COLORS.warningLight, alignItems: "center", justifyContent: "center" },
  requiredIconText: { color: COLORS.warningText, fontSize: 14, fontWeight: "900" },
  requiredCopy: { flex: 1 },
  requiredTitle: { color: COLORS.warningText, fontSize: 12, fontWeight: "900" },
  requiredText: { color: COLORS.warningText, fontSize: 11, lineHeight: 16, marginTop: 4 },

  title: {
    color: COLORS.text,
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 37,
    letterSpacing: -0.6,
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },

  infoCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    padding: 17,
    marginBottom: 25,
  },

  savedCard: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    gap: 8,
  },
  savedTitle: { color: COLORS.primary, fontSize: 16, fontWeight: "800" },
  savedText: { color: COLORS.text, fontSize: 13, lineHeight: 20 },
  retryButton: { alignSelf: "flex-start", paddingVertical: 10, paddingHorizontal: 14, marginTop: 6 },
  retryButtonText: { color: COLORS.primary, fontWeight: "700" },
  withdrawButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 12, padding: 12 },
  withdrawText: { color: COLORS.danger, fontSize: 14, fontWeight: "700" },

  infoTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },

  infoText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 21,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },

  categoryHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 },
  categoryHeadingCopy: { flex: 1 },
  selectedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 7 },
  selectedCount: { color: COLORS.primary, fontSize: 11, fontWeight: "900" },
  selectedLabel: { color: COLORS.muted, fontSize: 9, fontWeight: "700" },

  sectionDescription: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 5,
    marginBottom: 0,
  },

  categoryCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  categorySelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },

  categoryContent: {
    flex: 1,
    paddingRight: 12,
  },

  categoryTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
  },

  categoryDescription: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
    lineHeight: 18,
  },

  checkbox: {
    height: 25,
    width: 25,
    borderWidth: 1.5,
    borderColor: COLORS.muted,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  checkmark: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },

  consentCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 17,
    padding: 16,
    marginTop: 12,
  },
  acknowledgementLabel: { color: COLORS.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginBottom: 13 },

  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  consentText: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 21,
    flex: 1,
    marginLeft: 12,
  },

  disclaimer: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 16,
  },

  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    height: 57,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  buttonPressed: {
    opacity: 0.8,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },

  backButton: {
    alignItems: "center",
    marginTop: 18,
  },

  signOutText: { color: COLORS.muted, fontSize: 13, fontWeight: "600" },
});
