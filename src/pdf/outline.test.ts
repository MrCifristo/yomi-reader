import { autoDetectChapters } from './outline';

test('auto-detects headings as blocks 1.4x median font size', () => {
  const stats = [
    { page: 1, text: 'cuerpo', fontSize: 10 },
    { page: 1, text: 'CAPÍTULO 1', fontSize: 18 },
    { page: 2, text: 'cuerpo', fontSize: 10 },
    { page: 2, text: 'cuerpo', fontSize: 10 },
  ];
  const out = autoDetectChapters(stats);
  expect(out).toHaveLength(1);
  expect(out[0]).toMatchObject({ titulo: 'CAPÍTULO 1', pagina: 1, origen: 'auto' });
});
