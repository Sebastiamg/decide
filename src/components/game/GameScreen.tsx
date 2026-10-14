import { useEffect } from 'react';
import { ChallengeRenderer, mechanicIcon, mechanicShowsPrompt } from '../../challenges/ChallengeRenderer';
import { isStreakVisible } from '../../engine/streakEngine';
import { timeLimitMs } from '../../engine/timerEngine';
import { describeSolution, instructionFor } from '../../engine/validationEngine';
import type { GameController } from '../../hooks/useGame';
import { ChallengeHeader } from './ChallengeHeader';
import { FeedbackBanner } from './FeedbackBanner';
import { feedbackMessage, precisionText } from './feedbackText';
import { Hud } from './Hud';
import { PauseOverlay } from './PauseOverlay';
import { TimerBar } from './TimerBar';

interface GameScreenProps {
  game: GameController;
  soundOn: boolean;
  onToggleSound: () => void;
  onExit: () => void;
}

/**
 * Pantalla de juego: HUD + cabecera común (instrucción, enunciado, tiempo)
 * + la mecánica que toque + feedback. Es igual para cualquier materia.
 */
export function GameScreen({ game, soundOn, onToggleSound, onExit }: GameScreenProps) {
  const { state, current, config, labels, lastResult, advanceIn, submit, next, pause, resume } = game;
  const feedback = state.phase === 'feedback' && lastResult ? lastResult : null;

  // Durante el feedback, Enter o Espacio pasan al siguiente desafío.
  useEffect(() => {
    if (!feedback || state.paused || !config.feedback.allowSkip) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [feedback, state.paused, config.feedback.allowSkip, next]);

  if (!current) return null;
  const { challenge } = current;
  const instruction = instructionFor(challenge, labels);
  const running = state.phase === 'active' && !state.paused;
  // Una sola región viva y persistente: anuncia el desafío al arrancar el reloj y el resultado.
  let announcement = '';
  if (state.phase === 'active') announcement = `${instruction}. ${challenge.prompt}`;
  else if (feedback) {
    const parts = [feedbackMessage(feedback, labels), precisionText(feedback, labels)];
    if (feedback.outcome === 'correct') parts.push(`+${feedback.score.total} ${labels.points}`);
    else parts.push(`${labels.correctAnswerWas}: ${describeSolution(current).join('; ')}`);
    announcement = parts.filter(Boolean).join('. ');
  }

  return (
    <div className="paper flex h-dvh flex-col">
      <Hud
        current={state.currentIndex + 1}
        completed={state.results.length}
        total={state.queue.length}
        score={state.score}
        streak={state.streak}
        showStreak={isStreakVisible(state.streak, config.streaks)}
        soundOn={soundOn}
        labels={labels}
        onToggleSound={onToggleSound}
        onPause={pause}
      />
      <main className="safe-bottom relative mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-4">
        <ChallengeHeader
          key={`header-${state.seed}-${state.currentIndex}`}
          instruction={instruction}
          icon={mechanicIcon(current.type)}
          prompt={mechanicShowsPrompt(current.type) ? null : challenge.prompt}
          media={mechanicShowsPrompt(current.type) ? undefined : challenge.media}
          timer={
            config.timer.enabled ? (
              <TimerBar
                key={`timer-${state.seed}-${state.currentIndex}`}
                limitMs={timeLimitMs(challenge, config.timer)}
                timing={state.timing}
                running={running}
                config={config.timer}
              />
            ) : null
          }
        />
        <div key={`challenge-${state.seed}-${state.currentIndex}`} className="relative min-h-0 flex-1 pb-1 animate-rise">
          <ChallengeRenderer
            playable={current}
            phase={state.phase}
            paused={state.paused}
            result={feedback}
            labels={labels}
            config={config}
            onSubmit={submit}
          />
        </div>
        {/* En pausa se desmonta: al continuar, la barra de avance arranca de nuevo con el temporizador. */}
        {feedback && !state.paused && (
          <FeedbackBanner
            key={`feedback-${feedback.index}`}
            result={feedback}
            playable={current}
            labels={labels}
            config={config}
            advanceIn={advanceIn}
            onContinue={next}
          />
        )}
      </main>
      {state.paused && <PauseOverlay labels={labels} onResume={resume} onExit={onExit} />}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </div>
  );
}
