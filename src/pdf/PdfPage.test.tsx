import { render, screen, waitFor } from '@testing-library/react';
import { PdfPage } from './PdfPage';

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  OPS: {
    paintImageXObject: 85,
    paintInlineImageXObject: 92,
    paintImageMaskXObject: 83,
  },
  TextLayer: class { render() { return Promise.resolve(); } cancel() {} },
}));

function mockDoc() {
  const viewport = { width: 600, height: 800, scale: 1 };
  return {
    getPage: vi.fn().mockResolvedValue({
      getViewport: () => viewport,
      render: () => ({ promise: Promise.resolve() }),
      getTextContent: () => Promise.resolve({ items: [] }),
      getOperatorList: () => Promise.resolve({ fnArray: [], argsArray: [] }),
    }),
  } as any;
}

test('renders a canvas and reports dimensions', async () => {
  const onRendered = vi.fn();
  render(<PdfPage doc={mockDoc()} pageNumber={1} scale={1} onRendered={onRendered} />);
  await waitFor(() => expect(screen.getByTestId('pdf-canvas')).toBeInTheDocument());
  await waitFor(() => expect(onRendered).toHaveBeenCalledWith(1, { width: 600, height: 800 }));
});

test('renders with darkText prop without crashing', async () => {
  const onRendered = vi.fn();
  render(<PdfPage doc={mockDoc()} pageNumber={1} scale={1} darkText onRendered={onRendered} />);
  await waitFor(() => expect(screen.getByTestId('pdf-canvas')).toBeInTheDocument());
  await waitFor(() => expect(onRendered).toHaveBeenCalledWith(1, { width: 600, height: 800 }));
});
