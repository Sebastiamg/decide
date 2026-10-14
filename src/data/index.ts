import type { Activity } from '../types/activity';
import { historyActivity } from './history';

/**
 * Actividades disponibles. Añadir una materia = crear su carpeta en data/
 * (p. ej. data/chemistry/) y registrarla aquí. El motor no cambia.
 */
export const activities: readonly Activity[] = [historyActivity];

export function findActivity(id: string | null): Activity {
  return activities.find((activity) => activity.id === id) ?? historyActivity;
}
