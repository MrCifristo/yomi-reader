// @vitest-environment node
import { readFileSync } from 'node:fs';

test('theme defines the Bebop Dusk palette variables', () => {
  const css = readFileSync(new URL('./theme.css', import.meta.url), 'utf8');
  for (const hex of ['#e7d8b8', '#d9a441', '#b5533b', '#3f7d7a', '#1f2933', '#161d24']) {
    expect(css.toLowerCase()).toContain(hex);
  }
});
