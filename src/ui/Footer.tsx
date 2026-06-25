interface FooterProps {
  currentPage: number;
  totalPages: number;
  saving: boolean;
}

// Reading is a continuous scroll, so the footer only reports position and save
// state — no chapter stepping. Jump to a section via the sidebar index instead.
export function Footer({ currentPage, totalPages, saving }: FooterProps) {
  return (
    <footer className="gb-foot">
      <span className="gb-foot__counter">pág. {currentPage} / {totalPages}</span>
      {saving && <span className="gb-foot__saving">● guardando…</span>}
    </footer>
  );
}
