import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('service worker template uses allowlisted assets, not dynamic media caches', async () => {
  const worker = await readFile(new URL('../src/sw.js', import.meta.url), 'utf8');
  assert.match(worker, /allowedURLs\.has\(url\.href\)/);
  assert.match(worker, /request\.method !== 'GET'/);
  assert.match(worker, /url\.origin !== self\.location\.origin/);
  assert.match(worker, /request\.mode === 'navigate'/);
});

test('build script generates a fingerprinted shell cache', async () => {
  const builder = await readFile(new URL('../scripts/build-service-worker.mjs', import.meta.url), 'utf8');
  assert.match(builder, /createHash\('sha256'\)/);
  assert.match(builder, /kasivoices-shell-/);
  assert.match(builder, /index\.html/);
});
