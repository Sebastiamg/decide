/**
 * Sonidos sintetizados con Web Audio: sin archivos, sin descargas. Son un
 * refuerzo opcional; ninguna información depende de ellos.
 */
export type SoundName = 'correct' | 'incorrect' | 'timeout' | 'click' | 'swipe' | 'streak' | 'complete';

type AudioContextCtor = typeof AudioContext;

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!context) {
    const Ctor: AudioContextCtor | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      context = new Ctor();
    } catch {
      return null;
    }
  }
  return context;
}

/** Los navegadores exigen un gesto del usuario para habilitar el audio. */
export function unlockAudio(): void {
  const ctx = getContext();
  if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => {});
}

function tone(ctx: AudioContext, frequency: number, start: number, duration: number, type: OscillatorType, volume: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function whoosh(ctx: AudioContext, start: number) {
  const length = Math.floor(ctx.sampleRate * 0.14);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(600, start);
  filter.frequency.exponentialRampToValueAtTime(2400, start + 0.12);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.12, start);
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(start);
}

export function playSound(name: SoundName): void {
  const ctx = getContext();
  if (!ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime + 0.005;
  switch (name) {
    case 'correct':
      tone(ctx, 660, t, 0.09, 'triangle', 0.16);
      tone(ctx, 990, t + 0.075, 0.14, 'triangle', 0.16);
      break;
    case 'incorrect':
      tone(ctx, 220, t, 0.16, 'sine', 0.18);
      tone(ctx, 175, t + 0.1, 0.2, 'sine', 0.14);
      break;
    case 'timeout':
      tone(ctx, 440, t, 0.1, 'triangle', 0.12);
      tone(ctx, 330, t + 0.1, 0.1, 'triangle', 0.12);
      tone(ctx, 247, t + 0.2, 0.18, 'triangle', 0.12);
      break;
    case 'click':
      tone(ctx, 1300, t, 0.025, 'square', 0.03);
      break;
    case 'swipe':
      whoosh(ctx, t);
      break;
    case 'streak':
      [523, 659, 784].forEach((f, i) => tone(ctx, f, t + i * 0.06, 0.1, 'triangle', 0.12));
      break;
    case 'complete':
      [523, 659, 784, 1047].forEach((f) => tone(ctx, f, t, 0.5, 'triangle', 0.08));
      break;
  }
}
