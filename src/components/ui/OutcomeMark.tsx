import type { UiLabels } from '../../types/labels';
import type { Outcome } from '../../types/results';
import { Icon, type IconName } from './Icon';

const marks: Record<Outcome, { icon: IconName; className: string }> = {
  correct: { icon: 'check', className: 'bg-good text-white' },
  incorrect: { icon: 'x', className: 'bg-bad text-white' },
  timeout: { icon: 'clock', className: 'bg-warn text-ink' },
};

export function outcomeLabel(outcome: Outcome, labels: UiLabels): string {
  if (outcome === 'correct') return labels.outcomeCorrect;
  return outcome === 'timeout' ? labels.outcomeTimeout : labels.outcomeIncorrect;
}

interface OutcomeMarkProps {
  outcome: Outcome;
  labels: UiLabels;
  size?: number;
  className?: string;
}

/** ✓ ✕ ⏱: el color nunca es la única pista (siempre hay icono y texto accesible). */
export function OutcomeMark({ outcome, labels, size = 14, className = '' }: OutcomeMarkProps) {
  const mark = marks[outcome];
  return (
    <span className={`grid shrink-0 place-items-center rounded-md ${mark.className} ${className}`} title={outcomeLabel(outcome, labels)}>
      <Icon name={mark.icon} size={size} strokeWidth={3} />
      <span className="sr-only">{outcomeLabel(outcome, labels)}</span>
    </span>
  );
}
