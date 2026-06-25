import { useState, useCallback } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { hashDocument } from '../core/hash';
import type { DocMeta } from '../core/types';

export function usePdfDocument() {
  const [doc, setDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [meta, setMeta] = useState<DocMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const openFile = useCallback(async (file: File) => {
    setLoading(true); setError(null);
    try {
      const bytes = await file.arrayBuffer();
      const h = await hashDocument(bytes.slice(0));
      const loaded = await pdfjs.getDocument({ data: new Uint8Array(bytes) }).promise;
      setDoc(loaded); setHash(h);
      setMeta({ titulo: file.name, totalPaginas: loaded.numPages, ultimaPagina: 1 });
    } catch {
      setError('No se pudo abrir el PDF');
    } finally {
      setLoading(false);
    }
  }, []);

  return { doc, hash, meta, error, loading, openFile };
}
