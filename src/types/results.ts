import type { ChallengeAnswer, ChallengeType, Difficulty } from './challenge';

export type Outcome = 'correct' | 'incorrect' | 'timeout';

/** Precisión parcial para el feedback: "2 / 3 correctas", "3 conexiones · 1 error". */
export interface EvaluationDetail {
  correctParts: number;
  totalParts: number;
  /** Intentos equivocados rechazados durante el desafío (p. ej. líneas en modo immediate). */
  errors?: number;
}

/** Resultado de validar una respuesta (independiente de la mecánica). */
export interface Evaluation {
  /** Totalmente correcta. Solo así se puntúa. */
  correct: boolean;
  /** 0..1. Multiplica la puntuación de una respuesta correcta con errores intermedios. */
  accuracy: number;
  detail?: EvaluationDetail;
}

export interface ScoreBreakdown {
  base: number;
  speedBonus: number;
  streakBonus: number;
  total: number;
}

/** Resultado normalizado de un desafío: igual para todas las mecánicas. */
export interface ChallengeResult {
  challengeId: string;
  /** Posición en la partida (0..n-1). */
  index: number;
  type: ChallengeType;
  topic?: string;
  difficulty?: Difficulty;
  outcome: Outcome;
  correct: boolean;
  accuracy: number;
  detail?: EvaluationDetail;
  score: ScoreBreakdown;
  streakAfter: number;
  timeLimitMs: number;
  timeSpentMs: number;
  timeRemainingMs: number;
  /** null si se agotó el tiempo sin responder. */
  answer: ChallengeAnswer | null;
}

export interface BreakdownRow {
  total: number;
  correct: number;
  accuracy: number;
  averageTimeMs: number;
}

/** Informe de la partida: lo que necesitaría un futuro panel docente. */
export interface GameReport {
  activityId: string;
  total: number;
  correct: number;
  incorrect: number;
  timeouts: number;
  accuracy: number;
  score: number;
  maxStreak: number;
  /** Tiempo medio de respuesta (desafíos respondidos). */
  averageTimeMs: number;
  durationMs: number;
  byType: Readonly<Partial<Record<ChallengeType, BreakdownRow>>>;
  byTopic: Readonly<Record<string, BreakdownRow>>;
  failedChallengeIds: readonly string[];
}
