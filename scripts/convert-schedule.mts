// Converts the Line 544 workbook into a typed, committed data module.
// Run with: bun run convert
//
// The output (`src/data/schedules.ts`) is generated and must never be hand
// edited. Output is deterministic: the only non-literal value is the source
// file's mtime, so re-running against an untouched workbook yields
// byte-identical output.
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";

type DayType = "habiles" | "sabados" | "domingos";
type Direction = "ida" | "vuelta";
type TimeStr = string;

interface Note {
  time: TimeStr | null;
  note: string;
}

interface StopSchedule {
  times: TimeStr[];
  notes?: Note[];
}

interface LineInfo {
  company: string;
  line: string;
  destinations: string[];
  period: string;
  sourceFile: string;
  sourceLastModified: string;
}

interface SheetConfig {
  sheet: string;
  direction: Direction;
  day: DayType;
}

interface ParsedSheet {
  sheet: string;
  direction: Direction;
  day: DayType;
  title: string;
  meta: string;
  stops: string[];
  byStop: Map<string, { times: TimeStr[]; notes: Note[] }>;
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_FILE = "data/Horarios_Linea_544_Buttini.xlsx";
const SOURCE = join(ROOT, SOURCE_FILE);
const OUTPUT = join(ROOT, "src", "data", "schedules.ts");

// Emission order is fixed so the generated file stays stable between runs.
const SHEETS: SheetConfig[] = [
  { sheet: "Ida - Hábiles", direction: "ida", day: "habiles" },
  { sheet: "Vuelta - Hábiles", direction: "vuelta", day: "habiles" },
  { sheet: "Ida - Sábados", direction: "ida", day: "sabados" },
  { sheet: "Vuelta - Sábados", direction: "vuelta", day: "sabados" },
  { sheet: "Ida - Domingos y Feriados", direction: "ida", day: "domingos" },
  { sheet: "Vuelta - Dom. y Feriados", direction: "vuelta", day: "domingos" },
];

// stopOrder is built by first appearance in this scan. Stops that only exist in
// the Sunday return sheet ("E.T.O. San Rafael") are appended last.
const STOP_ORDER_SCAN = [
  "Ida - Hábiles",
  "Vuelta - Hábiles",
  "Ida - Domingos y Feriados",
  "Ida - Sábados",
  "Vuelta - Sábados",
  "Vuelta - Dom. y Feriados",
];

// Per-direction route order: the union of that direction's sheet header rows by
// first appearance, scanning weekdays, then Saturdays, then Sundays. This is the
// real travel order for each direction (the global stopOrder interleaves both
// directions, so it lists vuelta back-to-front).
const DIRECTION_SCAN: Record<Direction, string[]> = {
  ida: ["Ida - Hábiles", "Ida - Sábados", "Ida - Domingos y Feriados"],
  vuelta: ["Vuelta - Hábiles", "Vuelta - Sábados", "Vuelta - Dom. y Feriados"],
};

const TIME_RE = /^(\d{2}):(\d{2})$/;

function parseTime(value: string): TimeStr | null {
  const match = TIME_RE.exec(value);
  if (match === null) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return null;
  }
  return value;
}

function cellToText(raw: unknown): string {
  if (typeof raw === "string") {
    return raw;
  }
  // Defensive: the current workbook stores every time as a string. If a cell
  // ever carries an Excel time serial (a fraction of a day), decode it rather
  // than silently turning it into a "note".
  if (typeof raw === "number" && raw >= 0 && raw < 1) {
    const totalMinutes = Math.round(raw * 1440);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  if (raw === null || raw === undefined) {
    return "";
  }
  return String(raw);
}

// Cell rules, in order: empty -> skip; "HH:MM" -> time; contains "/" -> split,
// valid parts become times and invalid parts become notes; anything else -> note.
function processCell(raw: unknown): { times: TimeStr[]; notes: Note[] } {
  const text = cellToText(raw).trim();
  if (text === "") {
    return { times: [], notes: [] };
  }

  const single = parseTime(text);
  if (single !== null) {
    return { times: [single], notes: [] };
  }

  if (text.includes("/")) {
    const times: TimeStr[] = [];
    const notes: Note[] = [];
    let lastTime: TimeStr | null = null;
    for (const part of text.split("/")) {
      const trimmed = part.trim();
      if (trimmed === "") {
        continue;
      }
      const time = parseTime(trimmed);
      if (time !== null) {
        times.push(time);
        lastTime = time;
      } else {
        notes.push({ time: lastTime, note: trimmed });
      }
    }
    return { times, notes };
  }

  return { times: [], notes: [{ time: null, note: text }] };
}

// Service-day minute: trips from 04:00 onward belong to today; trips between
// 00:00 and 03:59 belong to the previous service day and sort after 23:xx.
function serviceMinute(time: TimeStr): number {
  const [hours, minutes] = time.split(":").map(Number);
  const absolute = hours * 60 + minutes;
  return hours >= 4 ? absolute : absolute + 1440;
}

function parseSheet(workbook: XLSX.WorkBook, config: SheetConfig): ParsedSheet {
  const worksheet = workbook.Sheets[config.sheet];
  if (worksheet === undefined) {
    throw new Error(`Missing sheet: ${config.sheet}`);
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    raw: true,
    defval: "",
  });

  const title = cellToText(rows[0]?.[0]).trim();
  const meta = cellToText(rows[1]?.[0]).trim();

  // rows[0] = title, rows[1] = metadata, then a blank row, then the stop header
  // row. Location is discovered rather than hard-coded, so a shifted sheet still
  // converts instead of producing garbage.
  let headerIndex = -1;
  for (let index = 2; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    if (row.some((cell) => cellToText(cell).trim() !== "")) {
      headerIndex = index;
      break;
    }
  }
  if (headerIndex === -1) {
    throw new Error(`No stop header row found in sheet: ${config.sheet}`);
  }

  const headerRow = rows[headerIndex] ?? [];
  const columns: { index: number; name: string }[] = [];
  for (let column = 0; column < headerRow.length; column += 1) {
    const name = cellToText(headerRow[column]).trim();
    if (name !== "") {
      columns.push({ index: column, name });
    }
  }

  const byStop = new Map<string, { times: TimeStr[]; notes: Note[] }>();
  for (const column of columns) {
    byStop.set(column.name, { times: [], notes: [] });
  }

  for (let row = headerIndex + 1; row < rows.length; row += 1) {
    const cells = rows[row] ?? [];
    const hasContent = cells.some((cell) => cellToText(cell).trim() !== "");
    if (!hasContent) {
      continue;
    }
    for (const column of columns) {
      const { times, notes } = processCell(cells[column.index]);
      const stop = byStop.get(column.name);
      if (stop === undefined) {
        continue;
      }
      stop.times.push(...times);
      stop.notes.push(...notes);
    }
  }

  const stops: string[] = [];
  for (const [name, stop] of byStop) {
    stop.times = [...new Set(stop.times)].sort((a, b) => serviceMinute(a) - serviceMinute(b));
    stops.push(name);
  }

  return { sheet: config.sheet, direction: config.direction, day: config.day, title, meta, stops, byStop };
}

function parseLineInfo(habilesIda: ParsedSheet): LineInfo {
  const { title, meta } = habilesIda;
  const company = /Empresa:\s*([^|]+)/.exec(meta)?.[1]?.trim() ?? title.split(" - ")[0]?.trim() ?? "";
  const line = /Línea:\s*(\S+)/.exec(meta)?.[1]?.trim() ?? "";
  const destinations = (/Destino\s+(.+)$/.exec(meta)?.[1] ?? "")
    .split("/")
    .map((value) => value.trim())
    .filter((value) => value !== "");
  const period = /-\s*([^:]+):/.exec(title)?.[1]?.trim() ?? "";
  return {
    company,
    line,
    destinations,
    period,
    sourceFile: SOURCE_FILE,
    sourceLastModified: statSync(SOURCE).mtime.toISOString(),
  };
}

function format(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function buildSchedules(parsedSheets: ParsedSheet[]): Record<Direction, Record<DayType, Record<string, StopSchedule>>> {
  const board: Record<Direction, Record<DayType, Record<string, StopSchedule>>> = {
    ida: { habiles: {}, sabados: {}, domingos: {} },
    vuelta: { habiles: {}, sabados: {}, domingos: {} },
  };
  for (const parsed of parsedSheets) {
    const day = board[parsed.direction][parsed.day];
    for (const [name, stop] of parsed.byStop) {
      // A stop header with no departures on a given day/direction means "no
      // service" (e.g. El Progreso on Saturday returns): omit the entry.
      if (stop.times.length === 0) {
        continue;
      }
      const entry: StopSchedule = { times: stop.times };
      if (stop.notes.length > 0) {
        entry.notes = stop.notes;
      }
      day[name] = entry;
    }
  }
  return board;
}

function buildStopOrder(parsedBySheet: Map<string, ParsedSheet>): string[] {
  const order: string[] = [];
  const seen = new Set<string>();
  for (const sheetName of STOP_ORDER_SCAN) {
    const parsed = parsedBySheet.get(sheetName);
    if (parsed === undefined) {
      continue;
    }
    for (const stop of parsed.stops) {
      if (!seen.has(stop)) {
        seen.add(stop);
        order.push(stop);
      }
    }
  }
  return order;
}

function buildStopOrderByDirection(
  parsedBySheet: Map<string, ParsedSheet>,
): Record<Direction, string[]> {
  const collect = (direction: Direction): string[] => {
    const order: string[] = [];
    const seen = new Set<string>();
    for (const sheetName of DIRECTION_SCAN[direction]) {
      const parsed = parsedBySheet.get(sheetName);
      if (parsed === undefined) {
        continue;
      }
      for (const stop of parsed.stops) {
        if (!seen.has(stop)) {
          seen.add(stop);
          order.push(stop);
        }
      }
    }
    return order;
  };
  return { ida: collect("ida"), vuelta: collect("vuelta") };
}

function buildTerminals(parsedBySheet: Map<string, ParsedSheet>): Record<Direction, { from: string; to: string }> {
  const terminals = (direction: Direction): { from: string; to: string } => {
    const parsed = parsedBySheet.get(direction === "ida" ? "Ida - Hábiles" : "Vuelta - Hábiles");
    const stops = parsed?.stops ?? [];
    return { from: stops[0] ?? "", to: stops[stops.length - 1] ?? "" };
  };
  return { ida: terminals("ida"), vuelta: terminals("vuelta") };
}

function render(parsedSheets: ParsedSheet[]): string {
  const bySheetName = new Map(parsedSheets.map((parsed) => [parsed.sheet, parsed]));

  const habilesIda = bySheetName.get("Ida - Hábiles");
  if (habilesIda === undefined) {
    throw new Error("Missing sheet: Ida - Hábiles");
  }

  const line = parseLineInfo(habilesIda);
  const schedules = buildSchedules(parsedSheets);
  const stopOrder = buildStopOrder(bySheetName);
  const stopOrderByDirection = buildStopOrderByDirection(bySheetName);
  const terminals = buildTerminals(bySheetName);

  const lines: string[] = [
    `// AUTO-GENERATED by scripts/convert-schedule.mts — DO NOT EDIT. Source: ${SOURCE_FILE}`,
    "",
    `export type DayType = "habiles" | "sabados" | "domingos";`,
    `export type Direction = "ida" | "vuelta";`,
    `export type TimeStr = string;`,
    "",
    "export interface StopSchedule {",
    "  times: TimeStr[];",
    "  notes?: { time: TimeStr | null; note: string }[];",
    "}",
    "",
    "export interface LineInfo {",
    "  company: string;",
    "  line: string;",
    "  destinations: string[];",
    "  period: string;",
    "  sourceFile: string;",
    "  sourceLastModified: string;",
    "}",
    "",
    `export const line: LineInfo = ${format(line)};`,
    "",
    `export const schedules: Record<Direction, Partial<Record<DayType, Record<string, StopSchedule>>>> = ${format(schedules)};`,
    "",
    `export const stopOrder: string[] = ${format(stopOrder)};`,
    "",
    `export const stopOrderByDirection: Record<Direction, string[]> = ${format(stopOrderByDirection)};`,
    "",
    `export const terminals: Record<Direction, { from: string; to: string }> = ${format(terminals)};`,
    "",
  ];
  return lines.join("\n");
}

function main(): void {
  const workbook = XLSX.readFile(SOURCE);
  const parsedSheets = SHEETS.map((config) => parseSheet(workbook, config));
  const output = render(parsedSheets);

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, output, "utf8");

  const totalStops = new Set(parsedSheets.flatMap((parsed) => parsed.stops)).size;
  console.log(`Wrote ${OUTPUT}`);
  console.log(`Sheets: ${parsedSheets.length}, unique stops: ${totalStops}`);
  for (const parsed of parsedSheets) {
    const withTimes = [...parsed.byStop.values()].filter((stop) => stop.times.length > 0).length;
    console.log(`  ${parsed.direction}/${parsed.day}: ${withTimes} stops with service`);
  }
}

main();
