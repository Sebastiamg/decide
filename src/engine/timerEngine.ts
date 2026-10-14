import type { Challenge } from '../types/challenge';
import type { TimerConfig } from '../types/config';
import type { ChallengeTiming } from '../types/game';

/**
 * Reloj de cada desafío, en funciones puras sobre `performance.now()`.
 * La UI no cuenta el tiempo: solo lo dibuja (CSS) y pide expirar.
 */

export const IDLE_TIMING: ChallengeTiming = { activatedAt: null, pausedAt: null, pausedTotal: 0 };

/** Tiempo disponible para un desafío (con la escala de la configuración). */
export function timeLimitMs(challenge: Challenge, timer: TimerConfig): number {
  const scale = timer.scale > 0 ? timer.scale : 1;
  return Math.round(challenge.timeLimit * 1000 * scale);
}

export function startTiming(clock: number): ChallengeTiming {
  return { activatedAt: clock, pausedAt: null, pausedTotal: 0 };
}

export function pauseTiming(timing: ChallengeTiming, clock: number): ChallengeTiming {
  return timing.pausedAt === null ? { ...timing, pausedAt: clock } : timing;
}

export function resumeTiming(timing: ChallengeTiming, clock: number): ChallengeTiming {
  if (timing.pausedAt === null) return timing;
  return { ...timing, pausedAt: null, pausedTotal: timing.pausedTotal + (clock - timing.pausedAt) };
}

/** Tiempo de juego consumido (sin contar pausas). */
export function elapsedMs(timing: ChallengeTiming, clock: number): number {
  if (timing.activatedAt === null) return 0;
  const end = timing.pausedAt ?? clock;
  return Math.max(0, end - timing.activatedAt - timing.pausedTotal);
}

export function remainingMs(timing: ChallengeTiming, limitMs: number, clock: number): number {
  return Math.max(0, limitMs - elapsedMs(timing, clock));
}

export type TimerLevel = 'normal' | 'warning' | 'danger';

export function timerLevel(remainingRatio: number, timer: TimerConfig): TimerLevel {
  if (remainingRatio <= timer.dangerRatio) return 'danger';
  if (remainingRatio <= timer.warningRatio) return 'warning';
  return 'normal';
}
