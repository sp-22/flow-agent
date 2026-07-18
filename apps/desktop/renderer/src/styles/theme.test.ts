import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(__dirname, 'theme.css'), 'utf8');

test('defines dark base and earned signal tokens verbatim', () => {
  expect(css).toContain('--bg-base:      #09090b');
  expect(css).toContain('--signal: #e5534b');
  expect(css).toContain('--go:     #3fb950');
  expect(css).toContain('--hold:   #d29922');
});

test('defines light theme override', () => {
  expect(css).toContain('[data-theme="light"]');
  expect(css).toContain('--bg-base:      #f9f9fb');
});

test('loads the three font families', () => {
  expect(css).toContain('Space Grotesk');
  expect(css).toContain('IBM Plex Sans');
  expect(css).toContain('IBM Plex Mono');
});
