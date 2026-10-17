import type { DayType } from "../data/schedules";
import { fill } from "../lib/i18n";
import { useLanguage } from "./LanguageProvider";

const ORDER: DayType[] = ["habiles", "sabados", "domingos"];

interface DayTabsProps {
  value: DayType;
  onChange: (day: DayType) => void;
  holiday: boolean;
  detected: DayType;
  weekdayLabel: string;
}

/** Segmented day selector with an honest caption about what is being shown. */
export function DayTabs({ value, onChange, holiday, detected, weekdayLabel }: DayTabsProps) {
  const { t } = useLanguage();

  const caption = holiday
    ? t.dayTabs.captionHoliday
    : value === detected
      ? fill(t.dayTabs.captionToday, { weekday: weekdayLabel, day: t.dayLabels[value].toLowerCase() })
      : t.dayTabs.captionOther;

  return (
    <section aria-label={t.dayTabs.sectionLabel}>
      <div
        role="group"
        aria-label={t.dayTabs.groupLabel}
        className="flex rounded-lg border border-hairline bg-card p-1"
      >
        {ORDER.map((day) => {
          const active = day === value;
          return (
            <button
              key={day}
              type="button"
              aria-pressed={active}
              disabled={holiday}
              onClick={() => onChange(day)}
              className={`min-h-11 flex-1 rounded-md px-2 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                active ? "bg-ink text-paper" : "text-slate hover:text-ink"
              } ${holiday && !active ? "opacity-40" : ""}`}
            >
              {t.dayShortLabels[day]}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 px-1 text-xs text-slate">{caption}</p>
    </section>
  );
}
