import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";

import {
  createThemedStyles,
  DARK_COLORS,
  LIGHT_COLORS,
  setActiveColorScheme,
  type AppPalette,
} from "@/constants/colors";

export type ThemeMode = "system" | "light" | "dark";

type AppThemeValue = {
  mode: ThemeMode;
  scheme: "light" | "dark";
  colors: AppPalette;
  setMode: (mode: ThemeMode) => void;
};

const THEME_STORAGE_KEY = "worthly_theme_mode";
const AppThemeContext = createContext<AppThemeValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const scheme: "light" | "dark" =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((savedMode) => {
        if (
          active &&
          (savedMode === "system" || savedMode === "light" || savedMode === "dark")
        ) {
          setModeState(savedMode);
        }
      })
      .catch((error: unknown) => {
        console.error("Could not load the saved appearance preference.", error);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setActiveColorScheme(scheme);
  }, [scheme]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode).catch((error: unknown) => {
      console.error("Could not save the appearance preference.", error);
    });
  }, []);

  const value = useMemo(
    () => ({
      mode,
      scheme,
      colors: scheme === "dark" ? DARK_COLORS : LIGHT_COLORS,
      setMode,
    }),
    [mode, scheme, setMode]
  );

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const value = useContext(AppThemeContext);
  if (!value) {
    throw new Error("useAppTheme must be used within AppThemeProvider.");
  }
  return value;
}

export function useAppStyles<T extends Record<string, object>>(styles: T): T {
  const { scheme } = useAppTheme();
  return useMemo(
    () => createThemedStyles(styles, scheme),
    [scheme, styles]
  );
}
