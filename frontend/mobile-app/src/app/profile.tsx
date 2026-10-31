import { useAppStyles } from "@/components/app-theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BottomNavigation } from "@/components/bottom-navigation";
import { BrandLockup } from "@/components/brand-lockup";
import { useAppTheme, type ThemeMode } from "@/components/app-theme";
import { MotionPressable as Pressable, ScreenEntrance } from "@/components/motion";
import { useFeedback } from "@/components/feedback";
import { COLORS } from "@/constants/colors";
import { signOut } from "@/services/auth.service";

const LINKS = [
  {
    title: "Personal information",
    detail: "View and update your name and contact details",
    icon: "person-circle-outline",
    route: "/account-profile",
  },
  {
    title: "Financial profile",
    detail: "Review your monthly financial snapshot",
    icon: "wallet-outline",
    route: "/financial-profile",
  },
  {
    title: "Import transactions",
    detail: "Choose a CSV file to submit",
    icon: "cloud-upload-outline",
    route: "/upload-csv",
  },
  {
    title: "Reports",
    detail: "View generated financial reports",
    icon: "document-text-outline",
    route: "/reports",
  },
  {
    title: "Data consent",
    detail: "Review, update, or withdraw your data consent",
    icon: "shield-checkmark-outline",
    route: "/consent",
  },
] as const;

const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

export default function ProfileScreen() {
  const styles = useAppStyles(baseStyles);
  const { notify } = useFeedback();
  const { mode, scheme, setMode, colors } = useAppTheme();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/");
    } catch (error) {
      notify(
        "Unable to sign out",
        error instanceof Error ? error.message : "Please try again.",
        "error"
      );
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <ScreenEntrance>
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <BrandLockup compact />
        <Text style={styles.heading}>More from Worthly</Text>
        <Text style={styles.subtitle}>
          Your profile, preferences and financial tools.
        </Text>

        <View style={styles.themeCard}>
          <View style={styles.themeHeading}>
            <Ionicons
              name={scheme === "dark" ? "moon" : "sunny"}
              size={19}
              color={colors.primary}
            />
            <View style={styles.themeCopy}>
              <Text style={styles.themeTitle}>Appearance</Text>
              <Text style={styles.themeDetail}>
                {mode === "system"
                  ? `Following your device · ${scheme} mode`
                  : `${scheme === "dark" ? "Dark" : "Light"} mode selected`}
              </Text>
            </View>
          </View>
          <View style={styles.themeOptions}>
            {THEME_OPTIONS.map((option) => {
              const selected = mode === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setMode(option.value)}
                  style={[
                    styles.themeOption,
                    selected && styles.themeOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.themeOptionText,
                      selected && styles.themeOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.menu}>
          {LINKS.map((item) => (
            <Pressable
              key={item.route}
              accessibilityRole="button"
              onPress={() => router.push(item.route)}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.iconBox}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.menuCopy}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDetail}>{item.detail}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>

        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>Your financial wellbeing, in focus.</Text>
          <Text style={styles.aboutCopy}>
            Worthly’s Pulse Score is an experimental financial wellness
            indicator. It is not an official credit bureau score or a lending
            decision.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleSignOut}
          disabled={signingOut}
          style={({ pressed }) => [
            styles.signOutButton,
            pressed && styles.pressed,
            signingOut && styles.disabled,
          ]}
        >
          {signingOut ? (
            <ActivityIndicator color={colors.danger} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              <Text style={styles.signOutText}>Sign out</Text>
            </>
          )}
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
  content: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    padding: 22,
    paddingTop: 26,
    paddingBottom: 112,
  },
  heading: {
    color: COLORS.navy,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 30,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 7,
    marginBottom: 21,
  },
  themeCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 15,
    marginBottom: 16,
  },
  themeHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  themeCopy: {
    flex: 1,
  },
  themeTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  themeDetail: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
    textTransform: "capitalize",
  },
  themeOptions: {
    flexDirection: "row",
    gap: 7,
    marginTop: 13,
    padding: 4,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSubtle,
  },
  themeOption: {
    flex: 1,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
  },
  themeOptionSelected: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  themeOptionText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  themeOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  menu: {
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 15,
  },
  menuItem: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
  },
  menuCopy: {
    flex: 1,
  },
  menuTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  menuDetail: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },
  pressed: {
    opacity: 0.72,
  },
  aboutCard: {
    backgroundColor: COLORS.navy,
    borderRadius: 15,
    padding: 18,
    marginTop: 20,
  },
  aboutTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  aboutCopy: {
    color: "#D2DDE8",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  signOutButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.dangerLight,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  signOutText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },
});
