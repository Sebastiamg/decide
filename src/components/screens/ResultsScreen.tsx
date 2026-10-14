import { useEffect, useRef } from 'react';
import { mechanicIcon } from '../../challenges/ChallengeRenderer';
import { useCountUp } from '../../hooks/useCountUp';
import type { Activity } from '../../types/activity';
import type { ChallengeType } from '../../types/challenge';
import type { UiLabels } from '../../types/labels';
import type { ChallengeResult, GameReport } from '../../types/results';
import { formatDuration, formatLabel, formatNumber, formatPercent } from '../../utils/format';
import { Icon, type IconName } from '../ui/Icon';
import { OutcomeMark } from '../ui/OutcomeMark';
import { IconButton, PressButton } from '../ui/PressButton';

interface ResultsScreenProps {
  activity: Activity;
  report: GameReport;
  results: readonly ChallengeResult[];
  labels: UiLabels;
  onReview: (index?: number) => void;
  onPlayAgain: () => void;
  onHome: () => void;
}

export function resultMessage(accuracy: number, labels: UiLabels): string {
  if (accuracy >= 0.9) return labels.resultExcellent;
  if (accuracy >= 0.7) return labels.resultGood;
  if (accuracy >= 0.5) return labels.resultOk;
  return labels.resultKeepGoing;
}

interface StatProps {
  icon: IconName;
  label: string;
  value: string;
  /** Valor animado (cuenta ascendente); los lectores de pantalla leen siempre `value`. */
  display?: string;
  delay: number;
}

function Stat({ icon, label, value, display, delay }: StatProps) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-card px-3.5 py-3 animate-rise" style={{ animationDelay: `${delay}ms` }}>
      <p className="flex items-center gap-1.5 text-[10.5px] font-extrabold tracking-[0.06em] whitespace-nowrap text-muted uppercase">
        <Icon name={icon} size={13} className="shrink-0" />
        {label}
      </p>
      <p className="mt-1 font-display text-[1.7rem] leading-none font-extrabold tabular-nums">
        {display === undefined ? (
          value
        ) : (
          <>
            <span aria-hidden="true">{display}</span>
            <span className="sr-only">{value}</span>
          </>
        )}
      </p>
    </div>
  );
}

/** Resultados: la recompensa primero, el detalle después. */
export function ResultsScreen({ activity, report, results, labels, onReview, onPlayAgain, onHome }: ResultsScreenProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const score = useCountUp(report.score, 1100, 250);
  const mechanics = Object.entries(report.byType) as [ChallengeType, NonNullable<GameReport['byType'][ChallengeType]>][];

  useEffect(() => titleRef.current?.focus({ preventScroll: true }), []);

  return (
    <div className="paper h-dvh overflow-y-auto">
      <div className="safe-top mx-auto w-full max-w-md px-5">
        <div className="flex items-center gap-2">
          <p className="flex min-w-0 flex-1 items-center gap-2 text-sm font-bold text-ink-soft">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-ink text-volt" aria-hidden="true">
              <Icon name="bolt" size={14} />
            </span>
            <span className="truncate">
              {labels.appName} · {activity.title}
            </span>
          </p>
          <IconButton icon="home" label={labels.backToStart} onClick={onHome} className="size-10! shadow-[0_3px_0_var(--color-ink)]" />
        </div>

        <h1 ref={titleRef} tabIndex={-1} className="instruction mt-4 text-[2.1rem] leading-[0.95] outline-none animate-pop">
          {labels.resultsTitle}
        </h1>

        <section className="relative mt-4 overflow-hidden rounded-3xl border-[3px] border-ink bg-volt p-5 shadow-[0_6px_0_var(--color-ink)] animate-rise">
          <p className="flex items-baseline gap-2 font-display font-extrabold tabular-nums">
            <span className="text-[4.5rem] leading-none">{report.correct}</span>
            <span className="text-3xl">/ {report.total}</span>
          </p>
          <p className="mt-0.5 text-sm font-bold">{labels.correctCount}</p>
          <p className="mt-3 text-lg leading-snug font-bold">{resultMessage(report.accuracy, labels)}</p>
          <Icon name="bolt" size={150} className="pointer-events-none absolute -top-5 -right-8 rotate-12 text-ink/10" />
        </section>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat icon="target" label={labels.accuracy} value={formatPercent(report.accuracy)} delay={80} />
          <Stat icon="bolt" label={labels.totalPoints} value={formatNumber(report.score)} display={formatNumber(score)} delay={140} />
          <Stat icon="flame" label={labels.maxStreak} value={`x${report.maxStreak}`} delay={200} />
          <Stat
            icon="clock"
            label={labels.averageTime}
            value={report.averageTimeMs > 0 ? formatDuration(report.averageTimeMs) : '—'}
            delay={260}
          />
        </div>

        <section className="mt-5 animate-rise" style={{ animationDelay: '320ms' }}>
          <h2 className="text-[11px] font-extrabold tracking-[0.12em] text-muted uppercase">{labels.perChallenge}</h2>
          <ol className="mt-2 grid grid-cols-10 gap-1.5">
            {results.map((result) => (
              <li key={result.index}>
                <button
                  type="button"
                  onClick={() => onReview(result.index)}
                  className="block w-full rounded-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-volt"
                  aria-label={formatLabel(labels.challengeCounter, { current: result.index + 1, total: results.length })}
                >
                  <OutcomeMark outcome={result.outcome} labels={labels} size={13} className="aspect-square w-full" />
                </button>
              </li>
            ))}
          </ol>
        </section>

        {mechanics.length > 1 && (
          <section className="mt-5 animate-rise" style={{ animationDelay: '380ms' }}>
            <h2 className="text-[11px] font-extrabold tracking-[0.12em] text-muted uppercase">{labels.byMechanic}</h2>
            <ul className="mt-2 divide-y divide-line rounded-2xl border-2 border-ink bg-card">
              {mechanics.map(([type, row]) => (
                <li key={type} className="flex items-center gap-3 px-3.5 py-2.5">
                  <Icon name={mechanicIcon(type)} size={17} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{labels.mechanicNames[type]}</span>
                  <span className="h-1.5 w-16 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
                    <span className="block h-full rounded-full bg-good" style={{ width: `${row.accuracy * 100}%` }} />
                  </span>
                  <span className="w-10 text-right font-display text-sm font-extrabold tabular-nums">
                    {row.correct}/{row.total}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Acciones siempre a mano: la barra queda fija abajo mientras se desplaza el detalle. */}
        <div className="safe-bottom sticky bottom-0 z-10 -mx-5 mt-6 grid gap-2.5 border-t-2 border-ink bg-paper/95 px-5 pt-3 backdrop-blur-sm">
          <PressButton variant="primary" size="lg" icon="replay" onClick={onPlayAgain}>
            {labels.playAgain}
          </PressButton>
          <PressButton variant="dark" size="sm" icon="list" onClick={() => onReview()}>
            {labels.review}
          </PressButton>
        </div>
      </div>
    </div>
  );
}
