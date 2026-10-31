import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAppStyles, useAppTheme } from "@/components/app-theme";
import { BrandLockup } from "@/components/brand-lockup";
import { useFeedback } from "@/components/feedback";
import { MotionPressable as Pressable, ScreenEntrance } from "@/components/motion";
import { COLORS } from "@/constants/colors";
import {
  getAccountProfile,
  updateAccountProfile,
  type AccountProfile,
} from "@/services/auth.service";

export default function AccountProfileScreen() {
  const styles = useAppStyles(baseStyles);
  const { colors } = useAppTheme();
  const { notify } = useFeedback();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const currentProfile = await getAccountProfile();
      setProfile(currentProfile);
      setLoadError(false);
      setFullName(currentProfile?.fullName ?? "");
      setPhone(currentProfile?.phone ?? "");
    } catch (error) {
      setLoadError(true);
      notify(
        "Could not load account details",
        error instanceof Error ? error.message : "Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    let active = true;
    getAccountProfile()
      .then((currentProfile) => {
        if (!active) return;
        setProfile(currentProfile);
        setFullName(currentProfile?.fullName ?? "");
        setPhone(currentProfile?.phone ?? "");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(true);
        notify(
          "Could not load account details",
          error instanceof Error ? error.message : "Please try again.",
          "error"
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [notify]);

  async function handleSave() {
    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();
    const phoneDigits = cleanPhone.replace(/\D/g, "");

    if (!cleanName) {
      notify("Name required", "Enter your full name before saving.", "error");
      return;
    }

    if (
      cleanPhone &&
      (!/^\+?[0-9\s().-]+$/.test(cleanPhone) ||
        phoneDigits.length < 7 ||
        phoneDigits.length > 15)
    ) {
      notify(
        "Check phone number",
        "Enter a valid phone number with 7 to 15 digits.",
        "error"
      );
      return;
    }

    setSaving(true);
    try {
      const updatedProfile = await updateAccountProfile({
        fullName: cleanName,
        phone: cleanPhone,
      });
      setProfile(updatedProfile);
      setFullName(updatedProfile.fullName);
      setPhone(updatedProfile.phone);
      notify("Details saved", "Your personal information has been updated.", "success");
    } catch (error) {
      notify(
        "Unable to save details",
        error instanceof Error ? error.message : "Please try again.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  const hasChanges =
    profile !== null &&
    (fullName.trim() !== profile.fullName || phone.trim() !== profile.phone);

  return (
    <ScreenEntrance>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to More"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={19} color={colors.primary} />
            <Text style={styles.backText}>More</Text>
          </Pressable>
          <BrandLockup compact />
          <Text style={styles.heading}>Personal information</Text>
          <Text style={styles.subtitle}>
            Manage the contact details associated with your Worthly account.
          </Text>

          {loading ? (
            <View
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel="Loading account details"
              style={styles.stateCard}
            >
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.stateText}>Loading your account details…</Text>
            </View>
          ) : loadError ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateText}>
                Your account details could not be loaded.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setLoading(true);
                  setLoadError(false);
                  void loadProfile();
                }}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : !profile ? (
            <View style={styles.stateCard}>
              <Ionicons name="person-circle-outline" size={32} color={colors.primary} />
              <Text style={styles.stateTitle}>Sign in to view your account</Text>
              <Text style={styles.stateText}>
                Personal details are available after you create an account or sign in.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/login")}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Go to login</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.label}>Full name</Text>
                <TextInput
                  accessibilityLabel="Full name"
                  autoCapitalize="words"
                  autoComplete="name"
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.muted}
                  returnKeyType="next"
                  style={styles.input}
                  value={fullName}
                />

                <Text style={styles.label}>Email address</Text>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyValue}>
                    {profile.email || "No email address available"}
                  </Text>
                  <Ionicons name="lock-closed-outline" size={16} color={colors.muted} />
                </View>
                <Text style={styles.helperText}>
                  Email changes require verification through your sign-in provider.
                </Text>

                <Text style={styles.label}>Phone number (optional)</Text>
                <TextInput
                  accessibilityLabel="Phone number"
                  autoComplete="tel"
                  keyboardType="phone-pad"
                  onChangeText={setPhone}
                  placeholder="+1 555 123 4567"
                  placeholderTextColor={colors.muted}
                  returnKeyType="done"
                  style={styles.input}
                  value={phone}
                />
                <Text style={styles.helperText}>
                  This number is saved to your account but is not verified for sign-in.
                </Text>
              </View>

              <View style={styles.privacyNote}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.privacyText}>
                  Worthly only asks for personal details needed to manage your account.
                  Financial information is managed separately in your financial profile.
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={!hasChanges || saving}
                onPress={handleSave}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.pressed,
                  (!hasChanges || saving) && styles.disabled,
                ]}
              >
                {saving ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Save changes</Text>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>
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
    maxWidth: 720,
    alignSelf: "center",
    padding: 22,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: "flex-start",
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 8,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  heading: {
    color: COLORS.navy,
    fontSize: 27,
    fontWeight: "800",
    marginTop: 26,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 18,
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 7,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    backgroundColor: COLORS.surfaceSubtle,
    color: COLORS.text,
    fontSize: 14,
    paddingHorizontal: 13,
    marginBottom: 18,
  },
  readOnlyField: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 13,
  },
  readOnlyValue: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 14,
    marginRight: 10,
  },
  helperText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: -11,
    marginBottom: 18,
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    padding: 14,
    marginTop: 16,
    marginBottom: 18,
  },
  privacyText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    paddingHorizontal: 18,
    marginTop: 14,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  stateCard: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  stateTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 12,
  },
  stateText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 9,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.78,
  },
});
