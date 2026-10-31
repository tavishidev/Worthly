import { useAppStyles, useAppTheme } from "@/components/app-theme";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import * as ExpoLinking from "expo-linking";

import { BrandLockup } from "@/components/brand-lockup";
import { useFeedback } from "@/components/feedback";
import { MotionPressable, ScreenEntrance } from "@/components/motion";
import { COLORS } from "@/constants/colors";
import {
  completePasswordRecovery,
  requestPasswordReset,
  updatePassword,
} from "@/services/auth.service";

export default function ForgotPasswordScreen() {
  const styles = useAppStyles(baseStyles);
  const { colors } = useAppTheme();
  const { notify } = useFeedback();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function handleUrl(url?: string | null) {
      if (!url) return;
      try {
        const ready = await completePasswordRecovery(url);
        if (active && ready) setRecoveryReady(true);
      } catch (error) {
        if (active) {
          notify(
            "Recovery link could not be verified",
            error instanceof Error ? error.message : "Request a new reset link.",
            "error"
          );
        }
      }
    }

    Linking.getInitialURL().then(handleUrl).catch((error: unknown) => {
      if (active) {
        notify(
          "Unable to open recovery link",
          error instanceof Error ? error.message : "Please try again.",
          "error"
        );
      }
    });

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleUrl(url);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, [notify]);

  async function handleRequestReset() {
    const cleanEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      notify("Check your email", "Enter a valid email address.", "error");
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(
        cleanEmail,
        ExpoLinking.createURL("forgot-password")
      );
      setEmailSent(true);
      notify(
        "Check your inbox",
        "If an account exists for this email, a password reset link is on its way.",
        "success"
      );
    } catch (error) {
      notify(
        "Could not send reset email",
        error instanceof Error ? error.message : "Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePassword() {
    if (password.length < 8) {
      notify("Password is too short", "Use at least 8 characters.", "error");
      return;
    }
    if (password !== confirmPassword) {
      notify(
        "Passwords do not match",
        "Enter the same password in both fields.",
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      notify(
        "Password updated",
        "You can now sign in with your new password.",
        "success"
      );
      router.replace("/login");
    } catch (error) {
      notify(
        "Could not update password",
        error instanceof Error ? error.message : "Please request a new recovery link.",
        "error"
      );
    } finally {
      setLoading(false);
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
          <View style={styles.header}>
            <BrandLockup />
          </View>

          <View style={styles.card}>
            <Text style={styles.heading}>
              {recoveryReady
                ? "Choose a new password"
                : "Reset your password"}
            </Text>
            <Text style={styles.description}>
              {recoveryReady
                ? "Create a new password for your Worthly account."
                : emailSent
                  ? "Open the recovery link in your email on this device to continue."
                  : "Enter the email address linked to your account and we’ll send you a secure recovery link."}
            </Text>

            {recoveryReady ? (
              <>
                <Text style={styles.label}>New password</Text>
                <TextInput
                  accessibilityLabel="New password"
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  returnKeyType="next"
                />
                <Text style={styles.label}>Confirm new password</Text>
                <TextInput
                  accessibilityLabel="Confirm new password"
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your new password"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  returnKeyType="done"
                />
                <MotionPressable
                  accessibilityRole="button"
                  onPress={handleUpdatePassword}
                  disabled={loading}
                  style={[styles.primaryButton, loading && styles.disabled]}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Update password</Text>
                  )}
                </MotionPressable>
              </>
            ) : (
              <>
                <Text style={styles.label}>Email address</Text>
                <TextInput
                  accessibilityLabel="Email address"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  returnKeyType="send"
                  onSubmitEditing={handleRequestReset}
                />
                <MotionPressable
                  accessibilityRole="button"
                  onPress={handleRequestReset}
                  disabled={loading}
                  style={[styles.primaryButton, loading && styles.disabled]}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {emailSent ? "Send another reset link" : "Send reset link"}
                    </Text>
                  )}
                </MotionPressable>
              </>
            )}

            <MotionPressable
              accessibilityRole="button"
              onPress={() => router.replace("/login")}
              style={styles.backButton}
            >
              <Text style={styles.backText}>Back to sign in</Text>
            </MotionPressable>
          </View>
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
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingVertical: 40,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
  },
  description: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    paddingHorizontal: 14,
    color: COLORS.text,
    fontSize: 15,
    backgroundColor: COLORS.surfaceSubtle,
  },
  primaryButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    marginTop: 22,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
  disabled: {
    opacity: 0.65,
  },
  backButton: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 4,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});
