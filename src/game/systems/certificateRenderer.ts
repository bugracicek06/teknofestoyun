// High-Resolution Master Certificate Renderer & Export Engine
// Pamukkale University & TEKNOFEST 2026 Şanlıurfa Medeniyetten Millî Teknolojiye

import { jsPDF } from 'jspdf';
import type { CertificateRecord } from './certificate';
import certBaseUrl from '../../assets/certificate_base.png';

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
    img.onerror = (e) => reject(new Error(`Failed to load master certificate template: ${e}`));
    img.src = src;
  });
}

/**
 * Renders the certificate onto full natural-resolution Canvas (3730x2635 px)
 * strictly superimposing:
 * 1. Master Certificate Template (100% full uncompressed quality)
 * 2. Player Full Name (centered above the dotted line, dynamically auto-scaled)
 * NO QR code is rendered onto the certificate canvas.
 */
export async function renderCertificateToCanvas(cert: CertificateRecord): Promise<HTMLCanvasElement> {
  await ensureFontsReady();

  // Load the master template image
  const baseImg = await loadImage(certBaseUrl);

  // CRITICAL: Master template resolution preservation
  // Strictly use natural dimensions (3730 x 2635)
  const canvasWidth = baseImg.naturalWidth || 3730;
  const canvasHeight = baseImg.naturalHeight || 2635;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Failed to get 2D canvas context');

  // Enable high quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Draw Master Template at 100% full resolution
  ctx.drawImage(baseImg, 0, 0, canvasWidth, canvasHeight);

  // 2. Render Player Full Name in uppercase right above the dotted line
  const name = (cert.fullName || 'GENÇ KAŞİF').trim().toLocaleUpperCase('tr-TR');

  // Dynamic Font Sizing & Auto-Shrink for long names
  const maxNameWidth = canvasWidth * 0.36;
  let fontSize = Math.round(canvasWidth * 0.030); // ~112px on 3730px template
  const minFontSize = Math.round(canvasWidth * 0.015); // ~56px

  ctx.font = `800 ${fontSize}px 'Outfit', 'Montserrat', 'Segoe UI', -apple-system, sans-serif`;
  while (ctx.measureText(name).width > maxNameWidth && fontSize > minFontSize) {
    fontSize -= 2;
    ctx.font = `800 ${fontSize}px 'Outfit', 'Montserrat', 'Segoe UI', -apple-system, sans-serif`;
  }

  ctx.save();
  ctx.fillStyle = '#0b2d64'; // Deep royal navy matching TEKNOFEST title and text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  // Normalized coordinates:
  // x is exact center of dotted line (0.6244)
  // y is baseline resting cleanly above dotted line (0.512)
  const nameX = Math.round(canvasWidth * 0.6244);
  const nameY = Math.round(canvasHeight * 0.512);

  ctx.fillText(name, nameX, nameY);
  ctx.restore();

  return canvas;
}

/**
 * Exports certificate as high quality lossless PNG image (3730 x 2635 px)
 */
export async function exportCertificateAsImage(cert: CertificateRecord, customFilename?: string): Promise<void> {
  const canvas = await renderCertificateToCanvas(cert);

  const cleanName = cert.fullName.trim().replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/g, '-').toLowerCase();
  const filename = customFilename || `certificate-${cleanName || 'kasif'}.png`;

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Legacy PDF helper retained for backwards compatibility
 */
export async function exportCertificateAsPdf(cert: CertificateRecord, customFilename?: string): Promise<void> {
  const canvas = await renderCertificateToCanvas(cert);

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = 297;
  const pdfHeight = 210;

  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

  const cleanName = cert.fullName.trim().replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/g, '-').toLowerCase();
  const filename = customFilename || `certificate-${cleanName || 'kasif'}.pdf`;
  pdf.save(filename);
}
