import { render, screen } from '@testing-library/react';
import { PdfViewer } from './PdfViewer';

vi.mock('./PdfPage', () => ({
  PdfPage: ({ pageNumber }: { pageNumber: number }) => <div data-testid="page">{pageNumber}</div>,
}));

function doc(n: number) { return { numPages: n } as any; }

test('renders a slot per page so the scrollbar spans the whole document', () => {
  const { container } = render(
    <PdfViewer doc={doc(100)} totalPages={100} currentPage={1} scale={1} onPageChange={() => {}} />,
  );
  expect(container.querySelectorAll('.pdf-slot')).toHaveLength(100);
});

test('virtualizes: mounts only pages near the viewport, not the whole document', () => {
  render(<PdfViewer doc={doc(100)} totalPages={100} currentPage={1} scale={1} onPageChange={() => {}} />);
  const mounted = screen.getAllByTestId('page').map((e) => Number(e.textContent));
  expect(mounted).toContain(1);
  expect(mounted.length).toBeLessThan(100);
});
