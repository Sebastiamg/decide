import { memo, useEffect, useRef, type CSSProperties } from 'react';
import { remainingMs, timerLevel } from '../../engine/timerEngine';
import type { TimerConfig } from '../../types/config';
import type { ChallengeTiming } from '../../types/game';
import { formatSeconds } from '../../utils/format';

interface TimerBarProps {
  limitMs: number;
  timing: ChallengeTiming;
  /** Solo corre en la fase activa y sin pausa. */
  running: boolean;
  config: TimerConfig;
}

/**
 * Barra de tensión: se vacía con una animación CSS (sin renders de React);
 * el número se actualiza por requestAnimationFrame solo cuando cambia la
 * décima, y el nivel (normal → aviso → peligro) cambia el color y el pulso.
 */
export const TimerBar = memo(function TimerBar({ limitMs, timing, running, config }: TimerBarProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const secondsRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const label = secondsRef.current;
    if (!root || !label) return;
    const paint = () => {
      const left = timing.activatedAt === null ? limitMs : remainingMs(timing, limitMs, performance.now());
      const text = formatSeconds(left);
      if (label.textContent !== text) label.textContent = text;
      const level = timerLevel(left / limitMs, config);
      if (root.dataset.level !== level) root.dataset.level = level;
    };
    paint();
    if (!running) return;
    let frame = requestAnimationFrame(function loop() {
      paint();
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, [running, timing, limitMs, config]);

  return (
    <div ref={rootRef} data-level="normal" className="flex items-center gap-3">
      <div className="timer-track flex-1" role="presentation">
        <div
          className="timer-fill"
          style={{ '--timer-duration': `${limitMs}ms`, '--timer-state': running ? 'running' : 'paused' } as CSSProperties}
        />
      </div>
      <p className="flex w-[4.2rem] items-baseline justify-end gap-0.5 font-display font-extrabold tabular-nums" aria-hidden="true">
        <span ref={secondsRef} className="timer-seconds inline-block text-xl">
          {formatSeconds(limitMs)}
        </span>
        <span className="text-xs text-muted">s</span>
      </p>
    </div>
  );
});
