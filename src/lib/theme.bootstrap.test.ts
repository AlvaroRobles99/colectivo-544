import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isThemePreference, resolveTheme, type ThemePreference } from "./theme";

/**
 * The pre-paint script in `index.html` decides the theme before React exists, so
 * it duplicates `resolveTheme` in plain JavaScript. This test runs the real
 * script out of the HTML and asserts it agrees with the provider for every
 * combination of stored value and OS preference: a drift here shows up as a
 * light flash on a dark session, which is exactly what the script exists to
 * prevent, and it is invisible to every other test.
 */
const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");

const source: string = (() => {
  const found = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if (found === undefined) {
    throw new Error("index.html is missing the inline theme script");
  }
  return found;
})();

function prePaintTheme(stored: string | null, prefersDark: boolean): string {
  const attributes: Record<string, string> = {};
  const documentElement = {
    setAttribute: (name: string, value: string) => {
      attributes[name] = value;
    },
  };
  const localStorage = {
    getItem: (key: string) => (key === "colectivo-544:theme" ? stored : null),
  };
  const window = { matchMedia: () => ({ matches: prefersDark }) };

  // eslint-disable-next-line no-new-func -- the script has to run as written in the HTML
  new Function("localStorage", "window", "document", source)(localStorage, window, {
    documentElement,
  });

  const applied = attributes["data-theme"];
  if (applied === undefined) {
    throw new Error("the inline script did not set data-theme");
  }
  return applied;
}

function expected(stored: string | null, prefersDark: boolean): string {
  const preference: ThemePreference =
    stored !== null && isThemePreference(stored) ? stored : "system";
  return resolveTheme(preference, prefersDark);
}

describe("pre-paint theme script", () => {
  const storedValues = [null, "system", "light", "dark", "banana"] as const;

  for (const stored of storedValues) {
    for (const prefersDark of [true, false]) {
      it(`matches the provider for stored=${String(stored)} and system dark=${prefersDark}`, () => {
        expect(prePaintTheme(stored, prefersDark)).toBe(expected(stored, prefersDark));
      });
    }
  }

  it("survives a storage that throws", () => {
    const attributes: Record<string, string> = {};
    const throwingStorage = {
      getItem: () => {
        throw new Error("storage disabled");
      },
    };
    const window = { matchMedia: () => ({ matches: true }) };
    const document = {
      documentElement: {
        setAttribute: (name: string, value: string) => {
          attributes[name] = value;
        },
      },
    };

    // eslint-disable-next-line no-new-func -- same script, failing environment
    new Function("localStorage", "window", "document", source)(
      throwingStorage,
      window,
      document,
    );

    expect(attributes["data-theme"]).toBe("light");
  });
});
