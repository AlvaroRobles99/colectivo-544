import type { DayType } from "../data/schedules";

/** User-visible Spanish labels. */
export const DAY_TYPE_LABELS: Record<DayType, string> = {
  habiles: "Días hábiles",
  sabados: "Sábados",
  domingos: "Domingos y feriados",
};

export const DAY_TYPE_SHORT_LABELS: Record<DayType, string> = {
  habiles: "Hábiles",
  sabados: "Sábados",
  domingos: "Dom. y feriados",
};

/** Local weekday: 0 (Sun) and 6 (Sat) are their own kinds, everything else is "habiles". */
export function detectDayType(date: Date): DayType {
  const weekday = date.getDay();
  if (weekday === 0) return "domingos";
  if (weekday === 6) return "sabados";
  return "habiles";
}

/** Holidays use the Sunday table: `isHoliday ? "domingos" : detectDayType(date)`. */
export function resolveDayType(date: Date, isHoliday: boolean): DayType {
  return isHoliday ? "domingos" : detectDayType(date);
}