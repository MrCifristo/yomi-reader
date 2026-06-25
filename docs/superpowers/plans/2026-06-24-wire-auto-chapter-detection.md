# Wire Chapter Auto-Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `autoDetectChapters` so it actually runs when a PDF has no embedded outline, using font-size stats collected via pdf.js `getTextContent`.

**Architecture:** Add `collectFontStats(doc, maxPages?)` to `src/pdf/outline.ts`; in `App.tsx`'s load-or-create effect, when `embedded.length === 0`, call `collectFontStats` then `autoDetectChapters` and pass the result as the `auto` arg to `mergeChapters`. Unit-test `collectFontStats` with a mocked doc. Keep all existing tests green.

**Tech Stack:** Vite + React + TypeScript, pdf.js (`pdfjs-dist`), Vitest + jsdom, pnpm

## Global Constraints

- Package manager: **pnpm** (never npm/yarn)
- Test runner: `pnpm test` (Vitest) — full suite must be green
- Build: `pnpm build` — must be clean
- No new dependencies
- `collectFontStats` must cap at `maxPages` (default 30) for performance
- Skip empty-string text items
- fontSize derived from pdf.js transform array: `Math.hypot(transform[2], transform[3])`
- Files touched: `src/pdf/outline.ts`, `src/App.tsx`, `src/pdf/outline.test.ts`

---

### Task 1: Add `collectFontStats` to `src/pdf/outline.ts` + unit test

**Files:**
- Modify: `src/pdf/outline.ts`
- Modify: `src/pdf/outline.test.ts`

**Interfaces:**
- Produces: `export async function collectFontStats(doc: PDFDocumentProxy, maxPages?: number): Promise<FontStat[]>`
  - `FontStat = { page: number; text: string; fontSize: number }`
  - `maxPages` defaults to 30
  - iterates pages 1..min(doc.numPages, maxPages)
  - calls `page.getTextContent()` for each page
  - for each item in `items`: skip if `item.str.trim() === ''`; derive `fontSize = Math.hypot(item.transform[2], item.transform[3])`; push `{ page, text: item.str, fontSize }`

- [ ] **Step 1: Write the failing test in `src/pdf/outline.test.ts`**

Add after the existing test:

```typescript
import { autoDetectChapters, collectFontStats } from './outline';

// ... existing test stays ...

test('collectFontStats returns one stat per non-empty text item with correct fontSize', async () => {
  const mockDoc = {
    numPages: 2,
    getPage: async (pageNum: number) => ({
      getTextContent: async () => ({
        items: pageNum === 1
          ? [
              { str: 'CAPÍTULO 1', transform: [1, 0, 0, 18, 0, 0] },  // fontSize = hypot(0,18) = 18
              { str: '', transform: [1, 0, 0, 10, 0, 0] },             // skipped: empty
              { str: 'cuerpo', transform: [1, 0, 0, 10, 0, 0] },       // fontSize = 10
            ]
          : [
              { str: 'más texto', transform: [1, 0, 0, 10, 0, 0] },    // fontSize = 10
            ],
      }),
    }),
  };

  const stats = await collectFontStats(mockDoc as any);

  expect(stats).toHaveLength(3);
  expect(stats[0]).toEqual({ page: 1, text: 'CAPÍTULO 1', fontSize: 18 });
  expect(stats[1]).toEqual({ page: 1, text: 'cuerpo', fontSize: 10 });
  expect(stats[2]).toEqual({ page: 2, text: 'más texto', fontSize: 10 });
});

test('collectFontStats respects maxPages cap', async () => {
  const mockDoc = {
    numPages: 50,
    getPage: async (_pageNum: number) => ({
      getTextContent: async () => ({ items: [{ str: 'text', transform: [1, 0, 0, 12, 0, 0] }] }),
    }),
  };

  const stats = await collectFontStats(mockDoc as any, 5);
  // 5 pages × 1 item each = 5 stats
  expect(stats).toHaveLength(5);
  expect(stats[0].page).toBe(1);
  expect(stats[4].page).toBe(5);
});
```

- [ ] **Step 2: Run failing tests**

```bash
cd /home/mrcifristo/Documents/Personal/yomi-reader && pnpm test -- --reporter=verbose 2>&1 | grep -A 5 'collectFontStats'
```

Expected: FAIL — `collectFontStats` is not exported from `./outline`

- [ ] **Step 3: Implement `collectFontStats` in `src/pdf/outline.ts`**

Add after the `readEmbeddedOutline` function (keep existing code unchanged):

```typescript
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
    for (const item of content.items as any[]) {
      if (!item.str || item.str.trim() === '') continue;
      const t = item.transform as number[];
      const fontSize = Math.hypot(t[2], t[3]);
      stats.push({ page: p, text: item.str, fontSize });
    }
  }
  return stats;
}
```

- [ ] **Step 4: Run the new tests to verify they pass**

```bash
cd /home/mrcifristo/Documents/Personal/yomi-reader && pnpm test -- --reporter=verbose 2>&1 | grep -E '(collectFontStats|PASS|FAIL|✓|✗)'
```

Expected: all `collectFontStats` tests PASS, existing `autoDetectChapters` test still PASS

- [ ] **Step 5: Run full suite**

```bash
cd /home/mrcifristo/Documents/Personal/yomi-reader && pnpm test 2>&1 | tail -20
```

Expected: all tests green

- [ ] **Step 6: Commit**

```bash
cd /home/mrcifristo/Documents/Personal/yomi-reader && git add src/pdf/outline.ts src/pdf/outline.test.ts && git commit -m "feat: add collectFontStats for per-page font-size collection"
```

---

### Task 2: Wire `collectFontStats` + `autoDetectChapters` in `App.tsx`

**Files:**
- Modify: `src/App.tsx` (lines 35-57, the load-or-create effect)

**Interfaces:**
- Consumes:
  - `collectFontStats(doc: PDFDocumentProxy, maxPages?: number): Promise<FontStat[]>` from `./pdf/outline`
  - `autoDetectChapters(stats: FontStat[]): Chapter[]` from `./pdf/outline`
  - `mergeChapters(embedded, auto, manual): Chapter[]` from `./core/chapters`
- The `auto` arg to `mergeChapters` must be `[]` when `embedded.length > 0`, or the result of `autoDetectChapters(stats)` when `embedded.length === 0`

- [ ] **Step 1: Update the import in `src/App.tsx`**

Change line 10:
```typescript
import { readEmbeddedOutline } from './pdf/outline';
```
to:
```typescript
import { readEmbeddedOutline, collectFontStats, autoDetectChapters } from './pdf/outline';
```

- [ ] **Step 2: Update the load-or-create effect in `src/App.tsx`**

Replace the existing effect body (lines 37-56):

```typescript
  useEffect(() => {
    if (!doc || !hash || !meta) return;
    (async () => {
      const existing = await getDocument(hash);
      const embedded = await readEmbeddedOutline(doc);
      // Only run auto-detection when there is no embedded outline —
      // it iterates up to 30 pages and calls getTextContent per page.
      const auto = embedded.length === 0
        ? autoDetectChapters(await collectFontStats(doc))
        : [];
      if (existing) {
        setSettings(existing.settings);
        setChapters(mergeChapters(embedded, auto, existing.chapters.filter((c) => c.origen === 'manual')));
        setCurrentPage(existing.meta.ultimaPagina);
        resetHighlights(existing.highlights);
        loadedHashRef.current = hash;
      } else {
        const rec = newDocumentRecord(hash, meta);
        rec.chapters = mergeChapters(embedded, auto, []);
        await patchDocument(hash, rec);
        setSettings(rec.settings);
        setChapters(rec.chapters);
        setCurrentPage(1);
        resetHighlights([]);
        loadedHashRef.current = hash;
      }
    })().catch((e) => console.error('[load-or-create] failed:', e));
  }, [doc, hash, meta, resetHighlights]);
```

- [ ] **Step 3: Run the full test suite**

```bash
cd /home/mrcifristo/Documents/Personal/yomi-reader && pnpm test 2>&1 | tail -30
```

Expected: all tests green. The existing integration tests mock `getOutline: async () => null` (no outline) and `getTextContent: async () => ({ items: [] })` (no text items), so `collectFontStats` returns `[]`, `autoDetectChapters([])` returns `[]`, and `mergeChapters([], [], manual)` = manual — behavior unchanged for those tests.

- [ ] **Step 4: Run build**

```bash
cd /home/mrcifristo/Documents/Personal/yomi-reader && pnpm build 2>&1 | tail -20
```

Expected: clean build, no TypeScript errors

- [ ] **Step 5: Commit**

```bash
cd /home/mrcifristo/Documents/Personal/yomi-reader && git add src/App.tsx && git commit -m "feat: wire chapter auto-detection when no embedded outline"
```

---

### Task 3: Write report + final commit

**Files:**
- Create: `/home/mrcifristo/Documents/Personal/.superpowers/sdd/fix-4-report.md`

- [ ] **Step 1: Create the report directory if needed**

```bash
mkdir -p /home/mrcifristo/Documents/Personal/.superpowers/sdd
```

- [ ] **Step 2: Write the report**

Write to `/home/mrcifristo/Documents/Personal/.superpowers/sdd/fix-4-report.md` with these sections:
1. What was changed (files + summary)
2. fontSize derivation + evidence from pdfjs types (TextItem.transform, Math.hypot rationale)
3. maxPages cap rationale (30 pages covers most TOC fronts; avoids iterating all pages on a 500-page PDF)
4. Full-suite test results (paste `pnpm test` summary)
5. Build results (paste `pnpm build` summary)
6. Concerns (jsdom can't fully verify pdf.js TextItem shape; browser verification required)

- [ ] **Step 3: Final combined commit**

```bash
cd /home/mrcifristo/Documents/Personal/yomi-reader && git add src/pdf/outline.ts src/pdf/outline.test.ts src/App.tsx && git commit -m "feat: wire chapter auto-detection when no embedded outline

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
