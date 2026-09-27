// Netlify Serverless Function: /api/certificates
// Pamukkale University & TEKNOFEST Medeniyetten Millî Teknolojiye
// Handles cross-device certificate creation (POST) and retrieval (GET)

import { getStore, connectLambda } from '@netlify/blobs';
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

/**
 * Netlify Blobs Helper - Canonical Storage Engine
 * Resolves store across Netlify Functions v2, v1/Lambda, and platform environments.
 * Avoids consistency: 'strong' which throws BlobsConsistencyError unless uncachedEdgeURL is present.
 */
function getBlobsStore(req?: any, context?: any) {
  // 1. Netlify Functions v2 context.blobs
  if (context && typeof context.blobs?.getStore === 'function') {
    try {
      return context.blobs.getStore('certificates');
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

  // 3. Fallback to siteID & token from process.env if available
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN;
  if (siteID && token) {
    try {
      return getStore({ name: 'certificates', siteID, token });
    } catch (err) {
      console.warn('[certificate:init] custom credentials getStore error:', err);
    }
  }

  // 4. Standard auto-injected Netlify Blobs store
  return getStore('certificates');
}

/**
 * Persist certificate directly to Netlify Blobs (Canonical Storage).
 * STRICT: NO IN-MEMORY FALLBACK. Throws immediately if persistence fails.
 */
async function saveCertificate(record: CertificateRecord, req?: any, context?: any): Promise<void> {
  const blobs = getBlobsStore(req, context);
  if (!blobs) {
    throw new Error('STORAGE_UNAVAILABLE: Netlify Blobs depolama alanı başlatılamadı.');
  }

  await blobs.setJSON(record.certificateId, record);
  console.log(`[certificate:persist] Saved to Netlify Blobs: ${record.certificateId}`);
}

/**
 * Retrieve certificate directly from Netlify Blobs (Canonical Storage).
 * STRICT: NO IN-MEMORY MAP. Reads strictly from durable storage.
 */
async function loadCertificate(id: string, req?: any, context?: any): Promise<CertificateRecord | null> {
  console.log(`[certificate:get] Fetching record for id: ${id}`);

  const blobs = getBlobsStore(req, context);
  if (!blobs) {
    throw new Error('STORAGE_UNAVAILABLE: Netlify Blobs depolama alanı başlatılamadı.');
  }

  const found = await blobs.get(id, { type: 'json' });
  if (found) {
    console.log(`[certificate:get] Found in Netlify Blobs: ${id}`);
    return found as CertificateRecord;
  }

  console.log(`[certificate:not-found] Record not found in Blobs for id: ${id}`);
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

    // 1. Check query parameter (populated by Netlify redirect: /api/certificates/:id -> ?id=:id)
    const queryId = urlObj.searchParams.get('id') || urlObj.searchParams.get('certificateId');
    if (queryId && queryId.trim() && queryId !== ':splat') return queryId.trim();

    // 2. Check header rewrites (x-nf-original-path, x-rewrite-original-url, x-forwarded-uri)
    const origHeader =
      headers instanceof Headers
        ? headers.get('x-nf-original-path') || headers.get('x-rewrite-original-url') || headers.get('x-forwarded-uri')
        : typeof headers === 'object'
        ? headers['x-nf-original-path'] || headers['x-rewrite-original-url'] || headers['x-forwarded-uri']
        : null;

    const pathToTest = origHeader || urlObj.pathname;
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

      console.log(`[certificate:create] Initializing creation for participant: ${fullName}`);

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

      // 1. Write strictly to persistent Netlify Blobs storage
      await saveCertificate(record, req, context);

      // 2. Perform immediate read-after-write verification against storage
      const verified = await loadCertificate(certificateId, req, context);
      if (!verified || (verified.id !== certificateId && verified.certificateId !== certificateId)) {
        throw new Error('CERTIFICATE_PERSISTENCE_VERIFICATION_FAILED: Kalıcı depolamaya yazıldı ancak okuma doğrulanamadı.');
      }

      console.log(`[certificate:persist] Read-after-write verification PASSED for ${certificateId}`);

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

