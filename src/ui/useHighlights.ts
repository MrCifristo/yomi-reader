import { useState, useCallback } from 'react';
import type { Highlight, NormRect } from '../core/types';

export function useHighlights(initial: Highlight[]) {
  const [highlights, setHighlights] = useState<Highlight[]>(initial);

  const addHighlight = useCallback((pagina: number, rects: NormRect[], color: string, texto: string): string => {
    const id = crypto.randomUUID();
    setHighlights((prev) => [...prev, { id, pagina, rects, color, texto, creado: Date.now() }]);
    return id;
  }, []);

  const removeHighlight = useCallback((id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  }, []);

  return { highlights, addHighlight, removeHighlight };
}
