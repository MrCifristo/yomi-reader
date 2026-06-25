import type { NormRect } from '../core/types';

interface OpList { fnArray: number[]; argsArray: any[]; }

export function extractImageRects(opList: OpList, imageOps: number[], pageW: number, pageH: number): NormRect[] {
  const rects: NormRect[] = [];
  for (let i = 0; i < opList.fnArray.length; i++) {
    if (!imageOps.includes(opList.fnArray[i])) continue;
    const arg = opList.argsArray[i]?.[0];
    const t = arg?.transform;
    if (!t) continue;
    const [a, , , d, e, f] = t; // scaleX, _, _, scaleY, transX, transY
    rects.push({ x: e / pageW, y: f / pageH, w: a / pageW, h: d / pageH });
  }
  return rects;
}
