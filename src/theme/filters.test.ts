import { buildPageFilter } from './filters';
import { defaultSettings } from '../core/hash';

test('texto mode returns none (canvas inversion handles dark mode)', () => {
  expect(buildPageFilter({ ...defaultSettings(), modo: 'texto' })).toBe('none');
});

test('escaneado mode appends contrast/brightness/sepia from sliders', () => {
  const f = buildPageFilter({ modo: 'escaneado', contraste: 50, brillo: -20, temperatura: 40 });
  expect(f).toBe('invert(1) hue-rotate(180deg) contrast(1.5) brightness(0.8) sepia(0.4)');
});
