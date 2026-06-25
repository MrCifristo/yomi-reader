import { useEffect, useState, useCallback } from 'react';
import { usePdfDocument } from './pdf/usePdfDocument';
import { PdfViewer } from './pdf/PdfViewer';
import { Toolbar } from './ui/Toolbar';
import { Sidebar } from './ui/Sidebar';
import { useHighlights } from './ui/useHighlights';
import { buildPageFilter } from './theme/filters';
import { readEmbeddedOutline } from './pdf/outline';
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
  const { highlights, addHighlight: _addHighlight, removeHighlight: _removeHighlight } = useHighlights([]);

  // Load or create record when a doc opens.
  useEffect(() => {
    if (!doc || !hash || !meta) return;
    (async () => {
      const existing = await getDocument(hash);
      const embedded = await readEmbeddedOutline(doc);
      if (existing) {
        setSettings(existing.settings);
        setChapters(mergeChapters(embedded, [], existing.chapters.filter((c) => c.origen === 'manual')));
        setCurrentPage(existing.meta.ultimaPagina);
      } else {
        const rec = newDocumentRecord(hash, meta);
        rec.chapters = embedded;
        await patchDocument(hash, rec);
        setSettings(rec.settings);
        setChapters(embedded);
        setCurrentPage(1);
      }
    })().catch((e) => console.error('[load-or-create] failed:', e));
  }, [doc, hash, meta]);

  // Autosave on any change.
  useEffect(() => {
    if (!hash || !meta) return;
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

  const filter = buildPageFilter(settings);

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
        <div className="pdf-stage" style={{ flex: 1, overflow: 'auto', filter }}>
          {meta && <div className="doc-title" style={{ padding: '4px 12px' }}>{meta.titulo}</div>}
          {doc && meta && (
            <PdfViewer
              doc={doc} totalPages={meta.totalPaginas} currentPage={currentPage}
              scale={1.3} onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
