import { useEffect, type CSSProperties } from 'react';
import { Icon } from '../components/ui/Icon';
import { useSwipe } from '../hooks/useSwipe';
import type { BinaryOption } from '../types/challenge';
import { useKeyboard } from './shared/useKeyboard';
import { answerFrom, type ChallengeViewProps } from './types';

function revealClass(optionId: string, chosen: string | null, correct: string, revealing: boolean): string {
  if (!revealing) return '';
  if (optionId === correct) return 'is-good';
  if (optionId === chosen) return 'is-bad';
  return 'is-dim';
}

function OptionLabel({ option, align }: { option: BinaryOption; align: 'left' | 'right' }) {
  return (
    <span className={`flex min-w-0 flex-col ${align === 'left' ? 'items-start text-left' : 'items-end text-right'}`}>
      <span className="font-display text-[clamp(0.95rem,4.4vw,1.125rem)] leading-none font-extrabold uppercase">{option.label}</span>
      {option.detail && <span className="mt-1 line-clamp-2 text-xs font-semibold normal-case text-ink-soft">{option.detail}</span>}
    </span>
  );
}

/**
 * Dos opciones (Sí/No, Verdadero/Falso, Correcto/Incorrecto, A/B…).
 * Swipe físico como mecánica principal; botones y flechas del teclado como
 * alternativa. Qué lado es correcto lo decide el contenido.
 */
export function BinaryChallenge({ challenge, phase, paused, result, labels, config, onSubmit }: ChallengeViewProps<'binary'>) {
  const interactive = phase === 'active' && !paused;
  const revealing = phase === 'feedback';
  const [left, right] = challenge.options;
  const { ref, fling, restore } = useSwipe<HTMLDivElement>({
    enabled: interactive,
    thresholdRatio: config.mechanics.swipeThreshold,
    onCommit: (direction) => onSubmit({ optionId: direction === 'left' ? left.id : right.id }),
  });
  useKeyboard(interactive, (event) => {
    if (event.key === 'ArrowLeft') fling('left');
    else if (event.key === 'ArrowRight') fling('right');
  });
  const chosen = answerFrom(result, 'binary')?.optionId ?? null;
  const isAB = challenge.variant === 'a-b';
  const correctOption = challenge.options.find((option) => option.id === challenge.answer);

  // En el feedback la tarjeta vuelve (compacta, arriba) para leer el enunciado junto a la solución.
  useEffect(() => {
    if (revealing) restore();
  }, [revealing, restore]);
  const cardTone = !revealing
    ? 'border-ink bg-card shadow-[0_6px_0_var(--color-ink)]'
    : chosen === null
      ? 'border-ink bg-card shadow-[0_6px_0_var(--color-ink)]'
      : chosen === challenge.answer
        ? 'border-good bg-good-soft shadow-[0_6px_0_var(--color-good)]'
        : 'border-bad bg-bad-soft shadow-[0_6px_0_var(--color-bad)]';

  return (
    <div className="flex h-full flex-col">
      <div className={`relative flex min-h-0 flex-1 justify-center py-2 ${revealing ? 'items-start pt-4' : 'items-center'}`}>
        <div
          ref={ref}
          role="group"
          aria-label={challenge.prompt}
          style={{ '--swipe': 0 } as CSSProperties}
          className={`no-touch-scroll relative flex w-full max-w-md flex-col items-center justify-center gap-4 rounded-[26px] border-2 px-5 text-center ${cardTone} ${
            revealing ? 'py-7' : 'h-full max-h-[25rem] min-h-[13rem] cursor-grab py-8 active:cursor-grabbing'
          }`}
        >
          {revealing && correctOption && (
            <span className="absolute -top-4 left-1/2 flex -translate-x-1/2 -rotate-3 items-center gap-1.5 rounded-lg border-2 border-ink bg-good px-2.5 py-1 font-display text-sm font-extrabold whitespace-nowrap text-white uppercase shadow-[0_3px_0_var(--color-ink)] animate-pop">
              <Icon name="check" size={15} strokeWidth={3} />
              {correctOption.label}
            </span>
          )}
          <span
            aria-hidden="true"
            className="absolute top-4 left-4 -rotate-12 rounded-lg border-2 border-ink bg-volt px-2 py-0.5 font-display text-sm font-extrabold uppercase"
            style={{ opacity: 'max(0, calc(var(--swipe) * -1))' }}
          >
            {left.label}
          </span>
          <span
            aria-hidden="true"
            className="absolute top-4 right-4 rotate-12 rounded-lg border-2 border-ink bg-volt px-2 py-0.5 font-display text-sm font-extrabold uppercase"
            style={{ opacity: 'max(0, var(--swipe))' }}
          >
            {right.label}
          </span>
          {challenge.media?.emoji && (
            <span className="text-5xl" aria-hidden="true">
              {challenge.media.emoji}
            </span>
          )}
          <p className="font-display text-[1.6rem] leading-tight font-bold text-balance sm:text-3xl">{challenge.prompt}</p>
          {isAB && (
            <div className="grid w-full grid-cols-2 gap-2 text-left">
              {challenge.options.map((option) => (
                <div key={option.id} className="rounded-xl border-2 border-line bg-paper px-3 py-2">
                  <span className="font-display text-sm font-extrabold">{option.label}</span>
                  <p className="text-sm leading-snug font-semibold">{option.detail}</p>
                </div>
              ))}
            </div>
          )}
          {!revealing && (
            <p className="flex items-center gap-2 text-xs font-semibold text-muted">
              <Icon name="arrow-left" size={14} />
              {labels.swipeHint}
              <Icon name="arrow-right" size={14} />
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          disabled={!interactive}
          onClick={() => fling('left')}
          className={`pressable flex min-h-16 items-center gap-1.5 px-3 py-2 ${revealClass(left.id, chosen, challenge.answer, revealing)}`}
        >
          <Icon name="arrow-left" size={17} className="shrink-0 max-[359px]:hidden" />
          <OptionLabel option={left} align="left" />
        </button>
        <button
          type="button"
          disabled={!interactive}
          onClick={() => fling('right')}
          className={`pressable flex min-h-16 items-center justify-end gap-1.5 px-3 py-2 ${revealClass(right.id, chosen, challenge.answer, revealing)}`}
        >
          <OptionLabel option={right} align="right" />
          <Icon name="arrow-right" size={17} className="shrink-0 max-[359px]:hidden" />
        </button>
      </div>
    </div>
  );
}
