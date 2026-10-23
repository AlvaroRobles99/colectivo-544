import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { readStorage, writeStorage } from "../lib/storage";
import {
  isThemePreference,
  nextPreference,
  resolveTheme,
  THEME_KEY,
  type Theme,
  type ThemePreference,
} from "../lib/theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

interface ThemeValue {
  /** What the rider chose: `system`, `light` or `dark`. */
  preference: ThemePreference;
  /** What is actually painted right now. */
  theme: Theme;
  cycle: () => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

/**
 * Owns the appearance: follows the OS until the rider overrides it, persists only
 * an explicit choice and keeps `<html data-theme>` in sync. The same attribute is
 * set pre-paint by the inline script in `index.html`, so a dark session never
 * flashes light on load.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    const stored = readStorage(THEME_KEY);
    return isThemePreference(stored) ? stored : "system";
  });
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(
    () => window.matchMedia(DARK_QUERY).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const theme = resolveTheme(preference, systemPrefersDark);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const cycle = () => {
    const next = nextPreference(preference);
    setPreference(next);
    // `system` clears the key so detection keeps running on later visits.
    writeStorage(THEME_KEY, next === "system" ? null : next);
  };

  const value = useMemo<ThemeValue>(() => ({ preference, theme, cycle }), [preference, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
