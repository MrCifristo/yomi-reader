import { useState } from 'react';
import type { Chapter, Highlight } from '../core/types';
import { chapterForPage } from '../core/chapters';

interface Props {
  chapters: Chapter[];
  highlights: Highlight[];
  currentPage: number;
  onJump: (page: number) => void;
  onAddChapter: (titulo: string) => void;
}

export function Sidebar({ chapters, highlights, currentPage, onJump, onAddChapter }: Props) {
  const [tab, setTab] = useState<'indice' | 'notas'>('indice');
  const [titulo, setTitulo] = useState('');
  const active = chapterForPage(chapters, currentPage);

  return (
    <aside className="sidebar">
      <div className="tabs">
        <button className={`gb-btn ${tab === 'indice' ? 'active' : ''}`} onClick={() => setTab('indice')}>Índice</button>
        <button className={`gb-btn ${tab === 'notas' ? 'active' : ''}`} onClick={() => setTab('notas')}>Notas</button>
      </div>

      {tab === 'indice' && (
        <div className="idx">
          {chapters.map((c) => (
            <div
              key={c.id}
              className={`idx-row ${active?.id === c.id ? 'cur' : ''}`}
              style={{ paddingLeft: 8 + c.nivel * 12 }}
              onClick={() => onJump(c.pagina)}
            >
              <span>{c.titulo}</span><span className="pg">p.{c.pagina}</span>
            </div>
          ))}
          <div className="add-chapter">
            <input
              placeholder="Título del capítulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
            <button className="gb-btn" onClick={() => { if (titulo.trim()) { onAddChapter(titulo.trim()); setTitulo(''); } }}>
              + Añadir capítulo
            </button>
          </div>
        </div>
      )}

      {tab === 'notas' && (
        <div className="notas">
          {highlights.map((h) => (
            <div key={h.id} className="nota-row" onClick={() => onJump(h.pagina)}>
              <span className="swatch" style={{ background: h.color }} />
              <span className="nota-text">{h.texto.slice(0, 60)}</span>
              <span className="pg">p.{h.pagina}</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
