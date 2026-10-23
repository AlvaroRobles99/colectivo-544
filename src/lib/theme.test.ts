import { describe, expect, it } from "vitest";
import {
  isThemePreference,
  nextPreference,
  resolveTheme,
  THEME_KEY,
  THEME_PREFERENCES,
  type ThemePreference,
} from "./theme";

describe("isThemePreference", () => {
  it("accepts exactly the three preferences", () => {
    for (const value of THEME_PREFERENCES) {
      expect(isThemePreference(value)).toBe(true);
    }
  });

  it("rejects anything else a stale or hand-edited storage could hold", () => {
    for (const value of ["auto", "Dark", "", "true", null, undefined, 0]) {
      expect(isThemePreference(value)).toBe(false);
    }
  });
});

describe("resolveTheme", () => {
  it("follows the operating system while the preference is automatic", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("lets an explicit choice override the operating system", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});

describe("nextPreference", () => {
  it("cycles automatic → light → dark → automatic", () => {
    let current: ThemePreference = "system";
    const seen: ThemePreference[] = [current];
    for (let step = 0; step < 3; step += 1) {
      current = nextPreference(current);
      seen.push(current);
    }
    expect(seen).toEqual(["system", "light", "dark", "system"]);
  });

  it("never stays on the same state, so every click is explainable", () => {
    for (const value of THEME_PREFERENCES) {
      expect(nextPreference(value)).not.toBe(value);
    }
  });
});

describe("THEME_KEY", () => {
  it("keeps the documented storage key stable", () => {
    expect(THEME_KEY).toBe("colectivo-544:theme");
  });
});
