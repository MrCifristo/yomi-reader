import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import * as pdfjs from 'pdfjs-dist';
import { TextLayer } from 'pdfjs-dist';
import { extractImageDeviceRects } from '../theme/imageRegions';

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

          // 2. Get the page operator list and locate image regions in CANVAS
          //    pixel coordinates. The image position lives in the CTM (set by
          //    transform ops), not in the paint op's args — so we track the CTM
          //    and map through viewport.transform.
          const opList = await page.getOperatorList();
          const imageOps = [
            pdfjs.OPS.paintImageXObject,
            pdfjs.OPS.paintInlineImageXObject,
            pdfjs.OPS.paintImageMaskXObject,
          ].filter((op) => op !== undefined);
          const deviceRects = extractImageDeviceRects(
            opList,
            {
              save: pdfjs.OPS.save,
              restore: pdfjs.OPS.restore,
              transform: pdfjs.OPS.transform,
              imageOps,
            },
            viewport.transform,
          );

          // 3. Invert the whole canvas via composite operation
          if (!cancelled) {
            ctx.save();
            ctx.globalCompositeOperation = 'difference';
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
          }

          // 4. Restore each image region from the pre-inversion snapshot so
          //    figures keep their original colors. Snap outward to whole pixels
          //    and clamp to canvas bounds (putImageData throws on out-of-range).
          if (!cancelled) {
            for (const rect of deviceRects) {
              const x0 = Math.max(0, Math.floor(rect.x));
              const y0 = Math.max(0, Math.floor(rect.y));
              const x1 = Math.min(canvas.width, Math.ceil(rect.x + rect.w));
              const y1 = Math.min(canvas.height, Math.ceil(rect.y + rect.h));
              const sw = x1 - x0;
              const sh = y1 - y0;
              if (sw > 0 && sh > 0) {
                ctx.putImageData(snapshot, 0, 0, x0, y0, sw, sh);
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
