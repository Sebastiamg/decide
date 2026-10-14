/**
 * Comprobación rápida del motor sin interfaz:
 *   npm run check:engine
 * - el banco no tiene problemas de contenido;
 * - las partidas respetan cantidad, cuotas, no repetición y alternancia de mecánicas;
 * - la respuesta correcta de cada desafío se evalúa como correcta y una alterada, no;
 * - la puntuación premia velocidad solo si la respuesta es correcta.
 */
import { feedbackMessage } from '../src/components/game/feedbackText';
import { resolveGameConfig } from '../src/config/gameConfig';
import { defaultLabels } from '../src/config/labels';
import { readUrlOverrides, withOverrides } from '../src/config/urlOptions';
import { buildQueue, plannedChallengeCount } from '../src/engine/challengeSelector';
import { createInitialGameState, gameReducer } from '../src/engine/gameEngine';
import { scoreChallenge } from '../src/engine/scoringEngine';
import { timeLimitMs } from '../src/engine/timerEngine';
import { checkBank, evaluateAnswer, prepareChallenge } from '../src/engine/validationEngine';
import { activities } from '../src/data';
import type { Challenge, ChallengeAnswer } from '../src/types/challenge';
import type { ChallengeResult } from '../src/types/results';
import { createRandom } from '../src/utils/random';

let failures = 0;
function assert(condition: boolean, message: string) {
  if (!condition) {
    failures++;
    console.error(`✕ ${message}`);
  }
}

function correctAnswer(challenge: Challenge): ChallengeAnswer {
  switch (challenge.type) {
    case 'binary':
      return { type: 'binary', value: { optionId: challenge.answer } };
    case 'single-choice':
      return { type: 'single-choice', value: { optionId: challenge.answer } };
    case 'multiple-choice':
      return { type: 'multiple-choice', value: { optionIds: challenge.answers } };
    case 'matching':
      return { type: 'matching', value: { pairs: challenge.pairs, errors: 0 } };
    case 'ordering':
      return { type: 'ordering', value: { order: challenge.items.map((i) => i.id) } };
    case 'classification':
      return {
        type: 'classification',
        value: { placements: Object.fromEntries(challenge.items.map((i) => [i.id, i.category])) },
      };
  }
}

function wrongAnswer(challenge: Challenge): ChallengeAnswer {
  switch (challenge.type) {
    case 'binary':
      return { type: 'binary', value: { optionId: challenge.options.find((o) => o.id !== challenge.answer)!.id } };
    case 'single-choice':
      return { type: 'single-choice', value: { optionId: challenge.options.find((o) => o.id !== challenge.answer)!.id } };
    case 'multiple-choice':
      return { type: 'multiple-choice', value: { optionIds: challenge.answers.slice(1) } };
    case 'matching': {
      const rights = challenge.pairs.map(([, r]) => r);
      return {
        type: 'matching',
        value: { pairs: challenge.pairs.map(([l], i) => [l, rights[(i + 1) % rights.length]!] as const), errors: 0 },
      };
    }
    case 'ordering':
      return { type: 'ordering', value: { order: challenge.items.map((i) => i.id).reverse() } };
    case 'classification':
      return {
        type: 'classification',
        value: { placements: Object.fromEntries(challenge.items.map((i) => [i.id, challenge.categories[0]!.id])) },
      };
  }
}

for (const activity of activities) {
  const config = resolveGameConfig(activity.config);
  const problems = checkBank(activity.challenges);
  assert(problems.length === 0, `${activity.id}: problemas de contenido:\n  ${problems.join('\n  ')}`);

  const random = createRandom(1);
  for (const challenge of activity.challenges) {
    const playable = prepareChallenge(challenge, random, true);
    assert(evaluateAnswer(playable, correctAnswer(challenge))?.correct === true, `${challenge.id}: la solución no se evalúa como correcta`);
    assert(evaluateAnswer(playable, wrongAnswer(challenge))?.correct === false, `${challenge.id}: una respuesta alterada se evalúa como correcta`);
  }

  for (let seed = 1; seed <= 200; seed++) {
    const queue = buildQueue(activity.challenges, config, seed);
    const ids = queue.map((p) => p.challenge.id);
    assert(queue.length === config.challengeCount, `${activity.id} semilla ${seed}: ${queue.length} desafíos`);
    assert(new Set(ids).size === ids.length, `${activity.id} semilla ${seed}: desafíos repetidos`);
    const repeats = queue.filter((p, i) => i > 0 && queue[i - 1]!.type === p.type).length;
    assert(repeats === 0, `${activity.id} semilla ${seed}: ${repeats} mecánicas repetidas seguidas`);
    if (config.selection.strategy === 'weighted' && config.selection.weights) {
      for (const [type, weight] of Object.entries(config.selection.weights)) {
        const count = queue.filter((p) => p.type === type).length;
        assert(count === weight, `${activity.id} semilla ${seed}: ${type} = ${count}, esperado ${weight}`);
      }
    }
  }
  const a = buildQueue(activity.challenges, config, 42).map((p) => p.challenge.id).join();
  const b = buildQueue(activity.challenges, config, 42).map((p) => p.challenge.id).join();
  assert(a === b, `${activity.id}: la misma semilla no reproduce la partida`);

  // Partida completa por el reducer: todo correcto → 20 aciertos y racha 20.
  const reduce = (state: ReturnType<typeof createInitialGameState>, action: Parameters<typeof gameReducer>[2]) =>
    gameReducer(config, state, action);
  let state = reduce(createInitialGameState(), { type: 'start', queue: buildQueue(activity.challenges, config, 7), seed: 7, now: 0 });
  let clock = 1000;
  while (state.status === 'playing') {
    state = reduce(state, { type: 'activate', clock });
    clock += 1500;
    state = reduce(state, { type: 'submit', answer: correctAnswer(state.queue[state.currentIndex]!.challenge), clock });
    state = reduce(state, { type: 'next', now: clock });
  }
  assert(state.results.filter((r) => r.correct).length === config.challengeCount, `${activity.id}: el reducer no registró ${config.challengeCount} aciertos`);
  assert(state.maxStreak === config.challengeCount, `${activity.id}: racha máxima ${state.maxStreak}`);
  console.log(`✓ ${activity.id}: ${activity.challenges.length} desafíos, partida perfecta = ${state.score} puntos`);
}

const config = resolveGameConfig();
const fast = scoreChallenge({ evaluation: { correct: true, accuracy: 1 }, timeRemainingMs: 9600, timeLimitMs: 10000, streak: 1, timed: true, scoring: config.scoring, streaks: config.streaks });
const slow = scoreChallenge({ evaluation: { correct: true, accuracy: 1 }, timeRemainingMs: 1600, timeLimitMs: 10000, streak: 1, timed: true, scoring: config.scoring, streaks: config.streaks });
const wrongFast = scoreChallenge({ evaluation: { correct: false, accuracy: 0 }, timeRemainingMs: 9900, timeLimitMs: 10000, streak: 0, timed: true, scoring: config.scoring, streaks: config.streaks });
assert(fast.total === 148 && slow.total === 108 && wrongFast.total === 0, `puntuación: rápida ${fast.total}, lenta ${slow.total}, incorrecta ${wrongFast.total}`);
console.log(`✓ puntuación: rápida = ${fast.total}, lenta = ${slow.total}, incorrecta rápida = ${wrongFast.total}`);

// Personalización por enlace: filtra mecánicas, ajusta cantidad y tiempo; ignora valores no válidos.
{
  const activity = activities[0]!;
  const overrides = readUrlOverrides('?count=8&mechanics=matching,inventada&time=1.5');
  const custom = resolveGameConfig(withOverrides(activity, overrides).config);
  const queue = buildQueue(activity.challenges, custom, 3);
  assert(queue.length === 8 && queue.every((p) => p.type === 'matching'), `enlace: ${queue.length} desafíos, tipos ${[...new Set(queue.map((p) => p.type))].join()}`);
  assert(custom.selection.weights !== undefined, 'enlace: se perdieron los pesos de la actividad');
  const sample = activity.challenges[0]!;
  assert(timeLimitMs(sample, custom.timer) === sample.timeLimit * 1500, `enlace: tiempo ampliado ${timeLimitMs(sample, custom.timer)}`);
  const few = resolveGameConfig(withOverrides(activity, readUrlOverrides('?mechanics=ordering')).config);
  const available = activity.challenges.filter((c) => c.type === 'ordering').length;
  assert(plannedChallengeCount(activity.challenges, few) === available, 'enlace: cantidad prevista con banco pequeño');
  assert(buildQueue(activity.challenges, few, 5).length === available, 'enlace: la partida no usa todo el banco filtrado');
  assert(readUrlOverrides('?count=abc&time=99&mechanics=') === null, 'enlace: valores no válidos deberían ignorarse');
  const untimed = resolveGameConfig(withOverrides(activity, readUrlOverrides('?time=off')).config);
  assert(!untimed.timer.enabled, 'enlace: time=off no desactiva el reloj');

  // Sin reloj: no hay tiempo agotado ni bonus de velocidad.
  let state = gameReducer(untimed, createInitialGameState(), { type: 'start', queue: buildQueue(activity.challenges, untimed, 9), seed: 9, now: 0 });
  state = gameReducer(untimed, state, { type: 'activate', clock: 0 });
  state = gameReducer(untimed, state, { type: 'timeout', clock: 999999 });
  assert(state.phase === 'active', 'sin reloj: el tiempo no debería agotarse');
  state = gameReducer(untimed, state, { type: 'submit', answer: correctAnswer(state.queue[0]!.challenge), clock: 999999 });
  assert(state.results[0]?.correct === true && state.results[0].score.speedBonus === 0, 'sin reloj: acierto sin bonus de velocidad');
  console.log('✓ enlace docente: mecánicas, cantidad, tiempo ampliado y modo sin reloj');
}

// Feedback: "Casi." solo con acierto parcial (≥ 50 %); si no, frases neutras.
{
  const base = { outcome: 'incorrect', index: 0, type: 'multiple-choice' } as ChallengeResult;
  const almost = feedbackMessage({ ...base, detail: { correctParts: 2, totalParts: 3 } }, defaultLabels);
  const none = feedbackMessage({ ...base, detail: { correctParts: 0, totalParts: 3 } }, defaultLabels);
  assert(almost === defaultLabels.almostMessage, `feedback parcial: "${almost}"`);
  assert(none !== defaultLabels.almostMessage, `feedback sin aciertos: "${none}"`);
  console.log(`✓ feedback: parcial = "${almost}", sin aciertos = "${none}"`);
}

if (failures > 0) {
  console.error(`\n${failures} comprobación(es) fallida(s)`);
  process.exit(1);
}
console.log('\nMotor OK');
