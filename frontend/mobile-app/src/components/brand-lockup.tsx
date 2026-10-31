import { StyleSheet, Text, View } from "react-native";
import { useAppStyles, useAppTheme } from "@/components/app-theme";
import { COLORS } from "@/constants/colors";

type BrandLockupProps = {
  compact?: boolean;
};

export function BrandLockup({ compact = false }: BrandLockupProps) {
  const themedStyles = useAppStyles(styles);
  const { colors } = useAppTheme();
  return (
    <View accessible accessibilityLabel="Worthly" style={themedStyles.lockup}>
      <View style={[themedStyles.mark, compact && themedStyles.markCompact]}>
        <View style={[themedStyles.bar, themedStyles.barOne, { backgroundColor: colors.emerald }]} />
        <View style={[themedStyles.bar, themedStyles.barTwo, { backgroundColor: colors.emerald }]} />
        <View style={[themedStyles.bar, themedStyles.barThree, { backgroundColor: colors.emerald }]} />
        <View style={[themedStyles.trend, { backgroundColor: colors.white }]} />
      </View>
      <Text style={[themedStyles.wordmark, compact && themedStyles.wordmarkCompact]}>
        WORTHLY
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.navy,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 3,
    paddingBottom: 10,
    overflow: "hidden",
  },
  markCompact: {
    width: 34,
    height: 34,
    borderRadius: 10,
    paddingBottom: 8,
  },
  bar: {
    width: 4,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: COLORS.emerald,
  },
  barOne: {
    height: 8,
  },
  barTwo: {
    height: 12,
  },
  barThree: {
    height: 16,
  },
  trend: {
    position: "absolute",
    width: 12,
    height: 2,
    top: 10,
    right: 7,
    backgroundColor: COLORS.white,
    transform: [{ rotate: "-38deg" }],
  },
  wordmark: {
    color: COLORS.navy,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1.6,
  },
  wordmarkCompact: {
    fontSize: 15,
  },
});
