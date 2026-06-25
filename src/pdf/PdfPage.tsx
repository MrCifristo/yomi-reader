import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { TextLayer } from 'pdfjs-dist';

interface Props {
  doc: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  onRendered?: (pageNumber: number, size: { width: number; height: number }) => void;
  overlay?: ReactNode;
}

export function PdfPage({ doc, pageNumber, scale, onRendered, overlay }: Props) {
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
  }, [doc, pageNumber, scale, onRendered]);

  return (
    <div className="pdf-page" data-page={pageNumber} style={{ position: 'relative' }}>
      <canvas ref={canvasRef} data-testid="pdf-canvas" />
      <div className="textLayer" ref={textLayerRef} />
      {overlay}
    </div>
  );
}
