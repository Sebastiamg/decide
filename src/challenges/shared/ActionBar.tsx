import type { ReactNode } from 'react';
import { PressButton } from '../../components/ui/PressButton';

interface ActionBarProps {
  /** Estado de la mecánica: "2 / 3 seleccionadas", "Por clasificar: 2"... */
  status?: ReactNode;
  statusTone?: 'normal' | 'ready' | 'alert';
  /** Sin texto no hay botón (p. ej. mecánicas que se resuelven solas). */
  label?: string;
  disabled: boolean;
  onConfirm: () => void;
  hidden?: boolean;
}

/** Barra inferior común de las mecánicas que requieren confirmar. */
export function ActionBar({ status, statusTone = 'normal', label, disabled, onConfirm, hidden }: ActionBarProps) {
  if (hidden) return null;
  const tones = {
    normal: 'text-muted',
    ready: 'text-good',
    alert: 'text-bad animate-shake',
  } as const;
  return (
    <div className="flex items-center gap-3 pt-3">
      {status !== undefined && (
        <p
          className={`min-w-0 flex-1 font-display text-sm font-bold tabular-nums ${tones[statusTone]}`}
          aria-live="polite"
        >
          {status}
        </p>
      )}
      {label && (
        <PressButton
          variant="primary"
          size="md"
          className={status === undefined ? 'w-full' : 'shrink-0'}
          disabled={disabled}
          onClick={onConfirm}
          iconRight="arrow-right"
        >
          {label}
        </PressButton>
      )}
    </div>
  );
}
