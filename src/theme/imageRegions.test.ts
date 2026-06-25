import { extractImageRects } from './imageRegions';

// Minimal fake op list: one image op with a transform giving a 100x80 image at (10,20)
const OPS = { paintImageXObject: 85 };

test('extracts normalized rect for an image paint op', () => {
  const opList = {
    fnArray: [OPS.paintImageXObject],
    argsArray: [[{ width: 100, height: 80, transform: [100, 0, 0, 80, 10, 20] }]],
  };
  const rects = extractImageRects(opList, [OPS.paintImageXObject], 1000, 800);
  expect(rects).toEqual([{ x: 0.01, y: 0.025, w: 0.1, h: 0.1 }]);
});

test('ignores non-image ops', () => {
  const opList = { fnArray: [10, 11], argsArray: [[], []] };
  expect(extractImageRects(opList, [85], 1000, 800)).toEqual([]);
});
