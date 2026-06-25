import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  test('renders page counter as "pág. X / N"', () => {
    render(<Footer currentPage={5} totalPages={100} saving={false} />);
    expect(screen.getByText('pág. 5 / 100')).toBeInTheDocument();
  });

  test('has no chapter navigation arrows (reading is continuous scroll)', () => {
    render(<Footer currentPage={5} totalPages={100} saving={false} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('saving=true shows guardando indicator', () => {
    render(<Footer currentPage={5} totalPages={100} saving={true} />);
    expect(screen.getByText(/guardando/i)).toBeInTheDocument();
  });

  test('saving=false hides guardando indicator', () => {
    render(<Footer currentPage={5} totalPages={100} saving={false} />);
    expect(screen.queryByText(/guardando/i)).toBeNull();
  });
});
