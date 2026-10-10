import { useMemo, useState } from "react";
import type { DayType, Direction } from "../data/schedules";
import { getStopSchedule, getStopsForDirection } from "../lib/schedule";

/** Case- and accent-insensitive match so "salto" finds "B° Salto". */
function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

interface StopPickerProps {
  direction: Direction;
  dayType: DayType;
  selected: string | null;
  onSelect: (stop: string) => void;
}

/**
 * Stop chooser. The list keeps the direction's full route order and marks stops
 * with no service that day, so a rider standing at one of them sees why nothing
 * shows up instead of a stop silently missing.
 */
export function StopPicker({ direction, dayType, selected, onSelect }: StopPickerProps) {
  const [open, setOpen] = useState(selected === null);
  const [query, setQuery] = useState("");

  const stops = useMemo(() => {
    const needle = normalize(query.trim());
    return getStopsForDirection(direction).filter((stop) => normalize(stop).includes(needle));
  }, [direction, query]);

  const choose = (stop: string) => {
    onSelect(stop);
    setQuery("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Cambiar parada. Parada elegida: ${selected ?? "ninguna"}`}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-hairline bg-card px-3 py-2 text-left transition-colors hover:border-ink"
      >
        <span className="min-w-0">
          <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-slate">Parada</span>
          <span className="block truncate text-sm font-semibold text-ink">{selected}</span>
        </span>
        <span className="shrink-0 text-xs font-semibold text-amber">Cambiar</span>
      </button>
    );
  }

  return (
    <section aria-label="Elegir parada" className="rounded-lg border border-hairline bg-card p-3">
      <label htmlFor="stop-search" className="sr-only">
        Buscar parada
      </label>
      <input
        id="stop-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar parada…"
        autoComplete="off"
        className="h-11 w-full rounded-md border border-hairline bg-paper px-3 text-sm text-ink placeholder:text-slate"
      />
      <ul className="mt-2 max-h-80 divide-y divide-hairline overflow-y-auto">
        {stops.length === 0 ? (
          <li className="px-1 py-3 text-sm text-slate">No hay paradas que coincidan</li>
        ) : (
          stops.map((stop) => {
            const count = getStopSchedule(direction, dayType, stop)?.times.length ?? 0;
            const isSelected = stop === selected;
            return (
              <li key={stop}>
                <button
                  type="button"
                  onClick={() => choose(stop)}
                  aria-pressed={isSelected}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 px-1 py-2 text-left ${
                    isSelected ? "bg-paper" : "hover:bg-paper"
                  }`}
                >
                  <span className={`truncate text-sm text-ink ${isSelected ? "font-bold" : "font-medium"}`}>
                    {stop}
                  </span>
                  {count === 0 ? (
                    <span className="shrink-0 text-xs text-slate">Sin servicio</span>
                  ) : (
                    <span className="shrink-0 font-mono text-xs text-ink/70">{count}</span>
                  )}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
