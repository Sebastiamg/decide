import { binaryDefinition } from './binary';
import { classificationDefinition } from './classification';
import type { ChallengeDefinitions } from './definition';
import { matchingDefinition } from './matching';
import { multipleChoiceDefinition } from './multipleChoice';
import { orderingDefinition } from './ordering';
import { singleChoiceDefinition } from './singleChoice';

/**
 * Registro del motor: una entrada por mecánica. El tipo es exhaustivo:
 * si se añade una mecánica a `Challenge`, TypeScript exige registrarla aquí.
 */
export const challengeDefinitions: ChallengeDefinitions = {
  binary: binaryDefinition,
  'single-choice': singleChoiceDefinition,
  'multiple-choice': multipleChoiceDefinition,
  matching: matchingDefinition,
  ordering: orderingDefinition,
  classification: classificationDefinition,
};
