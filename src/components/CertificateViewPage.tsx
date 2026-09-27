import React, { useEffect, useState, useCallback } from 'react';
import {
  type CertificateRecord,
  formatCertificateDate,
  MODULE_DISPLAY_INFO,
  REQUIRED_MODULE_IDS,
} from '../game/systems/certificate';
import { ApiCertificateRepository } from '../game/systems/certificate';
import { exportCertificateAsImage, renderCertificateToCanvas } from '../game/systems/certificateRenderer';
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
      // Authoritative remote API fetch (cross-device, no localStorage dependency)
      const apiRepo = new ApiCertificateRepository();
      const record = await apiRepo.getById(certificateId.trim());

      if (!record) {
        setErrorType('notFound');
        setErrorMessage('Sertifika bulunamadı. QR kodun doğruluğundan emin olunuz.');
        setLoading(false);
        return;
      }

      setCert(record);

      // Generate preview canvas at full master resolution (3730x2635)
      try {
        const canvas = await renderCertificateToCanvas(record);
        setPreviewDataUrl(canvas.toDataURL('image/png'));
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

  // Ensure scroll is enabled on html/body for certificate route while isolating kiosk game
  useEffect(() => {
    document.documentElement.classList.add('cert-route-active');
    document.body.classList.add('cert-route-active');
    return () => {
      document.documentElement.classList.remove('cert-route-active');
      document.body.classList.remove('cert-route-active');
    };
  }, []);

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
        <div className="cert-badge">TEKNOFEST 2026 ŞANLIURFA</div>
        <h1 className="cert-page-title">
          BAŞARI SERTİFİKASI
        </h1>
        <p className="cert-page-subtitle" style={{ maxWidth: '680px', margin: '0 auto', lineHeight: 1.6 }}>
          Tebrikler, <strong>{cert.fullName}</strong>! Medeniyetten Millî Teknolojiye yolculuğundaki tüm görevleri başarıyla tamamladın.
        </p>
      </header>

      <main className="cert-main">
        {/* Interactive Master Certificate Preview */}
        <section className="cert-preview-section" aria-label="Sertifika Önizleme">
          <div className="cert-preview-frame">
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt={`${cert.fullName} Başarı Sertifikası`}
                className="cert-preview-image"
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '12px' }}
              />
            ) : (
              <div className="cert-preview-placeholder">
                <span>Sertifika önizlemesi yükleniyor…</span>
              </div>
            )}
          </div>
        </section>

        {/* Download Action: Pure Lossless PNG in Full Master Resolution */}
        <section className="cert-actions-section" aria-label="İndirme Seçenekleri" style={{ justifyContent: 'center' }}>
          <button
            type="button"
            className="cert-btn-primary"
            onClick={handleDownloadImage}
            disabled={downloadingImg}
            aria-label="Sertifikayı İndir"
            style={{ minWidth: '280px', fontSize: '17px', padding: '16px 36px' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{downloadingImg ? 'Görsel Hazırlanıyor…' : 'SERTİFİKAYI İNDİR (PNG)'}</span>
          </button>
        </section>

        {/* Certificate Metadata Badges */}
        <section className="cert-meta-grid" aria-label="Sertifika Bilgileri">
          <div className="cert-meta-item">
            <span className="cert-meta-label">Kaşif</span>
            <strong className="cert-meta-value">{cert.fullName.toLocaleUpperCase('tr-TR')}</strong>
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
      </main>

      <footer className="cert-footer">
        <p>Pamukkale Üniversitesi · Pamukkale Teknokent · TEKNOFEST 2026 Şanlıurfa</p>
        <p className="cert-footer-sub">Bilgi · İnsan · Toplum · Daha Güçlü Yarınlar</p>
      </footer>
    </div>
  );
};

export default CertificateViewPage;
