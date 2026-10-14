export type Random = () => number;

/** Generador determinista (mulberry32): la misma semilla reproduce la misma partida. */
export function createRandom(seed: number): Random {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

/** Fisher–Yates sobre una copia. */
export function shuffle<T>(items: readonly T[], random: Random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return out;
}

/** Baraja garantizando que el resultado NO coincide con el orden original (si hay 2+ elementos). */
export function shuffleChanged<T>(items: readonly T[], random: Random): T[] {
  if (items.length < 2) return [...items];
  for (let attempt = 0; attempt < 6; attempt++) {
    const out = shuffle(items, random);
    if (out.some((item, index) => item !== items[index])) return out;
  }
  const rotated = [...items];
  rotated.push(rotated.shift() as T);
  return rotated;
}
