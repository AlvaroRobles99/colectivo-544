import { describe, expect, it } from "vitest";
import { getServiceDate, sortTimes, toServiceMinutes, toServiceNowMinutes, SERVICE_DAY_CUTOFF_HOUR } from "./serviceDay";
import { detectDayType } from "./dayType";

describe("getServiceDate", () => {
  it("shifts the 02:30 of any calendar day to the previous day", () => {
    const now = new Date(2026, 9, 10, 2, 30); // Saturday 02:30 local
    expect(getServiceDate(now)).toEqual(new Date(2026, 9, 9)); // Friday
  });

  it("does not mutate its input", () => {
    const now = new Date(2026, 9, 10, 2, 30);
    getServiceDate(now);
    expect(now).toEqual(new Date(2026, 9, 10, 2, 30));
  });

  it("keeps the same calendar day at and after the 04:00 cutoff", () => {
    expect(getServiceDate(new Date(2026, 9, 10, SERVICE_DAY_CUTOFF_HOUR, 0))).toEqual(
      new Date(2026, 9, 10),
    );
    expect(getServiceDate(new Date(2026, 9, 10, 23, 50))).toEqual(new Date(2026, 9, 10));
  });

  it("shifts one minute before the cutoff", () => {
    expect(getServiceDate(new Date(2026, 9, 10, 3, 59))).toEqual(new Date(2026, 9, 9));
  });

  it("wraps across month and year boundaries", () => {
    expect(getServiceDate(new Date(2026, 10, 1, 2, 0))).toEqual(new Date(2026, 9, 31));
    expect(getServiceDate(new Date(2027, 0, 1, 2, 0))).toEqual(new Date(2026, 11, 31));
  });
});

describe("toServiceMinutes", () => {
  it("shifts post-midnight times so they sort after the latest daytime time", () => {
    expect(toServiceMinutes("00:00")).toBe(1440);
    expect(toServiceMinutes("03:59")).toBe(1679);
    expect(toServiceMinutes("23:40")).toBe(1420);
    expect(toServiceMinutes("23:59")).toBe(1439);
    expect(toServiceMinutes("04:00")).toBe(240);
  });
});

describe("toServiceNowMinutes", () => {
  it("mirrors toServiceMinutes for the same wall-clock instant", () => {
    expect(toServiceNowMinutes(new Date(2026, 9, 10, 2, 30))).toBe(toServiceMinutes("02:30")); // 1590
    expect(toServiceNowMinutes(new Date(2026, 9, 10, 0, 30))).toBe(1470); // 1440 + 30
    expect(toServiceNowMinutes(new Date(2026, 9, 10, 23, 40))).toBe(toServiceMinutes("23:40"));
    expect(toServiceNowMinutes(new Date(2026, 9, 10, 4, 0))).toBe(toServiceMinutes("04:00"));
  });
});

describe("sortTimes", () => {
  it("sorts a mixed list under the service-day rule", () => {
    expect(sortTimes(["23:40", "05:15", "00:00", "01:00"])).toEqual([
      "05:15",
      "23:40",
      "00:00",
      "01:00",
    ]);
  });

  it("does not mutate the input and always returns a new array", () => {
    const times = ["00:00", "05:15", "23:40"];
    const sorted = sortTimes(times);
    expect(sorted).toEqual(["05:15", "23:40", "00:00"]);
    expect(sorted).not.toBe(times);
    expect(times).toEqual(["00:00", "05:15", "23:40"]);
  });
});

describe("service day + day type integration", () => {
  it("treats a 02:30 Saturday morning as the previous (Friday) service day: habiles", () => {
    const saturdayNight = new Date(2026, 9, 10, 2, 30); // 2026-10-10 is a Saturday
    expect(saturdayNight.getDay()).toBe(6);
    const serviceDate = getServiceDate(saturdayNight);
    expect(detectDayType(serviceDate)).toBe("habiles");
  });
});