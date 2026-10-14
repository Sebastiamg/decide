import type { OrderingChallenge } from '../../types/challenge';
import { shuffleChanged } from '../../utils/random';
import { duplicateIds, type ChallengeDefinition } from './definition';

function numbered(challenge: OrderingChallenge, order: readonly string[]): string[] {
  return order.map((id, index) => `${index + 1}. ${challenge.items.find((i) => i.id === id)?.label ?? id}`);
}

export const orderingDefinition: ChallengeDefinition<'ordering'> = {
  type: 'ordering',
  instruction: (challenge, labels) => challenge.instruction ?? labels.instructionOrdering,
  // Siempre mezclado (aunque shuffleOptions sea false): si no, no habría nada que ordenar.
  prepare: (challenge, random) => ({ initialOrder: shuffleChanged(challenge.items.map((i) => i.id), random) }),
  evaluate(challenge, answer) {
    const hits = challenge.items.filter((item, index) => answer.order[index] === item.id).length;
    const correct = hits === challenge.items.length;
    return { correct, accuracy: correct ? 1 : 0, detail: { correctParts: hits, totalParts: challenge.items.length } };
  },
  describeAnswer: (challenge, answer) => numbered(challenge, answer.order),
  describeSolution: (challenge) => numbered(challenge, challenge.items.map((i) => i.id)),
  check(challenge) {
    const problems: string[] = [];
    if (challenge.items.length < 2) problems.push('necesita al menos 2 elementos');
    const ids = challenge.items.map((i) => i.id);
    if (duplicateIds(ids).length > 0) problems.push(`ids repetidos: ${duplicateIds(ids).join(', ')}`);
    return problems;
  },
};
