// High-Resolution Certificate Renderer & Export Engine
// Pamukkale University & TEKNOFEST Medeniyetten Millî Teknolojiye

import { jsPDF } from 'jspdf';
import type { CertificateRecord } from './certificate';
import { formatCertificateDate } from './certificate';
import certBaseUrl from '../../assets/certificate_base.jpg';

/**
 * Ensures required web fonts are downloaded and ready before rendering.
 */
async function ensureFontsReady(): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts && typeof document.fonts.ready !== 'undefined') {
    try {
      await document.fonts.ready;
    } catch {
      // Safe fallback if font loading times out
    }
  }
}

/**
 * Loads an image asynchronously into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load certificate template: ${e}`));
    img.src = src;
  });
}

/**
 * Renders the certificate onto a high-resolution 2x Canvas (2048x1448)
 * strictly superimposing:
 * 1. Player Full Name (centered, dynamically scaled)
 * 2. Completion Date (above TAMAMLANMA TARİHİ)
 * 3. Certificate Number (above SERTİFİKA NUMARASI)
 * NO QR code is rendered onto the certificate.
 */
export async function renderCertificateToCanvas(cert: CertificateRecord): Promise<HTMLCanvasElement> {
  await ensureFontsReady();

  // Load the static base image
  const baseImg = await loadImage(certBaseUrl);

  // Target 2x print resolution
  const canvasWidth = 2048;
  const canvasHeight = 1448;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Failed to get 2D canvas context');

  // Enable high quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Draw static background
  ctx.drawImage(baseImg, 0, 0, canvasWidth, canvasHeight);

  // 2. Render Player Full Name
  const name = (cert.fullName || 'Genç Kâşif').toLocaleUpperCase('tr-TR');
  const nameLen = name.length;

  let fontSize = 48;
  if (nameLen > 35) {
    fontSize = 32;
  } else if (nameLen > 25) {
    fontSize = 40;
  }

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${fontSize}px 'Cinzel', 'Outfit', 'Plus Jakarta Sans', Georgia, serif`;
  ctx.fillStyle = '#0b233a';

  // Position relative to template (50% width, ~44% height)
  const nameX = canvasWidth * 0.5;
  const nameY = canvasHeight * 0.44;

  ctx.fillText(name, nameX, nameY);
  ctx.restore();

  // 3. Render Completion Date (Turkish format: DD.MM.YYYY)
  const formattedDate = formatCertificateDate(cert.completedAt) || new Intl.DateTimeFormat('tr-TR').format(new Date());

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.font = `600 24px 'Outfit', 'Plus Jakarta Sans', -apple-system, sans-serif`;
  ctx.fillStyle = '#17304a';

  const dateX = canvasWidth * 0.404;
  const dateY = canvasHeight * 0.774;
  ctx.fillText(formattedDate, dateX, dateY);
  ctx.restore();

  // 4. Render Certificate Number (e.g. PAU-TKF-2026-XXXXXX)
  const certNumber = cert.certificateNumber || 'PAU-TKF-GEN';

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.font = `600 24px 'Outfit', 'Plus Jakarta Sans', -apple-system, sans-serif`;
  ctx.fillStyle = '#17304a';

  const certNumX = canvasWidth * 0.588;
  const certNumY = canvasHeight * 0.774;
  ctx.fillText(certNumber, certNumX, certNumY);
  ctx.restore();

  return canvas;
}

/**
 * Exports certificate as high quality A4 Landscape PDF (297 x 210 mm)
 */
export async function exportCertificateAsPdf(cert: CertificateRecord, customFilename?: string): Promise<void> {
  const canvas = await renderCertificateToCanvas(cert);

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // A4 Landscape is exactly 297mm x 210mm
  const pdfWidth = 297;
  const pdfHeight = 210;

  const imgData = canvas.toDataURL('image/jpeg', 0.96);
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

  const cleanName = cert.fullName.trim().replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/g, '_');
  const filename = customFilename || `Basari_Sertifikasi_${cleanName || 'Katilimci'}.pdf`;
  pdf.save(filename);
}

/**
 * Exports certificate as high quality PNG image
 */
export async function exportCertificateAsImage(cert: CertificateRecord, customFilename?: string): Promise<void> {
  const canvas = await renderCertificateToCanvas(cert);

  const cleanName = cert.fullName.trim().replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/g, '_');
  const filename = customFilename || `Basari_Sertifikasi_${cleanName || 'Katilimci'}.png`;

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
