import { getDocument, saveDocument, patchDocument, newDocumentRecord } from './storage';

const meta = { titulo: 'Libro', totalPaginas: 10, ultimaPagina: 1 };

test('saves and retrieves a document record', async () => {
  const rec = newDocumentRecord('hashA', meta);
  await saveDocument(rec);
  const got = await getDocument('hashA');
  expect(got?.meta.titulo).toBe('Libro');
  expect(got?.settings.modo).toBe('texto');
  expect(got?.highlights).toEqual([]);
});

test('patchDocument merges partial fields', async () => {
  await saveDocument(newDocumentRecord('hashB', meta));
  await patchDocument('hashB', { meta: { ...meta, ultimaPagina: 5 } });
  const got = await getDocument('hashB');
  expect(got?.meta.ultimaPagina).toBe(5);
});

test('getDocument returns undefined for unknown hash', async () => {
  expect(await getDocument('nope')).toBeUndefined();
});
