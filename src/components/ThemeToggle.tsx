import type { ReactNode } from "react";
import { fill } from "../lib/i18n";
import { nextPreference, type ThemePreference } from "../lib/theme";
import { useLanguage } from "./LanguageProvider";
import { useTheme } from "./ThemeProvider";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
  className: "h-4 w-4",
} as const;

const ICONS: Record<ThemePreference, ReactNode> = {
  // Automatic: a half-filled circle, the usual "follow the system" glyph.
  system: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a8.5 8.5 0 0 0 0 17Z" fill="currentColor" stroke="none" />
    </svg>
  ),
  light: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  dark: (
    <svg {...iconProps}>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
  ),
};

/** One button, three states: automatic, light, dark. */
export function ThemeToggle() {
  const { t } = useLanguage();
  const { preference, cycle } = useTheme();

  const label = fill(t.theme.action, {
    current: t.theme[preference],
    next: t.theme[nextPreference(preference)],
  });

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-hairline bg-card text-ink transition-colors hover:border-ink"
    >
      {ICONS[preference]}
    </button>
  );
}
