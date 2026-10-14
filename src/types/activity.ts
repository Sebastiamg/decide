import type { Challenge } from './challenge';
import type { GameConfigOverrides } from './config';
import type { UiLabels } from './labels';

/**
 * Una actividad editorial: contenido + configuración. Es lo ÚNICO que hay
 * que escribir para crear una experiencia nueva (Historia, Química,
 * Matemáticas...). El motor se encarga del resto.
 */
export interface Activity {
  id: string;
  title: string;
  subject: string;
  grade?: string;
  description?: string;
  icon?: string;
  /** Banco de desafíos (puede ser mayor que la partida: el motor elige). */
  challenges: readonly Challenge[];
  config?: GameConfigOverrides;
  labels?: Partial<UiLabels>;
}
