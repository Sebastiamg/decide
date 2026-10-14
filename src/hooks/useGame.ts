import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { resolveGameConfig } from '../config/gameConfig';
import { resolveLabels } from '../config/labels';
import { buildReport } from '../engine/analytics';
import { buildQueue } from '../engine/challengeSelector';
import { createInitialGameState, gameReducer, type GameAction } from '../engine/gameEngine';
import { remainingMs, timeLimitMs } from '../engine/timerEngine';
import { checkBank } from '../engine/validationEngine';
import type { Activity } from '../types/activity';
import type { ChallengeAnswer } from '../types/challenge';
import type { GameConfig } from '../types/config';
import type { GameState } from '../types/game';
import type { ChallengeResult } from '../types/results';
import { randomSeed } from '../utils/random';

declare global {
  interface Window {
    /** Solo en desarrollo: estado de la partida para pruebas automatizadas. */
    __DECIDE__?: { state: GameState };
  }
}

/** Cuánto dura el feedback: más si hay que leer la solución y la explicación. */
export function feedbackDuration(result: ChallengeResult | undefined, explanation: string | undefined, config: GameConfig): number {
  if (!result) return config.feedback.correctMs;
  const { feedback } = config;
  if (result.outcome === 'correct') return feedback.correctMs;
  const base = result.outcome === 'timeout' ? feedback.timeoutMs : feedback.incorrectMs;
  const reading = feedback.showExplanation && explanation ? explanation.length * feedback.readingMsPerChar : 0;
  return Math.min(feedback.maxMs, base + reading);
}

/**
 * Conecta el motor (reducer puro) con el tiempo real: un único temporizador
 * por fase (entrada → reloj → feedback), siempre limpiado al cambiar.
 */
export function useGame(activity: Activity) {
  const config = useMemo(() => resolveGameConfig(activity.config), [activity]);
  const labels = useMemo(() => resolveLabels(activity.labels), [activity]);
  const reducer = useCallback((state: GameState, action: GameAction) => gameReducer(config, state, action), [config]);
  const [state, dispatch] = useReducer(reducer, undefined, () => createInitialGameState());

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    for (const problem of checkBank(activity.challenges)) console.warn(`[DECIDE:${activity.id}] ${problem}`);
  }, [activity]);

  const current = state.queue[state.currentIndex];
  const lastResult = state.results[state.results.length - 1];
  const { status, phase, paused, currentIndex, timing } = state;

  // 1. Entrada: el reloj arranca cuando el desafío ya está en pantalla.
  useEffect(() => {
    if (status !== 'playing' || phase !== 'ready' || paused) return;
    const id = window.setTimeout(
      () => dispatch({ type: 'activate', clock: performance.now() }),
      config.timer.readyDelayMs,
    );
    return () => window.clearTimeout(id);
  }, [status, phase, paused, currentIndex, config]);

  // 2. Reloj: un solo setTimeout hasta la expiración (se recalcula tras una pausa).
  useEffect(() => {
    if (!config.timer.enabled || status !== 'playing' || phase !== 'active' || paused || !current) return;
    const left = remainingMs(timing, timeLimitMs(current.challenge, config.timer), performance.now());
    const id = window.setTimeout(() => dispatch({ type: 'timeout', clock: performance.now() }), left);
    return () => window.clearTimeout(id);
  }, [status, phase, paused, timing, current, config]);

  // 3. Feedback breve y avance automático (el juego no se detiene).
  const advanceIn = feedbackDuration(lastResult, current?.challenge.explanation, config);
  useEffect(() => {
    if (status !== 'playing' || phase !== 'feedback' || paused) return;
    const id = window.setTimeout(() => dispatch({ type: 'next', now: Date.now() }), advanceIn);
    return () => window.clearTimeout(id);
  }, [status, phase, paused, advanceIn]);

  // Justicia: si la pestaña se oculta, el reloj se detiene.
  useEffect(() => {
    if (!config.timer.pauseWhenHidden) return;
    const onVisibilityChange = () => {
      if (document.hidden) dispatch({ type: 'pause', clock: performance.now() });
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [config]);

  useEffect(() => {
    if (import.meta.env.DEV) window.__DECIDE__ = { state };
  }, [state]);

  const start = useCallback(() => {
    const seed = randomSeed();
    dispatch({ type: 'start', queue: buildQueue(activity.challenges, config, seed), seed, now: Date.now() });
  }, [activity, config]);

  const submit = useCallback((answer: ChallengeAnswer) => {
    dispatch({ type: 'submit', answer, clock: performance.now() });
  }, []);

  const next = useCallback(() => dispatch({ type: 'next', now: Date.now() }), []);
  const pause = useCallback(() => dispatch({ type: 'pause', clock: performance.now() }), []);
  const resume = useCallback(() => dispatch({ type: 'resume', clock: performance.now() }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  const report = useMemo(
    () => (status === 'finished' ? buildReport(activity.id, state) : null),
    [status, activity.id, state],
  );

  return { config, labels, state, current, lastResult, advanceIn, start, submit, next, pause, resume, reset, report };
}

export type GameController = ReturnType<typeof useGame>;
