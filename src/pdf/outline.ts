import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Chapter } from '../core/types';

interface FontStat { page: number; text: string; fontSize: number; }

// Most common rounded font size = body text. Falls back to the smallest size.
function bodyFontSize(stats: FontStat[]): number {
  const counts = new Map<number, number>();
  for (const s of stats) {
    const k = Math.round(s.fontSize);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let best = 0;
  let bestCount = -1;
  for (const [size, count] of counts) {
    if (count > bestCount) { best = size; bestCount = count; }
  }
  return best;
}

/**
 * Detect a hierarchical chapter index (titles and subtitles) from the document
 * content by font size.
 *
 * 1. Body text size = the most common font size.
 * 2. Heading candidates are short lines clearly larger than body text (and not
 *    page numbers or running heads repeated across many pages).
 * 3. The distinct heading sizes are ranked: the largest becomes level 0
 *    (título), the next level 1 (subtítulo), the next level 2 — so a real
 *    title/subtitle hierarchy comes through.
 */
export function autoDetectChapters(stats: FontStat[]): Chapter[] {
  if (stats.length === 0) return [];
  const body = bodyFontSize(stats);

  // Candidate headings: notably larger than body, short, not just digits.
  const candidates = stats.filter((s) => {
    const text = s.text.trim();
    if (!text || text.length > 90) return false;
    if (/^[\d.\s]+$/.test(text)) return false; // page numbers / numeric noise
    return s.fontSize >= body * 1.15;
  });
  if (candidates.length === 0) return [];

  // Drop running heads: identical heading text appearing on 4+ pages.
  const pagesByText = new Map<string, Set<number>>();
  for (const c of candidates) {
    const key = c.text.trim().toLowerCase();
    (pagesByText.get(key) ?? pagesByText.set(key, new Set()).get(key)!).add(c.page);
  }
  const headings = candidates.filter((c) => (pagesByText.get(c.text.trim().toLowerCase())?.size ?? 0) < 4);
  if (headings.length === 0) return [];

  // Rank distinct heading sizes → levels (largest = 0). Cap at 3 levels.
  const sizes = [...new Set(headings.map((h) => Math.round(h.fontSize)))].sort((a, b) => b - a);
  const levelOf = new Map<number, number>();
  sizes.forEach((size, idx) => levelOf.set(size, Math.min(idx, 2)));

  // Build chapters, de-duplicating consecutive identical title+page entries.
  const chapters: Chapter[] = [];
  let i = 0;
  for (const h of headings) {
    const titulo = h.text.trim();
    const last = chapters[chapters.length - 1];
    if (last && last.titulo === titulo && last.pagina === h.page) continue;
    chapters.push({
      id: `auto-${i++}`,
      titulo,
      pagina: h.page,
      nivel: levelOf.get(Math.round(h.fontSize)) ?? 0,
      origen: 'auto',
    });
  }
  return chapters.sort((a, b) => a.pagina - b.pagina);
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

/**
 * Collect per-text-item font-size stats for auto chapter detection.
 *
 * Iterates pages 1..min(doc.numPages, maxPages) (default 30 — enough to
 * find chapter headings near the front of most documents; capped to keep
 * performance acceptable on large PDFs).
 *
 * FontSize is derived from the pdf.js text item's `transform` array as
 * Math.hypot(transform[2], transform[3]), which equals the font height for
 * unrotated text (transform[3]) and gracefully handles slight rotations.
 * Empty strings are skipped.
 */
export async function collectFontStats(
  doc: PDFDocumentProxy,
  maxPages = 30,
): Promise<FontStat[]> {
  const limit = Math.min(doc.numPages, maxPages);
  const stats: FontStat[] = [];
  for (let p = 1; p <= limit; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();

    // Group items into lines: same page, same baseline y (rounded) and same
    // font size, concatenated left-to-right. A heading split across several
    // text items becomes a single line so its full title is captured.
    type Line = { x: number; text: string; fontSize: number };
    const lines = new Map<string, Line[]>();
    for (const item of content.items as any[]) {
      if (!item.str || item.str.trim() === '') continue;
      const t = item.transform as number[];
      const fontSize = Math.hypot(t[2], t[3]);
      const key = `${Math.round(t[5])}:${Math.round(fontSize)}`;
      (lines.get(key) ?? lines.set(key, []).get(key)!).push({ x: t[4], text: item.str, fontSize });
    }
    for (const parts of lines.values()) {
      parts.sort((a, b) => a.x - b.x);
      const text = parts.map((p) => p.text).join('').replace(/\s+/g, ' ').trim();
      if (text) stats.push({ page: p, text, fontSize: parts[0].fontSize });
    }
  }
  return stats;
}
