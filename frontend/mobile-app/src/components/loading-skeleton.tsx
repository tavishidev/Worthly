import { useEffect, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";

import { COLORS } from "@/constants/colors";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useAppStyles } from "@/components/app-theme";

type SkeletonVariant = "dashboard" | "list" | "assessment" | "report" | "profile";

function SkeletonBlock({
  width,
  height = 14,
  style,
  blockStyle,
}: {
  width: ViewStyle["width"];
  height?: number;
  style?: ViewStyle;
  blockStyle: ViewStyle;
}) {
  return <View style={[blockStyle, { width, height }, style]} />;
}

export function LoadingSkeleton({
  variant = "list",
  label = "Loading content",
}: {
  variant?: SkeletonVariant;
  label?: string;
}) {
  const reduceMotion = useReducedMotion();
  const themedStyles = useAppStyles(styles);
  const [opacity] = useState(() => new Animated.Value(0.72));

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(0.82);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(opacity, {
          toValue: 0.62,
          duration: 750,
          useNativeDriver: Platform.OS !== "web",
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacity, reduceMotion]);

  const count = variant === "dashboard" ? 3 : variant === "profile" ? 4 : 3;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      style={themedStyles.container}
    >
      <Animated.View style={{ opacity }}>
        <View style={themedStyles.header}>
          <SkeletonBlock width={38} height={38} style={themedStyles.logo} blockStyle={themedStyles.block} />
          <SkeletonBlock width="34%" height={10} blockStyle={themedStyles.block} />
        </View>
        <SkeletonBlock width="62%" height={26} style={themedStyles.title} blockStyle={themedStyles.block} />
        <SkeletonBlock width="86%" height={12} style={themedStyles.subtitle} blockStyle={themedStyles.block} />

        {(variant === "dashboard" || variant === "assessment") && (
          <View style={[themedStyles.card, themedStyles.heroCard]}>
            <SkeletonBlock width="43%" height={10} blockStyle={themedStyles.block} />
            <SkeletonBlock width="34%" height={44} style={themedStyles.heroValue} blockStyle={themedStyles.block} />
            <SkeletonBlock width="100%" height={7} style={themedStyles.bar} blockStyle={themedStyles.block} />
            <View style={themedStyles.heroFooter}>
              <SkeletonBlock width="35%" height={12} blockStyle={themedStyles.block} />
              <SkeletonBlock width="35%" height={12} blockStyle={themedStyles.block} />
            </View>
          </View>
        )}

        {Array.from({ length: count }, (_, index) => (
          <View key={index} style={themedStyles.card}>
            <View style={themedStyles.row}>
              <SkeletonBlock width={38} height={38} style={themedStyles.icon} blockStyle={themedStyles.block} />
              <View style={themedStyles.copy}>
                <SkeletonBlock width="68%" height={13} blockStyle={themedStyles.block} />
                <SkeletonBlock width="45%" height={10} style={themedStyles.detail} blockStyle={themedStyles.block} />
              </View>
              <SkeletonBlock width="20%" height={13} blockStyle={themedStyles.block} />
            </View>
            {variant === "dashboard" && (
              <SkeletonBlock width="100%" height={7} style={themedStyles.bar} blockStyle={themedStyles.block} />
            )}
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 22,
    paddingTop: 28,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  block: {
    backgroundColor: COLORS.border,
    borderRadius: 7,
  },
  logo: {
    borderRadius: 12,
  },
  title: {
    marginBottom: 11,
  },
  subtitle: {
    marginBottom: 22,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  heroCard: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
    borderRadius: 18,
    padding: 19,
    marginBottom: 22,
  },
  heroValue: {
    backgroundColor: COLORS.navyBar,
    marginTop: 15,
  },
  bar: {
    marginTop: 14,
    backgroundColor: COLORS.border,
  },
  heroFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    borderRadius: 12,
  },
  copy: {
    flex: 1,
    gap: 8,
  },
  detail: {
    height: 10,
  },
});
