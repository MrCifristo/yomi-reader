import { useEffect, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface Props {
  doc: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  onRendered?: (pageNumber: number, size: { width: number; height: number }) => void;
}

export function PdfPage({ doc, pageNumber, scale, onRendered }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (ctx) await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      if (!cancelled) onRendered?.(pageNumber, { width: viewport.width, height: viewport.height });
    })();
    return () => { cancelled = true; };
  }, [doc, pageNumber, scale, onRendered]);

  return (
    <div className="pdf-page" data-page={pageNumber}>
      <canvas ref={canvasRef} data-testid="pdf-canvas" />
      <div className="textLayer" />
    </div>
  );
}
