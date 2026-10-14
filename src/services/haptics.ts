export type HapticName = 'correct' | 'incorrect' | 'timeout' | 'tap';

const patterns: Record<HapticName, number | number[]> = {
  correct: 14,
  incorrect: [18, 60, 18],
  timeout: [30, 50, 30],
  tap: 6,
};

/** Vibración ligera en dispositivos compatibles. Nunca imprescindible. */
export function vibrate(name: HapticName): void {
  try {
    navigator.vibrate?.(patterns[name]);
  } catch {
    // Algunos navegadores la bloquean: no importa.
  }
}
