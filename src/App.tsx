import { startTransition, useCallback, useMemo, useState } from 'react';
import { GameScreen } from './components/game/GameScreen';
import { ResultsScreen } from './components/screens/ResultsScreen';
import { ReviewScreen } from './components/screens/ReviewScreen';
import { StartScreen } from './components/screens/StartScreen';
import { readUrlOverrides, withOverrides } from './config/urlOptions';
import { findActivity } from './data';
import { useFeedbackEffects } from './hooks/useFeedbackEffects';
import { useGame } from './hooks/useGame';
import { loadSoundPreference, saveSoundPreference } from './services/preferences';
import { playSound, unlockAudio } from './services/sound';

/** Tras terminar: resultados o revisión (con un desafío opcional enfocado). */
type FinishedView = { screen: 'results' } | { screen: 'review'; focusIndex?: number };

/** Actividad y personalización desde el enlace (?activity=…&count=…&mechanics=…&time=…). */
function activityFromUrl() {
  const { search } = window.location;
  const activity = findActivity(new URLSearchParams(search).get('activity'));
  return withOverrides(activity, readUrlOverrides(search));
}

/**
 * Flujo completo: Inicio → 20 desafíos → Resultados → Revisión.
 * La pantalla se deriva del estado del motor; solo "resultados / revisión"
 * es estado local de la interfaz.
 */
export default function App() {
  const activity = useMemo(activityFromUrl, []);
  const game = useGame(activity);
  const { state, config, labels, report, start, reset } = game;
  const [soundOn, setSoundOn] = useState(() => loadSoundPreference(config.effects.sound));
  const [finishedView, setFinishedView] = useState<FinishedView>({ screen: 'results' });

  useFeedbackEffects(state, config, soundOn);

  const toggleSound = useCallback(() => {
    setSoundOn((enabled) => {
      const next = !enabled;
      saveSoundPreference(next);
      if (next) {
        unlockAudio();
        playSound('click');
      }
      return next;
    });
  }, []);

  const play = useCallback(() => {
    unlockAudio(); // el gesto de "Comenzar" habilita el audio en móviles
    // Montar la partida es el render más pesado: como transición, React lo trocea y no bloquea.
    startTransition(() => {
      setFinishedView({ screen: 'results' });
      start();
    });
  }, [start]);

  if (state.status === 'idle') {
    return (
      <StartScreen
        activity={activity}
        config={config}
        labels={labels}
        soundOn={soundOn}
        onToggleSound={toggleSound}
        onStart={play}
      />
    );
  }

  if (state.status === 'playing') {
    return <GameScreen game={game} soundOn={soundOn} onToggleSound={toggleSound} onExit={reset} />;
  }

  if (!report) return null;

  if (finishedView.screen === 'review') {
    return (
      <ReviewScreen
        queue={state.queue}
        results={state.results}
        labels={labels}
        focusIndex={finishedView.focusIndex}
        onBack={() => setFinishedView({ screen: 'results' })}
      />
    );
  }

  return (
    <ResultsScreen
      activity={activity}
      report={report}
      results={state.results}
      labels={labels}
      onReview={(focusIndex) => setFinishedView({ screen: 'review', focusIndex })}
      onPlayAgain={play}
      onHome={reset}
    />
  );
}
