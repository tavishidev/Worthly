/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';
import { DARK_COLORS, LIGHT_COLORS } from './colors';

export const Colors = {
  light: {
    text: LIGHT_COLORS.text,
    background: LIGHT_COLORS.background,
    backgroundElement: LIGHT_COLORS.surface,
    backgroundSelected: LIGHT_COLORS.primaryLight,
    textSecondary: LIGHT_COLORS.muted,
  },
  dark: {
    text: DARK_COLORS.text,
    background: DARK_COLORS.background,
    backgroundElement: DARK_COLORS.surface,
    backgroundSelected: DARK_COLORS.primaryLight,
    textSecondary: DARK_COLORS.muted,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 12,
  large: 18,
  pill: 999,
} as const;

export const Typography = {
  caption: 11,
  body: 14,
  subtitle: 18,
  title: 28,
  display: 36,
} as const;

export const Shadows = {
  card: {
    shadowColor: LIGHT_COLORS.navy,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
