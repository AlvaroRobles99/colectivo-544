import { describe, expect, it } from "vitest";
import { DEFAULT_LANG, LANGS, detectLang, dictionaries, fill, isLang } from "./i18n";

/** Every leaf path/value pair of a nested dictionary, for structural comparison. */
function leafEntries(value: unknown, prefix = ""): [string, string][] {
  if (typeof value === "string") return [[prefix, value]];
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      leafEntries(child, prefix === "" ? key : `${prefix}.${key}`),
    );
  }
  return [[prefix, `<non-string:${typeof value}>`]];
}

describe("i18n dictionaries", () => {
  it("exposes every declared language plus a Spanish default", () => {
    expect(Object.keys(dictionaries).sort()).toEqual([...LANGS].sort());
    expect(DEFAULT_LANG).toBe("es");
    expect(LANGS).toContain("en");
  });

  it("es and en define exactly the same key paths", () => {
    const esPaths = leafEntries(dictionaries.es).map(([path]) => path).sort();
    const enPaths = leafEntries(dictionaries.en).map(([path]) => path).sort();
    expect(enPaths).toEqual(esPaths);
    expect(esPaths.length).toBeGreaterThan(20);
  });

  it("has no empty or placeholder-only translations", () => {
    for (const lang of LANGS) {
      const empty = leafEntries(dictionaries[lang])
        .filter(([, text]) => text.trim() === "")
        .map(([path]) => path);
      expect(empty).toEqual([]);
    }
  });

  it("keeps the Spanish strings the UI already ships", () => {
    expect(dictionaries.es.sign.emptyStopTitle).toBe("SELECCIONÁ TU PARADA");
    expect(dictionaries.es.holiday.label).toBe("Hoy es feriado");
    expect(dictionaries.es.direction.ida).toBe("Ida");
  });
});

describe("fill", () => {
  it("replaces named placeholders", () => {
    expect(fill("EN {n} MIN", { n: 5 })).toBe("EN 5 MIN");
    expect(fill("Hoy es {weekday} — cuadro de {day}.", { weekday: "lunes", day: "días hábiles" })).toBe(
      "Hoy es lunes — cuadro de días hábiles.",
    );
  });

  it("leaves text without placeholders untouched", () => {
    expect(fill("SIN SERVICIO", {})).toBe("SIN SERVICIO");
  });
});

describe("detectLang", () => {
  it("picks English when the browser's first preference is English", () => {
    expect(detectLang(["en-US"])).toBe("en");
    expect(detectLang(["en"])).toBe("en");
    expect(detectLang(["en-GB", "es-AR"])).toBe("en");
  });

  it("falls back to Spanish for any other first preference", () => {
    expect(detectLang(["es-AR"])).toBe("es");
    expect(detectLang(["pt-BR", "en"])).toBe("es");
    expect(detectLang([])).toBe("es");
  });
});

describe("isLang", () => {
  it("accepts only known language codes", () => {
    expect(isLang("es")).toBe(true);
    expect(isLang("en")).toBe(true);
    expect(isLang("fr")).toBe(false);
    expect(isLang(null)).toBe(false);
  });
});
