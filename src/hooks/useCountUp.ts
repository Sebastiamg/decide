import { useEffect, useState } from 'react';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/** Cuenta de 0 al valor final (recompensa visual). Sin animación si se pide movimiento reducido. */
export function useCountUp(target: number, durationMs = 900, delayMs = 0): number {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));

  useEffect(() => {
    if (prefersReducedMotion() || target === 0) {
      setValue(target);
      return;
    }
    let frame = 0;
    const startAt = performance.now() + delayMs;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - startAt) / durationMs));
      setValue(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, delayMs]);

  return value;
}
