/** Resolved appearance applied to the document. */
export type Theme = "light" | "dark";

/** What the rider chose. `system` keeps following the operating system. */
export type ThemePreference = "system" | Theme;

/** Only an explicit choice is persisted, so `system` keeps reacting to the OS. */
export const THEME_KEY = "colectivo-544:theme";

export const THEME_PREFERENCES: readonly ThemePreference[] = ["system", "light", "dark"] as const;

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

/** `system` delegates to the OS preference; an explicit choice always wins. */
export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): Theme {
  if (preference === "system") {
    return systemPrefersDark ? "dark" : "light";
  }
  return preference;
}

/**
 * Fixed ring, so the control is predictable: automatic → light → dark → automatic.
 * The icon shows the chosen state, which tells the rider why a click changed
 * nothing when the OS already matched the next stop in the ring.
 */
export function nextPreference(current: ThemePreference): ThemePreference {
  if (current === "system") return "light";
  if (current === "light") return "dark";
  return "system";
}
