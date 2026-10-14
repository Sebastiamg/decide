import type { UiLabels } from '../../types/labels';
import type { ChallengeResult } from '../../types/results';
import { formatLabel } from '../../utils/format';

/** Textos del resultado de un desafío (feedback, anuncios y revisión). */

export function precisionText(result: ChallengeResult, labels: UiLabels): string | null {
  if (!result.detail) return null;
  const template = result.type === 'matching' ? labels.connectionsDetail : labels.precision;
  return formatLabel(template, { correct: result.detail.correctParts, total: result.detail.totalParts });
}

/** Mensaje principal del resultado: frases neutras, nunca humilla. "Casi." solo si casi lo era. */
export function feedbackMessage(result: ChallengeResult, labels: UiLabels): string {
  if (result.outcome === 'correct') return labels.correctTitle;
  if (result.outcome === 'timeout') return labels.timeoutTitle;
  const detail = result.detail;
  if (detail && detail.totalParts > 0 && detail.correctParts / detail.totalParts >= 0.5) return labels.almostMessage;
  const messages = labels.incorrectMessages;
  return messages[result.index % Math.max(1, messages.length)] ?? '';
}
