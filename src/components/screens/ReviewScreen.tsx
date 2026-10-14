import { useEffect, useMemo, useRef, useState } from 'react';
import { mechanicIcon } from '../../challenges/ChallengeRenderer';
import { describeAnswer, describeSolution, instructionFor } from '../../engine/validationEngine';
import type { PlayableChallenge } from '../../types/challenge';
import type { UiLabels } from '../../types/labels';
import type { ChallengeResult } from '../../types/results';
import { formatDuration, formatLabel } from '../../utils/format';
import { precisionText } from '../game/feedbackText';
import { Icon } from '../ui/Icon';
import { OutcomeMark, outcomeLabel } from '../ui/OutcomeMark';
import { IconButton } from '../ui/PressButton';

type Filter = 'mistakes' | 'all';

interface ReviewScreenProps {
  queue: readonly PlayableChallenge[];
  results: readonly ChallengeResult[];
  labels: UiLabels;
  /** Desafío al que saltar al abrir (desde la tira de resultados). */
  focusIndex?: number;
  onBack: () => void;
}

const outcomeStyles = {
  correct: 'border-good',
  incorrect: 'border-bad',
  timeout: 'border-warn',
} as const;

function AnswerLines({ lines, tone }: { lines: readonly string[]; tone: 'good' | 'bad' | 'neutral' }) {
  const color = tone === 'good' ? 'text-good' : tone === 'bad' ? 'text-bad' : 'text-ink-soft';
  return (
    <ul className="mt-1 space-y-0.5">
      {lines.map((line) => (
        <li key={line} className="flex gap-1.5 text-[15px] leading-snug font-semibold">
          <Icon name={tone === 'bad' ? 'x' : 'check'} size={15} strokeWidth={3} className={`mt-0.5 shrink-0 ${color}`} />
          {line}
        </li>
      ))}
    </ul>
  );
}

function ReviewCard({ playable, result, labels, total }: { playable: PlayableChallenge; result: ChallengeResult; labels: UiLabels; total: number }) {
  const answer = describeAnswer(playable, result.answer);
  const solution = describeSolution(playable);
  const precision = result.correct ? null : precisionText(result, labels);
  return (
    <article
      id={`review-${result.index}`}
      className={`scroll-mt-36 rounded-2xl border-2 border-l-8 bg-card p-4 shadow-[0_3px_0_var(--color-ink)] ${outcomeStyles[result.outcome]}`}
      aria-label={`${formatLabel(labels.challengeCounter, { current: result.index + 1, total })}: ${outcomeLabel(result.outcome, labels)}`}
    >
      <header className="flex items-center gap-2">
        <span className="font-display text-sm font-extrabold tabular-nums">{String(result.index + 1).padStart(2, '0')}</span>
        <span className="flex min-w-0 items-center gap-1 text-xs font-semibold text-muted">
          <Icon name={mechanicIcon(result.type)} size={13} className="shrink-0" />
          <span className="truncate">{labels.mechanicNames[result.type]}</span>
        </span>
        <span className="flex-1" />
        <span className="text-xs font-semibold text-muted tabular-nums">
          {result.answer ? formatDuration(result.timeSpentMs) : formatDuration(result.timeLimitMs)}
        </span>
        {result.correct && <span className="font-display text-sm font-extrabold tabular-nums">+{result.score.total}</span>}
        <OutcomeMark outcome={result.outcome} labels={labels} size={14} className="size-6" />
      </header>

      <p className="mt-3 text-[11px] font-extrabold tracking-[0.1em] text-muted uppercase">{instructionFor(playable.challenge, labels)}</p>
      <p className="mt-0.5 text-base leading-snug font-bold text-balance">{playable.challenge.prompt}</p>

      {result.correct ? (
        <AnswerLines lines={solution} tone="good" />
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-bad-soft/60 px-3 py-2">
            <p className="flex items-center gap-2 text-[11px] font-extrabold tracking-[0.1em] text-bad uppercase">
              {labels.yourAnswer}
              {precision && <span className="font-bold tracking-normal normal-case">· {precision}</span>}
            </p>
            {answer.length > 0 ? (
              <AnswerLines lines={answer} tone="bad" />
            ) : (
              <p className="mt-1 text-[15px] font-semibold text-ink-soft italic">{labels.noAnswer}</p>
            )}
          </div>
          <div className="rounded-xl bg-good-soft/70 px-3 py-2">
            <p className="text-[11px] font-extrabold tracking-[0.1em] text-good uppercase">{labels.correctAnswer}</p>
            <AnswerLines lines={solution} tone="good" />
          </div>
        </div>
      )}

      {playable.challenge.explanation && (
        <p className="mt-3 border-t border-line pt-2.5 text-sm leading-snug text-ink-soft">{playable.challenge.explanation}</p>
      )}
    </article>
  );
}

/** Revisión: por defecto solo los errores (lo que más enseña), con la opción de ver todo. */
export function ReviewScreen({ queue, results, labels, focusIndex, onBack }: ReviewScreenProps) {
  const mistakes = useMemo(() => results.filter((result) => !result.correct), [results]);
  const focusedIsCorrect = focusIndex !== undefined && results[focusIndex]?.correct === true;
  const [filter, setFilter] = useState<Filter>(mistakes.length > 0 && !focusedIsCorrect ? 'mistakes' : 'all');
  const titleRef = useRef<HTMLHeadingElement>(null);
  const shown = filter === 'mistakes' ? mistakes : results;

  useEffect(() => {
    const target = focusIndex === undefined ? null : document.getElementById(`review-${focusIndex}`);
    if (target) target.scrollIntoView({ block: 'start' });
    titleRef.current?.focus({ preventScroll: true });
  }, [focusIndex]);

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: 'mistakes', label: labels.onlyMistakes, count: mistakes.length },
    { id: 'all', label: labels.allChallenges, count: results.length },
  ];

  return (
    <div className="paper h-dvh overflow-y-auto">
      <div className="sticky top-0 z-10 border-b-2 border-ink bg-paper/95 backdrop-blur-sm">
        <div className="safe-top mx-auto w-full max-w-2xl px-4 pb-3">
          <div className="flex items-center gap-3">
            <IconButton icon="arrow-left" label={labels.back} onClick={onBack} className="size-10! shadow-[0_3px_0_var(--color-ink)]" />
            <h1 ref={titleRef} tabIndex={-1} className="instruction text-2xl outline-none">
              {labels.reviewTitle}
            </h1>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl border-2 border-ink bg-card p-1" role="group" aria-label={labels.reviewTitle}>
            {filters.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={filter === option.id}
                onClick={() => setFilter(option.id)}
                className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg font-display text-sm font-extrabold tracking-wide uppercase transition-colors focus-visible:outline-3 focus-visible:outline-volt ${
                  filter === option.id ? 'bg-ink text-white' : 'text-ink-soft hover:bg-ink/5'
                }`}
              >
                {option.label}
                <span className={`rounded-md px-1.5 text-xs tabular-nums ${filter === option.id ? 'bg-volt text-ink' : 'bg-ink/10'}`}>
                  {option.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="safe-bottom mx-auto w-full max-w-2xl px-4 pt-4">
        {shown.length === 0 ? (
          <div className="mt-10 grid place-items-center gap-3 text-center animate-pop">
            <span className="grid size-14 place-items-center rounded-2xl border-2 border-ink bg-good text-white shadow-[0_4px_0_var(--color-ink)]">
              <Icon name="check" size={28} strokeWidth={3} />
            </span>
            <p className="max-w-60 text-lg font-bold">{labels.noMistakes}</p>
          </div>
        ) : (
          <div className="grid gap-3 pb-4">
            {shown.map((result) => {
              const playable = queue[result.index];
              return playable ? (
                <ReviewCard key={result.index} playable={playable} result={result} labels={labels} total={results.length} />
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
