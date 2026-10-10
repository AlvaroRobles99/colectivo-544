import { schedules, stopOrder, stopOrderByDirection, type DayType, type Direction, type StopSchedule, type TimeStr } from "../data/schedules";
import { toServiceMinutes, toServiceNowMinutes } from "./serviceDay";

export interface NextDeparture {
  time: TimeStr | null; // next departure at that stop, or null when none remain in the service day
  minutesUntil: number | null; // minutes from now until `time`; null when `time` is null. 0 means "right now".
  nextDayFirstTime: TimeStr | null; // only when time === null: first departure of the NEXT service day at that stop
}

/** Route order for a direction (each direction has its own travel order); falls back to the global stopOrder. */
function routeOrder(direction: Direction): string[] {
  return stopOrderByDirection[direction] ?? stopOrder;
}

/** Route order for a direction, unfiltered — every stop the line serves that way. */
export function getStopsForDirection(direction: Direction): string[] {
  return routeOrder(direction);
}

/** Stops that actually have service for that direction/day, in that direction's route order. */
export function getStopsFor(direction: Direction, dayType: DayType): string[] {
  const cell = schedules[direction][dayType];
  return routeOrder(direction).filter((stop) => cell?.[stop] !== undefined);
}

/** Schedule entry for a stop, or undefined if that stop has no service that direction/day (e.g. "El Progreso" on vuelta/sabados). */
export function getStopSchedule(
  direction: Direction,
  dayType: DayType,
  stop: string,
): StopSchedule | undefined {
  return schedules[direction][dayType]?.[stop];
}

/** Whether that stop has any departure for the direction/day. */
export function hasService(direction: Direction, dayType: DayType, stop: string): boolean {
  return getStopSchedule(direction, dayType, stop) !== undefined;
}

/** First departure strictly after the current service-day minute; if the day ended, time=null and nextDayFirstTime set. */
export function getNextDeparture(
  direction: Direction,
  dayType: DayType,
  stop: string,
  now: Date,
): NextDeparture {
  const schedule = getStopSchedule(direction, dayType, stop);
  if (!schedule || schedule.times.length === 0) {
    return { time: null, minutesUntil: null, nextDayFirstTime: null };
  }

  const nowMinutes = toServiceNowMinutes(now);
  const next = schedule.times.find((time) => toServiceMinutes(time) > nowMinutes);

  if (next === undefined) {
    return { time: null, minutesUntil: null, nextDayFirstTime: schedule.times[0] };
  }
  return { time: next, minutesUntil: toServiceMinutes(next) - nowMinutes, nextDayFirstTime: null };
}

/**
 * Departures already passed today (service-day order) and the remaining ones — for grouping the UI list.
 * A departure whose minute equals the current one counts as passed, keeping this consistent with
 * getNextDeparture (which only looks strictly ahead).
 */
export function splitPassedAndUpcoming(
  direction: Direction,
  dayType: DayType,
  stop: string,
  now: Date,
): { passed: TimeStr[]; upcoming: TimeStr[] } {
  const schedule = getStopSchedule(direction, dayType, stop);
  if (!schedule) return { passed: [], upcoming: [] };

  const nowMinutes = toServiceNowMinutes(now);
  const passed: TimeStr[] = [];
  const upcoming: TimeStr[] = [];
  for (const time of schedule.times) {
    if (toServiceMinutes(time) <= nowMinutes) passed.push(time);
    else upcoming.push(time);
  }
  return { passed, upcoming };
}