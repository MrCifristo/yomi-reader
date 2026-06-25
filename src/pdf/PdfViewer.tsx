import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfPage } from './PdfPage';

interface Props {
  doc: PDFDocumentProxy;
  totalPages: number;
  currentPage: number;
  scale: number;
  onPageChange: (page: number) => void;
}

const WINDOW = 2;

export function PdfViewer({ doc, totalPages, currentPage, scale }: Props) {
  const start = Math.max(1, currentPage - WINDOW);
  const end = Math.min(totalPages, currentPage + WINDOW);
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <div className="pdf-viewer">
      {pages.map((p) => (
        <PdfPage key={p} doc={doc} pageNumber={p} scale={scale} />
      ))}
    </div>
  );
}
