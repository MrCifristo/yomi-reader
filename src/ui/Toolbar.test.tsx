import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar } from './Toolbar';
import { defaultSettings } from '../core/hash';

const base = {
  settings: defaultSettings(), highlightMode: false,
  onOpenFile: vi.fn(), onToggleScanned: vi.fn(), onToggleHighlight: vi.fn(),
  onSliderChange: vi.fn(), onExport: vi.fn(), onImport: vi.fn(),
};

test('toggling scanned mode fires handler', () => {
  const onToggleScanned = vi.fn();
  render(<Toolbar {...base} onToggleScanned={onToggleScanned} />);
  fireEvent.click(screen.getByText(/escaneado/i));
  expect(onToggleScanned).toHaveBeenCalled();
});

test('contrast slider is disabled in texto mode', () => {
  render(<Toolbar {...base} />);
  expect(screen.getByLabelText(/contraste/i)).toBeDisabled();
});
