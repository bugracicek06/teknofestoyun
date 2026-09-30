import React, { useState } from 'react';
import './gameUi.css';

export interface MissionCompleteModalProps {
  isOpen: boolean;
  moduleNumber: number;
  moduleTitle: string;
  moduleSubtitle?: string;
  score: number;
  timeText?: string;
  mistakesCount?: number;
  starsCount?: number; // 1, 2, or 3
  feedbackMessage?: string;
  nextModuleTitle?: string;
  isFinalModule?: boolean;
  accentKey?: 'gobeklitepe' | 'demir_cagi' | 'anadolu_ustaligi' | 'sanayilesme' | 'milli_teknoloji' | 'uzay_teknolojileri';
  stepInGame?: number;
  onMapClick: () => void;
  onNextClick: () => void;
}

export const MissionCompleteModal: React.FC<MissionCompleteModalProps> = ({
  isOpen,
  moduleNumber,
  moduleTitle,
  moduleSubtitle,
  score,
  timeText = '00 sn',
  mistakesCount = 0,
  starsCount = 3,
  feedbackMessage = 'Harika iş, Kaşif! Tüm hedefleri başarıyla tamamladın.',
  nextModuleTitle,
  isFinalModule = false,
  accentKey,
  stepInGame,
  onMapClick,
  onNextClick,
}) => {
  const [showCalculationInfo, setShowCalculationInfo] = useState(false);

  if (!isOpen) {
    return null;
  }

  const displayStep = stepInGame ?? (((moduleNumber - 1) % 2) + 1);

  // Next module titles fallback map
  const defaultNextTitles: Record<number, string> = {
    1: 'Demir Çağı',
    2: 'Anadolu Ustalığı',
    3: 'Bilim ve Sanayileşme',
    4: 'Millî Teknoloji',
    5: 'Uzay Teknolojileri',
  };

  const resolvedNextTitle = nextModuleTitle || defaultNextTitles[moduleNumber] || 'Sonraki Bölüm';

  return (
    <div
      className="mission-complete-backdrop"
      data-module-accent={accentKey}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mission-complete-title"
    >
      <div className="mission-complete-card">
        {/* Eyebrow */}
        <div className="complete-eyebrow-pill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Bölüm {displayStep} / 2 Tamamlandı</span>
        </div>

        {/* Titles */}
        <h2 id="mission-complete-title" className="complete-module-title">{moduleTitle}</h2>
        {moduleSubtitle && (
          <div className="complete-module-subtitle">{moduleSubtitle}</div>
        )}

        {/* Stars (1 to 3) */}
        <div className="complete-stars-row" aria-label={`${starsCount} Yıldız`}>
          {[1, 2, 3].map((starIndex) => {
            const isFilled = starIndex <= starsCount;
            return (
              <span
                key={starIndex}
                className={`complete-star-item ${isFilled ? 'is-filled' : 'is-empty'}`}
                aria-hidden="true"
              >
                ★
              </span>
            );
          })}
        </div>

        {/* 3-Column Metrics Grid: Puan, Süre, Hata */}
        <div className="complete-metrics-grid">
          <div className="complete-metric-card">
            <span className="complete-metric-value">{score}</span>
            <span className="complete-metric-label">Puan</span>
          </div>
          <div className="complete-metric-card">
            <span className="complete-metric-value">{timeText}</span>
            <span className="complete-metric-label">Süre</span>
          </div>
          <div className="complete-metric-card">
            <span className="complete-metric-value">{mistakesCount}</span>
            <span className="complete-metric-label">Hata</span>
          </div>
        </div>

        {/* Feedback Message */}
        <p className="complete-feedback-text">{feedbackMessage}</p>

        {/* Simplified Info Link */}
        <div className="complete-info-drawer">
          <button
            type="button"
            className="complete-info-toggle"
            onClick={() => setShowCalculationInfo((prev) => !prev)}
          >
            {showCalculationInfo ? 'Hesaplama bilgisini gizle ▲' : 'Puan nasıl hesaplandı? ▼'}
          </button>
          {showCalculationInfo && (
            <div className="complete-info-content">
              Temel puan 1000'dir. Her hatalı deneme puanı ve yıldız derecesini etkiler (0-2 hata: 3 yıldız, 3-5 hata: 2 yıldız). Süre puanı düşürmez.
            </div>
          )}
        </div>

        {/* Actions Row */}
        <div className="complete-actions-row">
          <button
            type="button"
            className="complete-btn-secondary"
            onClick={onMapClick}
            aria-label="Ana Menüye Dön"
          >
            Ana Menü
          </button>

          {isFinalModule ? (
            <button
              type="button"
              className="complete-btn-primary"
              onClick={onNextClick}
              aria-label="Macerayı Tamamla ve Sertifikanı Al"
            >
              <span>Macerayı Tamamla</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              className="complete-btn-primary"
              onClick={onNextClick}
              aria-label={`Sonraki Bölüme Geç: ${resolvedNextTitle}`}
            >
              <span>{resolvedNextTitle}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
