import { useEffect, useMemo, useRef } from 'react';
import { mechanicIcon } from '../../challenges/ChallengeRenderer';
import { eligibleChallenges, plannedChallengeCount } from '../../engine/challengeSelector';
import type { Activity } from '../../types/activity';
import type { ChallengeType } from '../../types/challenge';
import type { GameConfig } from '../../types/config';
import type { UiLabels } from '../../types/labels';
import { formatLabel } from '../../utils/format';
import { Icon } from '../ui/Icon';
import { IconButton, PressButton } from '../ui/PressButton';

interface StartScreenProps {
  activity: Activity;
  config: GameConfig;
  labels: UiLabels;
  soundOn: boolean;
  onToggleSound: () => void;
  onStart: () => void;
}

/** Inicio: identidad del juego, reglas en cuatro líneas y un solo botón grande. */
export function StartScreen({ activity, config, labels, soundOn, onToggleSound, onStart }: StartScreenProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const count = useMemo(() => plannedChallengeCount(activity.challenges, config), [activity, config]);
  // Mecánicas que la partida puede presentar (en el orden en que aparecen en el banco).
  const mechanics = useMemo(() => {
    const seen = new Set<ChallengeType>();
    for (const challenge of eligibleChallenges(activity.challenges, config.selection)) seen.add(challenge.type);
    return [...seen];
  }, [activity, config]);

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement)) onStart();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onStart]);

  return (
    <div className="paper h-dvh overflow-y-auto">
      <div className="safe-top safe-bottom mx-auto flex min-h-full w-full max-w-md flex-col px-5">
        <div className="flex items-center gap-2">
          <span className="flex min-w-0 items-center gap-2 rounded-full border-2 border-ink bg-card px-3 py-1 text-sm font-bold">
            {activity.icon && <span aria-hidden="true">{activity.icon}</span>}
            <span className="truncate">
              {activity.subject} · {activity.title}
            </span>
          </span>
          <div className="flex-1" />
          <IconButton
            icon={soundOn ? 'volume-on' : 'volume-off'}
            label={soundOn ? labels.soundOn : labels.soundOff}
            aria-pressed={soundOn}
            onClick={onToggleSound}
            className="size-10! shadow-[0_3px_0_var(--color-ink)]"
          />
        </div>

        <div className="flex flex-1 flex-col justify-center py-6">
          <div className="flex items-center gap-3 animate-pop">
            <span className="grid size-16 shrink-0 -rotate-6 place-items-center rounded-2xl border-[3px] border-ink bg-volt shadow-[0_5px_0_var(--color-ink)]">
              <Icon name="bolt" size={34} />
            </span>
            <h1 ref={titleRef} tabIndex={-1} className="instruction text-[4.2rem] leading-[0.9] tracking-tight outline-none">
              {labels.appName}
            </h1>
          </div>
          <p className="mt-5 flex flex-wrap gap-x-2.5 font-display text-2xl font-extrabold tracking-wide uppercase">
            {labels.tagline.map((word, index) => (
              <span
                key={word}
                className={`animate-rise ${index === 1 ? 'bg-volt px-1.5' : ''}`}
                style={{ animationDelay: `${120 + index * 110}ms` }}
              >
                {word}
              </span>
            ))}
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-xl bg-ink px-2.5 py-1.5 font-display text-[13px] font-extrabold tracking-[0.06em] whitespace-nowrap text-white uppercase">
              <Icon name="list" size={15} className="text-volt" />
              {formatLabel(labels.challengesCount, { count })}
            </span>
            {config.timer.enabled && (
              <span className="flex items-center gap-1.5 rounded-xl bg-ink px-2.5 py-1.5 font-display text-[13px] font-extrabold tracking-[0.06em] whitespace-nowrap text-white uppercase">
                <Icon name="clock" size={15} className="text-volt" />
                {labels.timeLimited}
              </span>
            )}
          </div>

          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={labels.byMechanic}>
            {mechanics.map((type) => (
              <li
                key={type}
                className="flex items-center gap-1 rounded-lg border border-ink/15 bg-card/70 px-2 py-1 text-xs font-semibold text-ink-soft"
              >
                <Icon name={mechanicIcon(type)} size={13} />
                {labels.mechanicNames[type]}
              </li>
            ))}
          </ul>

          <ol className="mt-7 space-y-2.5">
            {labels.rules.map((rule, index) => (
              <li key={rule} className="flex items-center gap-3 text-[1.05rem] font-semibold">
                <span className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink bg-card font-display text-sm font-extrabold">
                  {index + 1}
                </span>
                {rule}
              </li>
            ))}
          </ol>
        </div>

        <PressButton variant="primary" size="lg" icon="bolt" className="w-full text-xl" onClick={onStart}>
          {labels.start}
        </PressButton>
        {activity.description && <p className="mt-3 text-center text-xs leading-snug text-muted">{activity.description}</p>}
      </div>
    </div>
  );
}
