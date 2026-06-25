import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Chapter } from '../core/types';

interface FontStat { page: number; text: string; fontSize: number; }

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function autoDetectChapters(stats: FontStat[]): Chapter[] {
  if (stats.length === 0) return [];
  const med = median(stats.map((s) => s.fontSize));
  return stats
    .filter((s) => s.fontSize >= med * 1.4)
    .map((s, i) => ({ id: `auto-${i}`, titulo: s.text.trim(), pagina: s.page, nivel: 0, origen: 'auto' as const }));
}

export async function readEmbeddedOutline(doc: PDFDocumentProxy): Promise<Chapter[]> {
  const outline = await doc.getOutline();
  if (!outline) return [];
  const chapters: Chapter[] = [];
  let i = 0;
  const walk = async (items: any[], nivel: number) => {
    for (const item of items) {
      let pagina = 1;
      try {
        const dest = typeof item.dest === 'string' ? await doc.getDestination(item.dest) : item.dest;
        if (dest) pagina = (await doc.getPageIndex(dest[0])) + 1;
      } catch { /* keep default */ }
      chapters.push({ id: `emb-${i++}`, titulo: item.title, pagina, nivel, origen: 'embebido' });
      if (item.items?.length) await walk(item.items, nivel + 1);
    }
  };
  await walk(outline, 0);
  return chapters;
}
