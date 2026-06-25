import type { Chapter } from '../core/types';

interface FooterProps {
  chapters: Chapter[];
  currentPage: number;
  totalPages: number;
  saving: boolean;
  onPrevChapter: () => void;
  onNextChapter: () => void;
}

export function Footer({ currentPage, totalPages, saving, onPrevChapter, onNextChapter }: FooterProps) {
  return (
    <footer className="gb-foot">
      <button className="gb-btn" onClick={onPrevChapter} aria-label="Cap. anterior">
        ◀ Cap. anterior
      </button>
      <span className="gb-foot__counter">pág. {currentPage} / {totalPages}</span>
      {saving && <span className="gb-foot__saving">● guardando…</span>}
      <button className="gb-btn" onClick={onNextChapter} aria-label="Cap. siguiente">
        Cap. siguiente ▶
      </button>
    </footer>
  );
}
