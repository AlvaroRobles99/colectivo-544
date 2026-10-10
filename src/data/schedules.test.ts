import { describe, expect, it } from "vitest";
import { schedules, stopOrder, stopOrderByDirection, type DayType, type Direction } from "./schedules";

const DIRECTIONS: Direction[] = ["ida", "vuelta"];
const DAYS: DayType[] = ["habiles", "sabados", "domingos"];
const TIME_RE = /^\d{2}:\d{2}$/;

// Same service-day rule as the converter: 00:00-03:59 belongs to the previous
// service day and must sort after 23:xx.
function serviceMinute(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  const absolute = hours * 60 + minutes;
  return hours >= 4 ? absolute : absolute + 1440;
}

describe("schedules data sanity", () => {
  it("has all six direction/day cells and none are empty", () => {
    for (const direction of DIRECTIONS) {
      for (const day of DAYS) {
        const cell = schedules[direction][day];
        expect(cell, `${direction}/${day} is missing`).toBeDefined();
        expect(Object.keys(cell ?? {}).length, `${direction}/${day} is empty`).toBeGreaterThan(0);
      }
    }
  });

  it("every stop has at least one time", () => {
    for (const direction of DIRECTIONS) {
      for (const day of DAYS) {
        for (const [stop, schedule] of Object.entries(schedules[direction][day] ?? {})) {
          expect(schedule.times.length, `${direction}/${day}/${stop}`).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  it("every time matches HH:MM and every note is well formed", () => {
    for (const direction of DIRECTIONS) {
      for (const day of DAYS) {
        for (const [stop, schedule] of Object.entries(schedules[direction][day] ?? {})) {
          for (const time of schedule.times) {
            expect(time, `${direction}/${day}/${stop}`).toMatch(TIME_RE);
          }
          for (const note of schedule.notes ?? []) {
            expect(note.note.length, `${direction}/${day}/${stop}`).toBeGreaterThan(0);
            if (note.time !== null) {
              expect(note.time, `${direction}/${day}/${stop}`).toMatch(TIME_RE);
            }
          }
        }
      }
    }
  });

  it("times are strictly ascending under the service-day rule", () => {
    for (const direction of DIRECTIONS) {
      for (const day of DAYS) {
        for (const [stop, schedule] of Object.entries(schedules[direction][day] ?? {})) {
          const minutes = schedule.times.map(serviceMinute);
          for (let index = 1; index < minutes.length; index += 1) {
            expect(
              minutes[index],
              `${direction}/${day}/${stop} not ascending at ${schedule.times[index]}`,
            ).toBeGreaterThan(minutes[index - 1]);
          }
        }
      }
    }
  });

  it("stopOrder covers every stop key present in schedules", () => {
    const known = new Set(stopOrder);
    for (const direction of DIRECTIONS) {
      for (const day of DAYS) {
        for (const stop of Object.keys(schedules[direction][day] ?? {})) {
          expect(known.has(stop), `${stop} is missing from stopOrder`).toBe(true);
        }
      }
    }
  });

  it("stopOrderByDirection covers every stop key of its own direction, with no duplicates", () => {
    for (const direction of DIRECTIONS) {
      const order = stopOrderByDirection[direction];
      const known = new Set(order);
      expect(known.size, `${direction} has duplicate stops`).toBe(order.length);
      for (const day of DAYS) {
        for (const stop of Object.keys(schedules[direction][day] ?? {})) {
          expect(known.has(stop), `${stop} is missing from stopOrderByDirection.${direction}`).toBe(true);
        }
      }
    }
  });
});
