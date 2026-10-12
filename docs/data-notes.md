# Notas sobre los datos

## Origen

Los horarios se obtienen del archivo Excel **`data/Horarios_Linea_544_Buttini.xlsx`** (hoja cabecera "Invierno 2026").

El archivo se conserva como **fuente única de verdad**. No se edita dentro del código: se convierte a un módulo tipado TypeScript mediante `scripts/convert-schedule.mts`.

## Hojas del libro

El libro tiene 6 hojas que cubren cada sentido y tipo de día:

- `Ida - Hábiles`
- `Vuelta - Hábiles`
- `Ida - Sábados`
- `Vuelta - Sábados`
- `Ida - Domingos y Feriados`
- `Vuelta - Dom. y Feriados`

## Casos particulares detectados

- **"HASTA EL MATADERO".** En Salto de las Rosas (tanto ida como vuelta en hábiles) aparece como anotación, no como hora. Se guarda en `notes` sin agregarse a `times`.
- **Separación por barra (`/`).** Celdas como `10:20 / 11:00` generan **dos viajes** independientes (se separan en el parseo).
- **`E.T.O. San Rafael`.** Solo aparece en **Vuelta — Domingos y Feriados**. En otros días/sentidos esa parada no existe.
- **Viajes post-medianoche.** Horarios entre `00:00` y `03:59` pertenecen al **día de servicio anterior**. En la tabla se mantienen cronológicamente para ese servicio, pero se muestran **ordenados al final** (cutoff 04:00) para facilitar la lectura.
- **Deduplicación.** Se eliminan entradas duplicadas del mismo horario para una misma parada.
- **Orden de paradas.** `stopOrderByDirection` respeta el orden real por dirección (en **Vuelta**, la lista arranca cerca de Bella Vista). No se asume un orden global único.

## Cuándo regenerar

Si modificás el archivo `.xlsx`, regenerá los datos:

```bash
bun run convert
```

La salida (`src/data/schedules.ts`) es **determinista**: al correr dos veces seguidas sobre el mismo archivo, el resultado es idéntico. No edites ese archivo generado a mano.

## Cómo verificar rápido

1. Corré `bun run convert` sin cambios en el XLSX: el archivo no debería modificarse.
2. Verificá con `git diff --name-only` que solo afecte `src/data/schedules.ts` si realmente cambió el origen.
3. Chequeá `bun run typecheck && bun run test && bun run build` que todo siga compilando y pasando tests.
