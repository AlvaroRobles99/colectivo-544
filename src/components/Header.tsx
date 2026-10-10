import { line } from "../data/schedules";

/** Sticky line-identity bar: amber stripe, 544 chip, line name and byline. */
export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-paper/90 backdrop-blur">
      <div aria-hidden="true" className="h-[3px] bg-amber" />
      <div className="mx-auto flex h-14 w-full max-w-md items-center gap-3 px-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber font-display text-base font-extrabold leading-none text-ink">
          544
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-base font-extrabold leading-tight text-ink">
            Colectivo {line.line}
          </h1>
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-slate">
            {line.company} · {line.period}
          </p>
        </div>
      </div>
    </header>
  );
}
