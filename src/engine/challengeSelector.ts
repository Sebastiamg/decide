import type { Challenge, ChallengeType, PlayableChallenge } from '../types/challenge';
import type { GameConfig, SelectionConfig } from '../types/config';
import { createRandom, shuffle, type Random } from '../utils/random';
import { prepareChallenge } from './validationEngine';

/**
 * Elige los desafíos de la partida a partir del banco de la actividad.
 * Estrategias: random | fixed | weighted (cuotas por mecánica). Después,
 * reparte las mecánicas para que nunca se juegue en "piloto automático".
 */

function groupByType(items: readonly Challenge[]): Map<ChallengeType, Challenge[]> {
  const groups = new Map<ChallengeType, Challenge[]>();
  for (const item of items) {
    const group = groups.get(item.type);
    if (group) group.push(item);
    else groups.set(item.type, [item]);
  }
  return groups;
}

/** Toma `count` elementos; si faltan y se permiten duplicados, vuelve a recorrer el banco barajado. */
function takeCycling(items: readonly Challenge[], count: number, allowDuplicates: boolean, random: Random): Challenge[] {
  if (count <= items.length || !allowDuplicates || items.length === 0) return items.slice(0, count);
  const out = [...items];
  while (out.length < count) out.push(...shuffle(items, random));
  return out.slice(0, count);
}

function weightedPick(
  pool: readonly Challenge[],
  count: number,
  weights: Partial<Record<ChallengeType, number>>,
  allowDuplicates: boolean,
  random: Random,
): Challenge[] {
  const groups = groupByType(shuffle(pool, random));
  const types = [...groups.keys()];
  const hasWeights = types.some((type) => (weights[type] ?? 0) > 0);
  const weightOf = (type: ChallengeType) => (hasWeights ? (weights[type] ?? 0) : 1);
  const active = types.filter((type) => weightOf(type) > 0);
  const totalWeight = active.reduce((sum, type) => sum + weightOf(type), 0);
  if (active.length === 0 || totalWeight === 0) return takeCycling(shuffle(pool, random), count, allowDuplicates, random);

  // Cuotas por "mayor resto" para que sumen exactamente `count`.
  const raw = active.map((type) => ({ type, exact: (weightOf(type) / totalWeight) * count }));
  const quota = new Map(raw.map(({ type, exact }) => [type, Math.floor(exact)]));
  let assigned = [...quota.values()].reduce((a, b) => a + b, 0);
  for (const { type } of [...raw].sort((a, b) => (b.exact % 1) - (a.exact % 1))) {
    if (assigned >= count) break;
    quota.set(type, (quota.get(type) ?? 0) + 1);
    assigned++;
  }
  // Sin duplicados, una mecánica no puede dar más de lo que tiene: el déficit pasa a las demás.
  if (!allowDuplicates) {
    let deficit = 0;
    for (const type of active) {
      const available = groups.get(type)?.length ?? 0;
      const wanted = quota.get(type) ?? 0;
      if (wanted > available) {
        deficit += wanted - available;
        quota.set(type, available);
      }
    }
    const byWeight = [...active].sort((a, b) => weightOf(b) - weightOf(a));
    while (deficit > 0) {
      const receiver = byWeight.find((type) => (quota.get(type) ?? 0) < (groups.get(type)?.length ?? 0));
      if (!receiver) break;
      quota.set(receiver, (quota.get(receiver) ?? 0) + 1);
      deficit--;
    }
  }
  const picked: Challenge[] = [];
  for (const type of active) {
    picked.push(...takeCycling(groups.get(type) ?? [], quota.get(type) ?? 0, allowDuplicates, random));
  }
  return shuffle(picked, random);
}

/**
 * Reordena para no repetir mecánica seguida y que la siguiente sea
 * impredecible: elige al azar (ponderado por lo que queda) entre las
 * mecánicas distintas de la anterior, salvo que una deba ir ya para no
 * acabar con varias iguales al final.
 */
export function spreadTypes(items: readonly Challenge[], random: Random): Challenge[] {
  const buckets = groupByType(items);
  const result: Challenge[] = [];
  let last: ChallengeType | null = null;
  while (result.length < items.length) {
    const remaining = [...buckets.entries()].filter(([, list]) => list.length > 0);
    const totalLeft = remaining.reduce((sum, [, list]) => sum + list.length, 0);
    const candidates = remaining.filter(([type]) => type !== last);
    const pool = candidates.length > 0 ? candidates : remaining;
    const [heaviestType, heaviest] = pool.reduce((a, b) => (b[1].length > a[1].length ? b : a));
    let chosen = heaviestType;
    if (heaviest.length <= totalLeft - heaviest.length) {
      let ticket = random() * pool.reduce((sum, [, list]) => sum + list.length, 0);
      for (const [type, list] of pool) {
        ticket -= list.length;
        if (ticket <= 0) {
          chosen = type;
          break;
        }
      }
    }
    const next = buckets.get(chosen)?.shift();
    if (!next) break;
    result.push(next);
    last = chosen;
  }
  return result;
}

/** Desafíos que cumplen los filtros (dificultad, tema, mecánica). Si ninguno cumple, el banco entero. */
export function eligibleChallenges(bank: readonly Challenge[], selection: SelectionConfig): Challenge[] {
  const filtered = bank.filter(
    (challenge) =>
      (!selection.difficulties || (challenge.difficulty !== undefined && selection.difficulties.includes(challenge.difficulty))) &&
      (!selection.topics || (challenge.topic !== undefined && selection.topics.includes(challenge.topic))) &&
      (!selection.types || selection.types.includes(challenge.type)),
  );
  return filtered.length > 0 ? filtered : [...bank];
}

/** Cuántos desafíos tendrá la partida (puede ser menos que `challengeCount` si el banco no alcanza). */
export function plannedChallengeCount(bank: readonly Challenge[], config: GameConfig): number {
  const count = Math.max(1, Math.round(config.challengeCount));
  if (config.selection.allowDuplicates) return count;
  return Math.min(count, eligibleChallenges(bank, config.selection).length);
}

export function selectChallenges(bank: readonly Challenge[], config: GameConfig, random: Random): Challenge[] {
  const { selection } = config;
  const pool = eligibleChallenges(bank, selection);
  const count = Math.max(1, Math.round(config.challengeCount));

  let picked: Challenge[];
  switch (selection.strategy) {
    case 'fixed':
      return takeCycling(pool, count, selection.allowDuplicates, random);
    case 'weighted':
      picked = weightedPick(pool, count, selection.weights ?? {}, selection.allowDuplicates, random);
      break;
    case 'random':
      picked = takeCycling(shuffle(pool, random), count, selection.allowDuplicates, random);
      break;
  }
  return selection.avoidConsecutiveSameType ? spreadTypes(picked, random) : picked;
}

/** Partida completa y reproducible: misma semilla → mismos desafíos, orden y opciones. */
export function buildQueue(bank: readonly Challenge[], config: GameConfig, seed: number): PlayableChallenge[] {
  const random = createRandom(seed);
  return selectChallenges(bank, config, random).map((challenge) =>
    prepareChallenge(challenge, random, config.selection.shuffleOptions),
  );
}
