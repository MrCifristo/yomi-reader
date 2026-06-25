type Matrix = number[]; // [a, b, c, d, e, f]

interface OpList {
  fnArray: number[];
  argsArray: any[];
}

export interface DeviceRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ImageOps {
  save: number;
  restore: number;
  transform: number;
  imageOps: number[];
}

// Compose two pdf.js-style matrices: applying mul(m1, m2) to a point equals
// applying m2 then m1 (same convention as pdfjs Util.transform).
function mul(m1: Matrix, m2: Matrix): Matrix {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

function apply(m: Matrix, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

/**
 * Walk a pdf.js operator list tracking the current transformation matrix (CTM)
 * through save/restore/transform ops. For each image-painting op, the image
 * fills the unit square (0,0)-(1,1) under the CTM; mapping those corners through
 * the CTM and then the page viewport transform yields the image's bounding box
 * in CANVAS PIXEL coordinates (y-down). These rects are used to restore original
 * image colors after the page canvas is inverted for dark mode.
 *
 * Image position lives in the CTM, NOT in the paint op's args — that is why the
 * older arg-reading approach failed on real PDFs.
 */
export function extractImageDeviceRects(
  opList: OpList,
  ops: ImageOps,
  viewportTransform: Matrix,
): DeviceRect[] {
  const rects: DeviceRect[] = [];
  let ctm: Matrix = [1, 0, 0, 1, 0, 0];
  const stack: Matrix[] = [];

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i];
    if (fn === ops.save) {
      stack.push(ctm.slice());
    } else if (fn === ops.restore) {
      if (stack.length) ctm = stack.pop()!;
    } else if (fn === ops.transform) {
      const t = opList.argsArray[i] as Matrix;
      if (t && t.length === 6) ctm = mul(ctm, t);
    } else if (ops.imageOps.includes(fn)) {
      const combined = mul(viewportTransform, ctm);
      const corners = [
        apply(combined, 0, 0),
        apply(combined, 1, 0),
        apply(combined, 0, 1),
        apply(combined, 1, 1),
      ];
      const xs = corners.map((c) => c[0]);
      const ys = corners.map((c) => c[1]);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      rects.push({ x: minX, y: minY, w: maxX - minX, h: maxY - minY });
    }
  }
  return rects;
}
