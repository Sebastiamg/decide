import type { ScoringConfig, StreakConfig } from '../types/config';
import type { Evaluation, ScoreBreakdown } from '../types/results';
import { clamp } from '../utils/format';
import { streakBonus } from './streakEngine';

export const ZERO_SCORE: ScoreBreakdown = { base: 0, speedBonus: 0, streakBonus: 0, total: 0 };

interface ScoreInput {
  evaluation: Evaluation;
  timeRemainingMs: number;
  timeLimitMs: number;
  /** Racha DESPUÉS de esta respuesta. */
  streak: number;
  timed: boolean;
  scoring: ScoringConfig;
  streaks: StreakConfig;
}

/**
 * Precisión antes que velocidad: una respuesta incorrecta vale 0, aunque
 * se haya dado en 0,3 s. Solo una respuesta correcta suma la base y,
 * además, un bonus proporcional al tiempo que sobró (lineal: responder
 * al instante ≈ +50, al final ≈ +0). Si hubo intentos fallidos intermedios
 * (precisión < 1), base y bonus se reducen en esa proporción.
 */
export function scoreChallenge(input: ScoreInput): ScoreBreakdown {
  const { evaluation, scoring } = input;
  if (!evaluation.correct) return ZERO_SCORE;
  const speedRatio = input.timed && input.timeLimitMs > 0 ? clamp(input.timeRemainingMs / input.timeLimitMs, 0, 1) : 0;
  const base = Math.round(scoring.baseCorrect * evaluation.accuracy);
  const speed = Math.round(scoring.maxSpeedBonus * speedRatio * evaluation.accuracy);
  const bonus = streakBonus(input.streak, input.streaks, scoring);
  return { base, speedBonus: speed, streakBonus: bonus, total: base + speed + bonus };
}
