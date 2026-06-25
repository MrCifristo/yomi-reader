import { autoDetectChapters, collectFontStats } from './outline';

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

test('collectFontStats returns one stat per non-empty text item with correct fontSize', async () => {
  const mockDoc = {
    numPages: 2,
    getPage: async (pageNum: number) => ({
      getTextContent: async () => ({
        items: pageNum === 1
          ? [
              { str: 'CAPÍTULO 1', transform: [1, 0, 0, 18, 0, 0] },  // fontSize = hypot(0,18) = 18
              { str: '', transform: [1, 0, 0, 10, 0, 0] },             // skipped: empty
              { str: 'cuerpo', transform: [1, 0, 0, 10, 0, 0] },       // fontSize = 10
            ]
          : [
              { str: 'más texto', transform: [1, 0, 0, 10, 0, 0] },    // fontSize = 10
            ],
      }),
    }),
  };

  const stats = await collectFontStats(mockDoc as any);

  expect(stats).toHaveLength(3);
  expect(stats[0]).toEqual({ page: 1, text: 'CAPÍTULO 1', fontSize: 18 });
  expect(stats[1]).toEqual({ page: 1, text: 'cuerpo', fontSize: 10 });
  expect(stats[2]).toEqual({ page: 2, text: 'más texto', fontSize: 10 });
});

test('collectFontStats respects maxPages cap', async () => {
  const mockDoc = {
    numPages: 50,
    getPage: async (_pageNum: number) => ({
      getTextContent: async () => ({ items: [{ str: 'text', transform: [1, 0, 0, 12, 0, 0] }] }),
    }),
  };

  const stats = await collectFontStats(mockDoc as any, 5);
  // 5 pages × 1 item each = 5 stats
  expect(stats).toHaveLength(5);
  expect(stats[0].page).toBe(1);
  expect(stats[4].page).toBe(5);
});
