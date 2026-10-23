# AGENTS.md (for AI coding agents)

## Repo purpose
This is a frontend-only SPA to consult Line 544 schedules (Empresa A. Buttini, San Rafael, Invierno 2026). Users pick direction (Ida/Vuelta) and stop, see the next departure with live countdown and the full schedule for the day. It auto-detects laborable/Saturday/Sunday with a manual holiday toggle (holiday uses Sunday schedule). No backend, PWA, alerts, map or automatic holiday calendar.

## Tech stack
- React + Vite + Bun + Tailwind CSS v4
- TypeScript (strict)
- Vitest (unit tests)
- @fontsource-variable/archivo, @fontsource-variable/instrument-sans, @fontsource-variable/jetbrains-mono
- xlsx (data conversion only)

## Commands
```bash
bun install      # Install dependencies
bun run dev      # Start dev server
bun run build    # Production build
bun run typecheck # TypeScript check
bun run test     # Run unit tests (vitest)
bun run convert  # Convert XLSX to src/data/schedules.ts
```

## Data pipeline
- Source: `data/Horarios_Linea_544_Buttini.xlsx` (preserved; do not delete/rename without updating script)
- Script: `scripts/convert-schedule.mts` reads the XLSX and auto-generates `src/data/schedules.ts`
- **DO NOT EDIT generated files**. Always run `bun run convert` after changing the source XLSX.
- Output is deterministic (idempotent). Header detection is dynamic; sheet names match the workbook. 
- Known edge cases: `HASTA EL MATADERO` notes (not times), slash splits (`HH:MM / HH:MM`) become two times, post-midnight (00:00–03:59) belong to previous service day and are ordered at end with cutoff 04:00, Sunday return includes `E.T.O. San Rafael`, deduplication applied, and `stopOrderByDirection` is produced per direction.

## Data model (overview)
- `DayType = "habiles" | "sabados" | "domingos"`
- `Direction = "ida" | "vuelta"`
- `TimeStr = "\${number}:\${number}"` (HH:MM, zero-padded)
- `StopSchedule.times` in chronological order for that service day (00:00–03:59 at end)
- `notes` may attach text (e.g. `time: null` for general note like "HASTA EL MATADERO")
- Schedules are embedded in `src/data/schedules.ts` (generated). Stops only present in a sheet are absent for that day/direction.

## Agent workflow
- Read relevant context first (odd/tasks, src/, scripts/, package.json) before conclusions.
- Make minimal, targeted changes. Do not modify generated files (`src/data/schedules.ts`) or committed data blindly.
- Commits, pushes and pull requests are authorized standing delivery work (see Git rules). Do not run `gentle-ai` unless explicitly instructed.
- Fresh context: verify symbols/paths against codebase; do not assume.
- If unsure, ask (ask-on-risk). Keep responses short unless detail required.
- Never add AI attribution to commits (conventional commits only).
- Spanish content only where explicitly requested (README, docs). Code/comments/identifiers/UI literals in English by default per artifact language contract.

## Quality floor
- Mobile-first, responsive, accessible (focus visible). Respect `prefers-reduced-motion`.
- Type-safe, no `any`, strict TS. Pure logic in `src/lib/` (no DOM). UI components in `src/components/`.
- Tests cover pure logic (vitest). Keep buildable and typecheck passing.
- Deterministic generation (`bun run convert` idempotent). No network calls; fonts loaded via @fontsource-variable (offline).

## LocalStorage keys
- `colectivo-544:direction` — `"ida"` | `"vuelta"`
- `colectivo-544:stop` — stop name (string) | null
- `colectivo-544:feriado` — `"true"` | `"false"` (holiday toggle)
- `colectivo-544:lang` — `"es"` | `"en"` (UI language; first visit auto-detects from the browser's first locale, then only a manual toggle writes this key. Text in `src/lib/i18n.ts`, provider in `src/components/LanguageProvider.tsx`)

## Known quirks & common pitfalls
- xlsx under Bun/Windows: prefer the conversion script as written; avoid calling `xlsx.readFile` in ad-hoc shell in ways that differ. The script handles cell types (including potential Excel time serials defensively).
- Post-midnight times belong to previous service day; ordering rule is enforced by converter and logic.
- Some annotations are text-only (not parseable times) and go to `notes`. Slash-separated times (`10:20 / 11:00`) are split.
- `E.T.O. San Rafael` only appears in Vuelta Domingos (by workbook). "HASTA EL MATADERO" appears in Salto de las Rosas (both directions on laborables in those cases).
- `stopOrderByDirection` differs per direction (Vuelta starts near Bella Vista). Don't assume global order everywhere.
- Do not edit generated `src/data/schedules.ts`. Regenerate with `bun run convert` if source changes.
- Holiday toggle forces Sunday schedule (manual only; no Argentine holiday calendar).
- `nextDayFirstTime` returns first time of the same table (does not peek next calendar day type) — documented behavior in lib.

## Git rules
- Delivery is authorized standing work: branch, commit, push, and open a pull request without asking again.
- Flow: create a topic branch from `main` (never commit directly to `main`), commit in small reviewable units, push the branch, then open the PR with `gh pr create --base main`.
- No AI attribution ("Co-Authored-By", etc.)
- Conventional commits only
- Never merge, never force-push, never delete remote branches
- Do not run `gentle-ai`
- Small, reviewable units when relevant
- Keep repo buildable between changes
