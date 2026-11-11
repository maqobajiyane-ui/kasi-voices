import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(frontendRoot, 'dist');
const manifest = JSON.parse(await readFile(join(dist, '.vite', 'manifest.json'), 'utf8'));

const eager = new Set();
function includeEager(key) {
  if (eager.has(key)) return;
  eager.add(key);
  const item = manifest[key];
  if (!item) throw new Error('Missing Vite manifest item: ' + key);
  for (const imported of item.imports || []) includeEager(imported);
}

includeEager('index.html');
const shellAssets = new Set(['index.html', 'offline.html', 'favicon.svg', 'manifest.webmanifest']);
for (const key of eager) {
  const item = manifest[key];
  shellAssets.add(item.file);
  for (const css of item.css || []) shellAssets.add(css);
}
const allowed = [...shellAssets].sort();

if (!allowed.some((path) => /^assets\/.*\.js$/.test(path))) {
  throw new Error('No eager frontend JavaScript bundle found.');
}

// Dynamic chunks such as Leaflet and the map panel are fetched ONLY when opened.
const hash = createHash('sha256');
for (const path of allowed) {
  hash.update(path);
  hash.update(await readFile(join(dist, path)));
}
const cacheName = 'kasivoices-shell-' + hash.digest('hex').slice(0, 12);
const template = await readFile(join(frontendRoot, 'src/sw.js'), 'utf8');
const output = template
  .replace("'__KASIVOICES_CACHE__'", JSON.stringify(cacheName))
  .replace('__KASIVOICES_ASSETS__', JSON.stringify(allowed));

if (output.includes('__KASIVOICES_ASSETS__') || output.includes('__KASIVOICES_CACHE__')) {
  throw new Error('Offline worker template placeholders were not replaced.');
}
await writeFile(join(dist, 'sw.js'), output, 'utf8');
process.stdout.write('Built eager offline shell: ' + allowed.length + ' files, cache ' + cacheName + '\n');
