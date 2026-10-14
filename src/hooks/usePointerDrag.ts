import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';

export interface PointerDragHandlers<D> {
  /** Movimiento mínimo (px) para considerar que es un arrastre y no un toque. */
  threshold?: number;
  /** Al superar el umbral. Devuelve false para cancelar el arrastre. */
  onStart?: (data: D, event: PointerEvent) => boolean | void;
  /** Movimientos agrupados por frame (requestAnimationFrame). */
  onMove?: (data: D, event: PointerEvent) => void;
  onEnd?: (data: D, event: PointerEvent, cancelled: boolean) => void;
  /** Pulsación sin arrastre. */
  onTap?: (data: D, event: PointerEvent) => void;
}

/**
 * Arrastre con pointer events (ratón, dedo y lápiz por igual). Escucha en
 * window para no perder el puntero si sale del elemento, agrupa los
 * movimientos por frame y limpia todo al soltar o desmontar.
 */
export function usePointerDrag<D>(handlers: PointerDragHandlers<D>) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanupRef.current?.(), []);

  return useCallback((data: D) => (event: ReactPointerEvent) => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    cleanupRef.current?.();
    const startX = event.clientX;
    const startY = event.clientY;
    const pointerId = event.pointerId;
    const threshold = handlersRef.current.threshold ?? 6;
    let dragging = false;
    let frame = 0;
    let pending: PointerEvent | null = null;

    const flush = () => {
      frame = 0;
      if (pending && dragging) handlersRef.current.onMove?.(data, pending);
      pending = null;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      if (!dragging) {
        if (Math.hypot(e.clientX - startX, e.clientY - startY) < threshold) return;
        if (handlersRef.current.onStart?.(data, e) === false) {
          cleanup();
          return;
        }
        dragging = true;
      }
      e.preventDefault();
      pending = e;
      if (!frame) frame = requestAnimationFrame(flush);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const wasDragging = dragging;
      if (frame) cancelAnimationFrame(frame);
      if (wasDragging) {
        handlersRef.current.onMove?.(data, e);
        handlersRef.current.onEnd?.(data, e, false);
      } else {
        handlersRef.current.onTap?.(data, e);
      }
      cleanup();
    };
    const onCancel = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      if (dragging) handlersRef.current.onEnd?.(data, e, true);
      cleanup();
    };
    function cleanup() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      if (frame) cancelAnimationFrame(frame);
      cleanupRef.current = null;
    }
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    cleanupRef.current = cleanup;
  }, []);
}
