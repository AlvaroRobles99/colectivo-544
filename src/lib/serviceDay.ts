import type { TimeStr } from "../data/schedules";

/** Cutoff hour: local times before 04:00 belong to the previous service day. */
export const SERVICE_DAY_CUTOFF_HOUR = 4;

/** The calendar date whose schedule governs `now` (before 04:00 → previous calendar day). */
export function getServiceDate(now: Date): Date {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (now.getHours() < SERVICE_DAY_CUTOFF_HOUR) {
    date.setDate(date.getDate() - 1);
  }
  return date;
}

/** "HH:MM" → minutes since midnight, with hours < 04:00 shifted +1440 so 00:00 sorts after 23:40. */
export function toServiceMinutes(time: TimeStr): number {
  const hours = Number(time.slice(0, 2));
  const minutes = Number(time.slice(3, 5));
  const absolute = hours * 60 + minutes;
  return hours < SERVICE_DAY_CUTOFF_HOUR ? absolute + 1440 : absolute;
}

/** Minutes since midnight of the service day for `now` (mirrors toServiceMinutes). */
export function toServiceNowMinutes(now: Date): number {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const absolute = hours * 60 + minutes;
  return hours < SERVICE_DAY_CUTOFF_HOUR ? absolute + 1440 : absolute;
}

/** Sorted ascending under the service-day rule; returns a new array (no mutation). */
export function sortTimes(times: TimeStr[]): TimeStr[] {
  return [...times].sort((a, b) => toServiceMinutes(a) - toServiceMinutes(b));
}