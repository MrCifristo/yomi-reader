import { useEffect, useRef, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfPage } from './PdfPage';

interface Props {
  doc: PDFDocumentProxy;
  totalPages: number;
  currentPage: number;
  scale: number;
  darkText?: boolean;
  onPageChange: (page: number) => void;
  onPageRendered?: (pageNumber: number, size: { width: number; height: number }) => void;
  renderPageOverlay?: (pageNumber: number) => ReactNode;
}

// Pages near the viewport are mounted (heavy canvas + text layer); the rest are
// light fixed-height spacers so the scrollbar spans the whole document and
// reading is a single continuous scroll. Book pages are uniform height, so one
// estimated height drives both the spacers and scroll-to-page math.
const BUFFER = 2;
const DEFAULT_HEIGHT = 1000;

export function PdfViewer({
  doc,
  totalPages,
  currentPage,
  scale,
  darkText,
  onPageChange,
  onPageRendered,
  renderPageOverlay,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [estHeight, setEstHeight] = useState(DEFAULT_HEIGHT);
  const [range, setRange] = useState<{ start: number; end: number }>({ start: 1, end: Math.min(totalPages, 1 + BUFFER) });
  // The page the user is currently looking at (scroll-driven). Kept in a ref so
  // the programmatic-scroll effect can tell its own updates from user scrolling.
  const visiblePageRef = useRef(currentPage);

  const recompute = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, clientHeight } = el;
    const firstVisible = Math.max(1, Math.floor(scrollTop / estHeight) + 1);
    const lastVisible = Math.min(totalPages, Math.ceil((scrollTop + clientHeight) / estHeight));
    setRange({ start: Math.max(1, firstVisible - BUFFER), end: Math.min(totalPages, lastVisible + BUFFER) });

    // "Current" page = the one occupying the top third of the viewport.
    const current = Math.min(totalPages, Math.max(1, Math.floor((scrollTop + clientHeight * 0.3) / estHeight) + 1));
    if (current !== visiblePageRef.current) {
      visiblePageRef.current = current;
      onPageChange(current);
    }
  }, [estHeight, totalPages, onPageChange]);

  // Throttle scroll handling with requestAnimationFrame.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        recompute();
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    recompute();
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [recompute]);

  // Programmatic scroll: when currentPage changes from outside (index/jump),
  // scroll that page into view. Guarded so scroll-driven updates don't loop.
  useEffect(() => {
    if (currentPage === visiblePageRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    visiblePageRef.current = currentPage;
    el.scrollTo({ top: (currentPage - 1) * estHeight, behavior: 'auto' });
    recompute();
  }, [currentPage, estHeight, recompute]);

  // Adopt the first rendered page's real height as the estimate for all slots.
  const handleRendered = useCallback(
    (pageNumber: number, size: { width: number; height: number }) => {
      if (size.height > 0 && Math.abs(size.height - estHeight) > 2) setEstHeight(size.height);
      onPageRendered?.(pageNumber, size);
    },
    [estHeight, onPageRendered],
  );

  const slots: ReactNode[] = [];
  for (let p = 1; p <= totalPages; p++) {
    const mounted = p >= range.start && p <= range.end;
    slots.push(
      <div
        key={p}
        className="pdf-slot"
        data-slot={p}
        style={{ minHeight: estHeight, display: 'flex', justifyContent: 'center' }}
      >
        {mounted && (
          <PdfPage
            doc={doc}
            pageNumber={p}
            scale={scale}
            darkText={darkText}
            onRendered={handleRendered}
            overlay={renderPageOverlay?.(p)}
          />
        )}
      </div>,
    );
  }

  return (
    <div className="pdf-viewer" ref={scrollRef} style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
      {slots}
    </div>
  );
}
