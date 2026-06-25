import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';

const chapters = [
  { id: 'a', titulo: 'Intro', pagina: 1, nivel: 0, origen: 'embebido' as const },
  { id: 'b', titulo: 'Métodos', pagina: 20, nivel: 0, origen: 'embebido' as const },
];

test('clicking a chapter jumps to its page', () => {
  const onJump = vi.fn();
  render(<Sidebar chapters={chapters} highlights={[]} currentPage={1} onJump={onJump} onAddChapter={() => {}} />);
  fireEvent.click(screen.getByText('Métodos'));
  expect(onJump).toHaveBeenCalledWith(20);
});

test('adding a chapter uses current page', () => {
  const onAddChapter = vi.fn();
  render(<Sidebar chapters={chapters} highlights={[]} currentPage={7} onJump={() => {}} onAddChapter={onAddChapter} />);
  fireEvent.change(screen.getByPlaceholderText(/título del capítulo/i), { target: { value: 'Nuevo' } });
  fireEvent.click(screen.getByText(/añadir capítulo/i));
  expect(onAddChapter).toHaveBeenCalledWith('Nuevo');
});
