import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

import crypto from 'node:crypto';

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
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

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
              res.end(JSON.stringify({ success: false, error: 'INVALID_REQUEST', message: 'Missing certificateId' }));
              return;
            }
            const record = devCertStore.get(id);
            if (!record) {
              res.statusCode = 404;
              res.end(JSON.stringify({ success: false, error: 'CERTIFICATE_NOT_FOUND' }));
              return;
            }
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              certificate: {
                id: record.certificateId,
                certificateId: record.certificateId,
                participantName: record.fullName,
                fullName: record.fullName,
                completedAt: record.completedAt,
                certificateNumber: record.certificateNumber,
                completedModules: record.completedModules,
                projectName: record.projectName,
                results: record.results || {},
              },
            }));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const data = JSON.parse(body || '{}');
                const rawName = typeof data.participantName === 'string' && data.participantName.trim()
                  ? data.participantName
                  : typeof data.fullName === 'string'
                  ? data.fullName
                  : '';
                const fullName = rawName.trim();
                if (!fullName || fullName.length < 2) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ success: false, error: 'INVALID_REQUEST', message: 'Invalid certificate payload' }));
                  return;
                }
                const completedAt = data.completedAt || new Date().toISOString();
                const certId = data.certificateId || crypto.randomUUID();
                const year = new Date(completedAt).getFullYear();
                const code = crypto.randomBytes(3).toString('hex').toUpperCase();
                const cNumber = data.certificateNumber || `PAU-TKF-${year}-${code}`;

                const record = {
                  ...data,
                  id: certId,
                  certificateId: certId,
                  certificateNumber: cNumber,
                  fullName,
                  participantName: fullName,
                  completedAt,
                  completedModules: Array.isArray(data.completedModules) ? data.completedModules : [],
                  projectName: data.projectName || 'Medeniyetten Millî Teknolojiye',
                };

                devCertStore.set(record.certificateId, record);
                saveDevStore();
                res.statusCode = 201;
                res.end(JSON.stringify({
                  success: true,
                  certificate: {
                    id: record.certificateId,
                    certificateId: record.certificateId,
                    participantName: record.fullName,
                    fullName: record.fullName,
                    completedAt: record.completedAt,
                    certificateNumber: record.certificateNumber,
                    completedModules: record.completedModules,
                    projectName: record.projectName,
                    results: record.results || {},
                  },
                }));
              } catch (err: any) {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, error: 'INVALID_JSON', details: err?.message }));
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
