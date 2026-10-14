import type { PlayableChallenge } from './challenge';
import type { ChallengeResult } from './results';

export type GameStatus = 'idle' | 'playing' | 'finished';

/**
 * Ciclo de cada desafío:
 * ready    → entra en pantalla; instrucción visible, reloj detenido, sin interacción.
 * active   → reloj en marcha; el estudiante responde.
 * feedback → respuesta evaluada; se muestra el resultado y se avanza solo.
 */
export type ChallengePhase = 'ready' | 'active' | 'feedback';

export interface ChallengeTiming {
  /** performance.now() al arrancar el reloj. */
  activatedAt: number | null;
  /** performance.now() al pausar (null si no está en pausa). */
  pausedAt: number | null;
  /** Milisegundos acumulados en pausa durante la fase active. */
  pausedTotal: number;
}

export interface GameState {
  status: GameStatus;
  phase: ChallengePhase;
  paused: boolean;
  /** Semilla de la partida: misma semilla = mismos desafíos y mismo orden. */
  seed: number;
  queue: readonly PlayableChallenge[];
  currentIndex: number;
  timing: ChallengeTiming;
  score: number;
  streak: number;
  maxStreak: number;
  results: readonly ChallengeResult[];
  /** Date.now() de inicio y fin de la partida. */
  startedAt: number | null;
  finishedAt: number | null;
}
