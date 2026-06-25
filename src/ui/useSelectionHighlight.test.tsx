import { renderHook } from '@testing-library/react';
import { useSelectionHighlight } from './useSelectionHighlight';

test('captureSelection normalizes rects and calls onCreate', () => {
  const onCreate = vi.fn();
  const { result } = renderHook(() => useSelectionHighlight({ enabled: true, color: '#d9a441', onCreate }));

  const pageEl = document.createElement('div');
  pageEl.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 800, right: 1000, bottom: 800, x: 0, y: 0, toJSON: () => {} }) as DOMRect;

  const range = {
    getClientRects: () => [{ left: 100, top: 80, width: 200, height: 40 }],
    toString: () => 'texto seleccionado',
  };
  // @ts-expect-error minimal selection stub
  window.getSelection = () => ({ rangeCount: 1, isCollapsed: false, getRangeAt: () => range, removeAllRanges: () => {} });

  result.current.captureSelection(pageEl, 3, 1000, 800);
  expect(onCreate).toHaveBeenCalledWith(3, [{ x: 0.1, y: 0.1, w: 0.2, h: 0.05 }], '#d9a441', 'texto seleccionado');
});

test('does nothing when disabled', () => {
  const onCreate = vi.fn();
  const { result } = renderHook(() => useSelectionHighlight({ enabled: false, color: '#d9a441', onCreate }));
  result.current.captureSelection(document.createElement('div'), 1, 1000, 800);
  expect(onCreate).not.toHaveBeenCalled();
});
