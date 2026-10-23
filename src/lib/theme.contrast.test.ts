import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Guards the palette in `index.css`: a color tweak that silently kills readable
 * contrast in either theme fails here instead of shipping. Colors are read from
 * the stylesheet itself, so there is no second copy of the palette to drift.
 */
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");

const DARK_SELECTOR = ':root[data-theme="dark"]';
const darkStart = css.indexOf(DARK_SELECTOR);

if (darkStart === -1) {
  throw new Error(`index.css is missing the ${DARK_SELECTOR} palette`);
}

function paletteOf(source: string): Record<string, string> {
  const palette: Record<string, string> = {};
  for (const match of source.matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    const [, name, value] = match;
    if (name !== undefined && value !== undefined) {
      palette[name] = value;
    }
  }
  return palette;
}

const light = paletteOf(css.slice(0, darkStart));
const dark = paletteOf(css.slice(darkStart));

function token(palette: Record<string, string>, name: string): string {
  const value = palette[name];
  if (value === undefined) {
    throw new Error(`Missing --color-${name} in the palette`);
  }
  return value;
}

function channel(value: number): number {
  const ratio = value / 255;
  return ratio <= 0.03928 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const rgb = Number.parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((rgb >> 16) & 0xff) +
    0.7152 * channel((rgb >> 8) & 0xff) +
    0.0722 * channel(rgb & 0xff)
  );
}

function contrast(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** [foreground, background, minimum ratio] — WCAG AA for body text is 4.5, AAA is 7. */
const PAIRS: readonly (readonly [string, string, number])[] = [
  ["ink", "paper", 7],
  ["ink", "card", 7],
  ["slate", "paper", 4.5],
  ["slate", "card", 4.5],
  ["board-ink", "board", 7],
  ["amber", "board", 4.5],
  ["amber-ink", "paper", 4.5],
  ["amber-ink", "card", 4.5],
  ["on-amber", "amber", 4.5],
];

describe("palette", () => {
  it("defines the same tokens in both themes, so nothing falls back to the light value", () => {
    expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort());
  });

  for (const [themeName, palette] of [
    ["light", light],
    ["dark", dark],
  ] as const) {
    describe(`${themeName} theme`, () => {
      for (const [foreground, background, minimum] of PAIRS) {
        it(`keeps ${foreground} on ${background} at or above ${minimum}:1`, () => {
          const ratio = contrast(token(palette, foreground), token(palette, background));
          expect(ratio).toBeGreaterThanOrEqual(minimum);
        });
      }
    });
  }
});
