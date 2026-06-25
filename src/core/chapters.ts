import type { Chapter } from './types';

export function mergeChapters(embedded: Chapter[], auto: Chapter[], manual: Chapter[]): Chapter[] {
  const result: Chapter[] = [...embedded];
  const key = (c: Chapter) => `${c.pagina}|${c.titulo}`;
  const seen = new Set(embedded.map(key));
  for (const a of auto) {
    if (!seen.has(key(a))) { result.push(a); seen.add(key(a)); }
  }
  result.push(...manual);
  return result.sort((p, q) => p.pagina - q.pagina || p.nivel - q.nivel);
}

export function chapterForPage(chapters: Chapter[], page: number): Chapter | undefined {
  let current: Chapter | undefined;
  for (const c of chapters) {
    if (c.pagina <= page) current = c; else break;
  }
  return current;
}
