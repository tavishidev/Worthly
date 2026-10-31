import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MotionPressable } from "@/components/motion";
import { useAppStyles, useAppTheme } from "@/components/app-theme";
import { COLORS } from "@/constants/colors";

const TABS = [
  { label: "Home", href: "/dashboard", icon: "home-outline" },
  { label: "Activity", href: "/transactions", icon: "swap-horizontal-outline" },
  { label: "Score", href: "/assessment", icon: "analytics-outline" },
  { label: "Insights", href: "/insights", icon: "sparkles-outline" },
  { label: "More", href: "/profile", icon: "grid-outline" },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const themedStyles = useAppStyles(styles);
  const { colors } = useAppTheme();

  return (
    <View pointerEvents="box-none" style={[themedStyles.position, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={themedStyles.container}>
      {TABS.map((tab) => {
        const selected = pathname === tab.href;

        return (
          <MotionPressable
            key={tab.href}
            accessibilityRole="tab"
            accessibilityLabel={`${tab.label} tab`}
            accessibilityState={{ selected }}
            onPress={() => router.replace(tab.href)}
            style={({ pressed }) => [themedStyles.tab, selected && themedStyles.selectedTab, pressed && themedStyles.pressed]}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={selected ? colors.primary : colors.muted}
            />
            <Text style={[themedStyles.label, selected && themedStyles.selectedLabel]}>
              {tab.label}
            </Text>
            {selected && <View style={themedStyles.activeDot} />}
          </MotionPressable>
        );
      })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  position: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  container: {
    width: "100%",
    maxWidth: 560,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 23,
    padding: 7,
    elevation: 14,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.13,
    shadowRadius: 20,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 2,
    borderRadius: 16,
  },
  selectedTab: {
    backgroundColor: COLORS.primaryLight,
  },
  activeDot: {
    position: "absolute",
    top: 6,
    right: 11,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.emerald,
  },
  pressed: {
    opacity: 0.72,
  },
  label: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "600",
  },
  selectedLabel: {
    color: COLORS.primary,
    fontWeight: "800",
  },
});
