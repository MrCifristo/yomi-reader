import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the YOMI.READER brand', () => {
  render(<App />);
  expect(screen.getByText(/YOMI\.READER/i)).toBeInTheDocument();
});
