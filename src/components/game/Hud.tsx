import { formatLabel, formatNumber } from '../../utils/format';
import type { UiLabels } from '../../types/labels';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/PressButton';

interface HudProps {
  current: number;
  /** Desafíos ya resueltos (la barra avanza al responder, no al entrar). */
  completed: number;
  total: number;
  score: number;
  streak: number;
  showStreak: boolean;
  soundOn: boolean;
  labels: UiLabels;
  onToggleSound: () => void;
  onPause: () => void;
}

const caption = 'block text-[10px] font-extrabold tracking-[0.14em] text-muted uppercase';

/** HUD tipo marcador, pequeño: no compite con el desafío. */
export function Hud({ current, completed, total, score, streak, showStreak, soundOn, labels, onToggleSound, onPause }: HudProps) {
  const counter = formatLabel(labels.challengeCounter, { current, total });
  return (
    <div className="safe-top mx-auto w-full max-w-2xl px-4">
      <div className="flex items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink text-volt" aria-hidden="true">
          <Icon name="bolt" size={16} />
        </span>
        <p className="leading-none whitespace-nowrap">
          <span className={caption} aria-hidden="true">
            {labels.challengeLabel}
          </span>
          <span className="font-display text-lg font-extrabold tabular-nums" aria-hidden="true">
            {String(current).padStart(2, '0')}
            <span className="text-sm text-muted"> / {String(total).padStart(2, '0')}</span>
          </span>
          <span className="sr-only">{counter}</span>
        </p>
        <div className="flex-1" />
        {showStreak && (
          <span
            key={streak}
            className="flex items-center gap-0.5 rounded-full border-2 border-ink bg-volt px-2 py-0.5 font-display text-[13px] font-extrabold animate-pop"
          >
            <Icon name="flame" size={13} className="text-bad" />
            <span aria-hidden="true">x{streak}</span>
            <span className="sr-only">{formatLabel(labels.streak, { count: streak })}</span>
          </span>
        )}
        <p className="min-w-12 text-right leading-none whitespace-nowrap">
          <span className={caption} aria-hidden="true">
            {labels.totalPoints}
          </span>
          <span key={score} className="inline-block font-display text-lg font-extrabold tabular-nums animate-pop" aria-hidden="true">
            {formatNumber(score)}
          </span>
          <span className="sr-only">{`${formatNumber(score)} ${labels.points}`}</span>
        </p>
        <IconButton
          icon={soundOn ? 'volume-on' : 'volume-off'}
          label={soundOn ? labels.soundOn : labels.soundOff}
          aria-pressed={soundOn}
          onClick={onToggleSound}
          className="size-9! shadow-[0_3px_0_var(--color-ink)]"
        />
        <IconButton icon="pause" label={labels.pause} onClick={onPause} className="size-9! shadow-[0_3px_0_var(--color-ink)]" />
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10"
        role="progressbar"
        aria-label={counter}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
      >
        <div className="h-full rounded-full bg-ink transition-[width] duration-300" style={{ width: `${(completed / Math.max(1, total)) * 100}%` }} />
      </div>
    </div>
  );
}
