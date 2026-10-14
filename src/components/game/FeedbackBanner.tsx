import { useMemo, type CSSProperties } from 'react';
import { describeSolution } from '../../engine/validationEngine';
import type { PlayableChallenge } from '../../types/challenge';
import type { GameConfig } from '../../types/config';
import type { UiLabels } from '../../types/labels';
import type { ChallengeResult } from '../../types/results';
import { Icon } from '../ui/Icon';
import { PressButton } from '../ui/PressButton';
import { formatLabel } from '../../utils/format';
import { feedbackMessage, precisionText } from './feedbackText';

interface FeedbackBannerProps {
  result: ChallengeResult;
  playable: PlayableChallenge;
  labels: UiLabels;
  config: GameConfig;
  /** Milisegundos hasta pasar solo al siguiente desafío. */
  advanceIn: number;
  onContinue: () => void;
}

/** En pantallas táctiles no se mueve el foco (evita el anillo de foco tras un toque). */
const coarsePointer = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true;

const SPARKS = [
  [-46, -30],
  [42, -36],
  [-58, 8],
  [60, 4],
  [-20, -46],
  [24, -48],
] as const;

/**
 * Feedback breve sin detener el juego: un acierto es una píldora que dura
 * menos de un segundo; un error muestra la solución y la explicación el
 * tiempo justo para leerlas (o hasta tocar "Continuar"). Nunca humilla.
 */
export function FeedbackBanner({ result, playable, labels, config, advanceIn, onContinue }: FeedbackBannerProps) {
  const precision = precisionText(result, labels);
  const errors = result.detail?.errors ?? 0;
  const errorsText = errors > 0 ? formatLabel(labels.errorsDetail, { errors }) : null;
  const solution = useMemo(() => describeSolution(playable), [playable]);
  const autoProgress = (
    <div className="mt-3 h-1 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
      <div
        className="h-full origin-left rounded-full bg-ink/60"
        style={{ animation: `timer-drain ${advanceIn}ms linear forwards` }}
      />
    </div>
  );

  if (result.outcome === 'correct') {
    return (
      <div className="safe-bottom pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-2">
        <div className="relative flex max-w-full items-center gap-2.5 rounded-2xl border-2 border-ink bg-good px-4 py-3 text-white shadow-[0_5px_0_var(--color-ink)] animate-pop sm:gap-3 sm:px-5">
          {SPARKS.map(([dx, dy], index) => (
            <span
              key={index}
              className="spark top-1/2 left-7"
              style={{ '--dx': `${dx}px`, '--dy': `${dy}px`, animationDelay: `${index * 25}ms` } as CSSProperties}
              aria-hidden="true"
            />
          ))}
          <Icon name="check" size={22} strokeWidth={3} />
          <span className="instruction text-lg">{labels.correctTitle}</span>
          {/* Correcto ya es "todo bien": solo se detallan los intentos fallidos que restaron puntos. */}
          {errorsText && <span className="rounded-lg bg-white/20 px-2 py-0.5 text-xs font-bold whitespace-nowrap sm:text-sm">{errorsText}</span>}
          <span className="font-display text-xl font-extrabold tabular-nums">+{result.score.total}</span>
          {config.streaks.enabled && result.streakAfter >= config.streaks.showFrom && (
            <span className="flex items-center gap-0.5 rounded-lg bg-volt px-1.5 py-0.5 font-display text-sm font-extrabold text-ink">
              <Icon name="flame" size={13} className="text-bad" />x{result.streakAfter}
            </span>
          )}
        </div>
      </div>
    );
  }

  const timeout = result.outcome === 'timeout';
  const message = feedbackMessage(result, labels);
  return (
    <div className="safe-bottom absolute inset-x-0 bottom-0 z-30">
      <div className="rounded-2xl border-2 border-ink bg-card p-4 shadow-[0_6px_0_var(--color-ink)] animate-rise">
        <div className="flex items-center gap-2.5">
          <span className={`grid size-8 shrink-0 place-items-center rounded-full ${timeout ? 'bg-warn' : 'bg-bad'} text-white`}>
            <Icon name={timeout ? 'clock' : 'x'} size={17} strokeWidth={3} />
          </span>
          <p className="instruction min-w-0 flex-1 text-lg leading-tight normal-case">{message}</p>
          {precision && (
            <span className="shrink-0 rounded-lg bg-bad-soft px-2 py-0.5 text-sm font-bold whitespace-nowrap text-bad">{precision}</span>
          )}
        </div>
        <p className="mt-3 text-[11px] font-extrabold tracking-[0.12em] text-muted uppercase">{labels.correctAnswerWas}</p>
        <ul className="mt-1 space-y-0.5">
          {solution.map((line) => (
            <li key={line} className="flex gap-1.5 text-[15px] leading-snug font-bold">
              <Icon name="check" size={16} strokeWidth={3} className="mt-0.5 shrink-0 text-good" />
              {line}
            </li>
          ))}
        </ul>
        {config.feedback.showExplanation && playable.challenge.explanation && (
          <p className="mt-2 text-sm leading-snug text-ink-soft">{playable.challenge.explanation}</p>
        )}
        {config.feedback.allowSkip && (
          <PressButton size="sm" variant="dark" className="mt-3 w-full" iconRight="arrow-right" onClick={onContinue} autoFocus={!coarsePointer}>
            {labels.continue}
          </PressButton>
        )}
        {autoProgress}
      </div>
    </div>
  );
}
