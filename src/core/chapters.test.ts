import { mergeChapters, chapterForPage, nextChapterPage, prevChapterPage } from './chapters';
import type { Chapter } from './types';

const ch = (titulo: string, pagina: number, origen: Chapter['origen']): Chapter =>
  ({ id: `${origen}-${pagina}`, titulo, pagina, nivel: 0, origen });

test('manual chapters survive and embedded beats auto on collision', () => {
  const embedded = [ch('Intro', 1, 'embebido'), ch('Métodos', 20, 'embebido')];
  const auto = [ch('Intro', 1, 'auto'), ch('Extra', 50, 'auto')];
  const manual = [ch('Mi nota', 30, 'manual')];
  const out = mergeChapters(embedded, auto, manual);
  expect(out.map((c) => c.titulo)).toEqual(['Intro', 'Métodos', 'Mi nota', 'Extra']);
  expect(out.find((c) => c.pagina === 1)?.origen).toBe('embebido');
});

test('chapterForPage returns the active chapter', () => {
  const chapters = [ch('A', 1, 'embebido'), ch('B', 20, 'embebido')];
  expect(chapterForPage(chapters, 25)?.titulo).toBe('B');
  expect(chapterForPage(chapters, 5)?.titulo).toBe('A');
});

test('nextChapterPage returns first chapter strictly after current', () => {
  const chapters = [ch('A', 1, 'embebido'), ch('B', 20, 'embebido'), ch('C', 40, 'embebido')];
  expect(nextChapterPage(chapters, 1)).toBe(20);
  expect(nextChapterPage(chapters, 19)).toBe(20);
  expect(nextChapterPage(chapters, 20)).toBe(40);
  expect(nextChapterPage(chapters, 40)).toBeNull();
  expect(nextChapterPage(chapters, 99)).toBeNull();
});

test('prevChapterPage returns last chapter strictly before current', () => {
  const chapters = [ch('A', 1, 'embebido'), ch('B', 20, 'embebido'), ch('C', 40, 'embebido')];
  expect(prevChapterPage(chapters, 40)).toBe(20);
  expect(prevChapterPage(chapters, 21)).toBe(20);
  expect(prevChapterPage(chapters, 20)).toBe(1);
  expect(prevChapterPage(chapters, 1)).toBeNull();
  expect(prevChapterPage(chapters, 0)).toBeNull();
});

test('nextChapterPage with empty chapters returns null', () => {
  expect(nextChapterPage([], 5)).toBeNull();
});

test('prevChapterPage with empty chapters returns null', () => {
  expect(prevChapterPage([], 5)).toBeNull();
});
