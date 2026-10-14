import type {
  BinaryChallenge,
  ChallengeMedia,
  ChoiceLayout,
  ChoiceOption,
  ClassificationChallenge,
  Difficulty,
  MatchingChallenge,
  MultipleChoiceChallenge,
  OrderingChallenge,
  SingleChoiceChallenge,
} from '../types/challenge';

/*
 * Atajos para AUTORES de contenido: escribir un desafío en una línea, con
 * ids generados a partir de los textos y un tiempo razonable según la
 * mecánica (se puede fijar `timeLimit` en cada uno). No forman parte del
 * motor: solo producen objetos `Challenge` normales.
 */

interface BaseInput {
  id: string;
  prompt: string;
  timeLimit?: number;
  difficulty?: Difficulty;
  explanation?: string;
  topic?: string;
  instruction?: string;
  media?: ChallengeMedia;
  tags?: readonly string[];
}

/** "Simón Bolívar" → "simon-bolivar". */
export function slug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function base(input: BaseInput, defaultSeconds: number) {
  const { timeLimit, ...rest } = input;
  return { ...rest, timeLimit: timeLimit ?? defaultSeconds };
}

// ─── Binarios ────────────────────────────────────────────────────────

export function trueFalse(input: BaseInput & { answer: boolean; trueOnLeft?: boolean }): BinaryChallenge {
  const falseOption = { id: 'false', label: 'Falso' };
  const trueOption = { id: 'true', label: 'Verdadero' };
  const { answer, trueOnLeft, ...rest } = input;
  return {
    ...base(rest, 7),
    type: 'binary',
    variant: 'true-false',
    options: trueOnLeft ? [trueOption, falseOption] : [falseOption, trueOption],
    answer: answer ? 'true' : 'false',
  };
}

export function yesNo(input: BaseInput & { answer: boolean; yesOnLeft?: boolean }): BinaryChallenge {
  const no = { id: 'no', label: 'No' };
  const yes = { id: 'yes', label: 'Sí' };
  const { answer, yesOnLeft, ...rest } = input;
  return {
    ...base(rest, 7),
    type: 'binary',
    variant: 'yes-no',
    options: yesOnLeft ? [yes, no] : [no, yes],
    answer: answer ? 'yes' : 'no',
  };
}

export function correctIncorrect(input: BaseInput & { answer: boolean }): BinaryChallenge {
  const { answer, ...rest } = input;
  return {
    ...base(rest, 7),
    type: 'binary',
    variant: 'correct-incorrect',
    options: [
      { id: 'incorrect', label: 'Incorrecto' },
      { id: 'correct', label: 'Correcto' },
    ],
    answer: answer ? 'correct' : 'incorrect',
  };
}

export function aOrB(input: BaseInput & { a: string; b: string; answer: 'a' | 'b' }): BinaryChallenge {
  const { a, b, answer, ...rest } = input;
  return {
    ...base(rest, 8),
    type: 'binary',
    variant: 'a-b',
    options: [
      { id: 'a', label: 'A', detail: a },
      { id: 'b', label: 'B', detail: b },
    ],
    answer,
  };
}

// ─── Elegir ──────────────────────────────────────────────────────────

type OptionInput = string | { label: string; symbol?: string; detail?: string };

function toOptions(options: readonly OptionInput[]): ChoiceOption[] {
  return options.map((option) => {
    const label = typeof option === 'string' ? option : option.label;
    return typeof option === 'string' ? { id: slug(label), label } : { id: slug(label), ...option };
  });
}

export function singleChoice(
  input: BaseInput & { options: readonly OptionInput[]; answer: string; layout?: ChoiceLayout; shuffleOptions?: boolean },
): SingleChoiceChallenge {
  const { options, answer, layout, shuffleOptions, ...rest } = input;
  return {
    ...base(rest, layout === 'tiles' ? 8 : 9),
    type: 'single-choice',
    options: toOptions(options),
    answer: slug(answer),
    layout,
    shuffleOptions,
  };
}

/** "Selecciona N": N = número de respuestas correctas. */
export function selectExact(
  input: BaseInput & { options: readonly OptionInput[]; answers: readonly string[]; layout?: ChoiceLayout },
): MultipleChoiceChallenge {
  const { options, answers, layout, ...rest } = input;
  return {
    ...base(rest, 6 + answers.length * 2),
    type: 'multiple-choice',
    options: toOptions(options),
    answers: answers.map(slug),
    selection: { mode: 'exact', count: answers.length },
    layout,
  };
}

/** "Selecciona todas las correctas" (no se dice cuántas son). */
export function selectAll(
  input: BaseInput & { options: readonly OptionInput[]; answers: readonly string[]; layout?: ChoiceLayout },
): MultipleChoiceChallenge {
  const { options, answers, layout, ...rest } = input;
  return {
    ...base(rest, 13),
    type: 'multiple-choice',
    options: toOptions(options),
    answers: answers.map(slug),
    selection: { mode: 'all' },
    layout,
  };
}

// ─── Unir, ordenar, clasificar ───────────────────────────────────────

export function matching(
  input: BaseInput & {
    pairs: readonly (readonly [string, string])[];
    headers?: { left: string; right: string };
    validationMode?: 'immediate' | 'on-submit';
  },
): MatchingChallenge {
  const { pairs, headers, validationMode, ...rest } = input;
  const left = pairs.map(([label]) => ({ id: `l-${slug(label)}`, label }));
  const right = pairs.map(([, label]) => ({ id: `r-${slug(label)}`, label }));
  return {
    ...base(rest, Math.round(4 + pairs.length * 3.5)),
    type: 'matching',
    left,
    right,
    pairs: pairs.map(([l, r]) => [`l-${slug(l)}`, `r-${slug(r)}`] as const),
    headers,
    validationMode,
  };
}

/** `items` en el orden CORRECTO. */
export function ordering(
  input: BaseInput & {
    items: readonly (string | { label: string; detail?: string })[];
    ends?: { first: string; last: string };
  },
): OrderingChallenge {
  const { items, ends, ...rest } = input;
  return {
    ...base(rest, 5 + items.length * 3),
    type: 'ordering',
    items: items.map((item) =>
      typeof item === 'string' ? { id: slug(item), label: item } : { id: slug(item.label), ...item },
    ),
    ends,
  };
}

/** `groups`: { 'Edad Media': ['Cruzadas', 'Peste negra'], ... } */
export function classification(
  input: BaseInput & { groups: Readonly<Record<string, readonly string[]>> },
): ClassificationChallenge {
  const { groups, ...rest } = input;
  const categories = Object.keys(groups).map((label) => ({ id: `c-${slug(label)}`, label }));
  const items = Object.entries(groups).flatMap(([category, members]) =>
    members.map((label) => ({ id: slug(label), label, category: `c-${slug(category)}` })),
  );
  return {
    ...base(rest, 6 + items.length * 2),
    type: 'classification',
    categories,
    items,
  };
}
