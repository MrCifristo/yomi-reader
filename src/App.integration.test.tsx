import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { getDocument } from './core/storage';
import { hashDocument } from './core/hash';

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  OPS: { paintImageXObject: 85, paintJpegXObject: 86 },
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
