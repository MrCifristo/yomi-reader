import { renderHook, act, waitFor } from '@testing-library/react';
import { usePdfDocument } from './usePdfDocument';

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: () => ({ promise: Promise.resolve({ numPages: 7 }) }),
}));

function fileOf(text: string) {
  return new File([new TextEncoder().encode(text)], 'libro.pdf', { type: 'application/pdf' });
}

test('openFile loads doc, hash and meta', async () => {
  const { result } = renderHook(() => usePdfDocument());
  await act(async () => { await result.current.openFile(fileOf('pdfbytes')); });
  await waitFor(() => expect(result.current.doc).not.toBeNull());
  expect(result.current.meta?.totalPaginas).toBe(7);
  expect(result.current.meta?.titulo).toBe('libro.pdf');
  expect(result.current.hash).toMatch(/^[0-9a-f]{64}$/);
});
