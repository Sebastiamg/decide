import { useEffect } from 'react';
import type { UiLabels } from '../../types/labels';
import { PressButton } from '../ui/PressButton';

interface PauseOverlayProps {
  labels: UiLabels;
  onResume: () => void;
  onExit: () => void;
}

/** Pausa: tapa el desafío (no se puede seguir pensando con el reloj parado). */
export function PauseOverlay({ labels, onResume, onExit }: PauseOverlayProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onResume();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onResume]);
  return (
    <div className="paper fixed inset-0 z-50 grid place-items-center p-6 animate-fade" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <div className="w-full max-w-xs text-center">
        <p id="pause-title" className="instruction text-4xl">
          {labels.pausedTitle}
        </p>
        <div className="mt-8 grid gap-3">
          <PressButton variant="primary" size="lg" icon="play" onClick={onResume} autoFocus>
            {labels.resume}
          </PressButton>
          <PressButton size="md" icon="home" onClick={onExit}>
            {labels.exit}
          </PressButton>
        </div>
      </div>
    </div>
  );
}
