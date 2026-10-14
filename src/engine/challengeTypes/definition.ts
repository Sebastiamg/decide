import type { AnswerOf, ChallengeOf, ChallengeType, PresentationOf } from '../../types/challenge';
import type { UiLabels } from '../../types/labels';
import type { Evaluation } from '../../types/results';
import type { Random } from '../../utils/random';

/**
 * Contrato que cumple cada mecánica en el MOTOR (TypeScript puro, sin UI).
 * La parte visual vive en src/challenges/ y se registra aparte.
 */
export interface ChallengeDefinition<T extends ChallengeType> {
  type: T;
  /** Instrucción automática si el contenido no define una ("SELECCIONA 3"). */
  instruction(challenge: ChallengeOf<T>, labels: UiLabels): string;
  /** Orden de presentación para esta partida (barajado con la semilla). */
  prepare(challenge: ChallengeOf<T>, random: Random, shuffle: boolean): PresentationOf<T>;
  /** Validación pura de una respuesta. */
  evaluate(challenge: ChallengeOf<T>, answer: AnswerOf<T>): Evaluation;
  /** Respuesta del estudiante en texto (revisión). */
  describeAnswer(challenge: ChallengeOf<T>, answer: AnswerOf<T>): readonly string[];
  /** Solución en texto ("La respuesta correcta era…"). */
  describeSolution(challenge: ChallengeOf<T>): readonly string[];
  /** Problemas del contenido (se avisan en desarrollo). */
  check(challenge: ChallengeOf<T>): readonly string[];
}

export type ChallengeDefinitions = { [T in ChallengeType]: ChallengeDefinition<T> };

/** Comprobaciones comunes de identificadores. */
export function duplicateIds(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates];
}
