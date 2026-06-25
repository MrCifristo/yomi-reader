import { renderHook, act } from '@testing-library/react';
import { useHighlights } from './useHighlights';

test('adds and removes highlights immutably', () => {
  const { result } = renderHook(() => useHighlights([]));
  let id = '';
  act(() => { id = result.current.addHighlight(2, [{ x: 0, y: 0, w: 0.1, h: 0.1 }], '#d9a441', 'hola'); });
  expect(result.current.highlights).toHaveLength(1);
  expect(result.current.highlights[0].pagina).toBe(2);
  act(() => { result.current.removeHighlight(id); });
  expect(result.current.highlights).toHaveLength(0);
});
