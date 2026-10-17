import type { ReactNode } from "react";
import type { DayType, Direction } from "../data/schedules";
import { useNowMinute } from "../hooks/useNowMinute";
import { fill, type Dictionary } from "../lib/i18n";
import { getNextDeparture, hasService } from "../lib/schedule";
import { useLanguage } from "./LanguageProvider";

interface SignProps {
  direction: Direction;
  dayType: DayType;
  stop: string | null;
}

function formatCountdown(t: Dictionary, minutes: number): string {
  if (minutes <= 0) return t.sign.countdownNow;
  return fill(t.sign.countdownIn, { n: minutes });
}

/**
 * The departure board — the one memorable element: ink panel, mono amber type,
 * next departure plus a live countdown. Quiet states (no stop, no service, day
 * over) keep the same board language instead of decorating elsewhere.
 */
export function Sign({ direction, dayType, stop }: SignProps) {
  const now = useNowMinute();
  const { t } = useLanguage();

  let body: ReactNode;
  if (stop === null) {
    body = (
      <>
        <p className="font-mono text-2xl font-bold leading-snug tracking-[0.05em] text-amber">
          {t.sign.emptyStopTitle}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-paper/70">{t.sign.emptyStopBody}</p>
      </>
    );
  } else if (!hasService(direction, dayType, stop)) {
    body = (
      <>
        <p className="font-mono text-2xl font-bold leading-snug tracking-[0.05em] text-amber">
          {t.sign.noServiceTitle}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-paper/70">{t.sign.noServiceBody}</p>
      </>
    );
  } else {
    const departure = getNextDeparture(direction, dayType, stop, now);
    if (departure.time === null) {
      body = (
        <>
          <p className="font-mono text-xl font-bold leading-snug tracking-[0.05em] text-amber">
            {t.sign.doneTitle}
          </p>
          {departure.nextDayFirstTime !== null && (
            <p className="mt-3 text-xs leading-relaxed text-paper/70">
              {t.sign.nextDayLead}{" "}
              <span className="font-mono font-semibold text-paper">{departure.nextDayFirstTime}</span> —{" "}
              {fill(t.sign.nextDayTail, { day: t.dayLabels[dayType].toLowerCase() })}
            </p>
          )}
        </>
      );
    } else {
      body = (
        <>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.3em] text-amber/80">
            {t.sign.upcomingLabel}
          </p>
          <p className="mt-1 font-mono text-6xl font-bold tabular-nums leading-none text-amber">
            {departure.time}
          </p>
          <p className="mt-2 font-mono text-sm font-bold tracking-[0.2em] text-amber">
            {formatCountdown(t, departure.minutesUntil ?? 0)}
          </p>
        </>
      );
    }
  }

  return (
    <section
      aria-label={t.sign.sectionLabel}
      aria-live="polite"
      className="sign-lights-on relative overflow-hidden rounded-xl bg-ink px-5 py-6 shadow-[inset_0_1px_0_rgba(255,178,36,0.25),inset_0_0_48px_rgba(255,178,36,0.06)]"
    >
      {stop !== null && (
        <p className="mb-3 truncate font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-paper/60">
          {stop}
        </p>
      )}
      {body}
    </section>
  );
}
