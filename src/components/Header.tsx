import { line } from "../data/schedules";
import { fill, LANGS, type Lang } from "../lib/i18n";
import { useLanguage } from "./LanguageProvider";

/** Sticky line-identity bar: amber stripe, 544 chip, line name, byline and the language switch. */
export function Header() {
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-paper/90 backdrop-blur">
      <div aria-hidden="true" className="h-[3px] bg-amber" />
      <div className="mx-auto flex h-14 w-full max-w-md items-center gap-3 px-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber font-display text-base font-extrabold leading-none text-ink">
          544
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-base font-extrabold leading-tight text-ink">
            {fill(t.header.title, { n: line.line })}
          </h1>
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-slate">
            {line.company} · {line.period}
          </p>
        </div>
        <div
          role="group"
          aria-label={t.header.languageLabel}
          className="ml-auto flex shrink-0 items-center rounded-md border border-hairline bg-card p-0.5"
        >
          {LANGS.map((code: Lang) => {
            const active = code === lang;
            return (
              <button
                key={code}
                type="button"
                aria-pressed={active}
                onClick={() => setLang(code)}
                className={`min-h-9 rounded px-2 font-mono text-xs font-bold uppercase transition-colors ${
                  active ? "bg-ink text-paper" : "text-slate hover:text-ink"
                }`}
              >
                {code}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
