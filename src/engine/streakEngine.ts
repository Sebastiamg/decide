import type { ScoringConfig, StreakConfig } from '../types/config';

/** Racha tras responder: sube con cada acierto y se reinicia con un error o un tiempo agotado. */
export function nextStreak(current: number, correct: boolean): number {
  return correct ? current + 1 : 0;
}

/**
 * Pequeño premio por encadenar aciertos (a partir del segundo), con tope:
 * suma, pero nunca supera al de responder bien.
 */
export function streakBonus(streak: number, streaks: StreakConfig, scoring: ScoringConfig): number {
  if (!streaks.enabled || streak < 2) return 0;
  return Math.min(scoring.maxStreakBonus, (streak - 1) * scoring.streakBonusStep);
}

export function isStreakVisible(streak: number, streaks: StreakConfig): boolean {
  return streaks.enabled && streak >= streaks.showFrom;
}
