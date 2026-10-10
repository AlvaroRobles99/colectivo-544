import { useEffect, useState } from "react";

/**
 * A clock that re-renders at most once per minute. The interval fires every
 * second, but returning the previous Date while the minute is unchanged lets
 * React bail out of the re-render, so countdowns and passed/upcoming splits
 * update only when their visible value can change.
 */
export function useNowMinute(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => {
      const tick = new Date();
      setNow((previous) =>
        previous.getHours() === tick.getHours() && previous.getMinutes() === tick.getMinutes()
          ? previous
          : tick,
      );
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return now;
}
