// Production / Kiosk LAN Standalone HTTP Server
// Provides cross-device certificate API and serves the production dist/ bundle
// Zero external dependencies (uses native node:http, node:fs, node:path)

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DIST_DIR = path.join(__dirname, 'dist');
const DATA_DIR = path.join(__dirname, 'data');
const CERT_FILE = path.join(DATA_DIR, 'certificates.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache + persistent JSON backing
const certStore = new Map();

function loadStore() {
  try {
    if (fs.existsSync(CERT_FILE)) {
      const raw = fs.readFileSync(CERT_FILE, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item && item.certificateId) certStore.set(item.certificateId, item);
        }
      }
      console.log(`[Server] Loaded ${certStore.size} certificates from persistent store.`);
    }
  } catch (err) {
    console.error('[Server] Failed to load certificates:', err);
  }
}

function saveStore() {
  try {
    const list = Array.from(certStore.values());
    fs.writeFileSync(CERT_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server] Failed to save certificates:', err);
  }
}

loadStore();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // 1. API: /api/certificates
  if (pathname.startsWith('/api/certificates')) {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET') {
      const parts = pathname.split('/');
      const id = parts[3];
      if (!id) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Missing certificateId' }));
        return;
      }
      const record = certStore.get(id);
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
          const data = JSON.parse(body || '{}');
          const fullName = (typeof data.fullName === 'string' ? data.fullName : '').trim();
          if (!fullName || fullName.length < 2) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing or invalid fullName' }));
            return;
          }
          const completedAt = data.completedAt || new Date().toISOString();
          const certId = data.certificateId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
          const year = new Date(completedAt).getFullYear();
          const cNumber = data.certificateNumber || `PAU-TKF-${year}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

          const record = {
            ...data,
            certificateId: certId,
            certificateNumber: cNumber,
            fullName,
            completedAt,
            completedModules: Array.isArray(data.completedModules) ? data.completedModules : [],
            projectName: data.projectName || 'Medeniyetten Millî Teknolojiye',
          };
          certStore.set(record.certificateId, record);
          saveStore();
          res.statusCode = 201;
          res.end(JSON.stringify(record));
        } catch (err) {
          console.error('[Server] POST JSON parse error:', err);
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        }
      });
      return;
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // 2. Static File Serving (SPA Fallback)
  let safePath = path.normalize(path.join(DIST_DIR, pathname));
  if (!safePath.startsWith(DIST_DIR)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  // Check if static file exists
  if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    fs.createReadStream(safePath).pipe(res);
    return;
  }

  // SPA Route fallback: if route is /certificate/:id or anything else, serve dist/index.html
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    fs.createReadStream(indexPath).pipe(res);
    return;
  }

  res.statusCode = 404;
  res.end('Not Found (dist/ not built. Run npm run build first)');
});

server.listen(PORT, HOST, () => {
  console.log(`[Server] Medeniyetten Millî Teknolojiye Kiosk & Certificate Server running on http://${HOST}:${PORT}`);
});
