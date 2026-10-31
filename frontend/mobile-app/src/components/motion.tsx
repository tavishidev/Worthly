import {
  forwardRef,
  useMemo,
  useEffect,
  useState,
  type ElementRef,
  type ReactNode,
} from "react";
import {
  Animated,
  Pressable,
  Platform,
  type PressableProps,
} from "react-native";

import { useAppTheme } from "@/components/app-theme";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type MotionPressableProps = PressableProps;

export const MotionPressable = forwardRef<
  ElementRef<typeof Pressable>,
  MotionPressableProps
>(function MotionPressable(
  { onPressIn, onPressOut, disabled, style, ...props },
  ref
) {
  const reduceMotion = useReducedMotion();
  const { colors, scheme } = useAppTheme();
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (reduceMotion) scale.setValue(1);
  }, [reduceMotion, scale]);

  function animateTo(value: number) {
    Animated.timing(scale, {
      toValue: reduceMotion || disabled ? 1 : value,
      duration: 100,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        shadowColor: colors.primary,
        shadowOpacity: scheme === "dark" ? 0.07 : 0,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: scheme === "dark" ? 7 : 0,
        elevation: scheme === "dark" ? 2 : 0,
      }}
    >
      <Pressable
        {...props}
        ref={ref}
        disabled={disabled}
        onPressIn={(event) => {
          animateTo(0.985);
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          animateTo(1);
          onPressOut?.(event);
        }}
        style={style}
      />
    </Animated.View>
  );
});

export function ScreenEntrance({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const [entrance] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));

  useEffect(() => {
    if (reduceMotion) {
      entrance.setValue(1);
      return;
    }

    entrance.setValue(0);
    const animation = Animated.timing(entrance, {
      toValue: 1,
      duration: 300,
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start();

    return () => animation.stop();
  }, [entrance, reduceMotion]);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: entrance,
        transform: [
          {
            translateY: entrance.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
          {
            scale: entrance.interpolate({
              inputRange: [0, 1],
              outputRange: [0.99, 1],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

type MotionRevealProps = {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: object;
};

/** A lightweight staggered reveal for page sections and cards. */
export function MotionReveal({
  children,
  delay = 0,
  distance = 12,
  style,
}: MotionRevealProps) {
  const reduceMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));
  const translateY = useMemo(
    () => progress.interpolate({
      inputRange: [0, 1],
      outputRange: [distance, 0],
    }),
    [distance, progress]
  );

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }

    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      delay,
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start();
    return () => animation.stop();
  }, [delay, progress, reduceMotion]);

  return (
    <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
