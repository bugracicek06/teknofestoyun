import { readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import path from 'node:path';

let commit = process.env.COMMIT_REF || '';
if (!commit) {
  try {
    commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    commit = 'unknown';
  }
}

// Collect only files (not directory paths)
const entries = await readdir('dist/assets', { withFileTypes: true, recursive: true });
const files = entries
  .filter(e => e.isFile())
  .map(e => {
    const parent = e.parentPath || e.path || 'dist/assets';
    const rel = path.relative('dist/assets', path.join(parent, e.name)).replace(/\\/g, '/');
    return `/assets/${rel}`;
  })
  .sort();

const version = createHash('sha256').update(files.join('|') + '|' + commit).digest('hex').slice(0, 12);

await writeFile('dist/version.json', JSON.stringify({
  commit,
  shortCommit: commit.slice(0, 7),
  branch: process.env.BRANCH || 'main',
  buildTime: new Date().toISOString(),
  cacheVersion: `mmt-${version}`,
}, null, 2));

await writeFile('dist/sw.js', `
const CACHE = 'mmt-${version}';
const FILES = ${JSON.stringify(['/', '/index.html', ...files])};
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).catch(err => console.warn('Cache error:', err)));
});
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('mmt-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/certificate/') || url.pathname === '/version.json') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
`);
console.log(`Offline cache: ${files.length} build assets, version ${version}, commit ${commit.slice(0, 7)}`);
