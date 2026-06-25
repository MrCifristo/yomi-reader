import { render, screen, fireEvent } from '@testing-library/react';
import { HighlightLayer } from './HighlightLayer';

const h = [{ id: 'x', pagina: 1, rects: [{ x: 0.1, y: 0.1, w: 0.2, h: 0.05 }], color: '#d9a441', texto: 't', creado: 1 }];

test('renders one box per rect and removes on click', () => {
  const onRemove = vi.fn();
  render(<HighlightLayer highlights={h} pagina={1} pageW={1000} pageH={800} onRemove={onRemove} />);
  const box = screen.getByTestId('hl-box');
  expect(box).toHaveStyle({ left: '100px', top: '80px', width: '200px', height: '40px' });
  fireEvent.click(box);
  expect(onRemove).toHaveBeenCalledWith('x');
});
