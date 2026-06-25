import { extractImageDeviceRects } from './imageRegions';

// Realistic op codes (match pdfjs-dist v6 OPS values used in the app).
const OPS = { save: 10, restore: 11, transform: 12, paintImageXObject: 85 };

// Viewport transform for a 400x600 page at scale 1, rotation 0: flips y so
// user-space (x, y) maps to canvas (x, 600 - y).
const VIEWPORT_T = [1, 0, 0, -1, 0, 600];

test('locates an image from the CTM set by a preceding transform op', () => {
  // Image scaled 160x120 and translated to user-space (40, 300) (bottom-left).
  const opList = {
    fnArray: [OPS.save, OPS.transform, OPS.paintImageXObject, OPS.restore],
    argsArray: [null, [160, 0, 0, 120, 40, 300], [{ width: 1, height: 1 }], null],
  };
  const rects = extractImageDeviceRects(
    opList,
    { save: OPS.save, restore: OPS.restore, transform: OPS.transform, imageOps: [OPS.paintImageXObject] },
    VIEWPORT_T,
  );
  // user-space box (40,300)-(200,420) → canvas (y-flip): top y = 600-420 = 180, height 120.
  expect(rects).toEqual([{ x: 40, y: 180, w: 160, h: 120 }]);
});

test('restore pops the CTM so a later image ignores an inner transform', () => {
  const opList = {
    fnArray: [OPS.save, OPS.transform, OPS.restore, OPS.transform, OPS.paintImageXObject],
    argsArray: [
      null,
      [999, 0, 0, 999, 999, 999], // inner transform, undone by restore
      null,
      [100, 0, 0, 100, 0, 0], // outer transform that should apply
      [{ width: 1, height: 1 }],
    ],
  };
  const rects = extractImageDeviceRects(
    opList,
    { save: OPS.save, restore: OPS.restore, transform: OPS.transform, imageOps: [OPS.paintImageXObject] },
    VIEWPORT_T,
  );
  // box (0,0)-(100,100) → canvas top y = 600-100 = 500, height 100.
  expect(rects).toEqual([{ x: 0, y: 500, w: 100, h: 100 }]);
});

test('ignores ops that are not image paints', () => {
  const opList = { fnArray: [OPS.save, OPS.transform, OPS.restore], argsArray: [null, [1, 0, 0, 1, 0, 0], null] };
  const rects = extractImageDeviceRects(
    opList,
    { save: OPS.save, restore: OPS.restore, transform: OPS.transform, imageOps: [OPS.paintImageXObject] },
    VIEWPORT_T,
  );
  expect(rects).toEqual([]);
});
