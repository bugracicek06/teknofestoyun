import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// In-memory + local dev JSON store for testing cross-device access on local network / dev mode
const devCertStore = new Map<string, any>();
const devStoreFile = path.resolve(process.cwd(), 'data', 'dev_certificates.json');

function loadDevStore() {
  try {
    if (fs.existsSync(devStoreFile)) {
      const raw = fs.readFileSync(devStoreFile, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach(c => {
          if (c && c.certificateId) devCertStore.set(c.certificateId, c);
        });
      }
    }
  } catch (e) {
    console.warn('[Vite Dev API] Could not load dev_certificates.json:', e);
  }
}

function saveDevStore() {
  try {
    const dir = path.dirname(devStoreFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(devStoreFile, JSON.stringify(Array.from(devCertStore.values()), null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Vite Dev API] Could not save dev_certificates.json:', e);
  }
}

loadDevStore();

function devCertificateApiPlugin(): Plugin {
  return {
    name: 'dev-certificate-api',
    apply: 'serve', // strictly dev-only!
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if (url.startsWith('/api/certificates')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }

          if (req.method === 'GET') {
            const parts = url.split('?')[0].split('/');
            const id = parts[3];
            if (!id) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing certificateId' }));
              return;
            }
            const record = devCertStore.get(id);
            if (!record) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Certificate not found' }));
              return;
            }
            res.statusCode = 200;
            res.end(JSON.stringify(record));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                if (!data.certificateId || !data.fullName) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Invalid certificate payload' }));
                  return;
                }
                devCertStore.set(data.certificateId, data);
                saveDevStore();
                res.statusCode = 201;
                res.end(JSON.stringify(data));
              } catch (err: any) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Malformed JSON', details: err?.message }));
              }
            });
            return;
          }
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devCertificateApiPlugin()],
});
