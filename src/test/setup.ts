import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { webcrypto } from 'node:crypto';
import { vi } from 'vitest';

if (!globalThis.crypto) (globalThis as any).crypto = webcrypto;

// jsdom defines canvas getContext but logs "Not implemented" and returns null.
// Override it unconditionally with a quiet stub so PDF-rendering components can
// run in tests without noise. The render path is exercised against mocked
// pdfjs, which ignores the returned context.
HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as never;
