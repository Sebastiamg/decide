import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../components/ui/Icon';
import { usePointerDrag } from '../hooks/usePointerDrag';
import { ActionBar } from './shared/ActionBar';
import { answerFrom, type ChallengeViewProps } from './types';

interface DragState {
  id: string;
  /** Distancia del puntero al borde superior del elemento al agarrarlo. */
  grabOffset: number;
  pointerY: number;
}

/**
 * Ordenar: se arrastra cada elemento (los demás se apartan con una
 * animación FLIP) o se usan los botones ▲▼, también con teclado.
 */
export function OrderingChallenge({ challenge, presentation, phase, paused, result, labels, onSubmit }: ChallengeViewProps<'ordering'>) {
  const interactive = phase === 'active' && !paused;
  const revealing = phase === 'feedback';
  const [order, setOrder] = useState<string[]>(() => [...presentation.initialOrder]);
  const [dragId, setDragId] = useState<string | null>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const drag = useRef<DragState | null>(null);
  const previousTops = useRef<Map<string, number> | null>(null);
  const items = useMemo(() => new Map(challenge.items.map((item) => [item.id, item])), [challenge.items]);
  const shownOrder = answerFrom(result, 'ordering')?.order ?? order;
  const correctIndex = useMemo(() => new Map(challenge.items.map((item, index) => [item.id, index])), [challenge.items]);

  /** Coloca el elemento arrastrado bajo el puntero, sea cual sea su posición en la lista. */
  const placeDragged = () => {
    const state = drag.current;
    const element = state ? itemRefs.current.get(state.id) : undefined;
    if (!state || !element) return;
    element.style.transform = 'none';
    const naturalTop = element.getBoundingClientRect().top;
    element.style.transform = `translateY(${state.pointerY - state.grabOffset - naturalTop}px)`;
  };

  // FLIP: los elementos desplazados se animan desde su posición anterior.
  useLayoutEffect(() => {
    const before = previousTops.current;
    previousTops.current = null;
    if (before) {
      for (const [id, element] of itemRefs.current) {
        if (id === drag.current?.id) continue;
        const top = before.get(id);
        if (top === undefined) continue;
        const delta = top - element.getBoundingClientRect().top;
        if (Math.abs(delta) > 0.5) {
          element.animate([{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }], {
            duration: 170,
            easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
          });
        }
      }
    }
    placeDragged();
  }, [order]);

  const move = (id: string, to: number) => {
    const from = order.indexOf(id);
    if (from === -1 || to < 0 || to >= order.length || from === to) return;
    previousTops.current = new Map([...itemRefs.current].map(([key, element]) => [key, element.getBoundingClientRect().top]));
    const next = [...order];
    next.splice(from, 1);
    next.splice(to, 0, id);
    setOrder(next);
  };

  const startDrag = usePointerDrag<string>({
    threshold: 4,
    onStart: (id, event) => {
      const element = itemRefs.current.get(id);
      if (!interactive || !element) return false;
      drag.current = { id, grabOffset: event.clientY - element.getBoundingClientRect().top, pointerY: event.clientY };
      setDragId(id);
      return true;
    },
    onMove: (id, event) => {
      const state = drag.current;
      const element = itemRefs.current.get(id);
      if (!state || !element) return;
      state.pointerY = event.clientY;
      placeDragged();
      const center = event.clientY - state.grabOffset + element.offsetHeight / 2;
      let target = 0;
      for (const otherId of order) {
        if (otherId === id) continue;
        const rect = itemRefs.current.get(otherId)?.getBoundingClientRect();
        if (rect && center > rect.top + rect.height / 2) target++;
      }
      if (target !== order.indexOf(id)) move(id, target);
    },
    onEnd: (id) => {
      const element = itemRefs.current.get(id);
      drag.current = null;
      setDragId(null);
      if (element) {
        const from = element.style.transform || 'none';
        element.style.transform = '';
        element.animate([{ transform: from }, { transform: 'translateY(0)' }], { duration: 150, easing: 'ease-out' });
      }
    },
  });

  const submit = () => {
    if (interactive) onSubmit({ order });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {challenge.ends && (
          <p className="mb-2 flex items-center gap-1.5 font-display text-[11px] font-extrabold tracking-[0.14em] text-muted uppercase">
            <Icon name="chevron-up" size={14} /> {challenge.ends.first}
          </p>
        )}
        <ol className="grid gap-2.5" aria-label={challenge.prompt}>
          {shownOrder.map((id, index) => {
            const item = items.get(id);
            if (!item) return null;
            const inPlace = correctIndex.get(id) === index;
            const state = revealing ? (inPlace ? 'is-good' : 'is-bad') : dragId === id ? 'is-selected' : '';
            return (
              <li
                key={id}
                ref={(element) => {
                  if (element) itemRefs.current.set(id, element);
                  else itemRefs.current.delete(id);
                }}
                className={`pressable relative flex min-h-14 items-center gap-2 py-2 pr-1.5 pl-2 ${state} ${
                  dragId === id ? 'z-10 shadow-[0_10px_0_var(--color-ink)]' : ''
                }`}
              >
                <span
                  onPointerDown={startDrag(id)}
                  className="no-touch-scroll grid h-11 w-8 shrink-0 cursor-grab place-items-center text-muted active:cursor-grabbing"
                  aria-hidden="true"
                >
                  <Icon name="grip" size={18} />
                </span>
                <span
                  onPointerDown={startDrag(id)}
                  className="no-touch-scroll flex min-w-0 flex-1 cursor-grab items-center gap-2.5 active:cursor-grabbing"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-ink font-display text-sm font-extrabold text-white">
                    {index + 1}
                  </span>
                  <span className="min-w-0 text-[15px] leading-snug font-semibold">{item.label}</span>
                </span>
                {revealing && !inPlace && (
                  <span className="flex shrink-0 items-center gap-0.5 rounded-md bg-good px-1.5 py-0.5 font-display text-xs font-extrabold text-white">
                    <Icon name="arrow-right" size={12} strokeWidth={3} />
                    {(correctIndex.get(id) ?? 0) + 1}
                  </span>
                )}
                {!revealing && (
                  <span className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      className="grid size-7 place-items-center rounded-md border-2 border-ink/15 text-ink-soft hover:bg-paper disabled:opacity-30"
                      aria-label={`${labels.moveUp}: ${item.label}`}
                      disabled={!interactive || index === 0}
                      onClick={() => move(id, index - 1)}
                    >
                      <Icon name="chevron-up" size={16} />
                    </button>
                    <button
                      type="button"
                      className="grid size-7 place-items-center rounded-md border-2 border-ink/15 text-ink-soft hover:bg-paper disabled:opacity-30"
                      aria-label={`${labels.moveDown}: ${item.label}`}
                      disabled={!interactive || index === shownOrder.length - 1}
                      onClick={() => move(id, index + 1)}
                    >
                      <Icon name="chevron-down" size={16} />
                    </button>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        {challenge.ends && (
          <p className="mt-2 flex items-center gap-1.5 font-display text-[11px] font-extrabold tracking-[0.14em] text-muted uppercase">
            <Icon name="chevron-down" size={14} /> {challenge.ends.last}
          </p>
        )}
      </div>
      <ActionBar hidden={revealing} status={labels.orderingHint} label={labels.check} disabled={!interactive} onConfirm={submit} />
    </div>
  );
}
