import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve, sep } from 'node:path';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptDir, '..');
const dist = join(frontendRoot, 'dist');

async function walk(directory) {
  const results = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) results.push(...await walk(full));
    else if (entry.isFile()) results.push(full);
  }
  return results;
}

const allFiles = await walk(dist);
const allowed = allFiles
  .map((path) => relative(dist, path).split(sep).join('/'))
  .filter((path) =>
    path === 'index.html' ||
    path === 'offline.html' ||
    path === 'favicon.svg' ||
    path === 'manifest.webmanifest' ||
    /^assets\/[a-zA-Z0-9_./-]+\.(js|css)$/.test(path),
  )
  .sort();

if (!allowed.includes('index.html') || !allowed.some((x) => x.endsWith('.js'))) {
  throw new Error('Production shell files were not found in dist/. Build Vite first.');
}

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
process.stdout.write('Built offline shell: ' + allowed.length + ' files, cache ' + cacheName + '\n');
