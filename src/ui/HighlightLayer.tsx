import type { Highlight } from '../core/types';
import { denormalizeRect } from '../core/rects';

interface Props {
  highlights: Highlight[];
  pagina: number;
  pageW: number;
  pageH: number;
  onRemove: (id: string) => void;
}

export function HighlightLayer({ highlights, pagina, pageW, pageH, onRemove }: Props) {
  return (
    <div className="highlight-layer">
      {highlights.filter((h) => h.pagina === pagina).flatMap((h) =>
        h.rects.map((r, i) => {
          const px = denormalizeRect(r, pageW, pageH);
          return (
            <div
              key={`${h.id}-${i}`}
              data-testid="hl-box"
              onClick={() => onRemove(h.id)}
              style={{ position: 'absolute', left: px.x, top: px.y, width: px.w, height: px.h,
                       background: h.color, opacity: 0.45, cursor: 'pointer' }}
            />
          );
        })
      )}
    </div>
  );
}
