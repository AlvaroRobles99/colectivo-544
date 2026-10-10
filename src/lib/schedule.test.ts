import { describe, expect, it } from "vitest";
import { schedules, stopOrderByDirection, type DayType, type Direction } from "../data/schedules";
import { getNextDeparture, getStopsFor, getStopsForDirection, getStopSchedule, hasService, splitPassedAndUpcoming } from "./schedule";
import { toServiceMinutes } from "./serviceDay";

const DIRECTIONS: Direction[] = ["ida", "vuelta"];
const DAYS: DayType[] = ["habiles", "sabados", "domingos"];
// A Friday: 2026-10-09 (2026-10-10 is a Saturday, so 2026-10-12 is the Monday).
const FRIDAY = new Date(2026, 9, 9);

describe("getStopsFor", () => {
  it("matches the schedule keys of every direction/day cell, in that direction's route order", () => {
    for (const direction of DIRECTIONS) {
      for (const day of DAYS) {
        const cell = schedules[direction][day] ?? {};
        const keys = Object.keys(cell);
        expect(getStopsFor(direction, day)).toEqual(
          stopOrderByDirection[direction].filter((stop) => cell[stop] !== undefined),
        );
        expect(getStopsFor(direction, day).length).toBe(keys.length);
      }
    }
  });

  it("lists vuelta in its own route order: Bella Vista first, El Progreso between Babacce and B° Salto", () => {
    const stops = getStopsForDirection("vuelta");
    expect(stops[0]).toBe("Bella Vista");
    expect(stops.indexOf("El Progreso")).toBe(stops.indexOf("Babacce") + 1);
    expect(stops.indexOf("B° Salto")).toBe(stops.indexOf("El Progreso") + 1);
  });

  it("puts the Sunday-only E.T.O. San Rafael last on the vuelta route", () => {
    const stops = getStopsForDirection("vuelta");
    expect(stops[stops.length - 1]).toBe("E.T.O. San Rafael");
  });

  it("never reverses ida order: vuelta order is not the ida order", () => {
    expect(getStopsForDirection("vuelta")).not.toEqual(getStopsForDirection("ida"));
    expect(getStopsForDirection("ida")[0]).toBe("Av. Gral. Paz esq. Granaderos");
  });

  it("excludes El Progreso on vuelta/sabados", () => {
    const stops = getStopsFor("vuelta", "sabados");
    expect(stops).not.toContain("El Progreso");
  });

  it("includes Bella Vista on ida/domingos", () => {
    expect(getStopsFor("ida", "domingos")).toContain("Bella Vista");
  });

  it("reflects the vuelta/domingos quirk: E.T.O. San Rafael instead of Libertador 150", () => {
    const stops = getStopsFor("vuelta", "domingos");
    expect(stops).toContain("E.T.O. San Rafael");
    expect(stops).not.toContain("Libertador 150");
  });

  it("never returns vuelta-only stops for ida", () => {
    for (const day of DAYS) {
      const stops = getStopsFor("ida", day);
      expect(stops).not.toContain("El Progreso");
      expect(stops).not.toContain("B° Salto");
      expect(stops).not.toContain("E.T.O. San Rafael");
    }
  });
});

describe("getStopSchedule / hasService", () => {
  it("returns the schedule for a stop with service", () => {
    const schedule = getStopSchedule("ida", "habiles", "Av. Gral. Paz esq. Granaderos");
    expect(schedule).toBeDefined();
    expect(schedule?.times[0]).toBe("05:15");
    expect(hasService("ida", "habiles", "Av. Gral. Paz esq. Granaderos")).toBe(true);
  });

  it("returns undefined for a stop without service that direction/day", () => {
    expect(getStopSchedule("vuelta", "sabados", "El Progreso")).toBeUndefined();
    expect(hasService("vuelta", "sabados", "El Progreso")).toBe(false);
    expect(getStopSchedule("ida", "domingos", "El Progreso")).toBeUndefined();
  });

  it("returns undefined for an unknown stop", () => {
    expect(getStopSchedule("ida", "habiles", "Parada Inexistente")).toBeUndefined();
    expect(hasService("ida", "habiles", "Parada Inexistente")).toBe(false);
  });
});

describe("getNextDeparture", () => {
  const STOP = "Av. Gral. Paz esq. Granaderos";

  it("returns the first departure of the day before it leaves", () => {
    const result = getNextDeparture("ida", "habiles", STOP, new Date(2026, 9, 9, 5, 0));
    expect(result).toEqual({ time: "05:15", minutesUntil: 15, nextDayFirstTime: null });
  });

  it("picks the next departure mid-day with the correct minutesUntil", () => {
    const result = getNextDeparture("ida", "habiles", STOP, new Date(2026, 9, 9, 10, 0));
    expect(result).toEqual({ time: "10:20", minutesUntil: 20, nextDayFirstTime: null });
  });

  it("looks strictly ahead: at a departure minute it returns the NEXT one", () => {
    const result = getNextDeparture("ida", "habiles", STOP, new Date(2026, 9, 9, 5, 15));
    expect(result).toEqual({ time: "05:40", minutesUntil: 25, nextDayFirstTime: null });
  });

  it("reports the day is over with the first departure of the next day", () => {
    // This stop's ida/habiles list ends at 23:40 (verified against src/data/schedules.ts).
    const result = getNextDeparture("ida", "habiles", STOP, new Date(2026, 9, 9, 23, 41));
    expect(result).toEqual({ time: null, minutesUntil: null, nextDayFirstTime: "05:15" });
  });

  it("returns 00:00 as the next departure at 23:50 when the stop's list contains it", () => {
    // Real data: on ida/habiles the only stop whose list contains "00:00" is Florida
    // (the task text credited Av. Gral. Paz esq. Granaderos, which ends at 23:40 there).
    const times = schedules.ida.habiles!.Florida.times;
    expect(times).toContain("00:00");

    const result = getNextDeparture("ida", "habiles", "Florida", new Date(2026, 9, 9, 23, 50));
    expect(result).toEqual({ time: "00:00", minutesUntil: 10, nextDayFirstTime: null });
  });

  it("ends the day for the stop with the latest daytime departure", () => {
    // Av. Gral. Paz esq. Granaderos on ida/habiles contains no post-midnight time,
    // so at 23:50 everything has passed and the next day starts with 05:15.
    const result = getNextDeparture("ida", "habiles", STOP, new Date(2026, 9, 9, 23, 50));
    expect(result).toEqual({ time: null, minutesUntil: null, nextDayFirstTime: "05:15" });
  });

  it("returns all nulls for an unknown stop", () => {
    const result = getNextDeparture("ida", "habiles", "Parada Inexistente", FRIDAY);
    expect(result).toEqual({ time: null, minutesUntil: null, nextDayFirstTime: null });
  });

  it("returns all nulls for a known stop with no service that direction/day", () => {
    const result = getNextDeparture("vuelta", "sabados", "El Progreso", FRIDAY);
    expect(result).toEqual({ time: null, minutesUntil: null, nextDayFirstTime: null });
  });
});

describe("splitPassedAndUpcoming", () => {
  const STOP = "Av. Gral. Paz esq. Granaderos";

  it("partitions without loss and keeps the service-day ordering", () => {
    const now = new Date(2026, 9, 9, 10, 0);
    const { passed, upcoming } = splitPassedAndUpcoming("ida", "habiles", STOP, now);
    const times = schedules.ida.habiles![STOP].times;

    expect([...passed, ...upcoming]).toEqual(times);
    expect(passed).toEqual(["05:15", "05:40", "06:00", "06:20", "06:55", "07:50", "08:50", "09:50"]);
    expect(upcoming[0]).toBe("10:20");
    expect(upcoming[upcoming.length - 1]).toBe("23:40");

    // Cross-check with getNextDeparture: the first upcoming departure is the next one.
    expect(upcoming[0]).toBe(getNextDeparture("ida", "habiles", STOP, now).time);
  });

  it("counts a departure at the exact current minute as passed", () => {
    const now = new Date(2026, 9, 9, 5, 15);
    const { passed, upcoming } = splitPassedAndUpcoming("ida", "habiles", STOP, now);
    expect(passed[passed.length - 1]).toBe("05:15");
    expect(upcoming[0]).toBe("05:40");
  });

  it("keeps the post-midnight time in upcoming at 23:50", () => {
    const { passed, upcoming } = splitPassedAndUpcoming("ida", "habiles", "Florida", new Date(2026, 9, 9, 23, 50));
    expect(passed[passed.length - 1]).toBe("20:55");
    expect(upcoming).toEqual(["00:00"]);
  });

  it("keeps both partitions service-day sorted", () => {
    const { passed, upcoming } = splitPassedAndUpcoming("vuelta", "habiles", "Tropezón", new Date(2026, 9, 9, 13, 0));
    // Tropezón on vuelta/habiles contains "00:42", which sorts after 23:12.
    const minutes = (time: string) => toServiceMinutes(time);
    for (let index = 1; index < passed.length; index += 1) {
      expect(minutes(passed[index])).toBeGreaterThan(minutes(passed[index - 1]));
    }
    for (let index = 1; index < upcoming.length; index += 1) {
      expect(minutes(upcoming[index])).toBeGreaterThan(minutes(upcoming[index - 1]));
    }
    expect(upcoming[upcoming.length - 1]).toBe("00:42");
  });

  it("returns empty partitions for an unknown stop", () => {
    expect(splitPassedAndUpcoming("ida", "habiles", "Parada Inexistente", FRIDAY)).toEqual({
      passed: [],
      upcoming: [],
    });
  });
});