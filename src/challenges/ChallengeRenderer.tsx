import type { AnswerOf, ChallengeAnswer, ChallengeType, PlayableChallenge } from '../types/challenge';
import type { GameConfig } from '../types/config';
import type { ChallengePhase } from '../types/game';
import type { UiLabels } from '../types/labels';
import type { ChallengeResult } from '../types/results';
import { challengeViews } from './registry';
import type { ChallengeViewProps } from './types';

interface ChallengeRendererProps {
  playable: PlayableChallenge;
  phase: ChallengePhase;
  paused: boolean;
  result: ChallengeResult | null;
  labels: UiLabels;
  config: GameConfig;
  onSubmit: (answer: ChallengeAnswer) => void;
}

type CommonProps = Omit<ChallengeViewProps<ChallengeType>, 'challenge' | 'presentation' | 'onSubmit'>;

function renderTyped<T extends ChallengeType>(
  type: T,
  challenge: ChallengeViewProps<T>['challenge'],
  presentation: ChallengeViewProps<T>['presentation'],
  common: CommonProps,
  submit: (answer: ChallengeAnswer) => void,
) {
  const { View } = challengeViews[type];
  return (
    <View
      {...common}
      challenge={challenge}
      presentation={presentation}
      onSubmit={(value: AnswerOf<T>) => submit({ type, value } as ChallengeAnswer)}
    />
  );
}

/**
 * Decide QUÉ mecánica se muestra y nada más: no conoce cómo funciona ni
 * cómo se evalúa ninguna. Envuelve la respuesta como `{ type, value }`.
 */
export function ChallengeRenderer({ playable, onSubmit, ...common }: ChallengeRendererProps) {
  return renderTyped(playable.type, playable.challenge, playable.presentation, common, onSubmit);
}

export function mechanicShowsPrompt(type: ChallengeType): boolean {
  return challengeViews[type].showsPrompt === true;
}

export function mechanicIcon(type: ChallengeType) {
  return challengeViews[type].icon;
}
