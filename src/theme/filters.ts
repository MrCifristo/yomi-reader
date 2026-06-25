import type { Settings } from '../core/types';

export function buildPageFilter(s: Settings): string {
  // 'texto' mode: dark mode is applied on the canvas (not via CSS filter), so no filter here.
  if (s.modo === 'texto') return 'none';
  const base = 'invert(1) hue-rotate(180deg)';
  const contrast = 1 + s.contraste / 100;
  const brightness = 1 + s.brillo / 100;
  const sepia = Math.max(0, s.temperatura) / 100;
  return `${base} contrast(${contrast}) brightness(${brightness}) sepia(${sepia})`;
}
