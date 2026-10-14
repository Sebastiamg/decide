import type { GameConfig, GameConfigOverrides } from '../types/config';

/**
 * Configuración por defecto del motor. Ningún componente tiene valores de
 * juego "a mano": todo sale de aquí o de la configuración de la actividad.
 */
export const defaultGameConfig: GameConfig = {
  challengeCount: 20,
  selection: {
    strategy: 'random',
    allowDuplicates: false,
    avoidConsecutiveSameType: true,
    shuffleOptions: true,
  },
  timer: {
    enabled: true,
    scale: 1,
    readyDelayMs: 450,
    warningRatio: 0.4,
    dangerRatio: 0.2,
    pauseWhenHidden: true,
  },
  scoring: {
    baseCorrect: 100,
    maxSpeedBonus: 50,
    streakBonusStep: 5,
    maxStreakBonus: 25,
  },
  streaks: {
    enabled: true,
    showFrom: 2,
  },
  feedback: {
    showExplanation: true,
    correctMs: 950,
    incorrectMs: 2400,
    timeoutMs: 2400,
    readingMsPerChar: 32,
    maxMs: 6500,
    allowSkip: true,
  },
  mechanics: {
    selectionOverflow: 'block',
    swipeThreshold: 0.32,
  },
  effects: {
    sound: false,
    haptics: true,
  },
};

/** Combina la configuración por defecto con la de una actividad (dos niveles). */
export function resolveGameConfig(overrides?: GameConfigOverrides): GameConfig {
  if (!overrides) return defaultGameConfig;
  const base = defaultGameConfig;
  return {
    challengeCount: overrides.challengeCount ?? base.challengeCount,
    selection: { ...base.selection, ...overrides.selection },
    timer: { ...base.timer, ...overrides.timer },
    scoring: { ...base.scoring, ...overrides.scoring },
    streaks: { ...base.streaks, ...overrides.streaks },
    feedback: { ...base.feedback, ...overrides.feedback },
    mechanics: { ...base.mechanics, ...overrides.mechanics },
    effects: { ...base.effects, ...overrides.effects },
  };
}
