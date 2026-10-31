import { useAppStyles, useAppTheme } from "@/components/app-theme";
import React, { useState } from "react";
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
import { getPostAuthRoute, signIn } from "../services/auth.service";
import { COLORS } from "../constants/colors";

export default function LoginScreen() {
  const styles = useAppStyles(baseStyles);
  const { colors } = useAppTheme();
  const { notify } = useFeedback();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const isPreviewMode = !(
    process.env.EXPO_PUBLIC_SUPABASE_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  );

  const handleLogin = async () => {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      notify("Missing information", "Please enter your email and password.", "error");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      notify("Invalid email", "Please enter a valid email address.", "error");
      return;
    }

    try {
      setLoading(true);

      await signIn(cleanEmail, password);

      notify("Login successful", "Welcome back to Worthly.", "success");
      router.replace(await getPostAuthRoute());
    } catch (error: any) {
      notify(
        "Login failed",
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
        <View style={styles.header}>
          <BrandLockup />
          <Text style={styles.tagline}>
            A clearer view of your financial health.
          </Text>
        </View>

        {isPreviewMode && (
          <View style={styles.previewNotice} accessibilityRole="summary">
            <Text style={styles.previewNoticeTitle}>Local preview</Text>
            <Text style={styles.previewNoticeText}>
              This demo stores a sample account on this device. Preview sign-in does not verify a password or create a real account.
            </Text>
          </View>
        )}

        <MotionReveal style={{ width: "100%" }} delay={80}>
        <View style={styles.card}>
          <Text style={styles.heading}>Welcome Back</Text>

          <Text style={styles.description}>
            Sign in to continue your financial wellness journey.
          </Text>

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
              placeholder="Enter your password"
              placeholderTextColor={colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              returnKeyType="done"
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

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
              loading && styles.disabledButton,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Login</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={styles.forgotPasswordButton}
            onPress={() => router.push("/forgot-password")}
          >
            <Text style={styles.link}>Forgot password?</Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don’t have an account? </Text>

            <Pressable onPress={() => router.push("/signup")}>
              <Text style={styles.link}>Sign Up</Text>
            </Pressable>
          </View>
        </View>
        </MotionReveal>
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

  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 22,
    paddingVertical: 32,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 26,
  },
  previewNotice: { backgroundColor: COLORS.infoLight, borderRadius: 16, padding: 15, marginBottom: 18, gap: 5, borderWidth: 1, borderColor: COLORS.border },
  previewNoticeTitle: { color: COLORS.info, fontSize: 13, fontWeight: "800" },
  previewNoticeText: { color: COLORS.text, fontSize: 12, lineHeight: 18 },

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
    marginBottom: 21,
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
  forgotPasswordButton: {
    alignSelf: "flex-end",
    paddingVertical: 10,
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
});
