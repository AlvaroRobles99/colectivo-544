# Colectivo 544 — Horarios

Una web simple para consultar los horarios de la **Línea 544** (Empresa A. Buttini, San Rafael, Invierno 2026). Permite elegir dirección (Ida/Vuelta) y parada, muestra el próximo colectivo con cuenta regresiva en vivo, y la tabla completa del día.

## ¿Cómo usarlo?

1. Elegí la **dirección** (Ida o Vuelta).
2. Seleccioná tu **parada** del listado.
3. El cartel superior muestra el **próximo colectivo** y una cuenta regresiva en minutos.
4. Debajo vas a ver **todos los horarios** del día para esa parada.

El día se detecta automáticamente (hábiles, sábados o domingos). Si es feriado, podés usar el interruptor "Feriado" que fuerza el cuadro de domingos (esta app no tiene calendario automático de feriados argentinos).

La app guarda tus últimas elecciones (dirección, parada, feriado) en el navegador para que al volver estén listas.

## Correr localmente

Necesitás [Bun](https://bun.sh/) instalado.

```bash
bun install
bun run dev
```

Abrí [http://localhost:5173](http://localhost:5173) en tu navegador.

## Scripts útiles

```bash
bun install      # Instalar dependencias
bun run dev      # Servidor de desarrollo
bun run build    # Build de producción
bun run typecheck # Verificación de tipos
bun run test     # Tests unitarios (Vitest)
bun run convert  # Convertir XLSX a src/data/schedules.ts
```

## Estructura

```text
src/
├── components/  # Componentes UI (React + Tailwind)
├── lib/         # Lógica pura (sin DOM)
└── data/        # Datos generados desde XLSX

data/            # Excel fuente (conservado)
scripts/         # Conversión XLSX -> datos tipados
```

## Origen de datos

Los horarios provienen del archivo `data/Horarios_Linea_544_Buttini.xlsx`. Este archivo **se conserva como fuente** y no debe editarse manualmente en el código.

Para actualizar los datos si cambiara el Excel:

```bash
bun run convert
```

El script `scripts/convert-schedule.mts` genera de forma determinista `src/data/schedules.ts` (tipado con TypeScript). **No edites ese archivo generado.**

## Notas

- **Responsive y pensado para celular.** Diseño mobile-first, accesible con foco visible y respeta `prefers-reduced-motion`.
- **Sin backend.** Todo funciona localmente en el navegador.
- **Horarios post-medianoche.** Los viajes entre 00:00 y 03:59 pertenecen al día de servicio anterior y aparecen al final de la tabla.
- **Créditos:** Empresa de Transportes A. Buttini — Línea 544, San Rafael, Mendoza (Invierno 2026).
- **Licencia:** Ver `LICENSE.txt`.
