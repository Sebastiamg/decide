import { useEffect, useRef } from 'react';

/**
 * Atajos de teclado de una mecánica, activos solo mientras se puede
 * responder. Ignora las teclas si el foco está en un campo de texto.
 */
export function useKeyboard(enabled: boolean, onKey: (event: KeyboardEvent) => void): void {
  const handler = useRef(onKey);
  useEffect(() => {
    handler.current = onKey;
  });
  useEffect(() => {
    if (!enabled) return;
    const listener = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      handler.current(event);
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [enabled]);
}

/** "1".."9" → 0..8 (o null). */
export function digitIndex(event: KeyboardEvent): number | null {
  if (event.key.length !== 1) return null;
  const n = Number.parseInt(event.key, 10);
  return Number.isInteger(n) && n >= 1 && n <= 9 ? n - 1 : null;
}
