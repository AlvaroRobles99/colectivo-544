import { terminals, type Direction } from "../data/schedules";

const ORDER: Direction[] = ["ida", "vuelta"];

/** "Av. Gral. Paz esq. Granaderos" reads long in a segmented control; shorten only the corner suffix. */
function shortStop(stop: string): string {
  return stop.replace(" esq. Granaderos", "");
}

interface DirectionSwitchProps {
  value: Direction;
  onChange: (direction: Direction) => void;
}

/** Segmented ida/vuelta selector; each option names the route it travels. */
export function DirectionSwitch({ value, onChange }: DirectionSwitchProps) {
  return (
    <section aria-label="Dirección del viaje">
      <div
        role="group"
        aria-label="Elegir la dirección"
        className="flex rounded-lg border border-hairline bg-card p-1"
      >
        {ORDER.map((direction) => {
          const active = direction === value;
          const { from, to } = terminals[direction];
          return (
            <button
              key={direction}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(direction)}
              className={`flex min-h-11 flex-1 flex-col justify-center rounded-md px-2 py-1.5 text-left transition-colors ${
                active ? "bg-ink text-paper" : "text-slate hover:text-ink"
              }`}
            >
              <span className="font-display text-sm font-bold">{direction === "ida" ? "Ida" : "Vuelta"}</span>
              <span className="font-mono text-[10px] leading-tight opacity-80">
                {shortStop(from)} → {shortStop(to)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
