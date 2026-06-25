import type { Settings } from '../core/types';

export function buildPageFilter(s: Settings): string {
  const base = 'invert(1) hue-rotate(180deg)';
  if (s.modo === 'texto') return base;
  const contrast = 1 + s.contraste / 100;
  const brightness = 1 + s.brillo / 100;
  const sepia = Math.max(0, s.temperatura) / 100;
  return `${base} contrast(${contrast}) brightness(${brightness}) sepia(${sepia})`;
}
