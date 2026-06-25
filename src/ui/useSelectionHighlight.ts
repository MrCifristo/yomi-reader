import { useCallback } from 'react';
import { normalizeRect } from '../core/rects';
import type { NormRect } from '../core/types';

interface Opts {
  enabled: boolean;
  color: string;
  onCreate: (pagina: number, rects: NormRect[], color: string, texto: string) => void;
}

export function useSelectionHighlight({ enabled, color, onCreate }: Opts) {
  const captureSelection = useCallback((pageEl: HTMLElement, pagina: number, pageW: number, pageH: number) => {
    if (!enabled) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const base = pageEl.getBoundingClientRect();
    const rects: NormRect[] = Array.from(range.getClientRects()).map((r) =>
      normalizeRect({ x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height }, pageW, pageH)
    );
    const texto = range.toString();
    if (rects.length === 0 || !texto.trim()) return;
    onCreate(pagina, rects, color, texto);
    sel.removeAllRanges();
  }, [enabled, color, onCreate]);

  return { captureSelection };
}
