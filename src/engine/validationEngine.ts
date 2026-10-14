import type {
  AnswerOf,
  Challenge,
  ChallengeAnswer,
  ChallengeOf,
  ChallengeType,
  PlayableChallenge,
} from '../types/challenge';
import type { UiLabels } from '../types/labels';
import type { Evaluation } from '../types/results';
import type { Random } from '../utils/random';
import { challengeDefinitions } from './challengeTypes';

/*
 * Punto único de despacho por mecánica. La UI nunca sabe cómo se evalúa una
 * respuesta: solo entrega `{ type, value }` y recibe una `Evaluation`.
 * (Las funciones genéricas internas resuelven la "unión correlacionada":
 * el desafío y la respuesta son siempre del mismo tipo.)
 */

function evaluateTyped<T extends ChallengeType>(type: T, challenge: ChallengeOf<T>, value: AnswerOf<T>): Evaluation {
  return challengeDefinitions[type].evaluate(challenge, value);
}

/** null si la respuesta no corresponde a la mecánica del desafío. */
export function evaluateAnswer(playable: PlayableChallenge, answer: ChallengeAnswer): Evaluation | null {
  if (playable.type !== answer.type) return null;
  return evaluateTyped(playable.type, playable.challenge, answer.value);
}

function describeTyped<T extends ChallengeType>(type: T, challenge: ChallengeOf<T>, value: AnswerOf<T>): readonly string[] {
  return challengeDefinitions[type].describeAnswer(challenge, value);
}

export function describeAnswer(playable: PlayableChallenge, answer: ChallengeAnswer | null): readonly string[] {
  if (!answer || playable.type !== answer.type) return [];
  return describeTyped(playable.type, playable.challenge, answer.value);
}

function solutionTyped<T extends ChallengeType>(type: T, challenge: ChallengeOf<T>): readonly string[] {
  return challengeDefinitions[type].describeSolution(challenge);
}

export function describeSolution(playable: PlayableChallenge): readonly string[] {
  return solutionTyped(playable.type, playable.challenge);
}

function instructionTyped<T extends ChallengeType>(type: T, challenge: ChallengeOf<T>, labels: UiLabels): string {
  return challengeDefinitions[type].instruction(challenge, labels);
}

export function instructionFor(challenge: Challenge, labels: UiLabels): string {
  return instructionTyped(challenge.type, challenge, labels);
}

function prepareTyped<T extends ChallengeType>(
  type: T,
  challenge: ChallengeOf<T>,
  random: Random,
  shuffle: boolean,
): PlayableChallenge {
  const presentation = challengeDefinitions[type].prepare(challenge, random, shuffle);
  return { type, challenge, presentation } as PlayableChallenge;
}

/** Prepara un desafío para jugarlo (orden de opciones, columnas... de esta partida). */
export function prepareChallenge(challenge: Challenge, random: Random, shuffle: boolean): PlayableChallenge {
  return prepareTyped(challenge.type, challenge, random, shuffle);
}

function checkTyped<T extends ChallengeType>(type: T, challenge: ChallengeOf<T>): readonly string[] {
  return challengeDefinitions[type].check(challenge);
}

/** Problemas de contenido de un banco (ids repetidos, respuestas imposibles...). */
export function checkBank(challenges: readonly Challenge[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const challenge of challenges) {
    if (seen.has(challenge.id)) problems.push(`[${challenge.id}] id de desafío repetido`);
    seen.add(challenge.id);
    if (!(challenge.timeLimit > 0)) problems.push(`[${challenge.id}] timeLimit debe ser mayor que 0`);
    for (const problem of checkTyped(challenge.type, challenge)) problems.push(`[${challenge.id}] ${problem}`);
  }
  return problems;
}
