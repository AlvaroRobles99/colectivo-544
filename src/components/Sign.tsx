import type { ReactNode } from "react";
import type { DayType, Direction } from "../data/schedules";
import { useNowMinute } from "../hooks/useNowMinute";
import { DAY_TYPE_LABELS } from "../lib/dayType";
import { getNextDeparture, hasService } from "../lib/schedule";

interface SignProps {
  direction: Direction;
  dayType: DayType;
  stop: string | null;
}

function formatCountdown(minutes: number): string {
  if (minutes <= 0) return "AHORA";
  if (minutes === 1) return "EN 1 MIN";
  return `EN ${minutes} MIN`;
}

/**
 * The departure board — the one memorable element: ink panel, mono amber type,
 * next departure plus a live countdown. Quiet states (no stop, no service, day
 * over) keep the same board language instead of decorating elsewhere.
 */
export function Sign({ direction, dayType, stop }: SignProps) {
  const now = useNowMinute();

  let body: ReactNode;
  if (stop === null) {
    body = (
      <>
        <p className="font-mono text-2xl font-bold leading-snug tracking-[0.05em] text-amber">
          SELECCIONÁ TU PARADA
        </p>
        <p className="mt-2 text-sm leading-relaxed text-paper/70">
          Elegí una parada y acá aparece el próximo colectivo.
        </p>
      </>
    );
  } else if (!hasService(direction, dayType, stop)) {
    body = (
      <>
        <p className="font-mono text-2xl font-bold leading-snug tracking-[0.05em] text-amber">
          SIN SERVICIO
        </p>
        <p className="mt-2 text-sm leading-relaxed text-paper/70">
          No hay colectivos en esta parada hoy.
        </p>
      </>
    );
  } else {
    const departure = getNextDeparture(direction, dayType, stop, now);
    if (departure.time === null) {
      body = (
        <>
          <p className="font-mono text-xl font-bold leading-snug tracking-[0.05em] text-amber">
            NO QUEDAN MÁS SERVICIOS HOY
          </p>
          {departure.nextDayFirstTime !== null && (
            <p className="mt-3 text-xs leading-relaxed text-paper/70">
              Primera salida del próximo día:{" "}
              <span className="font-mono font-semibold text-paper">{departure.nextDayFirstTime}</span> —
              cuadro de {DAY_TYPE_LABELS[dayType].toLowerCase()}.
            </p>
          )}
        </>
      );
    } else {
      body = (
        <>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.3em] text-amber/80">
            PRÓXIMO
          </p>
          <p className="mt-1 font-mono text-6xl font-bold tabular-nums leading-none text-amber">
            {departure.time}
          </p>
          <p className="mt-2 font-mono text-sm font-bold tracking-[0.2em] text-amber">
            {formatCountdown(departure.minutesUntil ?? 0)}
          </p>
        </>
      );
    }
  }

  return (
    <section
      aria-label="Próximo colectivo"
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