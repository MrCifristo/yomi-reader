import { normalizeRect, denormalizeRect } from './rects';

test('normalize then denormalize round-trips at a different scale', () => {
  const px = { x: 100, y: 50, w: 200, h: 20 };
  const n = normalizeRect(px, 1000, 500);
  expect(n).toEqual({ x: 0.1, y: 0.1, w: 0.2, h: 0.04 });
  // same page at 2x zoom
  const back = denormalizeRect(n, 2000, 1000);
  expect(back).toEqual({ x: 200, y: 100, w: 400, h: 40 });
});
