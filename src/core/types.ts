export interface NormRect { x: number; y: number; w: number; h: number; }
export interface Chapter { id: string; titulo: string; pagina: number; nivel: number; origen: 'embebido' | 'auto' | 'manual'; }
export interface Highlight { id: string; pagina: number; rects: NormRect[]; color: string; texto: string; creado: number; }
export interface Settings { modo: 'texto' | 'escaneado'; contraste: number; brillo: number; temperatura: number; }
export interface DocMeta { titulo: string; totalPaginas: number; ultimaPagina: number; }
export interface DocumentRecord { hash: string; meta: DocMeta; chapters: Chapter[]; highlights: Highlight[]; settings: Settings; }
