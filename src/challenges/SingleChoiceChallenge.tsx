import { useMemo, useState } from 'react';
import { Icon } from '../components/ui/Icon';
import type { ChoiceOption } from '../types/challenge';
import { digitIndex, useKeyboard } from './shared/useKeyboard';
import { answerFrom, type ChallengeViewProps } from './types';

export function orderedOptions(options: readonly ChoiceOption[], order: readonly string[]): ChoiceOption[] {
  const byId = new Map(options.map((o) => [o.id, o]));
  return order.map((id) => byId.get(id)).filter((o): o is ChoiceOption => Boolean(o));
}

const layouts = {
  list: 'grid grid-cols-1 gap-2.5',
  grid: 'grid grid-cols-1 gap-2.5 sm:grid-cols-2',
  tiles: 'grid grid-cols-3 gap-2.5',
} as const;

/** Un toque y listo: la selección es inmediata (también con las teclas 1–9). */
export function SingleChoiceChallenge({ challenge, presentation, phase, paused, result, onSubmit }: ChallengeViewProps<'single-choice'>) {
  const interactive = phase === 'active' && !paused;
  const revealing = phase === 'feedback';
  const options = useMemo(
    () => orderedOptions(challenge.options, presentation.optionOrder),
    [challenge.options, presentation.optionOrder],
  );
  const [pressed, setPressed] = useState<string | null>(null);
  const chosen = answerFrom(result, 'single-choice')?.optionId ?? pressed;
  const layout = challenge.layout ?? 'list';
  const tiles = layout === 'tiles';

  const choose = (id: string) => {
    if (!interactive) return;
    setPressed(id);
    onSubmit({ optionId: id });
  };
  useKeyboard(interactive, (event) => {
    const index = digitIndex(event);
    const option = index === null ? undefined : options[index];
    if (option) choose(option.id);
  });

  return (
    <div className="flex h-full flex-col justify-center overflow-y-auto py-2">
      <div role="group" aria-label={challenge.prompt} className={layouts[layout]}>
        {options.map((option, index) => {
          const isAnswer = option.id === challenge.answer;
          const state = revealing
            ? isAnswer
              ? 'is-good'
              : option.id === chosen
                ? 'is-bad'
                : 'is-dim'
            : option.id === chosen
              ? 'is-selected'
              : '';
          return (
            <button
              key={option.id}
              type="button"
              disabled={!interactive}
              aria-pressed={option.id === chosen}
              onClick={() => choose(option.id)}
              className={`pressable relative flex items-center text-left ${
                tiles ? 'aspect-square flex-col justify-center gap-1 p-2 text-center' : 'min-h-14 gap-3 px-4 py-3'
              } ${state} animate-rise`}
              style={{ animationDelay: `${index * 35}ms` }}
            >
              {!tiles && (
                <span className="grid size-7 shrink-0 place-items-center rounded-lg border-2 border-ink/15 font-display text-sm font-extrabold text-muted">
                  {index + 1}
                </span>
              )}
              {tiles ? (
                <span className="font-display text-2xl leading-none font-extrabold sm:text-3xl">
                  {option.symbol ?? option.label}
                </span>
              ) : (
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] leading-snug font-semibold">{option.label}</span>
                  {option.detail && <span className="block text-xs text-muted">{option.detail}</span>}
                </span>
              )}
              {revealing && (isAnswer || option.id === chosen) && (
                <Icon
                  name={isAnswer ? 'check' : 'x'}
                  size={18}
                  className={`shrink-0 ${isAnswer ? 'text-good' : 'text-bad'} ${tiles ? 'absolute top-2 right-2' : ''}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
