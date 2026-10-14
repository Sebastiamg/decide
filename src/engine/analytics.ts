import type { ChallengeType } from '../types/challenge';
import type { GameState } from '../types/game';
import type { BreakdownRow, ChallengeResult, GameReport } from '../types/results';

function summarize(results: readonly ChallengeResult[]): BreakdownRow {
  const answered = results.filter((r) => r.outcome !== 'timeout');
  const correct = results.filter((r) => r.correct).length;
  return {
    total: results.length,
    correct,
    accuracy: results.length > 0 ? correct / results.length : 0,
    averageTimeMs: answered.length > 0 ? answered.reduce((sum, r) => sum + r.timeSpentMs, 0) / answered.length : 0,
  };
}

/**
 * Informe de la partida. Contiene lo necesario para un futuro panel docente:
 * precisión, tiempos, fallos por mecánica y por tema, desafíos fallados.
 */
export function buildReport(activityId: string, state: GameState): GameReport {
  const { results } = state;
  const all = summarize(results);
  const byType: Partial<Record<ChallengeType, BreakdownRow>> = {};
  for (const type of new Set(results.map((r) => r.type))) {
    byType[type] = summarize(results.filter((r) => r.type === type));
  }
  const byTopic: Record<string, BreakdownRow> = {};
  for (const topic of new Set(results.map((r) => r.topic).filter((t): t is string => Boolean(t)))) {
    byTopic[topic] = summarize(results.filter((r) => r.topic === topic));
  }
  return {
    activityId,
    total: results.length,
    correct: all.correct,
    incorrect: results.filter((r) => r.outcome === 'incorrect').length,
    timeouts: results.filter((r) => r.outcome === 'timeout').length,
    accuracy: all.accuracy,
    score: state.score,
    maxStreak: state.maxStreak,
    averageTimeMs: all.averageTimeMs,
    durationMs: state.startedAt && state.finishedAt ? state.finishedAt - state.startedAt : 0,
    byType,
    byTopic,
    failedChallengeIds: results.filter((r) => !r.correct).map((r) => r.challengeId),
  };
}
