import type { DayType, Direction, TimeStr } from "../data/schedules";
import { useNowMinute } from "../hooks/useNowMinute";
import { getStopSchedule, splitPassedAndUpcoming } from "../lib/schedule";
import { useLanguage } from "./LanguageProvider";

/** Marker glyphs rendered as superscripts; the legend below maps each to its note. */
const MARKERS = ["†", "‡", "*", "§"];

/** Friendly legend for the spreadsheet's own note wording (per-language in the dictionary). */
function legendFor(note: string, notes: Record<string, string>): string {
  const mapped = notes[note];
  if (mapped !== undefined) return mapped;
  return note.charAt(0).toUpperCase() + note.slice(1).toLowerCase();
}

interface ScheduleListProps {
  direction: Direction;
  dayType: DayType;
  stop: string;
}

/** Full timetable for one stop: hour groups, passed/upcoming, and note footnotes. */
export function ScheduleList({ direction, dayType, stop }: ScheduleListProps) {
  const now = useNowMinute();
  const { t } = useLanguage();
  const schedule = getStopSchedule(direction, dayType, stop);

  if (schedule === undefined || schedule.times.length === 0) {
    return (
      <section aria-label={t.scheduleList.sectionLabel} className="rounded-lg border border-hairline bg-card px-4 py-6 text-center">
        <p className="font-display text-base font-extrabold text-ink">{t.scheduleList.emptyTitle}</p>
        <p className="mt-1 text-sm leading-relaxed text-slate">{t.scheduleList.emptyBody}</p>
      </section>
    );
  }

  const { passed } = splitPassedAndUpcoming(direction, dayType, stop, now);
  const passedSet = new Set<TimeStr>(passed);

  const notes = schedule.notes ?? [];
  const generalMarkers: number[] = [];
  const timedMarkers = new Map<TimeStr, number[]>();
  notes.forEach((note, index) => {
    if (note.time === null) {
      generalMarkers.push(index);
    } else {
      const markers = timedMarkers.get(note.time) ?? [];
      markers.push(index);
      timedMarkers.set(note.time, markers);
    }
  });

  // Service-day list is already ascending, so consecutive same-hour times group
  // naturally (post-midnight 00:00-03:59 sorts last, as the converter emits it).
  const groups: { hour: string; times: TimeStr[] }[] = [];
  for (const time of schedule.times) {
    const hour = time.slice(0, 2);
    const last = groups[groups.length - 1];
    if (last !== undefined && last.hour === hour) {
      last.times.push(time);
    } else {
      groups.push({ hour, times: [time] });
    }
  }

  const departures =
    schedule.times.length === 1 ? t.scheduleList.departuresOne : t.scheduleList.departuresOther;
  const countLabel = `${schedule.times.length} ${departures}`;

  return (
    <section aria-label={t.scheduleList.sectionLabel} className="rounded-lg border border-hairline bg-card">
      <header className="flex items-end justify-between gap-3 border-b border-hairline px-4 py-3">
        <h2 className="min-w-0">
          <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate">
            {t.scheduleList.headingLabel}
          </span>
          <span className="block truncate font-display text-base font-extrabold text-ink">
            {stop}
            {generalMarkers.map((index) => (
              <sup key={index} className="ml-0.5 text-amber">
                {MARKERS[index % MARKERS.length]}
              </sup>
            ))}
          </span>
        </h2>
        <p className="shrink-0 font-mono text-xs text-slate">{countLabel}</p>
      </header>

      <div className="px-4 pb-3">
        {groups.map((group) => (
          <div key={group.hour}>
            <h3 className="sticky top-[59px] z-10 -mx-4 border-b border-hairline bg-card px-4 py-1.5 font-mono text-xs font-semibold tracking-[0.18em] text-slate">
              {group.hour}
              {t.scheduleList.hourSuffix}
            </h3>
            <ul className="flex flex-wrap gap-1.5 py-3">
              {group.times.map((time) => {
                const isPassed = passedSet.has(time);
                return (
                  <li key={time}>
                    <span
                      className={`inline-flex min-w-[3.5rem] items-center justify-center rounded-md border px-2 py-1 font-mono text-sm tabular-nums ${
                        isPassed
                          ? "border-hairline text-slate/50"
                          : "border-hairline bg-paper font-semibold text-ink"
                      }`}
                    >
                      {time}
                      {timedMarkers.get(time)?.map((index) => (
                        <sup key={index} className="ml-0.5 text-amber">
                          {MARKERS[index % MARKERS.length]}
                        </sup>
                      ))}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {notes.length > 0 && (
        <footer className="border-t border-hairline px-4 py-2.5">
          <ul className="space-y-1">
            {notes.map((note, index) => (
              <li key={index} className="text-xs leading-relaxed text-slate">
                <span className="mr-1 text-amber">{MARKERS[index % MARKERS.length]}</span>
                {legendFor(note.note, t.scheduleList.noteLegends)}
              </li>
            ))}
          </ul>
        </footer>
      )}
    </section>
  );
}
