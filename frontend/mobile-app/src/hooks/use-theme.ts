/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useAppTheme } from '@/components/app-theme';

export function useTheme() {
  const { colors } = useAppTheme();
  return {
    text: colors.text,
    background: colors.background,
    backgroundElement: colors.surface,
    backgroundSelected: colors.primaryLight,
    textSecondary: colors.muted,
  };
}
