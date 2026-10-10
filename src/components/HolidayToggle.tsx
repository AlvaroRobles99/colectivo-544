interface HolidayToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Plain-action holiday switch: it labels what it does and which table it shows. */
export function HolidayToggle({ checked, onChange }: HolidayToggleProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-card px-3 py-2">
      <label htmlFor="holiday-toggle" className="flex min-h-11 cursor-pointer flex-col justify-center">
        <span className="text-sm font-semibold text-ink">Hoy es feriado</span>
        <span className="text-xs text-slate">Muestra el cuadro de domingos</span>
      </label>
      <input
        id="holiday-toggle"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-6 w-6 shrink-0 cursor-pointer accent-amber"
      />
    </div>
  );
}
