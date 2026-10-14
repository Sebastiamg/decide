import type { ChallengeAnswer, PlayableChallenge } from '../types/challenge';
import type { GameConfig } from '../types/config';
import type { GameState } from '../types/game';
import type { ChallengeResult, Evaluation } from '../types/results';
import { ZERO_SCORE, scoreChallenge } from './scoringEngine';
import { nextStreak } from './streakEngine';
import { IDLE_TIMING, elapsedMs, pauseTiming, remainingMs, resumeTiming, startTiming, timeLimitMs } from './timerEngine';
import { evaluateAnswer } from './validationEngine';

/**
 * Máquina de estados de la partida (reducer puro). `clock` es
 * performance.now() (tiempo de juego); `now` es Date.now() (registro).
 *
 *   idle ──start──▶ playing ──(último desafío)──▶ finished
 *                     │
 *          ready ─activate─▶ active ─submit/timeout─▶ feedback ─next─▶ ready…
 */
export type GameAction =
  | { type: 'start'; queue: readonly PlayableChallenge[]; seed: number; now: number }
  | { type: 'activate'; clock: number }
  | { type: 'submit'; answer: ChallengeAnswer; clock: number }
  | { type: 'timeout'; clock: number }
  | { type: 'next'; now: number }
  | { type: 'pause'; clock: number }
  | { type: 'resume'; clock: number }
  | { type: 'reset' };

export function createInitialGameState(seed = 0): GameState {
  return {
    status: 'idle',
    phase: 'ready',
    paused: false,
    seed,
    queue: [],
    currentIndex: 0,
    timing: IDLE_TIMING,
    score: 0,
    streak: 0,
    maxStreak: 0,
    results: [],
    startedAt: null,
    finishedAt: null,
  };
}

export function currentChallenge(state: GameState): PlayableChallenge | undefined {
  return state.queue[state.currentIndex];
}

function resolve(
  state: GameState,
  config: GameConfig,
  playable: PlayableChallenge,
  evaluation: Evaluation,
  answer: ChallengeAnswer | null,
  clock: number,
): GameState {
  const limitMs = timeLimitMs(playable.challenge, config.timer);
  const timed = config.timer.enabled;
  const timeSpentMs = elapsedMs(state.timing, clock);
  const timeRemainingMs = timed ? remainingMs(state.timing, limitMs, clock) : 0;
  const outcome = answer === null ? 'timeout' : evaluation.correct ? 'correct' : 'incorrect';
  const streak = nextStreak(state.streak, outcome === 'correct');
  const score =
    outcome === 'correct'
      ? scoreChallenge({
          evaluation,
          timeRemainingMs,
          timeLimitMs: limitMs,
          streak,
          timed,
          scoring: config.scoring,
          streaks: config.streaks,
        })
      : ZERO_SCORE;
  const result: ChallengeResult = {
    challengeId: playable.challenge.id,
    index: state.currentIndex,
    type: playable.type,
    topic: playable.challenge.topic,
    difficulty: playable.challenge.difficulty,
    outcome,
    correct: outcome === 'correct',
    accuracy: evaluation.accuracy,
    detail: evaluation.detail,
    score,
    streakAfter: streak,
    timeLimitMs: limitMs,
    timeSpentMs,
    timeRemainingMs,
    answer,
  };
  return {
    ...state,
    phase: 'feedback',
    timing: pauseTiming(state.timing, clock), // congela el reloj
    score: state.score + score.total,
    streak,
    maxStreak: Math.max(state.maxStreak, streak),
    results: [...state.results, result],
  };
}

export function gameReducer(config: GameConfig, state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'start':
      if (action.queue.length === 0) return state;
      return { ...createInitialGameState(action.seed), status: 'playing', queue: action.queue, startedAt: action.now };

    case 'activate':
      if (state.status !== 'playing' || state.phase !== 'ready' || state.paused) return state;
      return { ...state, phase: 'active', timing: startTiming(action.clock) };

    case 'submit': {
      if (state.status !== 'playing' || state.phase !== 'active' || state.paused) return state;
      const playable = currentChallenge(state);
      if (!playable) return state;
      const evaluation = evaluateAnswer(playable, action.answer);
      if (!evaluation) return state;
      // Una respuesta que llega con el tiempo ya agotado cuenta como tiempo agotado.
      if (config.timer.enabled && remainingMs(state.timing, timeLimitMs(playable.challenge, config.timer), action.clock) <= 0) {
        return resolve(state, config, playable, { correct: false, accuracy: 0 }, null, action.clock);
      }
      return resolve(state, config, playable, evaluation, action.answer, action.clock);
    }

    case 'timeout': {
      if (!config.timer.enabled || state.status !== 'playing' || state.phase !== 'active' || state.paused) return state;
      const playable = currentChallenge(state);
      if (!playable) return state;
      return resolve(state, config, playable, { correct: false, accuracy: 0 }, null, action.clock);
    }

    case 'next':
      if (state.status !== 'playing' || state.phase !== 'feedback' || state.paused) return state;
      if (state.currentIndex + 1 >= state.queue.length) {
        return { ...state, status: 'finished', finishedAt: action.now };
      }
      return { ...state, currentIndex: state.currentIndex + 1, phase: 'ready', timing: IDLE_TIMING };

    case 'pause':
      if (state.status !== 'playing' || state.paused) return state;
      return {
        ...state,
        paused: true,
        timing: state.phase === 'active' ? pauseTiming(state.timing, action.clock) : state.timing,
      };

    case 'resume':
      if (!state.paused) return state;
      return {
        ...state,
        paused: false,
        timing: state.phase === 'active' ? resumeTiming(state.timing, action.clock) : state.timing,
      };

    case 'reset':
      return createInitialGameState();
  }
}
