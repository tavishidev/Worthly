import { useCallback, useEffect, useRef, useState } from "react";
import {
  DefaultTheme,
  router,
  Stack,
  ThemeProvider,
  usePathname,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AppThemeProvider, useAppTheme } from "@/components/app-theme";
import { FeedbackProvider } from "@/components/feedback";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { getCurrentSession, getPostAuthRoute } from "@/services/auth.service";
import { hasActiveConsent } from "@/services/consent.service";
import { subscribeAccessChanges } from "@/services/access-events";
import { COLORS } from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

type AccessState = "checking" | "signed-out" | "consent-required" | "ready";

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <AppThemeProvider>
        <RootNavigator />
      </AppThemeProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { colors, scheme } = useAppTheme();
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const [accessState, setAccessState] = useState<AccessState>("checking");

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const refreshAccess = useCallback(async () => {
    let session;
    try {
      session = await getCurrentSession();
    } catch (error) {
      console.error("Could not verify the current account.", error);
      setAccessState("signed-out");
      if (!["/", "/login", "/signup", "/forgot-password"].includes(pathnameRef.current)) {
        router.replace("/");
      }
      return;
    }

    if (!session) {
      setAccessState("signed-out");
      if (!["/", "/login", "/signup", "/forgot-password"].includes(pathnameRef.current)) {
        router.replace("/");
      }
      return;
    }

    let consentIsActive = false;
    try {
      consentIsActive = await hasActiveConsent();
    } catch (error) {
      // Fail closed: a consent lookup failure must not unlock app features.
      console.error("Could not verify the account's consent state.", error);
    }

    if (!consentIsActive) {
      setAccessState("consent-required");
      if (pathnameRef.current !== "/consent") router.replace("/consent");
      return;
    }

    setAccessState("ready");
    if (["/", "/login", "/signup", "/forgot-password"].includes(pathnameRef.current)) {
      try {
        router.replace(await getPostAuthRoute());
      } catch (error) {
        console.error("Could not load onboarding progress.", error);
        router.replace("/dashboard");
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!active) return;
      await refreshAccess();
    };
    void run();
    const unsubscribe = subscribeAccessChanges(() => {
      if (active) void refreshAccess();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [refreshAccess]);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const appRedirect = accessState === "consent-required" ? "/consent" : "/";

  return (
    <FeedbackProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <AnimatedSplashOverlay />

        <Stack
          screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.background },
            animation: reduceMotion ? "none" : "fade_from_bottom",
          }}
        >
          <Stack.Screen name="index" options={{ title: "Worthly" }} />
          <Stack.Screen name="login" options={{ title: "Login" }} />
          <Stack.Screen name="signup" options={{ title: "Create Account" }} />
          <Stack.Screen name="forgot-password" options={{ title: "Reset Password" }} />

          <Stack.Protected guard={accessState === "consent-required" || accessState === "ready"} redirectTo="/">
            <Stack.Screen name="consent" options={{ title: "Consent" }} />
          </Stack.Protected>

          <Stack.Protected guard={accessState === "ready"} redirectTo={appRedirect}>
            <Stack.Screen name="account-profile" options={{ title: "Personal Information" }} />
            <Stack.Screen name="financial-profile" options={{ title: "Financial Profile" }} />
            <Stack.Screen name="upload-csv" options={{ title: "Upload CSV" }} />
            <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
            <Stack.Screen name="insights" options={{ title: "AI Insights" }} />
            <Stack.Screen name="reports" options={{ title: "Reports" }} />
            <Stack.Screen name="transactions" options={{ title: "Transactions" }} />
            <Stack.Screen name="add-transaction" options={{ title: "Add Transaction" }} />
            <Stack.Screen name="assessment" options={{ title: "Financial Assessment" }} />
            <Stack.Screen name="lender-preview" options={{ title: "Lender view preview" }} />
            <Stack.Screen name="profile" options={{ title: "More" }} />
          </Stack.Protected>
        </Stack>

        {accessState === "checking" && (
          <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
            <View style={{ alignItems: "center", gap: 14 }}>
              <ActivityIndicator color={COLORS.primary} size="large" />
              <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "600" }}>Preparing your Worthly space</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </FeedbackProvider>
  );
}
