import { exportRecord, importRecord } from './transfer';
import { newDocumentRecord } from './storage';

test('export then import round-trips a record', () => {
  const rec = newDocumentRecord('h1', { titulo: 'X', totalPaginas: 3, ultimaPagina: 2 });
  rec.highlights.push({ id: 'a', pagina: 1, rects: [{ x: 0, y: 0, w: 0.1, h: 0.1 }], color: '#d9a441', texto: 'hi', creado: 1 });
  const restored = importRecord(exportRecord(rec));
  expect(restored).toEqual(rec);
});

test('import rejects malformed JSON', () => {
  expect(() => importRecord('{"nope":true}')).toThrow('JSON de notas inválido');
});
