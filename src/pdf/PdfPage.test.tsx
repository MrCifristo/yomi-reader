import { render, screen, waitFor } from '@testing-library/react';
import { PdfPage } from './PdfPage';

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  TextLayer: class { render() { return Promise.resolve(); } cancel() {} },
}));

function mockDoc() {
  const viewport = { width: 600, height: 800, scale: 1 };
  return {
    getPage: vi.fn().mockResolvedValue({
      getViewport: () => viewport,
      render: () => ({ promise: Promise.resolve() }),
      getTextContent: () => Promise.resolve({ items: [] }),
    }),
  } as any;
}

test('renders a canvas and reports dimensions', async () => {
  const onRendered = vi.fn();
  render(<PdfPage doc={mockDoc()} pageNumber={1} scale={1} onRendered={onRendered} />);
  await waitFor(() => expect(screen.getByTestId('pdf-canvas')).toBeInTheDocument());
  await waitFor(() => expect(onRendered).toHaveBeenCalledWith(1, { width: 600, height: 800 }));
});
