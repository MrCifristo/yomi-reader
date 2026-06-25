# YOMI.READER

Local-only PDF reader with smart dark mode, chapter navigation, and a persistent highlighter. Retro Pokémon × Cowboy-Bebop aesthetic.

> **Privacy:** PDFs never leave your browser. All data (annotations, highlights, chapters) lives in your browser's IndexedDB, keyed by a SHA-256 hash of each PDF. Nothing is transmitted.

## Run

```bash
pnpm install
pnpm dev        # development server (http://localhost:5173)
pnpm test       # test suite (Vitest)
pnpm build      # production build → static files in dist/
```

## Features

- **100% local** — PDFs never leave your browser. No server, no upload.
- **Dark mode (Modo texto B)** — inverts text pages while preserving color figures using CSS `mix-blend-mode`.
- **Scanned mode (Escaneado A+C)** — contrast, brightness, and temperature sliders for scanned-document PDFs.
- **Smart index** — built from the PDF's embedded outline; falls back to auto-detection of heading pages; supports manual chapter entries pinned to any page.
- **Persistent highlighter** — select text to highlight in multiple colors; highlights survive page reloads via IndexedDB. Export/import annotations as `*.notas.json`.
- **Retro aesthetic** — Bebop Dusk palette: warm amber, teal, dark grays. Pokémon-style pixel fonts for headings, monospace body.

## Interactive Smoke Test (manual)

After `pnpm dev`:

1. Open a text-based PDF → confirm dark mode shows light text on dark background, figures keep color.
2. Toggle Escaneado → sliders appear; adjust contrast/brightness/temperature.
3. Check the index panel for embedded chapters; click **+ Añadir capítulo** to pin one at the current page.
4. Enable ✦ Resaltar, select text, confirm highlight appears; reload the page, confirm highlight persists.
5. Click Export → downloads `<name>.notas.json`; clear IndexedDB; Import → annotations restored.

## Tech Stack

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript
- [PDF.js](https://mozilla.github.io/pdf.js/) (Mozilla) for PDF rendering
- [Vitest](https://vitest.dev/) for unit tests
- IndexedDB (via custom schema) for local persistence
