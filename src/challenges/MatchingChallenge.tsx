import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { usePointerDrag } from '../hooks/usePointerDrag';
import type { MatchItem, MatchPair } from '../types/challenge';
import { formatLabel } from '../utils/format';
import { ActionBar } from './shared/ActionBar';
import { answerFrom, type ChallengeViewProps } from './types';

type Side = 'left' | 'right';
interface Endpoint {
  side: Side;
  id: string;
}
interface Point {
  x: number;
  y: number;
}

const keyOf = (side: Side, id: string) => `${side}:${id}`;

function ordered(items: readonly MatchItem[], order: readonly string[]): MatchItem[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  return order.map((id) => byId.get(id)).filter((i): i is MatchItem => Boolean(i));
}

/** Curva suave entre dos puntos (las líneas "salen" horizontalmente de cada columna). */
function curve(a: Point, b: Point): string {
  const dx = Math.max(24, Math.abs(b.x - a.x) * 0.45);
  const direction = b.x >= a.x ? 1 : -1;
  return `M ${a.x} ${a.y} C ${a.x + dx * direction} ${a.y}, ${b.x - dx * direction} ${b.y}, ${b.x} ${b.y}`;
}

/**
 * Unir con líneas. Se arrastra desde un concepto y la línea sigue al
 * dedo/ratón hasta su pareja (en cualquier dirección). Alternativa: tocar
 * uno y luego el otro (también con teclado). Modo immediate: cada línea se
 * valida al soltarla; modo on-submit: se puede corregir y luego comprobar.
 */
export function MatchingChallenge({ challenge, presentation, phase, paused, result, labels, onSubmit }: ChallengeViewProps<'matching'>) {
  const interactive = phase === 'active' && !paused;
  const revealing = phase === 'feedback';
  const immediate = challenge.validationMode === 'immediate';
  const leftItems = useMemo(() => ordered(challenge.left, presentation.leftOrder), [challenge.left, presentation.leftOrder]);
  const rightItems = useMemo(() => ordered(challenge.right, presentation.rightOrder), [challenge.right, presentation.rightOrder]);
  const solution = useMemo(() => new Map(challenge.pairs.map(([l, r]) => [l, r])), [challenge.pairs]);
  const total = challenge.pairs.length;

  const [pairs, setPairs] = useState<MatchPair[]>([]);
  const [errors, setErrors] = useState(0);
  const [pending, setPending] = useState<Endpoint | null>(null);
  const [dragFrom, setDragFrom] = useState<Endpoint | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [wrong, setWrong] = useState<{ pair: MatchPair; key: number } | null>(null);
  const [anchors, setAnchors] = useState<Record<string, Point>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLElement>());
  const tempPathRef = useRef<SVGPathElement>(null);

  const shownPairs = answerFrom(result, 'matching')?.pairs ?? pairs;
  const byLeft = useMemo(() => new Map(shownPairs.map(([l, r]) => [l, r])), [shownPairs]);
  const byRight = useMemo(() => new Map(shownPairs.map(([l, r]) => [r, l])), [shownPairs]);
  const pairIndex = useMemo(() => {
    const map = new Map<string, number>();
    shownPairs.forEach(([l, r], index) => {
      map.set(keyOf('left', l), index + 1);
      map.set(keyOf('right', r), index + 1);
    });
    return map;
  }, [shownPairs]);

  // Posición del conector de cada elemento (borde interior), relativa al contenedor.
  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const origin = container.getBoundingClientRect();
    const next: Record<string, Point> = {};
    for (const [key, element] of itemRefs.current) {
      const rect = element.getBoundingClientRect();
      next[key] = {
        x: (element.dataset.side === 'left' ? rect.right : rect.left) - origin.left,
        y: rect.top + rect.height / 2 - origin.top,
      };
    }
    setAnchors(next);
  }, []);
  useLayoutEffect(() => {
    measure();
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => {
    if (!wrong) return;
    const id = window.setTimeout(() => setWrong(null), 650);
    return () => window.clearTimeout(id);
  }, [wrong]);

  const isLocked = (endpoint: Endpoint) =>
    immediate && pairs.some(([l, r]) => (endpoint.side === 'left' ? l : r) === endpoint.id);

  const connect = (a: Endpoint, b: Endpoint) => {
    if (a.side === b.side || !interactive) return;
    const left = a.side === 'left' ? a.id : b.id;
    const right = a.side === 'left' ? b.id : a.id;
    if (immediate) {
      if (isLocked({ side: 'left', id: left }) || isLocked({ side: 'right', id: right })) return;
      if (solution.get(left) === right) {
        const next = [...pairs, [left, right] as const];
        setPairs(next);
        if (next.length === total) onSubmit({ pairs: next, errors });
      } else {
        setErrors((n) => n + 1);
        setWrong({ pair: [left, right], key: performance.now() });
      }
      return;
    }
    setPairs((current) => [...current.filter(([l, r]) => l !== left && r !== right), [left, right] as const]);
  };

  const tap = (endpoint: Endpoint) => {
    if (!interactive || isLocked(endpoint)) return;
    if (!pending) {
      setPending(endpoint);
    } else if (pending.side === endpoint.side) {
      setPending(pending.id === endpoint.id ? null : endpoint);
    } else {
      connect(pending, endpoint);
      setPending(null);
    }
  };

  const local = (clientX: number, clientY: number): Point => {
    const origin = containerRef.current?.getBoundingClientRect();
    return { x: clientX - (origin?.left ?? 0), y: clientY - (origin?.top ?? 0) };
  };
  const targetAt = (clientX: number, clientY: number, from: Side): Endpoint | null => {
    const element = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>('[data-match-item]');
    const side = element?.dataset.side as Side | undefined;
    const id = element?.dataset.id;
    if (!side || !id || side === from) return null;
    return isLocked({ side, id }) ? null : { side, id };
  };
  const drawTemp = (from: Endpoint, to: Point | null) => {
    const path = tempPathRef.current;
    const anchor = anchors[keyOf(from.side, from.id)];
    if (!path) return;
    if (!to || !anchor) {
      path.style.visibility = 'hidden';
      return;
    }
    path.setAttribute('d', curve(anchor, to));
    path.style.visibility = 'visible';
  };

  const startDrag = usePointerDrag<Endpoint>({
    threshold: 5,
    onStart: (from, event) => {
      if (!interactive || isLocked(from)) return false;
      setPending(null);
      setDragFrom(from);
      drawTemp(from, local(event.clientX, event.clientY));
      return true;
    },
    onMove: (from, event) => {
      drawTemp(from, local(event.clientX, event.clientY));
      const target = targetAt(event.clientX, event.clientY, from.side);
      const key = target ? keyOf(target.side, target.id) : null;
      setHoverKey((current) => (current === key ? current : key));
    },
    onEnd: (from, event, cancelled) => {
      const target = cancelled ? null : targetAt(event.clientX, event.clientY, from.side);
      drawTemp(from, null);
      setDragFrom(null);
      setHoverKey(null);
      if (target) connect(from, target);
      else if (!immediate && !cancelled) {
        // Soltar en el vacío una línea existente la elimina (modo on-submit).
        setPairs((current) => current.filter(([l, r]) => (from.side === 'left' ? l : r) !== from.id));
      }
    },
    onTap: (endpoint) => tap(endpoint),
  });

  const complete = pairs.length === total;
  const submit = () => {
    if (interactive && complete && !immediate) onSubmit({ pairs, errors: 0 });
  };

  const lineFor = (pair: MatchPair): { d: string; className: string } | null => {
    const a = anchors[keyOf('left', pair[0])];
    const b = anchors[keyOf('right', pair[1])];
    if (!a || !b) return null;
    const correct = solution.get(pair[0]) === pair[1];
    const className = revealing
      ? correct
        ? 'stroke-good'
        : 'stroke-bad [stroke-dasharray:7_6]'
      : immediate
        ? 'stroke-good'
        : 'stroke-ink';
    return { d: curve(a, b), className };
  };

  const renderItem = (item: MatchItem, side: Side, index: number) => {
    const key = keyOf(side, item.id);
    const endpoint = { side, id: item.id };
    const leftId = side === 'left' ? item.id : byRight.get(item.id);
    const rightId = side === 'left' ? byLeft.get(item.id) : item.id;
    const connected = leftId !== undefined && rightId !== undefined;
    const correctPair = connected && solution.get(leftId) === rightId;
    const isWrongFlash = wrong && (side === 'left' ? wrong.pair[0] : wrong.pair[1]) === item.id;
    const active =
      (pending && pending.side === side && pending.id === item.id) || (dragFrom && dragFrom.side === side && dragFrom.id === item.id);
    const state = revealing
      ? connected
        ? correctPair
          ? 'is-good'
          : 'is-bad'
        : 'is-dim'
      : isLocked(endpoint)
        ? 'is-good'
        : active || hoverKey === key
          ? 'is-selected'
          : '';
    return (
      <button
        key={key}
        ref={(element) => {
          if (element) itemRefs.current.set(key, element);
          else itemRefs.current.delete(key);
        }}
        type="button"
        data-match-item=""
        data-side={side}
        data-id={item.id}
        aria-pressed={Boolean(active)}
        aria-label={`${item.label}${connected ? ` (unido, pareja ${pairIndex.get(key)})` : ''}`}
        disabled={!interactive}
        onPointerDown={startDrag(endpoint)}
        onClick={(event: MouseEvent) => {
          if (event.detail === 0) tap(endpoint); // teclado (Enter/Espacio)
        }}
        className={`pressable no-touch-scroll relative flex min-h-[52px] w-full items-center px-3 py-2 text-[13.5px] leading-tight font-semibold ${
          side === 'left' ? 'justify-start text-left' : 'justify-end text-right'
        } ${state} ${isWrongFlash ? 'animate-shake' : ''} animate-rise`}
        style={{ animationDelay: `${index * 40}ms` }}
      >
        <span className="line-clamp-3">{item.label}</span>
        <span
          aria-hidden="true"
          className={`absolute top-1/2 grid size-[18px] -translate-y-1/2 place-items-center rounded-full border-2 border-ink font-display text-[10px] font-extrabold ${
            side === 'left' ? '-right-[11px]' : '-left-[11px]'
          } ${connected ? 'bg-volt' : 'bg-card'}`}
        >
          {connected ? pairIndex.get(key) : ''}
        </span>
      </button>
    );
  };

  const wrongLine = wrong
    ? (() => {
        const a = anchors[keyOf('left', wrong.pair[0])];
        const b = anchors[keyOf('right', wrong.pair[1])];
        return a && b ? curve(a, b) : null;
      })()
    : null;

  return (
    <div className="flex h-full flex-col">
      {/* Al terminar las animaciones de entrada se vuelven a medir los conectores. */}
      <div ref={containerRef} className="relative min-h-0 flex-1 py-2" onAnimationEnd={measure}>
        {challenge.headers && (
          <div className="mb-2 grid grid-cols-2 gap-x-9 font-display sm:gap-x-20 text-[11px] font-extrabold tracking-[0.14em] text-muted uppercase">
            <span>{challenge.headers.left}</span>
            <span className="text-right">{challenge.headers.right}</span>
          </div>
        )}
        {/* Las fichas van por encima de las líneas: los números de pareja siempre se leen. */}
        <div className="relative z-30 grid grid-cols-2 gap-x-9 sm:gap-x-20">
          <div className="flex flex-col justify-center gap-2.5">{leftItems.map((item, i) => renderItem(item, 'left', i))}</div>
          <div className="flex flex-col justify-center gap-2.5">{rightItems.map((item, i) => renderItem(item, 'right', i))}</div>
        </div>
        <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible" aria-hidden="true">
          {shownPairs.map((pair) => {
            const line = lineFor(pair);
            return line ? (
              <path key={`${pair[0]}-${pair[1]}`} d={line.d} className={`fill-none ${line.className}`} strokeWidth={3.5} strokeLinecap="round" />
            ) : null;
          })}
          {wrongLine && (
            <path key={wrong?.key} d={wrongLine} className="animate-fade fill-none stroke-bad [stroke-dasharray:6_6]" strokeWidth={3.5} strokeLinecap="round" />
          )}
          <path ref={tempPathRef} className="fill-none stroke-ink [stroke-dasharray:2_7]" strokeWidth={3.5} strokeLinecap="round" style={{ visibility: 'hidden' }} />
        </svg>
      </div>
      <ActionBar
        hidden={revealing}
        status={
          immediate
            ? `${formatLabel(labels.connectionsDetail, { correct: pairs.length, total })}${errors > 0 ? ` · ${formatLabel(labels.errorsDetail, { errors })}` : ''}`
            : formatLabel(labels.connectionsDetail, { correct: pairs.length, total })
        }
        statusTone={complete ? 'ready' : 'normal'}
        label={immediate ? undefined : labels.check}
        disabled={!interactive || !complete}
        onConfirm={submit}
      />
    </div>
  );
}
