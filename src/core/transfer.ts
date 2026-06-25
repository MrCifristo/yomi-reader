import type { DocumentRecord } from './types';

export function exportRecord(rec: DocumentRecord): string {
  return JSON.stringify({ version: 1, ...rec }, null, 2);
}

export function importRecord(json: string): DocumentRecord {
  let data: any;
  try { data = JSON.parse(json); } catch { throw new Error('JSON de notas inválido'); }
  const ok = data && typeof data.hash === 'string' && data.meta && Array.isArray(data.chapters)
    && Array.isArray(data.highlights) && data.settings;
  if (!ok) throw new Error('JSON de notas inválido');
  const { hash, meta, chapters, highlights, settings } = data;
  return { hash, meta, chapters, highlights, settings };
}
