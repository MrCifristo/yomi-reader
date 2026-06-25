import type { NormRect } from './types';

export function normalizeRect(px: { x: number; y: number; w: number; h: number }, pageW: number, pageH: number): NormRect {
  return { x: px.x / pageW, y: px.y / pageH, w: px.w / pageW, h: px.h / pageH };
}

export function denormalizeRect(n: NormRect, pageW: number, pageH: number): { x: number; y: number; w: number; h: number } {
  return { x: n.x * pageW, y: n.y * pageH, w: n.w * pageW, h: n.h * pageH };
}
