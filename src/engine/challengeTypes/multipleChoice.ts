import { formatLabel } from '../../utils/format';
import { shuffle } from '../../utils/random';
import { duplicateIds, type ChallengeDefinition } from './definition';
import { choiceLabel } from './singleChoice';

export const multipleChoiceDefinition: ChallengeDefinition<'multiple-choice'> = {
  type: 'multiple-choice',
  instruction(challenge, labels) {
    if (challenge.instruction) return challenge.instruction;
    return challenge.selection.mode === 'exact'
      ? formatLabel(labels.instructionMultipleExact, { count: challenge.selection.count })
      : labels.instructionMultipleAll;
  },
  prepare(challenge, random, shuffleOptions) {
    const ids = challenge.options.map((o) => o.id);
    return { optionOrder: shuffleOptions && challenge.shuffleOptions !== false ? shuffle(ids, random) : ids };
  },
  // Correcta solo si coincide exactamente el conjunto; el detalle dice cuántas acertó.
  evaluate(challenge, answer) {
    const expected = new Set(challenge.answers);
    const chosen = new Set(answer.optionIds);
    let hits = 0;
    let misses = 0;
    for (const id of chosen) {
      if (expected.has(id)) hits++;
      else misses++;
    }
    const correct = misses === 0 && hits === expected.size;
    return {
      correct,
      accuracy: correct ? 1 : 0,
      detail: { correctParts: hits, totalParts: expected.size, errors: misses },
    };
  },
  describeAnswer: (challenge, answer) => answer.optionIds.map((id) => choiceLabel(challenge.options, id)),
  describeSolution: (challenge) => challenge.answers.map((id) => choiceLabel(challenge.options, id)),
  check(challenge) {
    const problems: string[] = [];
    const ids = challenge.options.map((o) => o.id);
    const missing = challenge.answers.filter((id) => !ids.includes(id));
    if (missing.length > 0) problems.push(`respuestas que no son opciones: ${missing.join(', ')}`);
    if (duplicateIds(ids).length > 0) problems.push(`ids repetidos: ${duplicateIds(ids).join(', ')}`);
    if (challenge.answers.length === 0) problems.push('no tiene respuestas correctas');
    if (challenge.selection.mode === 'exact' && challenge.selection.count !== challenge.answers.length) {
      problems.push(`pide seleccionar ${challenge.selection.count} pero tiene ${challenge.answers.length} correctas`);
    }
    if (challenge.answers.length >= ids.length) problems.push('todas las opciones son correctas: no hay decisión');
    return problems;
  },
};
