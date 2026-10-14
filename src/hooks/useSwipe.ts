import { useCallback, useEffect, useRef } from 'react';
import { clamp } from '../utils/format';

export type SwipeDirection = 'left' | 'right';

interface SwipeOptions {
  enabled: boolean;
  /** Fracción del ancho de la tarjeta para aceptar el swipe. */
  thresholdRatio: number;
  onCommit: (direction: SwipeDirection) => void;
}

const SPRING_BACK = 'transform 320ms cubic-bezier(0.2, 1.5, 0.4, 1)';
const FLY_OUT = 'transform 230ms cubic-bezier(0.4, 0, 1, 1), opacity 230ms ease-in';

/**
 * Tarjeta física: sigue al dedo/ratón, rota un poco, muestra hacia dónde va
 * (variable CSS --swipe de -1 a 1), vuelve si no llega al umbral y sale de
 * la pantalla si lo supera (o con un "latigazo" rápido). Sin estado React
 * por frame: todo se escribe en el estilo del elemento.
 */
export function useSwipe<T extends HTMLElement>({ enabled, thresholdRatio, onCommit }: SwipeOptions) {
  const ref = useRef<T>(null);
  const onCommitRef = useRef(onCommit);
  useEffect(() => {
    onCommitRef.current = onCommit;
  });
  const committed = useRef(false);

  const place = useCallback((dx: number, dy: number, transition: string, threshold: number) => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = transition;
    el.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${dx * 0.045}deg)`;
    el.style.setProperty('--swipe', clamp(dx / threshold, -1, 1).toFixed(3));
  }, []);

  /** Expulsa la tarjeta (también desde botones o teclado) y confirma la decisión. */
  const fling = useCallback(
    (direction: SwipeDirection) => {
      const el = ref.current;
      if (!el || committed.current) return;
      committed.current = true;
      const distance = window.innerWidth * 0.9 + el.offsetWidth;
      place(direction === 'right' ? distance : -distance, 40, FLY_OUT, 1);
      el.style.opacity = '0';
      onCommitRef.current(direction);
    },
    [place],
  );

  /** Vuelve a mostrar la tarjeta en su sitio (para el feedback). No reactiva el swipe. */
  const restore = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const wasFlung = committed.current;
    committed.current = true;
    el.style.setProperty('--swipe', '0');
    if (!wasFlung) {
      el.style.transition = SPRING_BACK;
      el.style.transform = '';
      return;
    }
    el.style.transition = 'none';
    el.style.transform = 'scale(0.94)';
    el.style.opacity = '0';
    void el.offsetWidth; // aplica el estado inicial antes de animar
    el.style.transition = 'transform 280ms cubic-bezier(0.2, 1.3, 0.4, 1), opacity 180ms ease-out';
    el.style.transform = '';
    el.style.opacity = '1';
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let start: { x: number; y: number; id: number } | null = null;
    let samples: { x: number; t: number }[] = [];
    const threshold = () => Math.max(60, el.offsetWidth * thresholdRatio);

    const onDown = (e: PointerEvent) => {
      if (committed.current || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
      samples = [{ x: e.clientX, t: e.timeStamp }];
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      const dy = (e.clientY - start.y) * 0.25;
      samples.push({ x: e.clientX, t: e.timeStamp });
      if (samples.length > 6) samples.shift();
      place(dx, dy, 'none', threshold());
    };
    const release = (e: PointerEvent, cancelled: boolean) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      start = null;
      const first = samples[0];
      const last = samples[samples.length - 1];
      const velocity = first && last && last.t > first.t ? (last.x - first.x) / (last.t - first.t) : 0;
      const flick = Math.abs(velocity) > 0.6 && Math.abs(dx) > 28;
      if (!cancelled && (Math.abs(dx) > threshold() || flick)) {
        fling(dx > 0 ? 'right' : 'left');
      } else {
        place(0, 0, SPRING_BACK, threshold());
      }
    };
    const onUp = (e: PointerEvent) => release(e, false);
    const onCancel = (e: PointerEvent) => release(e, true);

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onCancel);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onCancel);
    };
  }, [enabled, thresholdRatio, place, fling]);

  return { ref, fling, restore };
}
