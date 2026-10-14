import type { BinaryChallenge } from '../../types/challenge';
import { duplicateIds, type ChallengeDefinition } from './definition';

function optionText(challenge: BinaryChallenge, optionId: string): string {
  const option = challenge.options.find((o) => o.id === optionId);
  if (!option) return optionId;
  return option.detail ? `${option.label} · ${option.detail}` : option.label;
}

export const binaryDefinition: ChallengeDefinition<'binary'> = {
  type: 'binary',
  instruction(challenge, labels) {
    if (challenge.instruction) return challenge.instruction;
    switch (challenge.variant) {
      case 'true-false':
        return labels.instructionTrueFalse;
      case 'yes-no':
        return labels.instructionYesNo;
      case 'correct-incorrect':
        return labels.instructionCorrectIncorrect;
      case 'a-b':
        return labels.instructionAB;
      case 'custom':
        return labels.instructionBinary;
    }
  },
  // Los lados los decide el contenido: el motor nunca asume "derecha = correcto".
  prepare: () => ({ sides: 'as-authored' }),
  evaluate(challenge, answer) {
    const correct = answer.optionId === challenge.answer;
    return { correct, accuracy: correct ? 1 : 0 };
  },
  describeAnswer: (challenge, answer) => [optionText(challenge, answer.optionId)],
  describeSolution: (challenge) => [optionText(challenge, challenge.answer)],
  check(challenge) {
    const problems: string[] = [];
    const ids = challenge.options.map((o) => o.id);
    if (!ids.includes(challenge.answer)) problems.push(`la respuesta "${challenge.answer}" no es una de sus opciones`);
    if (duplicateIds(ids).length > 0) problems.push('las dos opciones tienen el mismo id');
    return problems;
  },
};
