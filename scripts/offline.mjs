import { readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const files = (await readdir('dist/assets')).map(name => `/assets/${name}`);
const version = createHash('sha256').update(files.join('|')).digest('hex').slice(0,12);
await writeFile('dist/sw.js', `
const CACHE = 'mmt-${version}';
const FILES = ${JSON.stringify(['/', '/index.html', ...files])};
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('mmt-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).catch(() => event.request.mode === 'navigate' ? caches.match('/index.html') : Response.error())));
});
`);
console.log(`Offline cache: ${files.length} build assets, version ${version}`);
