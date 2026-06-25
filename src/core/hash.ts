import type { Settings } from './types';

export async function hashDocument(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function defaultSettings(): Settings {
  return { modo: 'texto', contraste: 0, brillo: 0, temperatura: 0 };
}
