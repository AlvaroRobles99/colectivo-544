import { line } from "./data/schedules";

// Placeholder identity panel. The real UI (day/direction controls, next-bus
// countdown, full schedule table) lands in T4.
export default function App() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate">
        {line.period}
      </p>
      <h1 className="mt-2 font-display text-4xl font-extrabold text-ink">
        Colectivo {line.line}
      </h1>
      <p className="mt-1 text-slate">{line.company}</p>
    </main>
  );
}
