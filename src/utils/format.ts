/** Sustituye {clave}: formatLabel('{a} / {b}', { a: 2, b: 3 }) → "2 / 3". */
export function formatLabel(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

const numberFormat = new Intl.NumberFormat('es-EC');

export function formatNumber(value: number): string {
  return numberFormat.format(Math.round(value));
}

/** 7432 ms → "7.4". */
export function formatSeconds(ms: number): string {
  return (Math.max(0, ms) / 1000).toFixed(1);
}

/** 4210 ms → "4,2 s". */
export function formatDuration(ms: number): string {
  return `${(Math.max(0, ms) / 1000).toFixed(1).replace('.', ',')} s`;
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)} %`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
