import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { getDocument, patchDocument } from './core/storage';
import { hashDocument } from './core/hash';
import type { Highlight } from './core/types';

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  OPS: { paintImageXObject: 85, paintJpegXObject: 86 },
  TextLayer: class { render() { return Promise.resolve(); } cancel() {} },
  getDocument: () => ({ promise: Promise.resolve({
    numPages: 3,
    getOutline: async () => null,
    getPage: async () => ({
      getViewport: () => ({ width: 600, height: 800 }),
      render: () => ({ promise: Promise.resolve() }),
      getTextContent: async () => ({ items: [] }),
      getOperatorList: async () => ({ fnArray: [], argsArray: [] }),
    }),
  }) }),
}));

function pdfFile() {
  return new File([new TextEncoder().encode('bytes')], 'tesis.pdf', { type: 'application/pdf' });
}

test('opening a PDF persists a document record by hash', async () => {
  const { container } = render(<App />);
  const input = container.querySelector('input[type=file][accept="application/pdf"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [pdfFile()] } });
  await waitFor(() => expect(screen.getByText('tesis.pdf')).toBeInTheDocument());
  // a record now exists in IndexedDB — verify via the storage layer
  const expectedHash = await hashDocument(new TextEncoder().encode('bytes').buffer);
  await waitFor(async () => {
    expect(await getDocument(expectedHash)).toBeTruthy();
  });
});

test('toggling scanned mode switches the page filter to include contrast', async () => {
  render(<App />);
  // no file open yet: scanned toggle still flips settings and is reflected on the viewer wrapper
  fireEvent.click(screen.getByText(/escaneado/i));
  await waitFor(() => {
    const stage = document.querySelector('.pdf-stage') as HTMLElement;
    expect(stage.style.filter).toContain('contrast');
  });
});

test('reopening a PDF restores saved highlights and does not wipe them via autosave', async () => {
  // (a) Compute the hash of the PDF bytes
  const bytes = new TextEncoder().encode('bytes');
  const hash = await hashDocument(bytes.buffer as ArrayBuffer);

  // (b) Seed IndexedDB with a DocumentRecord containing one highlight for that hash
  const savedHighlight: Highlight = {
    id: 'test-highlight-id',
    pagina: 1,
    rects: [{ x: 0.1, y: 0.1, w: 0.5, h: 0.05 }],
    color: '#d9a441',
    texto: 'This is a saved highlight',
    creado: Date.now(),
  };
  await patchDocument(hash, {
    hash,
    meta: { titulo: 'tesis.pdf', totalPaginas: 3, ultimaPagina: 1 },
    chapters: [],
    highlights: [savedHighlight],
    settings: { modo: 'texto', contraste: 1, brillo: 1, temperatura: 0 },
  });

  // (c) Render App and open the seeded PDF file
  const { container } = render(<App />);
  const input = container.querySelector('input[type=file][accept="application/pdf"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [pdfFile()] } });

  // (d) Wait for the document title to appear
  await waitFor(() => expect(screen.getByText('tesis.pdf')).toBeInTheDocument());

  // (e) Switch to the Notas tab and assert the highlight text appears in the Sidebar
  fireEvent.click(screen.getByText(/notas/i));
  await waitFor(() => {
    expect(screen.getByText('This is a saved highlight')).toBeInTheDocument();
  });

  // (f) After a short wait, assert that getDocument(hash) still has that highlight (not wiped)
  await waitFor(async () => {
    const record = await getDocument(hash);
    expect(record?.highlights).toHaveLength(1);
    expect(record?.highlights[0].id).toBe('test-highlight-id');
    expect(record?.highlights[0].texto).toBe('This is a saved highlight');
  });
});
