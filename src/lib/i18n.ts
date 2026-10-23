import { DAY_TYPE_LABELS, DAY_TYPE_SHORT_LABELS } from "./dayType";

export type Lang = "es" | "en";

export const LANGS: readonly Lang[] = ["es", "en"] as const;

/** Spanish is the site's default; the choice persists per browser. */
export const DEFAULT_LANG: Lang = "es";

/**
 * The Spanish dictionary is the source of truth for the shape: `en` is typed
 * against it, so a missing or extra English key fails `tsc`.
 */
const es = {
  header: {
    title: "Colectivo {n}",
    languageLabel: "Idioma",
  },
  theme: {
    system: "automático",
    light: "claro",
    dark: "oscuro",
    action: "Tema: {current}. Cambiar a {next}.",
  },
  dayTabs: {
    sectionLabel: "Día del servicio",
    groupLabel: "Elegir el cuadro de horarios",
    captionHoliday: "Feriado activo: se muestra el cuadro de domingos y feriados.",
    captionToday: "Hoy es {weekday} — cuadro de {day}.",
    captionOther: "Estás viendo otro día.",
  },
  holiday: {
    label: "Hoy es feriado",
    hint: "Muestra el cuadro de domingos",
  },
  direction: {
    sectionLabel: "Dirección del viaje",
    groupLabel: "Elegir la dirección",
    ida: "Ida",
    vuelta: "Vuelta",
  },
  sign: {
    sectionLabel: "Próximo colectivo",
    emptyStopTitle: "SELECCIONÁ TU PARADA",
    emptyStopBody: "Elegí una parada y acá aparece el próximo colectivo.",
    noServiceTitle: "SIN SERVICIO",
    noServiceBody: "No hay colectivos en esta parada hoy.",
    doneTitle: "NO QUEDAN MÁS SERVICIOS HOY",
    nextDayLead: "Primera salida del próximo día:",
    nextDayTail: "cuadro de {day}.",
    upcomingLabel: "PRÓXIMO",
    countdownNow: "AHORA",
    countdownIn: "EN {n} MIN",
  },
  scheduleList: {
    sectionLabel: "Horarios del día",
    headingLabel: "Horarios",
    emptyTitle: "Sin servicios hoy en esta parada",
    emptyBody: "Probá con otra dirección u otro día.",
    departuresOne: "salida",
    departuresOther: "salidas",
    hourSuffix: " h",
    noteLegends: {
      "HASTA EL MATADERO": "El viaje termina en el Matadero / Salto de las Rosas",
    },
  },
  stopPicker: {
    sectionLabel: "Elegir parada",
    fieldLabel: "Parada",
    changeLabel: "Cambiar",
    changeAria: "Cambiar parada. Parada elegida: {stop}",
    noneValue: "ninguna",
    searchLabel: "Buscar parada",
    searchPlaceholder: "Buscar parada…",
    noMatches: "No hay paradas que coincidan",
    noService: "Sin servicio",
  },
  dayLabels: DAY_TYPE_LABELS,
  dayShortLabels: DAY_TYPE_SHORT_LABELS,
  /** Indexed by `Date#getDay()` (0 = Sunday). */
  weekdays: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
};

export type Dictionary = typeof es;

const en: Dictionary = {
  header: {
    title: "Bus {n}",
    languageLabel: "Language",
  },
  theme: {
    system: "automatic",
    light: "light",
    dark: "dark",
    action: "Theme: {current}. Switch to {next}.",
  },
  dayTabs: {
    sectionLabel: "Service day",
    groupLabel: "Choose the schedule table",
    captionHoliday: "Holiday mode: showing the Sunday and holiday schedule.",
    captionToday: "Today is {weekday} — {day} schedule.",
    captionOther: "You are viewing a different day.",
  },
  holiday: {
    label: "Today is a holiday",
    hint: "Shows the Sunday and holiday schedule",
  },
  direction: {
    sectionLabel: "Travel direction",
    groupLabel: "Choose the direction",
    ida: "Outbound",
    vuelta: "Return",
  },
  sign: {
    sectionLabel: "Next bus",
    emptyStopTitle: "PICK YOUR STOP",
    emptyStopBody: "Choose a stop and the next bus will show up here.",
    noServiceTitle: "NO SERVICE",
    noServiceBody: "No buses at this stop today.",
    doneTitle: "NO MORE DEPARTURES TODAY",
    nextDayLead: "First departure of the next day:",
    nextDayTail: "{day} schedule.",
    upcomingLabel: "NEXT",
    countdownNow: "NOW",
    countdownIn: "IN {n} MIN",
  },
  scheduleList: {
    sectionLabel: "Today's schedule",
    headingLabel: "Schedule",
    emptyTitle: "No service today at this stop",
    emptyBody: "Try another direction or another day.",
    departuresOne: "departure",
    departuresOther: "departures",
    hourSuffix: " hrs",
    noteLegends: {
      "HASTA EL MATADERO": "The trip ends at Matadero / Salto de las Rosas",
    },
  },
  stopPicker: {
    sectionLabel: "Choose a stop",
    fieldLabel: "Stop",
    changeLabel: "Change",
    changeAria: "Change stop. Selected stop: {stop}",
    noneValue: "none",
    searchLabel: "Search stop",
    searchPlaceholder: "Search stop…",
    noMatches: "No stops match",
    noService: "No service",
  },
  dayLabels: {
    habiles: "Weekdays",
    sabados: "Saturdays",
    domingos: "Sundays and holidays",
  },
  dayShortLabels: {
    habiles: "Weekdays",
    sabados: "Saturdays",
    domingos: "Sun & hol.",
  },
  weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

export const dictionaries: Record<Lang, Dictionary> = { es, en };

export function isLang(value: unknown): value is Lang {
  return value === "es" || value === "en";
}

/**
 * First-visit detection: the browser's first language preference decides
 * (English wins, everything else falls back to Spanish). A manual choice
 * overrides this by persisting `colectivo-544:lang`.
 */
export function detectLang(locales: readonly string[]): Lang {
  const first = locales[0];
  return first !== undefined && first.toLowerCase().startsWith("en") ? "en" : DEFAULT_LANG;
}

/** Replace `{name}` placeholders in a dictionary string. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match,
  );
}
