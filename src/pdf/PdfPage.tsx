import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import * as pdfjs from 'pdfjs-dist';
import { TextLayer } from 'pdfjs-dist';
import { extractImageRects } from '../theme/imageRegions';

interface Props {
  doc: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  darkText?: boolean;
  onRendered?: (pageNumber: number, size: { width: number; height: number }) => void;
  overlay?: ReactNode;
}

export function PdfPage({ doc, pageNumber, scale, darkText, onRendered, overlay }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let textLayer: InstanceType<typeof TextLayer> | null = null;

    (async () => {
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (ctx) await page.render({ canvas, canvasContext: ctx, viewport }).promise;

      // Modo texto dark mode: invert the canvas but restore image/figure regions
      // so they keep their original colors.
      if (darkText && ctx) {
        try {
          // 1. Snapshot the canvas at original colors (before any inversion)
          const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // 2. Get the page operator list to locate image painting operations
          const opList = await page.getOperatorList();

          // Identify image-painting OPS that exist in pdfjs-dist v6:
          //   paintImageXObject, paintInlineImageXObject, paintImageMaskXObject
          const imageOps = [
            pdfjs.OPS.paintImageXObject,
            pdfjs.OPS.paintInlineImageXObject,
            pdfjs.OPS.paintImageMaskXObject,
          ].filter((op) => op !== undefined);

          // extractImageRects returns rects normalized to [0..1] of page dimensions.
          // PDF user-space has y-axis pointing UP with origin at bottom-left.
          // Canvas pixel coords have y pointing DOWN with origin at top-left.
          // The transform stored in the operator args is [scaleX, 0, 0, scaleY, transX, transY]
          // in PDF user-space units (page width × height as defined by the viewport).
          // To convert to canvas pixels:
          //   canvas_x = normRect.x * canvas.width
          //   canvas_y = (1 - normRect.y - |normRect.h|) * canvas.height   ← y-flip
          //   canvas_w = |normRect.w| * canvas.width
          //   canvas_h = |normRect.h| * canvas.height
          // Note: scaleY in PDF transforms is often negative (y-up), so normRect.h may be negative;
          // we take absolute values for pixel sizes and apply the flip explicitly.
          const normRects = extractImageRects(opList, imageOps, viewport.width, viewport.height);

          // 3. Invert the whole canvas via composite operation
          if (!cancelled) {
            ctx.save();
            ctx.globalCompositeOperation = 'difference';
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
          }

          // 4. Restore each image region from the pre-inversion snapshot
          if (!cancelled) {
            for (const rect of normRects) {
              const rw = Math.abs(rect.w) * canvas.width;
              const rh = Math.abs(rect.h) * canvas.height;
              // rect.y is the PDF-space bottom-left y (normalized). Flip to canvas top-left.
              const rx = rect.x * canvas.width;
              const ry = (1 - rect.y - Math.abs(rect.h)) * canvas.height;
              // Clamp to canvas bounds to avoid out-of-bounds putImageData errors
              const sx = Math.max(0, Math.round(rx));
              const sy = Math.max(0, Math.round(ry));
              const sw = Math.min(Math.round(rw), canvas.width - sx);
              const sh = Math.min(Math.round(rh), canvas.height - sy);
              if (sw > 0 && sh > 0) {
                ctx.putImageData(snapshot, 0, 0, sx, sy, sw, sh);
              }
            }
          }
        } catch {
          // In jsdom or environments without real canvas support, getImageData /
          // getOperatorList may throw. Swallow silently — page still shows on canvas.
        }
      }

      // Render the real pdf.js text layer so text is selectable in the DOM.
      // Guarded with try/catch because jsdom (used in tests) does not implement
      // the canvas/font metrics that TextLayer depends on internally.
      const textLayerDiv = textLayerRef.current;
      if (!cancelled && textLayerDiv) {
        // Clear any spans from a previous render (scale/page change)
        textLayerDiv.replaceChildren();

        // Set the CSS variable required by pdf.js v6 for text sizing
        textLayerDiv.style.setProperty('--scale-factor', String(viewport.scale));
        textLayerDiv.style.width = `${viewport.width}px`;
        textLayerDiv.style.height = `${viewport.height}px`;

        try {
          const textContent = await page.getTextContent();
          if (!cancelled) {
            textLayer = new TextLayer({
              textContentSource: textContent,
              container: textLayerDiv,
              viewport,
            });
            await textLayer.render();
          }
        } catch {
          // In jsdom / environments without canvas font metrics, TextLayer will
          // throw. Swallow the error silently — the page still renders on canvas.
        }
      }

      if (!cancelled) onRendered?.(pageNumber, { width: viewport.width, height: viewport.height });
    })();

    return () => {
      cancelled = true;
      // Cancel any in-flight text layer render and clear the container
      textLayer?.cancel();
      if (textLayerRef.current) textLayerRef.current.replaceChildren();
    };
  }, [doc, pageNumber, scale, darkText, onRendered]);

  return (
    <div className="pdf-page" data-page={pageNumber} style={{ position: 'relative' }}>
      <canvas ref={canvasRef} data-testid="pdf-canvas" />
      <div className="textLayer" ref={textLayerRef} />
      {overlay}
    </div>
  );
}
