import type { DayType } from "../data/schedules";
import { DAY_TYPE_LABELS, DAY_TYPE_SHORT_LABELS } from "../lib/dayType";

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
  const caption = holiday
    ? "Feriado activo: se muestra el cuadro de domingos y feriados."
    : value === detected
      ? `Hoy es ${weekdayLabel} — cuadro de ${DAY_TYPE_LABELS[value].toLowerCase()}.`
      : "Estás viendo otro día.";

  return (
    <section aria-label="Día del servicio">
      <div
        role="group"
        aria-label="Elegir el cuadro de horarios"
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
              {DAY_TYPE_SHORT_LABELS[day]}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 px-1 text-xs text-slate">{caption}</p>
    </section>
  );
}
