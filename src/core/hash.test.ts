import { hashDocument } from './hash';

test('hashes bytes deterministically to hex SHA-256', async () => {
  const bytes = new TextEncoder().encode('hello').buffer;
  const a = await hashDocument(bytes);
  const b = await hashDocument(new TextEncoder().encode('hello').buffer);
  expect(a).toBe(b);
  expect(a).toMatch(/^[0-9a-f]{64}$/);
});

test('different content yields different hash', async () => {
  const a = await hashDocument(new TextEncoder().encode('a').buffer);
  const b = await hashDocument(new TextEncoder().encode('b').buffer);
  expect(a).not.toBe(b);
});
