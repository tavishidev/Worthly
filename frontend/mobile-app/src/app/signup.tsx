import { useAppStyles, useAppTheme } from "@/components/app-theme";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";

import { BrandLockup } from "@/components/brand-lockup";
import { MotionPressable as Pressable, MotionReveal, ScreenEntrance } from "@/components/motion";
import { useFeedback } from "@/components/feedback";
import { getPostAuthRoute, signUp } from "../services/auth.service";
import { COLORS } from "../constants/colors";
import { checkBackendConnection, isBackendConfigured } from "@/services/api";

export default function SignupScreen() {
  const styles = useAppStyles(baseStyles);
  const { colors } = useAppTheme();
  const { notify } = useFeedback();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const isPreviewMode = !isBackendConfigured();

  useEffect(() => {
    if (isPreviewMode) return;
    let active = true;
    checkBackendConnection().then((connected) => {
      if (active) setBackendStatus(connected ? "online" : "offline");
    });
    return () => { active = false; };
  }, [isPreviewMode]);

  const handleSignup = async () => {
    const cleanName = fullName.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanEmail || !password || !confirmPassword) {
      notify("Missing information", "Please complete all fields.", "error");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      notify("Invalid email", "Please enter a valid email address.", "error");
      return;
    }

    if (password.length < 8) {
      notify(
        "Weak password",
        "Your password must contain at least 8 characters.",
        "error"
      );
      return;
    }

    if (password !== confirmPassword) {
      notify("Password mismatch", "Your passwords do not match.", "error");
      return;
    }

    try {
      setLoading(true);

      const data = await signUp(cleanName, cleanEmail, password);

      if (data.session) {
        notify(
          "Account created",
          "Your Worthly account has been created successfully.",
          "success"
        );
        router.replace(await getPostAuthRoute());
      } else {
        notify(
          "Verify your email",
          "Your account registration was submitted. Please check your email for a verification link. Once verified, return and log in.",
          "info"
        );
        router.replace("/login");
      }
    } catch (error: any) {
      notify(
        "Signup failed",
        error?.message || "Something went wrong. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenEntrance>
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isPreviewMode && (
          <View style={styles.previewNotice} accessibilityRole="summary">
            <Text style={styles.previewNoticeTitle}>Local preview</Text>
            <Text style={styles.previewNoticeText}>
              Your sample account stays on this device. Preview mode is for exploring the interface and does not provide real account security.
            </Text>
          </View>
        )}
        {!isPreviewMode && (
          <Text style={{ color: backendStatus === "online" ? "#16845B" : backendStatus === "offline" ? "#B54737" : colors.muted, fontSize: 12, textAlign: "center", marginBottom: 12 }}>
            {backendStatus === "online" ? "Backend connected" : backendStatus === "offline" ? "Backend unreachable — check server, LAN, and CORS" : "Connecting to backend…"}
          </Text>
        )}
        <View style={styles.header}>
          <BrandLockup />
          <Text style={styles.tagline}>
            Start building a healthier financial future.
          </Text>
        </View>

        <MotionReveal style={{ width: "100%" }} delay={80}>
        <View style={styles.card}>
          <Text style={styles.heading}>Create Account</Text>

          <Text style={styles.description}>
            Join Worthly and begin understanding your financial wellness.
          </Text>

          <Text style={styles.label}>Full Name</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor={colors.muted}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
            accessibilityLabel="Full name"
          />

          <Text style={styles.label}>Email Address</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            returnKeyType="next"
            accessibilityLabel="Email address"
          />

          <Text style={styles.label}>Password</Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Create a password"
              placeholderTextColor={colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              returnKeyType="next"
              accessibilityLabel="Password"
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              style={styles.showPasswordButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.showPassword}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.helperText}>
            Use at least 8 characters.
          </Text>

          <Text style={styles.label}>Confirm Password</Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.muted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              returnKeyType="done"
              accessibilityLabel="Confirm password"
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                showConfirmPassword ? "Hide confirm password" : "Show confirm password"
              }
              style={styles.showPasswordButton}
              onPress={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
            >
              <Text style={styles.showPassword}>
                {showConfirmPassword ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
              loading && styles.disabledButton,
            ]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>

            <Pressable onPress={() => router.push("/login")}>
              <Text style={styles.link}>Login</Text>
            </Pressable>
          </View>
        </View>
        </MotionReveal>

        <Text style={styles.termsText}>
          By creating an account, you agree to continue through the
          application’s consent and onboarding process before financial
          data is processed.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
    </ScreenEntrance>
  );
}

const baseStyles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  previewNotice: { backgroundColor: COLORS.infoLight, borderRadius: 16, padding: 15, marginBottom: 18, gap: 5, borderWidth: 1, borderColor: COLORS.border },
  previewNoticeTitle: { color: COLORS.info, fontSize: 13, fontWeight: "800" },
  previewNoticeText: { color: COLORS.text, fontSize: 12, lineHeight: 18 },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 22,
    paddingVertical: 28,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 22,
  },

  logo: {
    fontSize: 36,
    fontWeight: "bold",
    color: COLORS.primary,
  },

  tagline: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 9,
    textAlign: "center",
  },

  card: {
    backgroundColor: COLORS.surface,
    padding: 23,
    borderRadius: 24,
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },

  heading: {
    fontSize: 29,
    fontWeight: "900",
    color: COLORS.text,
  },

  description: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 18,
  },

  label: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: 0.5,
    marginBottom: 7,
    marginTop: 17,
  },

  input: {
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: COLORS.text,
    fontSize: 15,
    backgroundColor: COLORS.surfaceSubtle,
  },

  passwordContainer: {
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    backgroundColor: COLORS.surfaceSubtle,
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    color: COLORS.text,
    fontSize: 15,
  },

  showPassword: {
    color: COLORS.primary,
    fontWeight: "600",
    paddingLeft: 10,
  },
  showPasswordButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  helperText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 6,
  },

  primaryButton: {
    minHeight: 57,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 3,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  pressed: {
    opacity: 0.8,
  },

  disabledButton: {
    opacity: 0.6,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },

  footerText: {
    color: COLORS.muted,
    fontSize: 14,
  },

  link: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 14,
  },

  termsText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 20,
  },
});
