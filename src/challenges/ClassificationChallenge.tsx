import { useMemo, useRef, useState, type MouseEvent } from 'react';
import { usePointerDrag } from '../hooks/usePointerDrag';
import type { ClassItem } from '../types/challenge';
import { ActionBar } from './shared/ActionBar';
import { answerFrom, type ChallengeViewProps } from './types';

const POOL = '__pool__';

interface Ghost {
  id: string;
  label: string;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Clasificar: arrastrar cada ficha a su grupo (una copia sigue al dedo) o
 * tocar la ficha y después el grupo. Las fichas colocadas se pueden mover
 * otra vez, o devolver a la bandeja.
 */
export function ClassificationChallenge({ challenge, presentation, phase, paused, result, labels, onSubmit }: ChallengeViewProps<'classification'>) {
  const interactive = phase === 'active' && !paused;
  const revealing = phase === 'feedback';
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [hoverZone, setHoverZone] = useState<string | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const shown = answerFrom(result, 'classification')?.placements ?? placements;
  const items = useMemo(() => {
    const byId = new Map(challenge.items.map((item) => [item.id, item]));
    return presentation.poolOrder.map((id) => byId.get(id)).filter((i): i is ClassItem => Boolean(i));
  }, [challenge.items, presentation.poolOrder]);
  const pending = items.filter((item) => !shown[item.id]);
  const complete = pending.length === 0;

  const place = (itemId: string, zone: string) => {
    if (!interactive) return;
    setPlacements((current) => {
      const next = { ...current };
      if (zone === POOL) delete next[itemId];
      else next[itemId] = zone;
      return next;
    });
    setSelected(null);
  };
  const tapItem = (itemId: string) => {
    if (!interactive) return;
    // Con una ficha elegida, tocar una ficha ya colocada en OTRO grupo es tocar ese grupo
    // (las fichas cubren la zona: la intención es "ponla aquí", no cambiar de ficha).
    const zone = placements[itemId];
    if (selected && selected !== itemId && zone && zone !== placements[selected]) {
      place(selected, zone);
      return;
    }
    setSelected((current) => (current === itemId ? null : itemId));
  };
  const tapZone = (zone: string) => {
    if (selected) place(selected, zone);
  };

  const zoneAt = (x: number, y: number) =>
    document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-zone-id]')?.dataset.zoneId ?? null;
  const moveGhost = (x: number, y: number, state: Ghost) => {
    if (ghostRef.current) ghostRef.current.style.transform = `translate3d(${x - state.offsetX}px, ${y - state.offsetY}px, 0) rotate(-3deg)`;
  };
  const ghostState = useRef<Ghost | null>(null);

  const startDrag = usePointerDrag<ClassItem>({
    threshold: 5,
    onStart: (item, event) => {
      if (!interactive) return false;
      const source = document.querySelector<HTMLElement>(`[data-chip-id="${item.id}"]`);
      const rect = source?.getBoundingClientRect();
      const state: Ghost = {
        id: item.id,
        label: item.label,
        width: rect?.width ?? 120,
        height: rect?.height ?? 40,
        offsetX: event.clientX - (rect?.left ?? event.clientX),
        offsetY: event.clientY - (rect?.top ?? event.clientY),
      };
      ghostState.current = state;
      setGhost(state);
      setSelected(null);
      requestAnimationFrame(() => moveGhost(event.clientX, event.clientY, state));
      return true;
    },
    onMove: (_item, event) => {
      const state = ghostState.current;
      if (!state) return;
      moveGhost(event.clientX, event.clientY, state);
      const zone = zoneAt(event.clientX, event.clientY);
      setHoverZone((current) => (current === zone ? current : zone));
    },
    onEnd: (item, event, cancelled) => {
      const zone = cancelled ? null : zoneAt(event.clientX, event.clientY);
      ghostState.current = null;
      setGhost(null);
      setHoverZone(null);
      if (zone) place(item.id, zone);
    },
    onTap: (item) => tapItem(item.id),
  });

  const chip = (item: ClassItem) => {
    const zone = shown[item.id];
    const state = revealing
      ? zone === item.category
        ? 'is-good'
        : 'is-bad'
      : selected === item.id
        ? 'is-selected'
        : '';
    return (
      <button
        key={item.id}
        type="button"
        data-chip-id={item.id}
        aria-pressed={selected === item.id}
        disabled={!interactive}
        onPointerDown={startDrag(item)}
        onClick={(event: MouseEvent) => {
          event.stopPropagation(); // no "toca" también la zona que la contiene
          if (event.detail === 0) tapItem(item.id); // teclado
        }}
        className={`pressable no-touch-scroll min-h-10 rounded-xl px-3 py-1.5 text-left text-[13.5px] leading-tight font-semibold ${state} ${
          ghost?.id === item.id ? 'opacity-30' : ''
        } animate-pop`}
      >
        {item.label}
      </button>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        <div className={`grid gap-2.5 ${challenge.categories.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          {challenge.categories.map((category) => {
            const members = items.filter((item) => shown[item.id] === category.id);
            const active = hoverZone === category.id || (selected !== null && interactive);
            return (
              <div
                key={category.id}
                data-zone-id={category.id}
                role="button"
                tabIndex={interactive && selected ? 0 : -1}
                aria-label={`Grupo: ${category.label}`}
                onClick={() => tapZone(category.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    tapZone(category.id);
                  }
                }}
                className={`flex min-h-[86px] flex-col rounded-2xl border-2 p-2.5 transition-colors ${
                  hoverZone === category.id
                    ? 'border-ink bg-volt-soft'
                    : active
                      ? 'border-dashed border-ink bg-card'
                      : 'border-dashed border-ink/25 bg-card/70'
                }`}
              >
                <p className="mb-2 font-display text-[12px] font-extrabold tracking-[0.12em] uppercase">{category.label}</p>
                <div className="flex flex-wrap gap-2">{members.map(chip)}</div>
              </div>
            );
          })}
        </div>

        <div
          data-zone-id={POOL}
          onClick={() => tapZone(POOL)}
          className={`mt-3 rounded-2xl border-2 border-transparent p-1 ${hoverZone === POOL ? 'border-dashed border-ink/40' : ''}`}
        >
          {!revealing && (
            <p className="mb-2 font-display text-[11px] font-extrabold tracking-[0.14em] text-muted uppercase">
              {labels.pendingItems} · {pending.length}
            </p>
          )}
          <div className="flex flex-wrap gap-2">{pending.map(chip)}</div>
        </div>
      </div>

      <ActionBar
        hidden={revealing}
        status={complete ? labels.allPlaced : labels.classificationHint}
        statusTone={complete ? 'ready' : 'normal'}
        label={labels.check}
        disabled={!interactive || !complete}
        onConfirm={() => interactive && complete && onSubmit({ placements })}
      />

      {ghost && (
        <div
          ref={ghostRef}
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 z-50 flex items-center rounded-xl border-2 border-ink bg-volt px-3 py-1.5 text-[13.5px] leading-tight font-semibold shadow-[0_8px_0_var(--color-ink)]"
          style={{ width: ghost.width, minHeight: ghost.height, transform: 'translate3d(-999px, -999px, 0)' }}
        >
          {ghost.label}
        </div>
      )}
    </div>
  );
}
