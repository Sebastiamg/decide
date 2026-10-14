/**
 * Contenido de DECIDE. El motor solo conoce estas formas: ninguna materia,
 * ninguna pregunta concreta. Cada mecánica es una variante de la unión
 * discriminada `Challenge` (campo `type`).
 *
 * Añadir una mecánica nueva = añadir aquí su interfaz + su entrada en
 * `AnswerMap` y `PresentationMap`. TypeScript señalará después todos los
 * registros que deben completarse (motor y UI), y nada más.
 */

export type Difficulty = 'easy' | 'medium' | 'hard';

/** Apoyo visual opcional del enunciado. */
export interface ChallengeMedia {
  /** Emoji o símbolo grande (sin descargas). */
  emoji?: string;
  /** Imagen con texto alternativo obligatorio. */
  image?: { src: string; alt: string };
}

interface ChallengeBase {
  id: string;
  /** Instrucción visible. Si se omite, el motor la genera según la mecánica ("SELECCIONA 3"). */
  instruction?: string;
  /** Enunciado: la pregunta o la afirmación. */
  prompt: string;
  /** Segundos disponibles para este desafío. */
  timeLimit: number;
  difficulty?: Difficulty;
  /** Se muestra al fallar y en la revisión. */
  explanation?: string;
  /** Tema, para analíticas del profesor ("Independencia", "Edad Media"...). */
  topic?: string;
  tags?: readonly string[];
  media?: ChallengeMedia;
  metadata?: Readonly<Record<string, unknown>>;
}

// ─── Binario: Sí/No, Verdadero/Falso, Correcto/Incorrecto, A/B ────────

export type BinaryVariant = 'true-false' | 'yes-no' | 'correct-incorrect' | 'a-b' | 'custom';

export interface BinaryOption {
  id: string;
  label: string;
  /** Texto adicional (en A/B, el contenido de cada opción). */
  detail?: string;
}

export interface BinaryChallenge extends ChallengeBase {
  type: 'binary';
  variant: BinaryVariant;
  /** [izquierda, derecha]. El contenido decide qué va a cada lado, no el motor. */
  options: readonly [BinaryOption, BinaryOption];
  /** id de la opción correcta. */
  answer: string;
}

// ─── Elegir ──────────────────────────────────────────────────────────

export interface ChoiceOption {
  id: string;
  label: string;
  detail?: string;
  /** Símbolo grande para desafíos de observación (layout 'tiles'). */
  symbol?: string;
}

/** list = una columna; grid = dos columnas en pantallas anchas; tiles = mosaico de símbolos (observación). */
export type ChoiceLayout = 'list' | 'grid' | 'tiles';

export interface SingleChoiceChallenge extends ChallengeBase {
  type: 'single-choice';
  options: readonly ChoiceOption[];
  answer: string;
  layout?: ChoiceLayout;
  /** Por defecto se barajan; false para listas con orden propio. */
  shuffleOptions?: boolean;
}

/** exact = "Selecciona N"; all = "Selecciona todas las correctas" (sin revelar cuántas). */
export type SelectionRule = { mode: 'exact'; count: number } | { mode: 'all' };

export interface MultipleChoiceChallenge extends ChallengeBase {
  type: 'multiple-choice';
  options: readonly ChoiceOption[];
  answers: readonly string[];
  selection: SelectionRule;
  layout?: ChoiceLayout;
  shuffleOptions?: boolean;
}

// ─── Unir con líneas ─────────────────────────────────────────────────

export interface MatchItem {
  id: string;
  label: string;
}

export type MatchPair = readonly [left: string, right: string];

export interface MatchingChallenge extends ChallengeBase {
  type: 'matching';
  left: readonly MatchItem[];
  right: readonly MatchItem[];
  /** Parejas correctas [idIzquierda, idDerecha]. */
  pairs: readonly MatchPair[];
  /** immediate: cada línea se valida al crearla. on-submit: se comprueba todo al final. */
  validationMode?: 'immediate' | 'on-submit';
  headers?: { left: string; right: string };
}

// ─── Ordenar ─────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  label: string;
  detail?: string;
}

export interface OrderingChallenge extends ChallengeBase {
  type: 'ordering';
  /** En el orden CORRECTO: el motor los presenta mezclados. */
  items: readonly OrderItem[];
  /** Rótulos de los extremos, p. ej. "Más antiguo" / "Más reciente". */
  ends?: { first: string; last: string };
}

// ─── Clasificar (arrastrar a zonas) ──────────────────────────────────

export interface ClassCategory {
  id: string;
  label: string;
}

export interface ClassItem {
  id: string;
  label: string;
  /** id de la categoría correcta. */
  category: string;
}

export interface ClassificationChallenge extends ChallengeBase {
  type: 'classification';
  categories: readonly ClassCategory[];
  items: readonly ClassItem[];
}

// ─── Uniones y mapas por mecánica ────────────────────────────────────

export type Challenge =
  | BinaryChallenge
  | SingleChoiceChallenge
  | MultipleChoiceChallenge
  | MatchingChallenge
  | OrderingChallenge
  | ClassificationChallenge;

export type ChallengeType = Challenge['type'];
export type ChallengeOf<T extends ChallengeType> = Extract<Challenge, { type: T }>;

/** Lo que entrega cada mecánica al responder. */
export interface AnswerMap {
  binary: { optionId: string };
  'single-choice': { optionId: string };
  'multiple-choice': { optionIds: readonly string[] };
  /** errors: conexiones equivocadas rechazadas (modo immediate). */
  matching: { pairs: readonly MatchPair[]; errors: number };
  ordering: { order: readonly string[] };
  classification: { placements: Readonly<Record<string, string>> };
}

export type AnswerOf<T extends ChallengeType> = AnswerMap[T];

export type ChallengeAnswer = { [T in ChallengeType]: { type: T; value: AnswerMap[T] } }[ChallengeType];

/** Cómo se presenta el desafío en ESTA partida (barajados con semilla: reproducible). */
export interface PresentationMap {
  binary: { readonly sides: 'as-authored' };
  'single-choice': { optionOrder: readonly string[] };
  'multiple-choice': { optionOrder: readonly string[] };
  matching: { leftOrder: readonly string[]; rightOrder: readonly string[] };
  ordering: { initialOrder: readonly string[] };
  classification: { poolOrder: readonly string[] };
}

export type PresentationOf<T extends ChallengeType> = PresentationMap[T];

/** Desafío listo para jugar: contenido + presentación de esta partida. */
export type PlayableChallenge = {
  [T in ChallengeType]: { type: T; challenge: ChallengeOf<T>; presentation: PresentationMap[T] };
}[ChallengeType];
