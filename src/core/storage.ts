import { openDB, type IDBPDatabase } from 'idb';
import type { DocumentRecord, DocMeta } from './types';
import { defaultSettings } from './hash';

const DB_NAME = 'yomi-reader';
const STORE = 'documents';

let dbPromise: Promise<IDBPDatabase> | null = null;
function db() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(d) { d.createObjectStore(STORE, { keyPath: 'hash' }); },
    });
  }
  return dbPromise;
}

export function newDocumentRecord(hash: string, meta: DocMeta): DocumentRecord {
  return { hash, meta, chapters: [], highlights: [], settings: defaultSettings() };
}

export async function getDocument(hash: string): Promise<DocumentRecord | undefined> {
  return (await db()).get(STORE, hash);
}

export async function saveDocument(rec: DocumentRecord): Promise<void> {
  await (await db()).put(STORE, rec);
}

export async function patchDocument(hash: string, partial: Partial<DocumentRecord>): Promise<DocumentRecord> {
  const existing = (await getDocument(hash)) ?? newDocumentRecord(hash, partial.meta ?? { titulo: '', totalPaginas: 0, ultimaPagina: 1 });
  const merged: DocumentRecord = { ...existing, ...partial, hash };
  await saveDocument(merged);
  return merged;
}
