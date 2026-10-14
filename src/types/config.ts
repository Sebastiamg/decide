import type { ChallengeType, Difficulty } from './challenge';

/**
 * random   → al azar, sin repetir.
 * fixed    → en el orden del banco (los primeros N).
 * weighted → cuota por mecánica según `weights` (p. ej. 30 % binario, 20 % unir...).
 * (Una estrategia 'adaptive' se añadiría en engine/challengeSelector.ts.)
 */
export type SelectionStrategy = 'random' | 'fixed' | 'weighted';

export interface SelectionConfig {
  strategy: SelectionStrategy;
  /** Peso relativo de cada mecánica (estrategia 'weighted'). */
  weights?: Partial<Record<ChallengeType, number>>;
  /** Permite repetir desafíos si el banco es más pequeño que la partida. */
  allowDuplicates: boolean;
  /** Evita dos mecánicas iguales seguidas siempre que el banco lo permita. */
  avoidConsecutiveSameType: boolean;
  /** Mezcla opciones, columnas y elementos dentro de cada desafío. */
  shuffleOptions: boolean;
  /** Limita el banco a estas dificultades. */
  difficulties?: readonly Difficulty[];
  /** Limita el banco a estos temas. */
  topics?: readonly string[];
  /** Limita el banco a estas mecánicas (p. ej. practicar solo "unir"). */
  types?: readonly ChallengeType[];
}

export interface TimerConfig {
  /** false = modo práctica: sin reloj ni bonus de velocidad. */
  enabled: boolean;
  /** Multiplica el tiempo de cada desafío (1.5 = tiempo ampliado, por accesibilidad). */
  scale: number;
  /** Pausa tras la entrada del desafío antes de arrancar el reloj (la animación no consume tiempo). */
  readyDelayMs: number;
  /** Fracción de tiempo restante en la que la barra pasa a "aviso" y a "peligro". */
  warningRatio: number;
  dangerRatio: number;
  /** Pausa el reloj si la pestaña se oculta (justicia). */
  pauseWhenHidden: boolean;
}

export interface ScoringConfig {
  baseCorrect: number;
  maxSpeedBonus: number;
  /** Bonus por cada acierto encadenado a partir del segundo. */
  streakBonusStep: number;
  maxStreakBonus: number;
}

export interface StreakConfig {
  enabled: boolean;
  /** Racha mínima para mostrarla en pantalla. */
  showFrom: number;
}

export interface FeedbackConfig {
  showExplanation: boolean;
  /** Duración del feedback antes de pasar al siguiente desafío. */
  correctMs: number;
  incorrectMs: number;
  timeoutMs: number;
  /** Tiempo extra de lectura por carácter de explicación (con tope `maxMs`). */
  readingMsPerChar: number;
  maxMs: number;
  /** Tocar para continuar sin esperar. */
  allowSkip: boolean;
}

export interface MechanicsConfig {
  /** Seleccionar más de N: bloquear (con aviso) o reemplazar la selección más antigua. */
  selectionOverflow: 'block' | 'replace-oldest';
  /** Fracción del ancho de la tarjeta para aceptar un swipe. */
  swipeThreshold: number;
}

export interface EffectsConfig {
  sound: boolean;
  haptics: boolean;
}

export interface GameConfig {
  challengeCount: number;
  selection: SelectionConfig;
  timer: TimerConfig;
  scoring: ScoringConfig;
  streaks: StreakConfig;
  feedback: FeedbackConfig;
  mechanics: MechanicsConfig;
  effects: EffectsConfig;
}

/** Cada actividad puede ajustar cualquier valor sin repetir el resto. */
export type GameConfigOverrides = {
  [K in keyof GameConfig]?: GameConfig[K] extends object ? Partial<GameConfig[K]> : GameConfig[K];
};
