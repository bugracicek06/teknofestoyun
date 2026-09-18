import React, { useEffect, useState, useCallback } from 'react';
import {
  type CertificateRecord,
  formatCertificateDate,
  MODULE_DISPLAY_INFO,
  REQUIRED_MODULE_IDS,
} from '../game/systems/certificate';
import { ApiCertificateRepository } from '../game/systems/certificate';
import { exportCertificateAsPdf, exportCertificateAsImage, renderCertificateToCanvas } from '../game/systems/certificateRenderer';
import pauLogo from '../assets/logos/pau_logo.png';
import teknofestLogo from '../assets/logos/teknofest_logo.png';

interface CertificateViewPageProps {
  certificateId: string;
}

type PageErrorType = 'notFound' | 'network' | 'invalidId' | null;

export const CertificateViewPage: React.FC<CertificateViewPageProps> = ({ certificateId }) => {
  const [cert, setCert] = useState<CertificateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<PageErrorType>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingImg, setDownloadingImg] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  const fetchCertificate = useCallback(async () => {
    if (!certificateId || !certificateId.trim()) {
      setErrorType('invalidId');
      setErrorMessage('Geçersiz veya eksik sertifika bağlantısı.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorType(null);
    setErrorMessage(null);

    try {
      // Authoritative remote API fetch (no localStorage dependency)
      const apiRepo = new ApiCertificateRepository();
      const record = await apiRepo.getById(certificateId.trim());

      if (!record) {
        setErrorType('notFound');
        setErrorMessage('Sertifika bulunamadı. QR kodun doğruluğundan emin olunuz.');
        setLoading(false);
        return;
      }

      setCert(record);

      // Generate high quality preview canvas
      try {
        const canvas = await renderCertificateToCanvas(record);
        setPreviewDataUrl(canvas.toDataURL('image/jpeg', 0.9));
      } catch (renderErr) {
        console.warn('[CertificateView] Could not generate preview canvas:', renderErr);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('[CertificateView] Network or server error:', err);
      setErrorType('network');
      setErrorMessage('Sunucuya erişilemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.');
      setLoading(false);
    }
  }, [certificateId]);

  useEffect(() => {
    fetchCertificate();
  }, [fetchCertificate]);

  const handleDownloadPdf = async () => {
    if (!cert || downloadingPdf) return;
    try {
      setDownloadingPdf(true);
      await exportCertificateAsPdf(cert);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('PDF oluşturulurken bir hata oluştu.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!cert || downloadingImg) return;
    try {
      setDownloadingImg(true);
      await exportCertificateAsImage(cert);
    } catch (err) {
      console.error('Image export error:', err);
      alert('Görsel indirilirken bir hata oluştu.');
    } finally {
      setDownloadingImg(false);
    }
  };

  if (loading) {
    return (
      <div className="cert-page-container">
        <div className="cert-card cert-status-card">
          <div className="cert-spinner" aria-hidden="true" />
          <h2>Sertifikanız Hazırlanıyor…</h2>
          <p>Lütfen bekleyin, dijital başarı sertifikanız doğrulanıyor.</p>
        </div>
      </div>
    );
  }

  if (errorType || errorMessage || !cert) {
    return (
      <div className="cert-page-container">
        <div className="cert-card cert-status-card cert-error-card">
          <div className="cert-status-icon" aria-hidden="true">⚠️</div>
          <h2>{errorType === 'notFound' ? 'Sertifika Bulunamadı' : errorType === 'network' ? 'Bağlantı Hatası' : 'Bağlantı Geçersiz'}</h2>
          <p>{errorMessage || 'Sertifika bulunamadı veya bağlantı geçersiz.'}</p>
          <p className="cert-help-text">
            {errorType === 'notFound'
              ? 'Kiosk ekranındaki QR kodun eksiksiz okutulduğundan veya sertifika kimliğinizin doğru olduğundan emin olunuz.'
              : errorType === 'network'
              ? 'İnternet bağlantınızı kontrol edip aşağıdaki butondan sayfayı yenileyebilirsiniz.'
              : 'Kiosk ekranındaki QR kodun doğru okutulduğundan emin olunuz.'}
          </p>
          {errorType === 'network' && (
            <button
              type="button"
              className="cert-btn-primary"
              style={{ marginTop: '1rem', width: 'auto', alignSelf: 'center' }}
              onClick={() => fetchCertificate()}
            >
              Yeniden Dene
            </button>
          )}
        </div>
      </div>
    );
  }

  const formattedDate = formatCertificateDate(cert.completedAt);

  return (
    <div className="cert-page-container">
      <header className="cert-header">
        <div className="cert-brand-bar">
          <img className="cert-pau-logo" src={pauLogo} alt="Pamukkale Üniversitesi" />
          <div className="cert-brand-sep" aria-hidden="true" />
          <img className="cert-teknofest-logo" src={teknofestLogo} alt="TEKNOFEST" />
        </div>
        <div className="cert-badge">TEKNOFEST DİJİTAL BAŞARI SERTİFİKASI</div>
        <h1 className="cert-page-title">
          Tebrikler, <span>{cert.fullName}</span>!
        </h1>
        <p className="cert-page-subtitle">
          “Medeniyetten Millî Teknolojiye” interaktif eğitim oyununu başarıyla tamamladın.
        </p>
      </header>

      <main className="cert-main">
        {/* Interactive Certificate Preview */}
        <section className="cert-preview-section" aria-label="Sertifika Önizleme">
          <div className="cert-preview-frame">
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt={`${cert.fullName} Başarı Sertifikası`}
                className="cert-preview-image"
              />
            ) : (
              <div className="cert-preview-placeholder">
                <span>Sertifika önizlemesi yükleniyor…</span>
              </div>
            )}
          </div>
        </section>

        {/* Certificate Metadata Badges */}
        <section className="cert-meta-grid" aria-label="Sertifika Bilgileri">
          <div className="cert-meta-item">
            <span className="cert-meta-label">Katılımcı</span>
            <strong className="cert-meta-value">{cert.fullName}</strong>
          </div>
          <div className="cert-meta-item">
            <span className="cert-meta-label">Tamamlanma Tarihi</span>
            <strong className="cert-meta-value">{formattedDate}</strong>
          </div>
          <div className="cert-meta-item">
            <span className="cert-meta-label">Sertifika Numarası</span>
            <strong className="cert-meta-value cert-code">{cert.certificateNumber}</strong>
          </div>
        </section>

        {/* 6 Stage Timeline Completed */}
        <section className="cert-stages-section" aria-label="Tamamlanan Görevler">
          <h2 className="cert-section-heading">Başarıyla Tamamlanan 6 Keşif Durağı</h2>
          <div className="cert-stages-grid">
            {REQUIRED_MODULE_IDS.map((modId) => {
              const info = MODULE_DISPLAY_INFO[modId];
              return (
                <div key={modId} className="cert-stage-pill">
                  <span className="cert-stage-step">{info.step}</span>
                  <div className="cert-stage-text">
                    <strong>{info.title}</strong>
                    <span>{info.subtitle}</span>
                  </div>
                  <span className="cert-stage-check" aria-label="Tamamlandı">✓</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Download Actions */}
        <section className="cert-actions-section" aria-label="İndirme Seçenekleri">
          <button
            type="button"
            className="cert-btn-primary"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            aria-label="Sertifikayı PDF Olarak İndir"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <span>{downloadingPdf ? 'PDF Hazırlanıyor…' : 'Sertifikayı PDF Olarak İndir'}</span>
          </button>

          <button
            type="button"
            className="cert-btn-secondary"
            onClick={handleDownloadImage}
            disabled={downloadingImg}
            aria-label="Görsel Olarak İndir"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>{downloadingImg ? 'Görsel Hazırlanıyor…' : 'Görsel Olarak İndir (PNG)'}</span>
          </button>
        </section>
      </main>

      <footer className="cert-footer">
        <p>Pamukkale Üniversitesi · TEKNOFEST</p>
        <p className="cert-footer-sub">Bilgi · İnsan · Toplum · Daha Güçlü Yarınlar</p>
      </footer>
    </div>
  );
};

export default CertificateViewPage;
