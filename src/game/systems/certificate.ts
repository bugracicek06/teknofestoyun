// Dynamic Digital Certificate System
// Pamukkale University & TEKNOFEST Medeniyetten Millî Teknolojiye

import type { MissionResult } from './scoring';

export interface CertificateRecord {
  certificateId: string;
  certificateNumber: string;
  fullName: string;
  completedAt: string; // ISO 8601 string
  completedModules: string[];
  projectName: string;
  results?: Record<string, MissionResult>;
}

export interface PlayerSession {
  fullName: string;
  startedAt: string;
  completedAt: string | null;
  certificateId: string | null;
  certificateNumber: string | null;
  completedModules: string[];
}

export type CertificateCreationStatus = 'idle' | 'creating' | 'created' | 'error';

export const REQUIRED_MODULE_IDS = [
  'gobeklitepe',
  'demir_cagi',
  'anadolu_ustaligi',
  'sanayilesme', // Canonical module ID for Mühendislik – Mekanizmayı Kur
  'milli_teknoloji',
  'uzay_teknolojileri',
] as const;

export const MODULE_DISPLAY_INFO: Record<string, { step: string; title: string; subtitle: string }> = {
  gobeklitepe: { step: '01', title: 'GÖBEKLİTEPE', subtitle: 'Taşın Hafızası' },
  demir_cagi: { step: '02', title: 'DEMİR ÇAĞI', subtitle: 'Ateşe Hükmet' },
  anadolu_ustaligi: { step: '03', title: 'ANADOLU USTALIĞI', subtitle: 'Ustalığın İzleri' },
  sanayilesme: { step: '04', title: 'MÜHENDİSLİK', subtitle: 'Mekanizmayı Kur' },
  milli_teknoloji: { step: '05', title: 'MİLLÎ TEKNOLOJİ', subtitle: 'Gökyüzüne Yüksel' },
  uzay_teknolojileri: { step: '06', title: 'UZAY TEKNOLOJİLERİ', subtitle: 'Sıra Sende' },
};

export function createEmptyPlayerSession(): PlayerSession {
  return {
    fullName: '',
    startedAt: new Date().toISOString(),
    completedAt: null,
    certificateId: null,
    certificateNumber: null,
    completedModules: [],
  };
}

/**
 * Validate and sanitize Player Full Name
 * Full Turkish character support, no restrictive regex.
 */
export function validateAndCleanFullName(rawName: string): { isValid: boolean; cleanedName: string; error?: string } {
  if (typeof rawName !== 'string') {
    return { isValid: false, cleanedName: '', error: 'Lütfen adınızı ve soyadınızı girin.' };
  }
  const cleaned = rawName.trim().replace(/\s+/g, ' ');
  if (!cleaned) {
    return { isValid: false, cleanedName: '', error: 'Lütfen adınızı ve soyadınızı girin.' };
  }
  if (cleaned.length < 2) {
    return { isValid: false, cleanedName: cleaned, error: 'Ad Soyad en az 2 karakter olmalıdır.' };
  }
  if (cleaned.length > 50) {
    return { isValid: false, cleanedName: cleaned.slice(0, 50), error: 'Ad Soyad en fazla 50 karakter olabilir.' };
  }
  return { isValid: true, cleanedName: cleaned };
}

/**
 * Generate unique certificateId using secure random UUID
 */
export function generateCertificateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate human-readable certificateNumber: PAU-TKF-${year}-${6RandomChars}
 * Year is dynamically extracted from completion timestamp.
 */
export function generateCertificateNumber(completedAtIso: string): string {
  const date = new Date(completedAtIso);
  const year = isNaN(date.getFullYear()) ? new Date().getFullYear() : date.getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const randomBytes = new Uint8Array(6);
    crypto.getRandomValues(randomBytes);
    for (let i = 0; i < 6; i++) {
      code += chars[randomBytes[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return `PAU-TKF-${year}-${code}`;
}

/**
 * Formats completion date into Turkish standard format: DD.MM.YYYY
 */
export function formatCertificateDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}

/**
 * Validates that all 6 required modules are completed.
 */
export function areAllModulesCompleted(completedModuleIds: string[]): boolean {
  if (!Array.isArray(completedModuleIds)) return false;
  return REQUIRED_MODULE_IDS.every(id => completedModuleIds.includes(id));
}

/**
 * Resolves and validates the public URL for the certificate QR code.
 * Priority:
 * 1. import.meta.env.VITE_PUBLIC_BASE_URL (trimmed)
 * 2. window.location.origin (safe browser runtime fallback)
 *
 * In production (import.meta.env.PROD):
 * - Validates absolute URL
 * - Must be HTTPS protocol
 * - Strictly rejects localhost, 127.0.0.1, 0.0.0.0, ::1, .local, .internal, and private IP ranges
 */
export function getCertificatePublicUrl(certificateId: string): { url: string | null; error?: string } {
  if (!certificateId || typeof certificateId !== 'string' || !certificateId.trim()) {
    return { url: null, error: 'Geçersiz sertifika kimliği.' };
  }

  const cleanId = encodeURIComponent(certificateId.trim());
  const configuredBaseUrl = typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined)?.trim()
    : undefined;

  const runtimeBaseUrl = typeof window !== 'undefined' && window.location && window.location.origin
    ? window.location.origin.trim()
    : '';

  const publicBaseUrl = (configuredBaseUrl && configuredBaseUrl.length > 0)
    ? configuredBaseUrl
    : runtimeBaseUrl;

  if (!publicBaseUrl) {
    return {
      url: null,
      error: 'Sertifika genel web adresi (Base URL) tespit edilemedi.',
    };
  }

  let finalUrl: URL;
  try {
    finalUrl = new URL(`/certificate/${cleanId}`, publicBaseUrl);
  } catch (err: any) {
    return {
      url: null,
      error: `Geçersiz sertifika web adresi oluşturuldu: ${err?.message || publicBaseUrl}`,
    };
  }

  const isProd = typeof import.meta !== 'undefined' && import.meta.env
    ? Boolean(import.meta.env.PROD)
    : false;

  if (isProd) {
    // 1. Production QR URL must be HTTPS
    if (finalUrl.protocol !== 'https:') {
      return {
        url: null,
        error: `Production QR adresi güvenli HTTPS olmalıdır (Alınan: ${finalUrl.protocol}).`,
      };
    }

    // 2. Reject localhost, loopback, and private development hostnames
    const hostname = finalUrl.hostname.toLowerCase();
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal');

    const isPrivateIp =
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname);

    if (isLocalhost || isPrivateIp) {
      return {
        url: null,
        error: `Production QR adresinde yerel geliştirme adresi kullanılamaz: ${hostname}`,
      };
    }
  }

  return { url: finalUrl.toString() };
}

// ----------------------------------------------------
// Repository Pattern
// ----------------------------------------------------

export interface CertificateRepository {
  create(certificate: CertificateRecord): Promise<CertificateRecord>;
  getById(id: string): Promise<CertificateRecord | null>;
}

export class ApiCertificateRepository implements CertificateRepository {
  private baseUrl: string;

  constructor(customBaseUrl?: string) {
    const envApi = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : undefined;
    this.baseUrl = (customBaseUrl || envApi || '').replace(/\/+$/, '');
  }

  async create(certificate: CertificateRecord): Promise<CertificateRecord> {
    const url = `${this.baseUrl}/api/certificates`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(certificate),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Sertifika oluşturulamadı (HTTP ${response.status}): ${errorText}`);
    }

    return await response.json();
  }

  async getById(id: string): Promise<CertificateRecord | null> {
    const url = `${this.baseUrl}/api/certificates/${encodeURIComponent(id)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Sertifika sorgulanamadı (HTTP ${response.status})`);
    }

    return await response.json();
  }
}

/**
 * Local memory / storage fallback repository for testing
 */
export class LocalCertificateRepository implements CertificateRepository {
  private store = new Map<string, CertificateRecord>();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem('mmt:local_certificates');
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            list.forEach(item => {
              if (item && item.certificateId) this.store.set(item.certificateId, item);
            });
          }
        }
      }
    } catch {
      // safe fallback
    }
  }

  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const list = Array.from(this.store.values());
        window.localStorage.setItem('mmt:local_certificates', JSON.stringify(list));
      }
    } catch {
      // safe fallback
    }
  }

  async create(certificate: CertificateRecord): Promise<CertificateRecord> {
    this.store.set(certificate.certificateId, structuredClone(certificate));
    this.saveToStorage();
    return certificate;
  }

  async getById(id: string): Promise<CertificateRecord | null> {
    const found = this.store.get(id);
    return found ? structuredClone(found) : null;
  }
}

// Singleton repository instance
export const certificateRepository: CertificateRepository = new ApiCertificateRepository();

// Legacy adapter for backward compatibility if needed
export interface Certificate {
  id: string;
  issuedAt: string;
  nickname: string;
  results: Record<string, MissionResult>;
}

export function createLocalCertificate(nickname: string, results: Record<string, MissionResult>): Certificate {
  return {
    id: generateCertificateId(),
    issuedAt: new Date().toISOString(),
    nickname: [...nickname].filter(char => char.charCodeAt(0) >= 32 && char !== '<' && char !== '>').join('').trim().slice(0, 24) || 'Genç Kâşif',
    results: structuredClone(results),
  };
}
