import { render, screen, fireEvent } from '@testing-library/react';
import { Footer } from './Footer';
import type { Chapter } from '../core/types';

const ch = (titulo: string, pagina: number): Chapter =>
  ({ id: `t-${pagina}`, titulo, pagina, nivel: 0, origen: 'embebido' });

describe('Footer', () => {
  const chapters = [ch('Intro', 1), ch('Cap. 2', 20), ch('Cap. 3', 40)];

  test('renders page counter as "pág. X / N"', () => {
    render(
      <Footer
        chapters={chapters} currentPage={5} totalPages={100}
        saving={false} onPrevChapter={() => {}} onNextChapter={() => {}}
      />
    );
    expect(screen.getByText('pág. 5 / 100')).toBeInTheDocument();
  });

  test('clicking "Cap. siguiente" calls onNextChapter', () => {
    const onNext = vi.fn();
    render(
      <Footer
        chapters={chapters} currentPage={5} totalPages={100}
        saving={false} onPrevChapter={() => {}} onNextChapter={onNext}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /cap\. siguiente/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  test('clicking "Cap. anterior" calls onPrevChapter', () => {
    const onPrev = vi.fn();
    render(
      <Footer
        chapters={chapters} currentPage={25} totalPages={100}
        saving={false} onPrevChapter={onPrev} onNextChapter={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /cap\. anterior/i }));
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  test('saving=true shows guardando indicator', () => {
    render(
      <Footer
        chapters={chapters} currentPage={5} totalPages={100}
        saving={true} onPrevChapter={() => {}} onNextChapter={() => {}}
      />
    );
    expect(screen.getByText(/guardando/i)).toBeInTheDocument();
  });

  test('saving=false hides guardando indicator', () => {
    render(
      <Footer
        chapters={chapters} currentPage={5} totalPages={100}
        saving={false} onPrevChapter={() => {}} onNextChapter={() => {}}
      />
    );
    expect(screen.queryByText(/guardando/i)).toBeNull();
  });
});
