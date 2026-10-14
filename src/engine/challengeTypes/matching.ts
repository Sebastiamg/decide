import type { MatchingChallenge, MatchPair } from '../../types/challenge';
import { shuffle } from '../../utils/random';
import { duplicateIds, type ChallengeDefinition } from './definition';

/** Cada conexión equivocada (modo immediate) resta un 15 % de la puntuación, hasta un mínimo del 50 %. */
const ERROR_PENALTY = 0.15;
const MIN_ACCURACY = 0.5;

function labelOf(challenge: MatchingChallenge, side: 'left' | 'right', id: string): string {
  return challenge[side].find((item) => item.id === id)?.label ?? id;
}

function pairText(challenge: MatchingChallenge, [left, right]: MatchPair): string {
  return `${labelOf(challenge, 'left', left)} → ${labelOf(challenge, 'right', right)}`;
}

export const matchingDefinition: ChallengeDefinition<'matching'> = {
  type: 'matching',
  instruction: (challenge, labels) => challenge.instruction ?? labels.instructionMatching,
  /**
   * Baraja ambas columnas y se queda con la disposición que menos parejas deja
   * "alineadas" en la misma fila (si no, unir sería trivial).
   */
  prepare(challenge, random, shuffleOptions) {
    const leftIds = challenge.left.map((i) => i.id);
    const rightIds = challenge.right.map((i) => i.id);
    if (!shuffleOptions) return { leftOrder: leftIds, rightOrder: rightIds };
    const partner = new Map(challenge.pairs.map(([l, r]) => [l, r]));
    let best = { leftOrder: leftIds, rightOrder: rightIds, aligned: Number.POSITIVE_INFINITY };
    for (let attempt = 0; attempt < 8 && best.aligned > 0; attempt++) {
      const leftOrder = shuffle(leftIds, random);
      const rightOrder = shuffle(rightIds, random);
      const aligned = leftOrder.filter((id, row) => partner.get(id) === rightOrder[row]).length;
      if (aligned < best.aligned) best = { leftOrder, rightOrder, aligned };
    }
    return { leftOrder: best.leftOrder, rightOrder: best.rightOrder };
  },
  evaluate(challenge, answer) {
    const solution = new Map(challenge.pairs.map(([l, r]) => [l, r]));
    const hits = answer.pairs.filter(([l, r]) => solution.get(l) === r).length;
    const correct = hits === challenge.pairs.length && answer.pairs.length === challenge.pairs.length;
    return {
      correct,
      accuracy: correct ? Math.max(MIN_ACCURACY, 1 - ERROR_PENALTY * answer.errors) : 0,
      detail: { correctParts: hits, totalParts: challenge.pairs.length, errors: answer.errors },
    };
  },
  describeAnswer: (challenge, answer) => answer.pairs.map((pair) => pairText(challenge, pair)),
  describeSolution: (challenge) => challenge.pairs.map((pair) => pairText(challenge, pair)),
  check(challenge) {
    const problems: string[] = [];
    const leftIds = challenge.left.map((i) => i.id);
    const rightIds = challenge.right.map((i) => i.id);
    if (challenge.pairs.length !== leftIds.length) problems.push('cada elemento de la izquierda debe tener una pareja');
    for (const [l, r] of challenge.pairs) {
      if (!leftIds.includes(l)) problems.push(`"${l}" no está en la columna izquierda`);
      if (!rightIds.includes(r)) problems.push(`"${r}" no está en la columna derecha`);
    }
    const usedRight = challenge.pairs.map(([, r]) => r);
    if (duplicateIds(usedRight).length > 0) problems.push('un elemento de la derecha tiene dos parejas');
    if (duplicateIds([...leftIds, ...rightIds]).length > 0) problems.push('ids repetidos entre columnas');
    return problems;
  },
};
