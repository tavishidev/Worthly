import { useAppStyles, useAppTheme } from "@/components/app-theme";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import { BrandLockup } from "@/components/brand-lockup";
import { MotionPressable as Pressable, MotionReveal, ScreenEntrance } from "@/components/motion";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { COLORS } from "@/constants/colors";
import { FinancialProfile } from "@/types/financial";
import {
  getFinancialProfile,
  saveFinancialProfile,
} from "@/services/profile.service";

const EMPLOYMENT_TYPES = [
  { label: "Salaried", value: "salaried" },
  { label: "Self-employed", value: "self_employed" },
  { label: "Business", value: "business" },
  { label: "Student", value: "student" },
  { label: "Other", value: "other" },
] as const;

type FormValues = {
  monthly_income: string;
  monthly_expenses: string;
  monthly_savings: string;
  existing_debt: string;
  employment_type: string;
};

const EMPTY_FORM: FormValues = {
  monthly_income: "",
  monthly_expenses: "",
  monthly_savings: "",
  existing_debt: "",
  employment_type: "",
};

const FORM_FIELDS: {
  key: keyof Omit<FormValues, "employment_type">;
  label: string;
  helper: string;
  required?: boolean;
}[] = [
  {
    key: "monthly_income",
    label: "Monthly take-home income",
    helper: "Your typical income after tax",
    required: true,
  },
  {
    key: "monthly_expenses",
    label: "Monthly expenses",
    helper: "Include regular household and personal spending",
  },
  {
    key: "monthly_savings",
    label: "Monthly savings",
    helper: "What you usually set aside each month",
  },
  {
    key: "existing_debt",
    label: "Monthly debt obligations",
    helper: "Current loan or credit repayments",
  },
];

function formatFieldValue(value: number | undefined) {
  return value == null ? "" : String(value);
}

export default function FinancialProfileScreen() {
  const styles = useAppStyles(baseStyles);
  const { colors } = useAppTheme();
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [saved, setSaved] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);

    try {
      const response = await getFinancialProfile();
      const profile = response?.data ?? response;

      if (profile && typeof profile === "object") {
        setValues({
          monthly_income: formatFieldValue(profile.monthly_income),
          monthly_expenses: formatFieldValue(profile.monthly_expenses),
          monthly_savings: formatFieldValue(profile.monthly_savings),
          existing_debt: formatFieldValue(profile.existing_debt),
          employment_type: profile.employment_type ?? "",
        });
      }

      setIsMock(Boolean(response?.mock));
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to load your profile."
      );
      setFeedbackType("error");
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  function updateValue(key: keyof FormValues, value: string) {
    const cleanValue =
      key === "employment_type" ? value : value.replace(/[^\d.]/g, "");
    setValues((current) => ({ ...current, [key]: cleanValue }));
    setSaved(false);
    setFeedback(null);
  }

  async function handleSave() {
    const numericFields = {
      monthly_income: Number(values.monthly_income),
      monthly_expenses: Number(values.monthly_expenses || 0),
      monthly_savings: Number(values.monthly_savings || 0),
      existing_debt: Number(values.existing_debt || 0),
    };

    if (!values.monthly_income.trim() || numericFields.monthly_income <= 0) {
      setFeedback("Enter a monthly income greater than zero.");
      setFeedbackType("error");
      return;
    }

    if (
      Object.values(numericFields).some(
        (value) => !Number.isFinite(value) || value < 0
      )
    ) {
      setFeedback("Enter valid, non-negative amounts for each field.");
      setFeedbackType("error");
      return;
    }

    if (!values.employment_type) {
      setFeedback("Choose an employment type to continue.");
      setFeedbackType("error");
      return;
    }

    const profile: FinancialProfile = {
      ...numericFields,
      employment_type: values.employment_type,
    };

    setSaving(true);
    try {
      const response = await saveFinancialProfile(profile);
      setIsMock(Boolean(response?.mock));
      setSaved(true);
      setFeedback(
        response?.message || "Your financial profile has been saved."
      );
      setFeedbackType("success");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to save your profile."
      );
      setFeedbackType("error");
      setSaved(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenEntrance>
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <BrandLockup compact />
        <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityLabel="Onboarding step 2 of 2" accessibilityValue={{ min: 1, max: 2, now: 2 }}>
          <View style={styles.progressSegmentComplete} />
          <View style={styles.progressSegmentActive} />
        </View>
        <Text style={styles.step}>ONBOARDING · STEP 2 OF 2</Text>
        <Text style={styles.heading}>A little context goes a long way.</Text>
        <Text style={styles.subtitle}>
          Share a few monthly figures to help Worthly make your financial
          overview more useful. You can update these details later.
        </Text>

        {isMock && (
          <View style={styles.mockNotice}>
            <Text style={styles.mockNoticeText}>
              Preview mode · Your profile is stored on this device only.
            </Text>
          </View>
        )}

        {loadingProfile ? (
          <LoadingSkeleton variant="profile" label="Loading your financial profile" />
        ) : (
          <>
            <MotionReveal style={{ width: "100%" }} delay={70}>
            <View style={styles.formCard}>
              {FORM_FIELDS.map((field) => (
                <View key={field.key} style={styles.field}>
                  <Text style={styles.label}>
                    {field.label}
                    {field.required ? " *" : ""}
                  </Text>
                  <View style={styles.amountInput}>
                    <Text style={styles.currency}>₹</Text>
                    <TextInput
                      accessibilityLabel={field.label}
                      style={styles.input}
                      value={values[field.key]}
                      onChangeText={(value) => updateValue(field.key, value)}
                      placeholder="0"
                      placeholderTextColor={colors.muted}
                      keyboardType="decimal-pad"
                      returnKeyType="next"
                    />
                    <Text style={styles.perMonth}>/ month</Text>
                  </View>
                  <Text style={styles.helper}>{field.helper}</Text>
                </View>
              ))}

              <Text style={styles.label}>Employment type *</Text>
              <View style={styles.employmentOptions}>
                {EMPLOYMENT_TYPES.map((option) => {
                  const selected = values.employment_type === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() =>
                        updateValue("employment_type", option.value)
                      }
                      style={[
                        styles.employmentOption,
                        selected && styles.employmentOptionSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.employmentText,
                          selected && styles.employmentTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            </MotionReveal>

            <MotionReveal style={{ width: "100%" }} delay={150}>
            <View style={styles.privacyNote}>
              <Text style={styles.privacyIcon}>i</Text>
              <Text style={styles.privacyText}>
                These figures help describe your cash flow. Worthly does not
                approve or reject loans, and this indicator is not a loan decision.
              </Text>
            </View>
            </MotionReveal>

            {feedback && (
              <View
                accessibilityLiveRegion="polite"
                style={[
                  styles.feedbackCard,
                  feedbackType === "error" && styles.feedbackCardError,
                ]}
              >
                <Text
                  style={[
                    styles.feedbackText,
                    feedbackType === "error" && styles.feedbackTextError,
                  ]}
                >
                  {feedback}
                </Text>
              </View>
            )}

            <MotionReveal style={{ width: "100%" }} delay={220}>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                saved ? router.replace("/dashboard") : handleSave()
              }
              disabled={saving}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.pressed,
                saving && styles.disabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {saved ? "Continue to dashboard" : "Save financial profile"}
                </Text>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/dashboard")}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>I’ll do this later</Text>
            </Pressable>
            </MotionReveal>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
    </ScreenEntrance>
  );
}

const baseStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    padding: 22,
    paddingTop: 24,
    paddingBottom: 42,
  },
  step: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: 12,
  },
  progressTrack: { width: 86, height: 5, flexDirection: "row", gap: 5, marginBottom: 17 },
  progressSegmentComplete: { flex: 1, borderRadius: 4, backgroundColor: COLORS.emerald },
  progressSegmentActive: { flex: 1, borderRadius: 4, backgroundColor: COLORS.primary },
  heading: {
    color: COLORS.text,
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
    marginBottom: 20,
  },
  mockNotice: {
    borderRadius: 15,
    backgroundColor: COLORS.warningSurface,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.warningLight,
    marginBottom: 16,
  },
  mockNoticeText: {
    color: COLORS.warningText,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  loading: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: COLORS.muted,
    marginTop: 10,
    fontSize: 13,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 21,
    padding: 18,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.045,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
  },
  field: {
    marginBottom: 19,
  },
  label: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.35,
    marginBottom: 8,
  },
  amountInput: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceSubtle,
  },
  currency: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "700",
    marginRight: 9,
  },
  input: {
    flex: 1,
    minHeight: 48,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
  },
  perMonth: {
    color: COLORS.muted,
    fontSize: 11,
  },
  helper: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 6,
  },
  employmentOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  employmentOption: {
    minHeight: 43,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
  },
  employmentOptionSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  employmentText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  employmentTextSelected: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 16,
  },
  privacyIcon: {
    width: 18,
    height: 18,
    overflow: "hidden",
    borderRadius: 9,
    backgroundColor: COLORS.primaryLight,
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 18,
  },
  privacyText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
  },
  feedbackCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  feedbackCardError: {
    backgroundColor: COLORS.dangerLight,
  },
  feedbackText: {
    color: COLORS.primary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  feedbackTextError: {
    color: COLORS.danger,
  },
  saveButton: {
    minHeight: 57,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    marginTop: 22,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.6,
  },
  skipButton: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  skipText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
  },
});
