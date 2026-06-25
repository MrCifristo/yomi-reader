import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { usePdfDocument } from './pdf/usePdfDocument';
import { PdfViewer } from './pdf/PdfViewer';
import { Toolbar } from './ui/Toolbar';
import { Sidebar } from './ui/Sidebar';
import { useHighlights } from './ui/useHighlights';
import { HighlightLayer } from './ui/HighlightLayer';
import { useSelectionHighlight } from './ui/useSelectionHighlight';
import { buildPageFilter } from './theme/filters';
import { readEmbeddedOutline, collectFontStats, autoDetectChapters } from './pdf/outline';
import { mergeChapters } from './core/chapters';
import { exportRecord, importRecord } from './core/transfer';
import { getDocument, patchDocument, newDocumentRecord } from './core/storage';
import { defaultSettings } from './core/hash';
import type { Chapter, Settings } from './core/types';

export default function App() {
  const { doc, hash, meta, error, openFile } = usePdfDocument();
  const [settings, setSettings] = useState<Settings>(defaultSettings());
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightMode, setHighlightMode] = useState(false);
  const { highlights, addHighlight, removeHighlight, resetHighlights } = useHighlights([]);
  const loadedHashRef = useRef<string | null>(null);
  // Track rendered page sizes keyed by page number (state to trigger re-render for overlay)
  const [pageSizes, setPageSizes] = useState<Map<number, { width: number; height: number }>>(new Map());
  const pageSizesRef = useRef<Map<number, { width: number; height: number }>>(new Map());
  const { captureSelection } = useSelectionHighlight({
    enabled: highlightMode,
    color: '#d9a441',
    onCreate: addHighlight,
  });

  // Load or create record when a doc opens.
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

  // Autosave on any change.
  useEffect(() => {
    if (!hash || !meta || loadedHashRef.current !== hash) return;
    patchDocument(hash, {
      meta: { ...meta, ultimaPagina: currentPage },
      chapters, highlights, settings,
    }).catch((e) => {
      console.warn('[autosave] patchDocument failed:', e);
    });
  }, [hash, meta, currentPage, chapters, highlights, settings]);

  const toggleScanned = useCallback(() => {
    setSettings((s) => ({ ...s, modo: s.modo === 'texto' ? 'escaneado' : 'texto' }));
  }, []);
  const onSliderChange = useCallback((key: 'contraste' | 'brillo' | 'temperatura', value: number) => {
    setSettings((s) => ({ ...s, [key]: value }));
  }, []);
  const onAddChapter = useCallback((titulo: string) => {
    setChapters((prev) => mergeChapters(
      prev.filter((c) => c.origen !== 'manual'), [],
      [...prev.filter((c) => c.origen === 'manual'), { id: crypto.randomUUID(), titulo, pagina: currentPage, nivel: 0, origen: 'manual' }],
    ));
  }, [currentPage]);

  const onExport = useCallback(async () => {
    if (!hash) return;
    const rec = (await getDocument(hash)) ?? newDocumentRecord(hash, meta!);
    const blob = new Blob([exportRecord(rec)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${meta?.titulo ?? 'notas'}.notas.json`;
    a.click();
  }, [hash, meta]);

  const onImport = useCallback(async (file: File) => {
    const rec = importRecord(await file.text());
    await patchDocument(rec.hash, rec);
    if (rec.hash === hash) {
      setSettings(rec.settings); setChapters(rec.chapters);
      setCurrentPage(rec.meta.ultimaPagina);
    }
  }, [hash]);

  // In 'texto' mode dark inversion happens on the canvas (PdfPage), not via CSS.
  // In 'escaneado' mode the stage-level CSS filter handles full inversion + sliders.
  const filter = buildPageFilter(settings);
  const darkText = settings.modo === 'texto';

  const onPageRendered = useCallback((pageNumber: number, size: { width: number; height: number }) => {
    pageSizesRef.current.set(pageNumber, size);
    setPageSizes(new Map(pageSizesRef.current));
  }, []);

  const handleStageMouseUp = useCallback(() => {
    if (!highlightMode) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const anchorNode = sel.anchorNode;
    if (!anchorNode) return;
    const el = anchorNode.nodeType === Node.ELEMENT_NODE ? (anchorNode as Element) : anchorNode.parentElement;
    const pageEl = el?.closest<HTMLElement>('.pdf-page[data-page]');
    if (!pageEl) return;
    const pageNumber = Number(pageEl.dataset.page);
    const size = pageSizesRef.current.get(pageNumber);
    const canvas = pageEl.querySelector('canvas');
    const pageW = size?.width ?? canvas?.width ?? pageEl.offsetWidth;
    const pageH = size?.height ?? canvas?.height ?? pageEl.offsetHeight;
    captureSelection(pageEl, pageNumber, pageW, pageH);
  }, [highlightMode, captureSelection]);

  const renderPageOverlay = useMemo(() => (pageNumber: number) => {
    const size = pageSizes.get(pageNumber);
    if (!size) return null;
    return (
      <HighlightLayer
        highlights={highlights}
        pagina={pageNumber}
        pageW={size.width}
        pageH={size.height}
        onRemove={removeHighlight}
      />
    );
  }, [pageSizes, highlights, removeHighlight]);

  return (
    <div className="app">
      <Toolbar
        settings={settings} highlightMode={highlightMode}
        onOpenFile={openFile} onToggleScanned={toggleScanned}
        onToggleHighlight={() => setHighlightMode((v) => !v)}
        onSliderChange={onSliderChange} onExport={onExport} onImport={onImport}
      />
      {error && <div className="error-banner">{error}</div>}
      <div className="body" style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar
          chapters={chapters} highlights={highlights} currentPage={currentPage}
          onJump={setCurrentPage} onAddChapter={onAddChapter}
        />
        <div className="pdf-stage" style={{ flex: 1, overflow: 'auto', filter }} onMouseUp={handleStageMouseUp}>
          {meta && <div className="doc-title" style={{ padding: '4px 12px' }}>{meta.titulo}</div>}
          {doc && meta && (
            <PdfViewer
              doc={doc} totalPages={meta.totalPaginas} currentPage={currentPage}
              scale={1.3} onPageChange={setCurrentPage}
              darkText={darkText}
              onPageRendered={onPageRendered}
              renderPageOverlay={renderPageOverlay}
            />
          )}
        </div>
      </div>
    </div>
  );
}
