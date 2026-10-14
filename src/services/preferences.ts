const SOUND_KEY = 'decide:sound';

/** Preferencia de sonido del estudiante (si el navegador permite guardarla). */
export function loadSoundPreference(fallback: boolean): boolean {
  try {
    const stored = window.localStorage.getItem(SOUND_KEY);
    return stored === null ? fallback : stored === 'on';
  } catch {
    return fallback;
  }
}

export function saveSoundPreference(enabled: boolean): void {
  try {
    window.localStorage.setItem(SOUND_KEY, enabled ? 'on' : 'off');
  } catch {
    // Modo privado o almacenamiento bloqueado: la preferencia dura solo esta sesión.
  }
}
