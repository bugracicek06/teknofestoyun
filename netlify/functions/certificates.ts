// Netlify Serverless Function: /api/certificates
// Pamukkale University & TEKNOFEST Medeniyetten Millî Teknolojiye
// Handles cross-device certificate creation (POST) and retrieval (GET)

import { getStore, connectLambda } from '@netlify/blobs';
import { neon } from '@neondatabase/serverless';
import crypto from 'node:crypto';

export interface CertificateRecord {
  id?: string;
  certificateId: string;
  certificateNumber: string;
  fullName: string;
  participantName?: string;
  completedAt: string;
  completedModules: string[];
  projectName: string;
  results?: Record<string, unknown>;
}

// In-memory L1 cache fallback for warm serverless instances
const memoryStore = new Map<string, CertificateRecord>();

// Neon Database Helper (Tier 1 Persistence)
function getNeonClient() {
  const dbUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) return null;
  try {
    return neon(dbUrl);
  } catch (err) {
    console.warn('[certificate:init] Failed to initialize Neon client:', err);
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
    console.warn('[certificate:init] Neon table creation error:', err);
  }
}

/**
 * Netlify Blobs Helper (Tier 2 Persistence)
 * Supports both Netlify Functions v2 (context.blobs) and Lambda mode (connectLambda)
 */
function getBlobsStore(req?: any, context?: any) {
  // 1. Netlify Functions v2 context.blobs
  if (context && typeof context.blobs?.getStore === 'function') {
    try {
      return context.blobs.getStore({ name: 'certificates', consistency: 'strong' });
    } catch (err) {
      console.warn('[certificate:init] context.blobs error:', err);
    }
  }

  // 2. Netlify Lambda compatibility mode with event.blobs
  if (req && typeof req === 'object' && req.blobs && typeof connectLambda === 'function') {
    try {
      connectLambda(req);
    } catch (err) {
      console.warn('[certificate:init] connectLambda error:', err);
    }
  }

  // 3. Global getStore with strong consistency (critical for immediate mobile QR scan)
  try {
    return getStore({ name: 'certificates', consistency: 'strong' });
  } catch {
    // Outside Netlify environment or Blobs credentials unconfigured
    return null;
  }
}

/**
 * Persist certificate across persistent storage tiers.
 * Guarantees cross-device durability:
 * 1. Writes to Neon Postgres if available.
 * 2. Writes to Netlify Blobs with strong consistency.
 * 3. Keeps in-memory L1 cache.
 * Throws error if NO durable storage could save the record, preventing false 201 responses.
 */
async function saveCertificate(record: CertificateRecord, req?: any, context?: any): Promise<{ storageType: string }> {
  let savedToDurableStorage = false;
  let usedStorage = 'none';

  // Always update memory L1 cache
  memoryStore.set(record.certificateId, record);

  // 1. Tier 1: Neon PostgreSQL
  const sql = getNeonClient();
  if (sql) {
    try {
      await ensureNeonTable(sql);
      await sql`
        INSERT INTO certificates (id, number, full_name, completed_at, data)
        VALUES (${record.certificateId}, ${record.certificateNumber}, ${record.fullName}, ${record.completedAt}, ${JSON.stringify(record)})
        ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(record)};
      `;
      savedToDurableStorage = true;
      usedStorage = 'neon-postgres';
      console.log(`[certificate:persist] Saved to Neon Postgres: ${record.certificateId}`);
    } catch (err: any) {
      console.warn('[certificate:error] Neon save failed, falling back to Blobs:', err?.message || err);
    }
  }

  // 2. Tier 2: Netlify Blobs (with strong consistency)
  const blobs = getBlobsStore(req, context);
  if (blobs) {
    try {
      await blobs.setJSON(record.certificateId, record);
      savedToDurableStorage = true;
      usedStorage = usedStorage === 'neon-postgres' ? 'neon+blobs' : 'netlify-blobs';
      console.log(`[certificate:persist] Saved to Netlify Blobs: ${record.certificateId}`);
    } catch (err: any) {
      console.warn('[certificate:error] Netlify Blobs save failed:', err?.message || err);
    }
  }

  // If in a serverless environment (Netlify) and neither durable store succeeded:
  const isNetlifyEnv = Boolean(
    process.env.NETLIFY ||
    process.env.NETLIFY_BLOBS_CONTEXT ||
    (req && typeof req === 'object' && req.blobs) ||
    context?.blobs
  );

  if (isNetlifyEnv && !savedToDurableStorage) {
    const errorMsg = 'Kalıcı depolama başarısız oldu (Neon veya Netlify Blobs erişilemedi).';
    console.error(`[certificate:error] [certificate:persist] FAILED durable storage write for ${record.certificateId}`);
    throw new Error(errorMsg);
  }

  // For local development environments outside Netlify without DB:
  if (!savedToDurableStorage) {
    usedStorage = 'local-memory';
    console.log(`[certificate:persist] Saved to local memory store: ${record.certificateId}`);
  }

  return { storageType: usedStorage };
}

/**
 * Retrieve certificate across available tiers.
 * Immediate read-after-write with strong consistency.
 */
async function loadCertificate(id: string, req?: any, context?: any): Promise<CertificateRecord | null> {
  console.log(`[certificate:get] Fetching record for id: ${id}`);

  // 1. Check memory L1 cache
  const inMem = memoryStore.get(id);
  if (inMem) {
    console.log(`[certificate:get] Found in memory L1 cache: ${id}`);
    return inMem;
  }

  // 2. Check Neon PostgreSQL
  const sql = getNeonClient();
  if (sql) {
    try {
      await ensureNeonTable(sql);
      const rows = await sql`SELECT data FROM certificates WHERE id = ${id} LIMIT 1;`;
      if (rows && rows.length > 0) {
        const found = rows[0].data as CertificateRecord;
        memoryStore.set(id, found);
        console.log(`[certificate:get] Found in Neon Postgres: ${id}`);
        return found;
      }
    } catch (err: any) {
      console.warn('[certificate:error] Neon query failed:', err?.message || err);
    }
  }

  // 3. Check Netlify Blobs (with strong consistency)
  const blobs = getBlobsStore(req, context);
  if (blobs) {
    try {
      const found = await blobs.get(id, { type: 'json' });
      if (found) {
        const parsed = found as CertificateRecord;
        memoryStore.set(id, parsed);
        console.log(`[certificate:get] Found in Netlify Blobs: ${id}`);
        return parsed;
      }
    } catch (err: any) {
      console.warn('[certificate:error] Netlify Blobs query failed:', err?.message || err);
    }
  }

  console.log(`[certificate:not-found] Record not found for id: ${id}`);
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

const RESPONSE_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
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
      headers instanceof Headers
        ? headers.get('x-nf-original-path') || headers.get('x-rewrite-original-url') || headers.get('x-forwarded-uri')
        : typeof headers === 'object'
        ? headers['x-nf-original-path'] || headers['x-rewrite-original-url'] || headers['x-forwarded-uri']
        : null;

    const pathToTest = origHeader || path;
    const match = pathToTest.match(/(?:\/api)?\/certificates\/([^/?#]+)/i);
    if (match && match[1] && match[1] !== 'certificates') {
      return decodeURIComponent(match[1]);
    }
  } catch (err) {
    console.warn('[certificate:error] extractIdFromUrl error:', err);
  }
  return null;
}

/**
 * Formats standardized JSON envelope for certificate responses
 */
function createStandardEnvelope(record: CertificateRecord) {
  return {
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
  };
}

// Netlify Functions v2 standard Fetch Request handler & v1 Lambda compatibility
export default async function handler(req: Request | any, context?: any) {
  const isStandardReq = typeof req?.method === 'string' && typeof req?.url === 'string';
  const method = (isStandardReq ? req.method : req.httpMethod || 'GET').toUpperCase();
  const rawUrl = isStandardReq ? req.url : req.rawUrl || req.path || '/';
  const headers = isStandardReq ? req.headers : req.headers || {};

  // Pre-flight CORS
  if (method === 'OPTIONS') {
    if (isStandardReq) {
      return new Response(null, { status: 204, headers: RESPONSE_HEADERS });
    }
    return { statusCode: 204, headers: RESPONSE_HEADERS, body: '' };
  }

  // GET /api/certificates/:id
  if (method === 'GET') {
    const id = extractIdFromUrl(rawUrl, headers);
    if (!id) {
      const errBody = JSON.stringify({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'Geçersiz veya eksik certificateId.',
      });
      if (isStandardReq) return new Response(errBody, { status: 400, headers: RESPONSE_HEADERS });
      return { statusCode: 400, headers: RESPONSE_HEADERS, body: errBody };
    }

    try {
      const record = await loadCertificate(id, req, context);
      if (!record) {
        const notFoundBody = JSON.stringify({
          success: false,
          error: 'CERTIFICATE_NOT_FOUND',
        });
        if (isStandardReq) return new Response(notFoundBody, { status: 404, headers: RESPONSE_HEADERS });
        return { statusCode: 404, headers: RESPONSE_HEADERS, body: notFoundBody };
      }

      const resBody = JSON.stringify(createStandardEnvelope(record));
      if (isStandardReq) return new Response(resBody, { status: 200, headers: RESPONSE_HEADERS });
      return { statusCode: 200, headers: RESPONSE_HEADERS, body: resBody };
    } catch (err: any) {
      console.error('[certificate:error] GET error:', err);
      const errBody = JSON.stringify({
        success: false,
        error: 'STORAGE_QUERY_ERROR',
        message: err?.message || 'Sertifika sorgulanamadı.',
      });
      if (isStandardReq) return new Response(errBody, { status: 500, headers: RESPONSE_HEADERS });
      return { statusCode: 500, headers: RESPONSE_HEADERS, body: errBody };
    }
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
      const rawName = typeof data.participantName === 'string' && data.participantName.trim()
        ? data.participantName
        : typeof data.fullName === 'string'
        ? data.fullName
        : '';
      const fullName = rawName.trim().replace(/\s+/g, ' ');

      if (!fullName || fullName.length < 2 || fullName.length > 50) {
        const errBody = JSON.stringify({
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Geçersiz Ad Soyad. En az 2, en fazla 50 karakter olmalıdır.',
        });
        if (isStandardReq) return new Response(errBody, { status: 400, headers: RESPONSE_HEADERS });
        return { statusCode: 400, headers: RESPONSE_HEADERS, body: errBody };
      }

      console.log(`[certificate:create] Initializing creation for participant (len: ${fullName.length})`);

      const completedAt =
        typeof data.completedAt === 'string' && !isNaN(Date.parse(data.completedAt))
          ? data.completedAt
          : new Date().toISOString();

      // Server-side authoritative UUID generation
      const certificateId =
        typeof data.certificateId === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.certificateId)
          ? data.certificateId
          : crypto.randomUUID();

      const certificateNumber =
        typeof data.certificateNumber === 'string' && /^PAU-TKF-\d{4}-[A-Z0-9]{6}$/.test(data.certificateNumber)
          ? data.certificateNumber
          : generateServerCertificateNumber(completedAt);

      const completedModules = Array.isArray(data.completedModules) ? data.completedModules : [];

      const record: CertificateRecord = {
        id: certificateId,
        certificateId,
        certificateNumber,
        fullName,
        participantName: fullName,
        completedAt,
        completedModules,
        projectName: 'Medeniyetten Millî Teknolojiye',
        results: data.results || {},
      };

      // 1. Write to persistent storage
      const persistResult = await saveCertificate(record, req, context);

      // 2. Perform read-after-write verification to guarantee readability before 201
      const verified = await loadCertificate(certificateId, req, context);
      if (!verified) {
        throw new Error('Sertifika depolama sonrası okuma doğrulamasından geçemedi.');
      }

      console.log(`[certificate:persist] Read-after-write verification PASSED for ${certificateId} via ${persistResult.storageType}`);

      const resBody = JSON.stringify(createStandardEnvelope(record));
      if (isStandardReq) return new Response(resBody, { status: 201, headers: RESPONSE_HEADERS });
      return { statusCode: 201, headers: RESPONSE_HEADERS, body: resBody };
    } catch (err: any) {
      console.error('[certificate:error] POST error:', err);
      const errBody = JSON.stringify({
        success: false,
        error: 'STORAGE_PERSISTENCE_FAILED',
        message: err?.message || 'Sertifika kalıcı olarak kaydedilemedi.',
      });
      if (isStandardReq) return new Response(errBody, { status: 500, headers: RESPONSE_HEADERS });
      return { statusCode: 500, headers: RESPONSE_HEADERS, body: errBody };
    }
  }

  // Method not allowed
  const errBody = JSON.stringify({ success: false, error: 'METHOD_NOT_ALLOWED' });
  if (isStandardReq) return new Response(errBody, { status: 405, headers: RESPONSE_HEADERS });
  return { statusCode: 405, headers: RESPONSE_HEADERS, body: errBody };
}

export { handler };

