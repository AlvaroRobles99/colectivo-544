import { describe, expect, it } from "vitest";
import { DAY_TYPE_LABELS, DAY_TYPE_SHORT_LABELS, detectDayType, resolveDayType } from "./dayType";
import { getServiceDate } from "./serviceDay";

describe("labels", () => {
  it("exposes the user-visible Spanish labels", () => {
    expect(DAY_TYPE_LABELS).toEqual({
      habiles: "Días hábiles",
      sabados: "Sábados",
      domingos: "Domingos y feriados",
    });
    expect(DAY_TYPE_SHORT_LABELS).toEqual({
      habiles: "Hábiles",
      sabados: "Sábados",
      domingos: "Dom. y feriados",
    });
  });
});

describe("detectDayType", () => {
  it("classifies known local weekdays", () => {
    const monday = new Date(2026, 9, 12); // Monday
    const saturday = new Date(2026, 9, 10); // Saturday
    const sunday = new Date(2026, 9, 11); // Sunday
    expect(monday.getDay()).toBe(1);
    expect(saturday.getDay()).toBe(6);
    expect(sunday.getDay()).toBe(0);

    expect(detectDayType(monday)).toBe("habiles");
    expect(detectDayType(saturday)).toBe("sabados");
    expect(detectDayType(sunday)).toBe("domingos");
  });

  it("classifies every weekday as habiles", () => {
    for (let day = 12; day <= 16; day += 1) {
      // 2026-10-12 (Monday) through 2026-10-16 (Friday)
      expect(detectDayType(new Date(2026, 9, day))).toBe("habiles");
    }
  });
});

describe("resolveDayType", () => {
  it("forces domingos on holidays regardless of the weekday", () => {
    const wednesday = new Date(2026, 9, 14); // Wednesday
    const saturday = new Date(2026, 9, 10); // Saturday
    expect(wednesday.getDay()).toBe(3);

    expect(resolveDayType(wednesday, true)).toBe("domingos");
    expect(resolveDayType(saturday, true)).toBe("domingos");
  });

  it("falls back to the weekday detection when not a holiday", () => {
    const wednesday = new Date(2026, 9, 14);
    const sunday = new Date(2026, 9, 11);
    expect(resolveDayType(wednesday, false)).toBe("habiles");
    expect(resolveDayType(sunday, false)).toBe("domingos");
  });

  it("resolves the type of the service date, not the raw clock date", () => {
    const saturdayEarlyMorning = new Date(2026, 9, 10, 2, 30);
    expect(resolveDayType(getServiceDate(saturdayEarlyMorning), false)).toBe("habiles");
  });
});