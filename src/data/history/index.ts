import type { Activity } from '../../types/activity';
import { historyChallenges } from './historyChallenges';

/** Demo de Historia: el mismo motor servirá para cualquier otra materia. */
export const historyActivity: Activity = {
  id: 'historia-demo',
  title: 'Historia',
  subject: 'Estudios Sociales',
  grade: 'Educación General Básica Superior',
  description: 'De las primeras civilizaciones al siglo XX, pasando por la independencia del Ecuador.',
  icon: '🏛️',
  challenges: historyChallenges,
  config: {
    challengeCount: 20,
    // Cuotas por mecánica: cada partida mezcla todas (6 + 4 + 4 + 3 + 2 + 1 = 20).
    selection: {
      strategy: 'weighted',
      weights: { binary: 6, 'single-choice': 4, 'multiple-choice': 4, matching: 3, ordering: 2, classification: 1 },
    },
  },
};
