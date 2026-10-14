import { BinaryChallenge } from './BinaryChallenge';
import { ClassificationChallenge } from './ClassificationChallenge';
import { MatchingChallenge } from './MatchingChallenge';
import { MultipleChoiceChallenge } from './MultipleChoiceChallenge';
import { OrderingChallenge } from './OrderingChallenge';
import { SingleChoiceChallenge } from './SingleChoiceChallenge';
import type { ChallengeViewRegistry } from './types';

/**
 * Registro de la interfaz: una vista por mecánica. Para añadir una mecánica
 * nueva se crea su componente y se registra aquí (TypeScript obliga a ello).
 * Ningún otro componente cambia.
 */
export const challengeViews: ChallengeViewRegistry = {
  binary: { View: BinaryChallenge, icon: 'swap', showsPrompt: true },
  'single-choice': { View: SingleChoiceChallenge, icon: 'target' },
  'multiple-choice': { View: MultipleChoiceChallenge, icon: 'check' },
  matching: { View: MatchingChallenge, icon: 'link' },
  ordering: { View: OrderingChallenge, icon: 'list' },
  classification: { View: ClassificationChallenge, icon: 'grid' },
};
