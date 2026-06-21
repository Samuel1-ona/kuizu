import { useState, useEffect, useRef, useCallback } from "react";
import { SECONDS_PER_QUESTION } from "../constants/config";

export function useTimer(active: boolean, onTimeUp: () => void) {
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  const reset = useCallback(() => setTimeLeft(SECONDS_PER_QUESTION), []);

  useEffect(() => {
    if (!active) return;
    setTimeLeft(SECONDS_PER_QUESTION);

    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id);
          onTimeUpRef.current();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [active]);

  const pct = (timeLeft / SECONDS_PER_QUESTION) * 100;
  const color = timeLeft > 10 ? "green" : timeLeft > 5 ? "yellow" : "red";

  return { timeLeft, pct, color, reset };
}
