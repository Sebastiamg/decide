import { useEffect, useRef } from 'react';
import { vibrate } from '../services/haptics';
import { playSound } from '../services/sound';
import type { GameConfig } from '../types/config';
import type { GameState } from '../types/game';

/** Sonido y vibración como refuerzo (opcional) de cada resultado. */
export function useFeedbackEffects(state: GameState, config: GameConfig, soundOn: boolean): void {
  const handled = useRef(0);
  const last = state.results[state.results.length - 1];

  useEffect(() => {
    if (state.results.length === 0) {
      handled.current = 0;
      return;
    }
    if (!last || state.results.length === handled.current) return;
    handled.current = state.results.length;
    if (soundOn) {
      if (last.outcome === 'correct') {
        const milestone = last.streakAfter >= 3 && (last.streakAfter === 3 || last.streakAfter % 5 === 0);
        playSound(milestone ? 'streak' : 'correct');
      } else {
        playSound(last.outcome === 'timeout' ? 'timeout' : 'incorrect');
      }
    }
    if (config.effects.haptics) vibrate(last.outcome === 'correct' ? 'correct' : last.outcome);
  }, [state.results.length, last, soundOn, config]);

  // Una sola vez por partida (activar el sonido en resultados no la repite).
  const celebrated = useRef<number | null>(null);
  useEffect(() => {
    if (state.status !== 'finished') {
      celebrated.current = null;
      return;
    }
    if (celebrated.current === state.finishedAt) return;
    celebrated.current = state.finishedAt;
    if (soundOn) playSound('complete');
  }, [state.status, state.finishedAt, soundOn]);
}
