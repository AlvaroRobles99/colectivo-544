import { useEffect, useState } from "react";
import { DayTabs } from "./components/DayTabs";
import { DirectionSwitch } from "./components/DirectionSwitch";
import { Header } from "./components/Header";
import { HolidayToggle } from "./components/HolidayToggle";
import { ScheduleList } from "./components/ScheduleList";
import { Sign } from "./components/Sign";
import { StopPicker } from "./components/StopPicker";
import type { DayType, Direction } from "./data/schedules";
import { resolveDayType } from "./lib/dayType";
import { getServiceDate } from "./lib/serviceDay";

const DIRECTION_KEY = "colectivo-544:direction";
const STOP_KEY = "colectivo-544:stop";
const HOLIDAY_KEY = "colectivo-544:feriado";

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Storage can be unavailable (e.g. private mode); the app still works.
  }
}

function readDirection(): Direction {
  return readStorage(DIRECTION_KEY) === "vuelta" ? "vuelta" : "ida";
}

export default function App() {
  const [direction, setDirection] = useState<Direction>(readDirection);
  const [stop, setStop] = useState<string | null>(() => readStorage(STOP_KEY));
  const [holiday, setHoliday] = useState<boolean>(() => readStorage(HOLIDAY_KEY) === "true");
  const [dayType, setDayType] = useState<DayType>(() =>
    resolveDayType(getServiceDate(new Date()), readStorage(HOLIDAY_KEY) === "true"),
  );

  useEffect(() => {
    setDayType(resolveDayType(getServiceDate(new Date()), holiday));
  }, [holiday]);

  useEffect(() => writeStorage(DIRECTION_KEY, direction), [direction]);
  useEffect(() => writeStorage(STOP_KEY, stop), [stop]);
  useEffect(() => writeStorage(HOLIDAY_KEY, String(holiday)), [holiday]);

  const serviceDate = getServiceDate(new Date());
  const detectedDayType = resolveDayType(serviceDate, false);
  const weekdayLabel = WEEKDAYS[serviceDate.getDay()];

  return (
    <div className="min-h-dvh bg-paper">
      <Header />
      <main className="mx-auto w-full max-w-md space-y-3 px-4 pb-16 pt-4">
        <DayTabs
          value={dayType}
          onChange={setDayType}
          holiday={holiday}
          detected={detectedDayType}
          weekdayLabel={weekdayLabel}
        />
        <HolidayToggle checked={holiday} onChange={setHoliday} />
        <DirectionSwitch value={direction} onChange={setDirection} />
        <Sign direction={direction} dayType={dayType} stop={stop} />
        <StopPicker direction={direction} dayType={dayType} selected={stop} onSelect={setStop} />
        {stop !== null && <ScheduleList direction={direction} dayType={dayType} stop={stop} />}
      </main>
    </div>
  );
}