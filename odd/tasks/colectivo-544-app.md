# Feature: colectivo-544-app

> Feature document (ODD). Repo target: `github.com/AlvaroRobles99/colectivo-544` (public). Local dir: `C:\Users\rocio\Desktop\wweb`.

## Objective
SPA frontend-only para consultar horarios de la Línea 544 (Empresa A. Buttini, San Rafael, Invierno 2026). El usuario elige dirección (Ida/Vuelta) y parada, y ve (a) el próximo colectivo con cuenta regresiva en vivo y (b) la tabla completa del día. La app detecta día hábil / sábado / domingo, con toggle manual de "feriado"; los feriados usan el cuadro de domingos.

## Problem / Why
Los horarios existen solo en un XLSX (`Horarios_Linea_544_Buttini (1).xlsx`). Queremos una web simple, sin backend, que responda "¿a qué hora pasa el colectivo acá?" desde el celular, en la parada.

## Decisions (user-confirmed)
- Stack: React + Vite + Bun + Tailwind (v4), solo frontend. TS estricto.
- Parada: selector por **dirección (Ida/Vuelta) + parada**.
- Mostrar **próximo colectivo con cuenta regresiva en vivo** + tabla completa.
- Día: **detección automática** hábil/sábado/domingo + **toggle manual de feriado** (persistido en localStorage). No se implementa calendario completo de feriados.
- Git: repo local + push a GitHub **público**, nombre `colectivo-544`, cuenta `AlvaroRobles99` (auth confirmada, HTTPS). Primer push directo a `main`.
- Docs/AGENTS.md: AGENTS.md en inglés; README y docs en español (precedente pageRo).

## Scope
- Convertir el XLSX a datos tipados embebidos (`src/data/schedules.ts`) vía script reproducible (`scripts/convert-schedule.mts`, `bun run convert`). El XLSX se conserva como fuente (se mueve a `data/`).
- Detección de día: hábiles (lun–vie), sábados, domingos; toggle feriado → cuadro domingos.
- Horarios post-medianoche (00:00–03:59) pertenecen al día de servicio anterior (ordenan al final de la lista).
- Próximo colectivo: basado en hora local del cliente, con cuenta regresiva; si no hay más servicio hoy, indicar el primero del próximo día.
- UI responsive mobile-first, accesible (focus visible, reduced motion), textos en español.
- Tests unitarios (vitest) de lógica pura: parseo de tiempos, orden, detección de día, próximo colectivo, sanity de datos.

## Out of scope
- Backend, persistencia de datos externa, mapa de recorrido, alertas, PWA.
- Calendario automático de feriados argentinos.

## Data model
```ts
type DayType = "habiles" | "sabados" | "domingos";
type Direction = "ida" | "vuelta";
type TimeStr = `${number}:${number}`; // "HH:MM"
interface StopSchedule {
  times: TimeStr[];                       // orden cronológico del día de servicio (00:00..03:59 al final)
  notes?: { time: TimeStr | null; note: string }[]; // p.ej. "HASTA EL MATADERO" → time null cuando no se ata a una hora
}
type ScheduleTable = Record<Direction, Partial<Record<DayType, Record<string, StopSchedule>>>>;
```
- Columnas de parada se usan verbatim. Si una parada no existe en un día/sentido (ej. "E.T.O. San Rafael" solo en vuelta domingos) → sin servicios ese día.
- Celdas no-hora (texto) no entran en `times`; si es anotación se guarda en `notes`.
- Celdas con `a / b` (ej. "10:20 / 11:00") se separan en dos tiempos.

## Excel quirks (verified 2026-10-09)
1. "HASTA EL MATADERO" en col Salto de las Rosas (vuelta e ida hábiles): nota, no hora.
2. Fila domingos ida "10:20 / 11:00 ...": dos viajes en una fila → split por `/`.
3. Vuelta domingos: última col es "E.T.O. San Rafael" (no "Av. Gral. Paz esq. Granaderos"; faltan Libertador 150 y El Progreso).
4. Post-medianoche: 00:00, 00:20, 00:30, 01:00 (pertenecen al día de servicio previo).

## Design direction (frontend-design skill)
- **Palette**: ink `#0B1A2E` (fondo oscuro), paper `#F2F5F9`, card `#FFFFFF`, amber `#FFB224` (acento señal), slate `#5C6B7E` (texto secundario), hairline `#D8DFE8`.
- **Type**: display **Archivo** (variable, 800/900), body **Instrument Sans**, mono **JetBrains Mono** (figuras tabulares para horarios) — vía @fontsource-variable (offline, sin CDN).
- **Signature**: panel "cartel de parada" (sign): fondo ink, hora + "PRÓXIMO" + countdown "EN 4 MIN" en amber, badge 544. El resto del UI queda quieto.
- **Layout**: columna centrada max-w-md; header sticky con identidad de línea y franja amber; controles segmentados (día, dirección); buscador de paradas; sign; lista completa agrupada por hora.
- **Motion**: countdown 1s; "encendido" del cartel al cargar; respeta reduced motion.

## Tasks
- [x] T1 — Scaffold: package.json (bun), vite+react+ts, tailwind v4, vitest, fontsource, configs, .gitignore, index.html, git init (rama `feat/colectivo-544-app`). ✅ `bun install`/`typecheck`/`test`/`build` verdes (parent spot-check re-ejecutado). Nota: TS7 exigió `src/vite-env.d.ts`; tsconfig plano (no references).
- [x] T2 — Pipeline: XLSX movido a `data/Horarios_Linea_544_Buttini.xlsx`, `scripts/convert-schedule.mts` genera `src/data/schedules.ts` (AUTO-GENERATED, determinista). ✅ `bun run convert` ×2 idempotente (SHA-256 igual), 5 sanity tests verdes. El header row se descubre (no se hardcodea índice: hay fila vacía tras metadata).
- [x] T3 — Lógica: `src/lib/{serviceDay,dayType,schedule}.ts` (puro, sin DOM) + 37 tests nuevos → suite 42/42. ✅ `typecheck`/`test`/`build` verdes (spot-check del padre re-ejecutado). Corrección: `00:00` en ida/habiles está en **Florida**, no en Gral. Paz (verificado por el writer contra los datos reales). Caveat: `nextDayFirstTime` usa la primera hora de la MISMA tabla (no conoce el día siguiente).
- [ ] T4 — UI: componentes React + Tailwind según design direction; sign con countdown; listados; estados vacíos; a11y. Check: `bun run typecheck`, `bun run build`.
- [ ] T5 — Docs: AGENTS.md (EN), README.md (ES), breve nota de datos. Check: revisión de contenidos.
- [ ] T6 — Delivery: commits por unidad de trabajo (conventional), push a `main` de `AlvaroRobles99/colectivo-544`, cierre de feature doc.

## Delivery
- Ruta: directo + delegado (un writer por task; orquestador glue).
- Estrategia: `ask-on-risk`. Forecast ~700–900 líneas → supera 400: aplicar estrategia cuando corresponda (candidato nativo = work-unit commit/slice, no todo el branch).
- RDD: on por defecto. Tras cada work-unit commit correr `gentle-ai review assess`; seguir transiciones nativas. Si `gentle-ai` no está disponible, registrarlo y no inventar estado.

## Checks (aplicables, por task)
- `bun run typecheck`, `bun run test` (vitest), `bun run build`, `bun run convert` idempotente.
- Verificación de caminos/símbolos reclamados por writers (gate anti-hallucination).

## Progress
- T1+T2 ✅ cerrados por work-unit commit `9b04c3d` (unidad atómica: scaffold+pipeline son co-dependientes; cada commit queda buildable y test verde).
- Verificación: parent spot-check `typecheck`/`test`(5)/`build` re-ejecutados OK; writer reportó comandos con resultados observados iguales.
- Verificación independiente T1+T2: **PASS** (6/6). Cross-check propio del workbook: 55 celdas de parada, 0 mismatches; idempotencia por SHA-256; 15/15 artefactos existen; config verificada. Hallazgos del verificador (dato fuente, no código): (a) Vuelta-Sábados `Florida 15:57` vs `Av. Gral. Paz esq. Granaderos 15:20` en la misma fila = inconsistencia del Excel (se transcribe fiel); (b) `E.T.O. San Rafael 20:25` duplicado en dos celdas (se deduplica); (c) `xlsx.readFile` frágil bajo bun/Windows (`Bun.file()+XLSX.read` es el fallback probado).
- Entrega: estrategia `ask-on-risk` resuelta por la usuaria → **push directo a main** (sin PRs). Un solo slice: todo el branch `feat/colectivo-544-app` → `main`. Presupuesto >400 autorizado por decisión explícita.
- RDD: `gentle-ai review assess` → `unassessable` + STATUS preflight → typed failure `immutable_review_transport_unsupported` (`next_action: stop`). OpenCode no es runtime elegible para receipt review (solo claude-code/codex). No se toca el switch (user-owned). Se aplica path RDD-off: tier high/unassessable → verificador independiente (hecho para T1+T2).

## Next step
- T4 (UI).