import { render, screen } from '@testing-library/react';
import { PdfViewer } from './PdfViewer';

vi.mock('./PdfPage', () => ({
  PdfPage: ({ pageNumber }: { pageNumber: number }) => <div data-testid="page">{pageNumber}</div>,
}));

function doc(n: number) { return { numPages: n } as any; }

test('only renders pages within the window around currentPage', () => {
  render(<PdfViewer doc={doc(100)} totalPages={100} currentPage={50} scale={1} onPageChange={() => {}} />);
  const pages = screen.getAllByTestId('page').map((e) => Number(e.textContent));
  expect(pages).toEqual([48, 49, 50, 51, 52]);
});
