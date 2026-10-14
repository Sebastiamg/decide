import { useMemo, useState } from 'react';
import { Icon } from '../components/ui/Icon';
import { formatLabel } from '../utils/format';
import { ActionBar } from './shared/ActionBar';
import { digitIndex, useKeyboard } from './shared/useKeyboard';
import { orderedOptions } from './SingleChoiceChallenge';
import { answerFrom, type ChallengeViewProps } from './types';

/**
 * Selecciona N (exactamente) o "selecciona todas las correctas". Con N
 * fijo no deja pasar de N: avisa con una sacudida (o reemplaza la más
 * antigua si la configuración lo pide). Confirmar es un gesto deliberado.
 */
export function MultipleChoiceChallenge({
  challenge,
  presentation,
  phase,
  paused,
  result,
  labels,
  config,
  onSubmit,
}: ChallengeViewProps<'multiple-choice'>) {
  const interactive = phase === 'active' && !paused;
  const revealing = phase === 'feedback';
  const options = useMemo(
    () => orderedOptions(challenge.options, presentation.optionOrder),
    [challenge.options, presentation.optionOrder],
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [overflowPulse, setOverflowPulse] = useState(0);
  const rule = challenge.selection;
  const exact = rule.mode === 'exact' ? rule.count : null;
  const shown = answerFrom(result, 'multiple-choice')?.optionIds ?? selected;
  const ready = exact !== null ? selected.length === exact : selected.length > 0;

  const toggle = (id: string) => {
    if (!interactive) return;
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
      setOverflowPulse(0);
      return;
    }
    if (exact !== null && selected.length >= exact) {
      if (config.mechanics.selectionOverflow === 'replace-oldest') {
        setSelected([...selected.slice(1), id]);
        setOverflowPulse(0);
      } else {
        setOverflowPulse((n) => n + 1); // bloqueado: se avisa, no se cambia nada
      }
      return;
    }
    setSelected([...selected, id]);
    setOverflowPulse(0);
  };
  const confirm = () => {
    if (interactive && ready) onSubmit({ optionIds: selected });
  };
  useKeyboard(interactive, (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      confirm();
      return;
    }
    const index = digitIndex(event);
    const option = index === null ? undefined : options[index];
    if (option) toggle(option.id);
  });

  const full = overflowPulse > 0;
  const status = full
    ? formatLabel(labels.selectionFull, { count: exact ?? 0 })
    : exact !== null
      ? formatLabel(labels.selectedExact, { selected: selected.length, count: exact })
      : formatLabel(labels.selectedSome, { selected: selected.length });

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        <div role="group" aria-label={challenge.prompt} className={challenge.layout === 'grid' ? 'grid gap-2.5 sm:grid-cols-2' : 'grid gap-2.5'}>
          {options.map((option, index) => {
            const isSelected = shown.includes(option.id);
            const isAnswer = challenge.answers.includes(option.id);
            const state = revealing
              ? isSelected
                ? isAnswer
                  ? 'is-good'
                  : 'is-bad'
                : isAnswer
                  ? 'border-dashed border-good'
                  : 'is-dim'
              : isSelected
                ? 'is-selected'
                : '';
            return (
              <button
                key={option.id}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                disabled={!interactive}
                onClick={() => toggle(option.id)}
                className={`pressable flex min-h-14 items-center gap-3 px-4 py-3 text-left ${state} animate-rise`}
                style={{ animationDelay: `${index * 35}ms` }}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-lg border-2 border-ink font-display text-sm font-extrabold ${
                    isSelected ? 'bg-ink text-white' : 'bg-card text-muted'
                  }`}
                >
                  {isSelected ? <Icon name="check" size={16} strokeWidth={3} /> : index + 1}
                </span>
                <span className="min-w-0 flex-1 text-[15px] leading-snug font-semibold">{option.label}</span>
                {revealing && isAnswer && !isSelected && (
                  <Icon name="check" size={16} strokeWidth={3} className="shrink-0 text-good" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <ActionBar
        key={full ? `full-${overflowPulse}` : 'status'}
        hidden={revealing}
        status={status}
        statusTone={full ? 'alert' : ready ? 'ready' : 'normal'}
        label={labels.confirm}
        disabled={!interactive || !ready}
        onConfirm={confirm}
      />
    </div>
  );
}
