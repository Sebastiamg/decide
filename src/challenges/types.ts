import type { ComponentType } from 'react';
import type { IconName } from '../components/ui/Icon';
import type { AnswerOf, ChallengeOf, ChallengeType, PresentationOf } from '../types/challenge';
import type { GameConfig } from '../types/config';
import type { ChallengePhase } from '../types/game';
import type { UiLabels } from '../types/labels';
import type { ChallengeResult } from '../types/results';

/**
 * Contrato común de TODAS las mecánicas en la interfaz. Cada vista:
 * - solo acepta interacción en la fase `active` (y sin pausa);
 * - entrega UNA respuesta con `onSubmit` (el motor la valida, no la vista);
 * - en `feedback` usa `result` para revelar aciertos y errores.
 */
export interface ChallengeViewProps<T extends ChallengeType> {
  challenge: ChallengeOf<T>;
  presentation: PresentationOf<T>;
  phase: ChallengePhase;
  paused: boolean;
  result: ChallengeResult | null;
  labels: UiLabels;
  config: GameConfig;
  onSubmit: (value: AnswerOf<T>) => void;
}

export interface ChallengeViewEntry<T extends ChallengeType> {
  View: ComponentType<ChallengeViewProps<T>>;
  /** Pictograma de la mecánica junto a la instrucción (reconocerla de un vistazo). */
  icon: IconName;
  /** La propia mecánica muestra el enunciado (p. ej. la tarjeta del swipe). */
  showsPrompt?: boolean;
}

/** Registro exhaustivo: añadir una mecánica obliga a registrar su vista. */
export type ChallengeViewRegistry = { [T in ChallengeType]: ChallengeViewEntry<T> };

/** Respuesta del estudiante para esta mecánica (null si no respondió). */
export function answerFrom<T extends ChallengeType>(result: ChallengeResult | null, type: T): AnswerOf<T> | null {
  const answer = result?.answer;
  if (!answer || answer.type !== type) return null;
  return answer.value as AnswerOf<T>;
}
