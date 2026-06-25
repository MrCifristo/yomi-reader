import type { Settings } from '../core/types';

interface Props {
  settings: Settings;
  highlightMode: boolean;
  onOpenFile: (file: File) => void;
  onToggleScanned: () => void;
  onToggleHighlight: () => void;
  onSliderChange: (key: 'contraste' | 'brillo' | 'temperatura', value: number) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export function Toolbar(p: Props) {
  const scanned = p.settings.modo === 'escaneado';
  const slider = (key: 'contraste' | 'brillo' | 'temperatura', label: string) => (
    <label className="slider">
      {label}
      <input
        type="range" min={-100} max={100} aria-label={label}
        value={p.settings[key]} disabled={!scanned}
        onChange={(e) => p.onSliderChange(key, Number(e.target.value))}
      />
    </label>
  );

  return (
    <header className="topbar">
      <span className="brand">YOMI.READER</span>
      <label className="gb-btn">📂 Abrir
        <input type="file" accept="application/pdf" hidden
          onChange={(e) => e.target.files?.[0] && p.onOpenFile(e.target.files[0])} />
      </label>
      <button className={`gb-btn ${scanned ? 'active' : ''}`} onClick={p.onToggleScanned}>🖼 Escaneado</button>
      <button className={`gb-btn ${p.highlightMode ? 'active' : ''}`} onClick={p.onToggleHighlight}>✦ Resaltar</button>
      {slider('contraste', 'Contraste')}
      {slider('brillo', 'Brillo')}
      {slider('temperatura', 'Temperatura')}
      <div style={{ flex: 1 }} />
      <button className="gb-btn" onClick={p.onExport}>⤓ Exportar</button>
      <label className="gb-btn">⤒ Importar
        <input type="file" accept="application/json" hidden
          onChange={(e) => e.target.files?.[0] && p.onImport(e.target.files[0])} />
      </label>
    </header>
  );
}
