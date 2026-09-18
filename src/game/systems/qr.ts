// High-Contrast QR Code Generator for Kiosk Final Screen
// Generates scannable QR pointing to ${PUBLIC_BASE_URL}/certificate/${certificateId}

import QRCode from 'qrcode';
import { getCertificatePublicUrl } from './certificate';

export interface QrGenerationResult {
  success: boolean;
  dataUrl?: string;
  targetUrl?: string;
  error?: string;
}

/**
 * Generates a high-contrast QR code data URL (PNG) with proper quiet zone
 */
export async function generateCertificateQr(certificateId: string): Promise<QrGenerationResult> {
  const { url, error } = getCertificatePublicUrl(certificateId);
  if (!url || error) {
    console.error('[QR] Failed to resolve public certificate URL:', error);
    return {
      success: false,
      error: error || 'Sertifika URL yapılandırması eksik.',
    };
  }

  try {
    const dataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 3,
      scale: 8,
      color: {
        dark: '#07111f', // Deep dark navy for maximum contrast
        light: '#ffffff', // Pure white background
      },
    });

    return {
      success: true,
      dataUrl,
      targetUrl: url,
    };
  } catch (err: any) {
    console.error('[QR] Failed to generate QR code:', err);
    return {
      success: false,
      error: 'QR kod oluşturulurken bir hata meydana geldi.',
    };
  }
}
