import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from "react";
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/constants/colors";
import { useAppStyles, useAppTheme } from "@/components/app-theme";

export type FeedbackTone = "success" | "error" | "info";

type FeedbackMessage = {
  title: string;
  message: string;
  tone: FeedbackTone;
};

type FeedbackContextValue = {
  notify: (title: string, message: string, tone?: FeedbackTone) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used within FeedbackProvider.");
  }
  return context;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const themedStyles = useAppStyles(styles);
  const { colors } = useAppTheme();
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    Animated.timing(opacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: Platform.OS !== "web",
    }).start(({ finished }) => {
      if (finished) setFeedback(null);
    });
  }, [opacity]);

  const notify = useCallback(
    (title: string, message: string, tone: FeedbackTone = "info") => {
      if (timer.current) clearTimeout(timer.current);
      setFeedback({ title, message, tone });
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: Platform.OS !== "web",
      }).start();
      AccessibilityInfo.announceForAccessibility(`${title}. ${message}`);
      timer.current = setTimeout(dismiss, tone === "error" ? 6000 : 4200);
    },
    [dismiss, opacity]
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const contextValue = useMemo(() => ({ notify }), [notify]);
  const toneColor =
    feedback?.tone === "error"
      ? colors.danger
      : feedback?.tone === "success"
        ? colors.success
        : colors.info;

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
      {feedback && (
        <Animated.View
          accessibilityLiveRegion="polite"
          style={[
            themedStyles.toast,
            {
              top: insets.top + 10,
              opacity,
              borderLeftColor: toneColor,
            },
          ]}
        >
          <View style={themedStyles.copy}>
            <Text style={themedStyles.title}>{feedback.title}</Text>
            <Text style={themedStyles.message}>{feedback.message}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification"
            hitSlop={8}
            onPress={dismiss}
            style={themedStyles.dismiss}
          >
            <Text style={themedStyles.dismissText}>×</Text>
          </Pressable>
        </Animated.View>
      )}
    </FeedbackContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    zIndex: 10000,
    left: 16,
    right: 16,
    maxWidth: 600,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderLeftWidth: 4,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 15,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 8,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  message: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  dismiss: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  dismissText: {
    color: COLORS.muted,
    fontSize: 23,
    lineHeight: 27,
  },
});
