// Netlify Serverless Function: /api/certificates
// Pamukkale University & TEKNOFEST Medeniyetten Millî Teknolojiye
// Handles cross-device certificate creation (POST) and retrieval (GET)

import { getStore } from '@netlify/blobs';
import { neon } from '@neondatabase/serverless';
import crypto from 'node:crypto';

export interface CertificateRecord {
  certificateId: string;
  certificateNumber: string;
  fullName: string;
  completedAt: string;
  completedModules: string[];
  projectName: string;
  results?: Record<string, unknown>;
}

// In-memory cache fallback for warm serverless instances
const memoryStore = new Map<string, CertificateRecord>();

// Neon Database Helper (Tier 1 Persistence)
function getNeonClient() {
  const dbUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) return null;
  try {
    return neon(dbUrl);
  } catch (err) {
    console.warn('[Function] Failed to initialize Neon client:', err);
    return null;
  }
}

let dbInitialized = false;
async function ensureNeonTable(sql: ReturnType<typeof neon>) {
  if (dbInitialized) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS certificates (
        id TEXT PRIMARY KEY,
        number TEXT NOT NULL,
        full_name TEXT NOT NULL,
        completed_at TEXT NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    dbInitialized = true;
  } catch (err) {
    console.warn('[Function] Neon table creation error:', err);
  }
}

// Netlify Blobs Helper (Tier 2 Persistence)
function getBlobsStore() {
  try {
    return getStore('certificates');
  } catch {
    // Outside Netlify environment (or Blobs not configured)
    return null;
  }
}

/**
 * Persist certificate across all available tiers:
 * 1. Neon PostgreSQL
 * 2. Netlify Blobs
 * 3. In-memory Map
 */
async function saveCertificate(record: CertificateRecord): Promise<void> {
  // Always update memory store
  memoryStore.set(record.certificateId, record);

  // 1. Neon PostgreSQL
  const sql = getNeonClient();
  if (sql) {
    try {
      await ensureNeonTable(sql);
      await sql`
        INSERT INTO certificates (id, number, full_name, completed_at, data)
        VALUES (${record.certificateId}, ${record.certificateNumber}, ${record.fullName}, ${record.completedAt}, ${JSON.stringify(record)})
        ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(record)};
      `;
      return;
    } catch (err) {
      console.warn('[Function] Neon save failed, falling back to Blobs:', err);
    }
  }

  // 2. Netlify Blobs
  const blobs = getBlobsStore();
  if (blobs) {
    try {
      await blobs.setJSON(record.certificateId, record);
      return;
    } catch (err) {
      console.warn('[Function] Netlify Blobs save failed, falling back to memory:', err);
    }
  }
}

/**
 * Retrieve certificate across available tiers
 */
async function loadCertificate(id: string): Promise<CertificateRecord | null> {
  // 1. Check memory cache first
  const inMem = memoryStore.get(id);
  if (inMem) return inMem;

  // 2. Check Neon PostgreSQL
  const sql = getNeonClient();
  if (sql) {
    try {
      await ensureNeonTable(sql);
      const rows = await sql`SELECT data FROM certificates WHERE id = ${id} LIMIT 1;`;
      if (rows && rows.length > 0) {
        const found = rows[0].data as CertificateRecord;
        memoryStore.set(id, found);
        return found;
      }
    } catch (err) {
      console.warn('[Function] Neon query failed:', err);
    }
  }

  // 3. Check Netlify Blobs
  const blobs = getBlobsStore();
  if (blobs) {
    try {
      const found = await blobs.get(id, { type: 'json' });
      if (found) {
        memoryStore.set(id, found as CertificateRecord);
        return found as CertificateRecord;
      }
    } catch (err) {
      console.warn('[Function] Netlify Blobs query failed:', err);
    }
  }

  return null;
}

/**
 * Generate human-readable certificateNumber: PAU-TKF-${year}-${random6}
 */
function generateServerCertificateNumber(completedAtIso: string): string {
  const date = new Date(completedAtIso);
  const year = isNaN(date.getFullYear()) ? new Date().getFullYear() : date.getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomBytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return `PAU-TKF-${year}-${code}`;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
  'Content-Type': 'application/json; charset=utf-8',
};

function extractIdFromUrl(rawUrl: string, headers: Headers | Record<string, string | undefined>): string | null {
  try {
    const urlObj = new URL(rawUrl, 'http://localhost');
    const path = urlObj.pathname;

    // Check query params (?id=... or ?certificateId=...)
    const queryId = urlObj.searchParams.get('id') || urlObj.searchParams.get('certificateId');
    if (queryId && queryId.trim()) return queryId.trim();

    // Check header rewrites (x-nf-original-path, x-rewrite-original-url, x-forwarded-uri)
    const origHeader =
      (headers instanceof Headers
        ? headers.get('x-nf-original-path') || headers.get('x-rewrite-original-url') || headers.get('x-forwarded-uri')
        : typeof headers === 'object'
        ? headers['x-nf-original-path'] || headers['x-rewrite-original-url'] || headers['x-forwarded-uri']
        : null);

    const pathToTest = origHeader || path;
    const match = pathToTest.match(/(?:\/api)?\/certificates\/([^/?#]+)/i);
    if (match && match[1] && match[1] !== 'certificates') {
      return decodeURIComponent(match[1]);
    }
  } catch (err) {
    console.warn('[Function] extractIdFromUrl error:', err);
  }
  return null;
}

// Netlify Functions v2 standard Fetch Request handler
export default async function handler(req: Request | any, _context?: any) {
  // Support both Netlify Functions v2 (Request) and v1 (event)
  const isStandardReq = typeof req?.method === 'string' && typeof req?.url === 'string';
  const method = (isStandardReq ? req.method : req.httpMethod || 'GET').toUpperCase();
  const rawUrl = isStandardReq ? req.url : req.rawUrl || req.path || '/';
  const headers = isStandardReq ? req.headers : req.headers || {};

  // Pre-flight CORS
  if (method === 'OPTIONS') {
    if (isStandardReq) {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // GET /api/certificates/:id
  if (method === 'GET') {
    const id = extractIdFromUrl(rawUrl, headers);
    if (!id) {
      const errBody = JSON.stringify({ error: 'Geçersiz veya eksik certificateId.' });
      if (isStandardReq) return new Response(errBody, { status: 400, headers: CORS_HEADERS });
      return { statusCode: 400, headers: CORS_HEADERS, body: errBody };
    }

    const record = await loadCertificate(id);
    if (!record) {
      const errBody = JSON.stringify({ error: 'Sertifika bulunamadı.' });
      if (isStandardReq) return new Response(errBody, { status: 404, headers: CORS_HEADERS });
      return { statusCode: 404, headers: CORS_HEADERS, body: errBody };
    }

    const resBody = JSON.stringify(record);
    if (isStandardReq) return new Response(resBody, { status: 200, headers: CORS_HEADERS });
    return { statusCode: 200, headers: CORS_HEADERS, body: resBody };
  }

  // POST /api/certificates
  if (method === 'POST') {
    try {
      let rawBody = '';
      if (isStandardReq) {
        rawBody = await req.text();
      } else {
        rawBody = req.body || '{}';
      }

      const data = JSON.parse(rawBody || '{}');
      const fullName = (typeof data.fullName === 'string' ? data.fullName : '').trim().replace(/\s+/g, ' ');

      if (!fullName || fullName.length < 2 || fullName.length > 50) {
        const errBody = JSON.stringify({ error: 'Geçersiz Ad Soyad. En az 2, en fazla 50 karakter olmalıdır.' });
        if (isStandardReq) return new Response(errBody, { status: 400, headers: CORS_HEADERS });
        return { statusCode: 400, headers: CORS_HEADERS, body: errBody };
      }

      const completedAt = (typeof data.completedAt === 'string' && !isNaN(Date.parse(data.completedAt)))
        ? data.completedAt
        : new Date().toISOString();

      // Server-side authoritative generation for security and unpredictability
      const certificateId = (typeof data.certificateId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.certificateId))
        ? data.certificateId
        : crypto.randomUUID();

      const certificateNumber = (typeof data.certificateNumber === 'string' && /^PAU-TKF-\d{4}-[A-Z0-9]{6}$/.test(data.certificateNumber))
        ? data.certificateNumber
        : generateServerCertificateNumber(completedAt);

      const completedModules = Array.isArray(data.completedModules) ? data.completedModules : [];

      const record: CertificateRecord = {
        certificateId,
        certificateNumber,
        fullName,
        completedAt,
        completedModules,
        projectName: 'Medeniyetten Millî Teknolojiye',
        results: data.results || {},
      };

      await saveCertificate(record);

      const resBody = JSON.stringify(record);
      if (isStandardReq) return new Response(resBody, { status: 201, headers: CORS_HEADERS });
      return { statusCode: 201, headers: CORS_HEADERS, body: resBody };
    } catch (err: any) {
      console.error('[Function] POST error:', err);
      const errBody = JSON.stringify({ error: 'Sertifika kaydedilemedi.', details: err?.message });
      if (isStandardReq) return new Response(errBody, { status: 500, headers: CORS_HEADERS });
      return { statusCode: 500, headers: CORS_HEADERS, body: errBody };
    }
  }

  // Method not allowed
  const errBody = JSON.stringify({ error: 'Method not allowed' });
  if (isStandardReq) return new Response(errBody, { status: 405, headers: CORS_HEADERS });
  return { statusCode: 405, headers: CORS_HEADERS, body: errBody };
}

export { handler };
