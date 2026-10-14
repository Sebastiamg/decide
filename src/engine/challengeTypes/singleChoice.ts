import type { ChoiceOption } from '../../types/challenge';
import { shuffle } from '../../utils/random';
import { duplicateIds, type ChallengeDefinition } from './definition';

export function choiceLabel(options: readonly ChoiceOption[], id: string): string {
  const option = options.find((o) => o.id === id);
  if (!option) return id;
  const text = option.symbol ? `${option.symbol} ${option.label}` : option.label;
  return option.detail ? `${text} · ${option.detail}` : text;
}

export const singleChoiceDefinition: ChallengeDefinition<'single-choice'> = {
  type: 'single-choice',
  instruction(challenge, labels) {
    if (challenge.instruction) return challenge.instruction;
    return challenge.layout === 'tiles' ? labels.instructionObserve : labels.instructionSingle;
  },
  prepare(challenge, random, shuffleOptions) {
    const ids = challenge.options.map((o) => o.id);
    return { optionOrder: shuffleOptions && challenge.shuffleOptions !== false ? shuffle(ids, random) : ids };
  },
  evaluate(challenge, answer) {
    const correct = answer.optionId === challenge.answer;
    return { correct, accuracy: correct ? 1 : 0 };
  },
  describeAnswer: (challenge, answer) => [choiceLabel(challenge.options, answer.optionId)],
  describeSolution: (challenge) => [choiceLabel(challenge.options, challenge.answer)],
  check(challenge) {
    const problems: string[] = [];
    const ids = challenge.options.map((o) => o.id);
    if (ids.length < 2) problems.push('necesita al menos 2 opciones');
    if (!ids.includes(challenge.answer)) problems.push(`la respuesta "${challenge.answer}" no es una de sus opciones`);
    if (duplicateIds(ids).length > 0) problems.push(`ids repetidos: ${duplicateIds(ids).join(', ')}`);
    return problems;
  },
};
