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
  notes?: { time: TimeStr; note: string }[]; // p.ej. "HASTA EL MATADERO"
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
- [ ] T1 — Scaffold: package.json (bun), vite+react+ts, tailwind v4, vitest, fontsource, configs, .gitignore, index.html, git init (rama `feat/colectivo-544-app`). Check: `bun install` sin errores, `bun run dev` sirve.
- [ ] T2 — Pipeline: mover XLSX a `data/`, escribir `scripts/convert-schedule.mts`, generar `src/data/schedules.ts` tipado + metadatos. Check: `bun run convert` regenera sin diff (idempotente), sanity test pasa.
- [ ] T3 — Lógica: tipos, detección de día (con feriado toggle), normalización/orden de tiempos, próximo colectivo. Tests vitest. Check: `bun run test` verde.
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
- (vacío hasta T1)

## Next step
- T1: scaffold.