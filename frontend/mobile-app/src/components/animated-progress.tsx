import { useEffect, useState } from "react";
import { Animated, StyleSheet, View, type ViewStyle } from "react-native";

import { COLORS } from "@/constants/colors";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useAppStyles } from "@/components/app-theme";

type AnimatedProgressProps = {
  progress: number;
  trackStyle?: ViewStyle;
  fillStyle?: ViewStyle;
  accessibilityLabel?: string;
};

export function AnimatedProgress({
  progress,
  trackStyle,
  fillStyle,
  accessibilityLabel = "Progress",
}: AnimatedProgressProps) {
  const reduceMotion = useReducedMotion();
  const themedStyles = useAppStyles(styles);
  const [width] = useState(() => new Animated.Value(0));
  const safeProgress = Math.max(0, Math.min(progress, 100));

  useEffect(() => {
    if (reduceMotion) {
      width.setValue(safeProgress);
      return;
    }

    const animation = Animated.timing(width, {
      toValue: safeProgress,
      duration: 420,
      useNativeDriver: false,
    });
    animation.start();

    return () => animation.stop();
  }, [reduceMotion, safeProgress, width]);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: safeProgress }}
      style={[themedStyles.track, trackStyle]}
    >
      <Animated.View
        style={[
          themedStyles.fill,
          fillStyle,
          {
            width: width.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
});
