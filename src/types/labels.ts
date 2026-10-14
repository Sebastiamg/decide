import type { ChallengeType } from './challenge';

/** Textos de interfaz. Plantillas con {count}, {selected}, {current}, {total}, {correct}, {errors}. */
export interface UiLabels {
  appName: string;
  tagline: readonly string[];
  start: string;
  rules: readonly string[];
  challengesCount: string;
  timeLimited: string;
  // Instrucciones automáticas por mecánica
  instructionTrueFalse: string;
  instructionYesNo: string;
  instructionCorrectIncorrect: string;
  instructionAB: string;
  instructionBinary: string;
  instructionSingle: string;
  instructionObserve: string;
  instructionMultipleExact: string;
  instructionMultipleAll: string;
  instructionMatching: string;
  instructionOrdering: string;
  instructionClassification: string;
  // Juego
  challengeCounter: string;
  challengeLabel: string;
  points: string;
  streak: string;
  confirm: string;
  check: string;
  selectedExact: string;
  selectedSome: string;
  selectionFull: string;
  swipeHint: string;
  matchingHint: string;
  orderingHint: string;
  classificationHint: string;
  moveUp: string;
  moveDown: string;
  pendingItems: string;
  allPlaced: string;
  // Feedback
  correctTitle: string;
  /** Se rotan al fallar (sin acierto parcial). */
  incorrectMessages: readonly string[];
  /** Al fallar con la mitad o más de las partes correctas. */
  almostMessage: string;
  timeoutTitle: string;
  correctAnswerWas: string;
  precision: string;
  connectionsDetail: string;
  errorsDetail: string;
  continue: string;
  // Pausa
  pause: string;
  pausedTitle: string;
  resume: string;
  exit: string;
  soundOn: string;
  soundOff: string;
  // Resultados y revisión
  resultsTitle: string;
  resultExcellent: string;
  resultGood: string;
  resultOk: string;
  resultKeepGoing: string;
  correctCount: string;
  perChallenge: string;
  accuracy: string;
  totalPoints: string;
  maxStreak: string;
  averageTime: string;
  byMechanic: string;
  review: string;
  playAgain: string;
  backToStart: string;
  back: string;
  reviewTitle: string;
  onlyMistakes: string;
  allChallenges: string;
  yourAnswer: string;
  correctAnswer: string;
  noAnswer: string;
  outcomeCorrect: string;
  outcomeIncorrect: string;
  outcomeTimeout: string;
  noMistakes: string;
  mechanicNames: Readonly<Record<ChallengeType, string>>;
}
