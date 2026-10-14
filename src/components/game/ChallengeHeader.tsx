import type { ReactNode } from 'react';
import type { ChallengeMedia } from '../../types/challenge';
import { Icon, type IconName } from '../ui/Icon';

interface ChallengeHeaderProps {
  instruction: string;
  icon: IconName;
  prompt: string | null;
  media?: ChallengeMedia;
  timer: ReactNode;
}

/**
 * Jerarquía fija en todas las mecánicas: INSTRUCCIÓN (qué hacer, grande) →
 * enunciado (sobre qué) → tiempo. Al cambiar de mecánica, la instrucción
 * entra con un "pop" para que el cambio se note al instante.
 */
export function ChallengeHeader({ instruction, icon, prompt, media, timer }: ChallengeHeaderProps) {
  return (
    <header className="pt-3 pb-2">
      <div className="flex items-center gap-2.5 animate-pop">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border-2 border-ink bg-volt shadow-[0_3px_0_var(--color-ink)]">
          <Icon name={icon} size={18} strokeWidth={2.6} />
        </span>
        <h2 className="instruction text-[1.55rem] leading-none sm:text-3xl">{instruction}</h2>
      </div>
      {prompt && (
        <div className="mt-3 flex items-start gap-3 animate-rise">
          {media?.emoji && (
            <span className="text-3xl leading-none" aria-hidden="true">
              {media.emoji}
            </span>
          )}
          <p className="text-[1.08rem] leading-snug font-semibold text-balance sm:text-xl">{prompt}</p>
        </div>
      )}
      {media?.image && (
        <img src={media.image.src} alt={media.image.alt} className="mt-3 max-h-40 w-full rounded-xl border-2 border-ink object-cover" />
      )}
      <div className="mt-3">{timer}</div>
    </header>
  );
}
