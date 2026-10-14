import type { ClassificationChallenge } from '../../types/challenge';
import { shuffle } from '../../utils/random';
import { duplicateIds, type ChallengeDefinition } from './definition';

function grouped(challenge: ClassificationChallenge, placements: Readonly<Record<string, string>>): string[] {
  return challenge.categories.map((category) => {
    const members = challenge.items.filter((item) => placements[item.id] === category.id).map((item) => item.label);
    return `${category.label}: ${members.length > 0 ? members.join(', ') : '—'}`;
  });
}

export const classificationDefinition: ChallengeDefinition<'classification'> = {
  type: 'classification',
  instruction: (challenge, labels) => challenge.instruction ?? labels.instructionClassification,
  prepare: (challenge, random, shuffleOptions) => {
    const ids = challenge.items.map((i) => i.id);
    return { poolOrder: shuffleOptions ? shuffle(ids, random) : ids };
  },
  evaluate(challenge, answer) {
    const hits = challenge.items.filter((item) => answer.placements[item.id] === item.category).length;
    const correct = hits === challenge.items.length;
    return { correct, accuracy: correct ? 1 : 0, detail: { correctParts: hits, totalParts: challenge.items.length } };
  },
  describeAnswer: (challenge, answer) => grouped(challenge, answer.placements),
  describeSolution: (challenge) =>
    grouped(challenge, Object.fromEntries(challenge.items.map((item) => [item.id, item.category]))),
  check(challenge) {
    const problems: string[] = [];
    const categoryIds = challenge.categories.map((c) => c.id);
    if (categoryIds.length < 2) problems.push('necesita al menos 2 categorías');
    for (const item of challenge.items) {
      if (!categoryIds.includes(item.category)) problems.push(`"${item.id}" usa una categoría inexistente`);
    }
    const ids = [...categoryIds, ...challenge.items.map((i) => i.id)];
    if (duplicateIds(ids).length > 0) problems.push(`ids repetidos: ${duplicateIds(ids).join(', ')}`);
    return problems;
  },
};
