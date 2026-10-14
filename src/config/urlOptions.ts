import { challengeDefinitions } from '../engine/challengeTypes';
import type { Activity } from '../types/activity';
import type { ChallengeType, Difficulty } from '../types/challenge';
import type { GameConfigOverrides } from '../types/config';

const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'];

function isChallengeType(value: string): value is ChallengeType {
  return Object.hasOwn(challengeDefinitions, value);
}

function list(params: URLSearchParams, key: string): string[] {
  return (params.get(key) ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

/**
 * Personalización por enlace, sin tocar código (pensada para docentes):
 *
 *   ?activity=historia-demo     actividad
 *   &count=10                   desafíos por partida (1–50)
 *   &mechanics=matching,binary  solo esas mecánicas
 *   &difficulty=easy,medium     solo esas dificultades
 *   &time=1.5                   tiempo ampliado ×1.5 (accesibilidad) · time=off: sin reloj
 *
 * Los valores no válidos se ignoran: el enlace nunca rompe la actividad.
 */
export function readUrlOverrides(search: string): GameConfigOverrides | null {
  const params = new URLSearchParams(search);
  const overrides: GameConfigOverrides = {};
  let changed = false;

  const count = Number(params.get('count'));
  if (params.has('count') && Number.isFinite(count) && count >= 1) {
    overrides.challengeCount = Math.min(50, Math.round(count));
    changed = true;
  }

  const types = list(params, 'mechanics').filter(isChallengeType);
  const difficulties = list(params, 'difficulty').filter((value): value is Difficulty =>
    (DIFFICULTIES as readonly string[]).includes(value),
  );
  if (types.length > 0 || difficulties.length > 0) {
    overrides.selection = {
      ...(types.length > 0 && { types }),
      ...(difficulties.length > 0 && { difficulties }),
    };
    changed = true;
  }

  const time = params.get('time');
  if (time === 'off') {
    overrides.timer = { enabled: false };
    changed = true;
  } else if (time !== null) {
    const scale = Number(time);
    if (Number.isFinite(scale) && scale >= 0.5 && scale <= 4) {
      overrides.timer = { scale };
      changed = true;
    }
  }

  return changed ? overrides : null;
}

/** Aplica las opciones del enlace sobre la configuración propia de la actividad. */
export function withOverrides(activity: Activity, overrides: GameConfigOverrides | null): Activity {
  if (!overrides) return activity;
  const base = activity.config ?? {};
  return {
    ...activity,
    config: {
      ...base,
      ...(overrides.challengeCount !== undefined && { challengeCount: overrides.challengeCount }),
      selection: { ...base.selection, ...overrides.selection },
      timer: { ...base.timer, ...overrides.timer },
    },
  };
}
