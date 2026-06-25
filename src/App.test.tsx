import { render, screen } from '@testing-library/react';
import App from './App';

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  OPS: { paintImageXObject: 85, paintJpegXObject: 86 },
  TextLayer: class { render() { return Promise.resolve(); } cancel() {} },
  getDocument: () => ({ promise: Promise.resolve({
    numPages: 1,
    getOutline: async () => null,
    getPage: async () => ({
      getViewport: () => ({ width: 600, height: 800 }),
      render: () => ({ promise: Promise.resolve() }),
      getTextContent: async () => ({ items: [] }),
      getOperatorList: async () => ({ fnArray: [], argsArray: [] }),
    }),
  }) }),
}));

test('renders the YOMI.READER brand', () => {
  render(<App />);
  expect(screen.getByText(/YOMI\.READER/i)).toBeInTheDocument();
});
