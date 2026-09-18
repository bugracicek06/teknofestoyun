import React from 'react';
import type { ModuleIntroConfig } from '../data/moduleIntros';

export interface ModuleIntroScreenProps {
  config: ModuleIntroConfig;
  isNarrating: boolean;
  onListenInstruction: () => void;
  onHazirim: () => void;
  onHome: () => void;
  asOverlay?: boolean;
}

export const ModuleIntroScreen: React.FC<ModuleIntroScreenProps> = ({
  config,
  isNarrating,
  onListenInstruction,
  onHazirim,
  onHome,
  asOverlay = true,
}) => {
  const isMilliTeknoloji = config.moduleId === 'milli_teknoloji';
  const gradient = isMilliTeknoloji
    ? 'linear-gradient(90deg, rgba(3, 14, 28, 0.98) 0%, rgba(3, 14, 28, 0.90) 28%, rgba(3, 14, 28, 0.50) 52%, rgba(3, 14, 28, 0.12) 100%), linear-gradient(180deg, rgba(3, 14, 28, 0.35) 0%, transparent 20%, transparent 80%, rgba(3, 14, 28, 0.55) 100%)'
    : 'linear-gradient(90deg, rgba(4,12,24,0.92) 0%, rgba(4,12,24,0.78) 40%, rgba(4,12,24,0.30) 62%, rgba(4,12,24,0.12) 85%, rgba(4,12,24,0.35) 100%), linear-gradient(180deg, rgba(4,12,24,0.45) 0%, transparent 25%, transparent 75%, rgba(4,12,24,0.75) 100%)';

  const backgroundPosition = isMilliTeknoloji ? 'right 20% center' : 'center';

  const panelContent = (
    <section
      className="gobeklitepe-stage-panel is-visible"
      style={{
        backgroundImage: `${gradient}, url(${config.backgroundImage})`,
        backgroundPosition,
      }}
      aria-label={`${config.title} ${config.subtitle} Giriş Paneli`}
    >
      <div className="stage-panel-inner">
        {/* Left Column: Mission Description and Primary CTA */}
        <div className="stage-left-content">
          <p className="stage-eyebrow">{config.stopLabel}</p>
          <h1 className="stage-title">
            {config.title}
            <br />
            <span className={config.subtitleColorClass}>{config.subtitle}</span>
          </h1>
          <p className="stage-instruction">{config.instruction}</p>

          <button
            type="button"
            className={`btn-listen-instruction ${isNarrating ? 'is-playing' : ''}`}
            onClick={onListenInstruction}
            aria-label={isNarrating ? 'Yönerge Seslendirmesini Durdur' : 'Yönergeyi Sesli Dinle'}
            title={isNarrating ? 'Yönergeyi Durdur' : 'Yönergeyi Dinle'}
          >
            <span className="listen-play-circle" aria-hidden="true">
              {isNarrating ? (
                <span className="audio-wave-bars">
                  <span className="bar bar-1" />
                  <span className="bar bar-2" />
                  <span className="bar bar-3" />
                </span>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6 3 20 12 6 21 6 3" />
                </svg>
              )}
            </span>
            <span>{isNarrating ? 'Yönerge Çalıyor (Durdur)' : 'Yönergeyi Dinle'}</span>
          </button>

          <div className="stage-separator" aria-hidden="true" />

          <p className="stage-timer-note">
            Süre, <span className="highlight-hazirim">“Hazırım”</span> düğmesine dokunduğunda başlar.
          </p>

          <div className="stage-action-row">
            <button
              type="button"
              className="primary btn-hazirim"
              onClick={onHazirim}
              aria-label="Hazırım, Keşfe Başla"
            >
              <span>Hazırım</span>
              <svg
                className="cta-arrow"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

            <button
              type="button"
              className="btn-stage-home"
              onClick={onHome}
              aria-label="Ana Ekrana Dön"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Ana Ekran</span>
            </button>
          </div>
        </div>

        {/* Right Column: Interaction Hint Card & Motto */}
        <div className="stage-right-content">
          <div className="interaction-hint-card" role="note" aria-label="Etkileşim İpucu">
            <div className="hint-visual-row" aria-hidden="true">
              <span className="hint-icon-hand">☝</span>
              <svg
                width="22"
                height="16"
                viewBox="0 0 24 16"
                fill="none"
                stroke="var(--accent-cyan)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="2" y1="8" x2="20" y2="8" />
                <polyline points="14 2 20 8 14 14" />
              </svg>
              <span className="hint-icon-target">◎</span>
            </div>
            <p className="hint-text">{config.miniInstruction}</p>
          </div>

          <div className="stage-motto" aria-hidden="true">
            <span className="motto-diamond">◆</span>
            <span>KEŞFET · ÖĞREN · TASARLA</span>
          </div>
        </div>
      </div>
    </section>
  );

  if (!asOverlay) {
    return panelContent;
  }

  return (
    <div
      className="module-intro-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${config.title} ${config.subtitle} Giriş Ekranı`}
    >
      <header className="module-intro-top-bar" aria-label="Bölüm Üst Barı">
        <div className="module-intro-top-badge">
          <span className="badge-text">BÖLÜM</span>
          <span className="badge-number">{config.stopNumber}</span>
          <span className="badge-slash">/</span>
          <span className="badge-total">6</span>
        </div>
        <div className="module-intro-top-center">
          Medeniyetten Millî Teknolojiye
        </div>
        <div className="module-intro-top-branding">
          <span>Pamukkale Üniversitesi</span>
          <span className="branding-pipe">|</span>
          <span>TEKNOFEST</span>
        </div>
      </header>
      {panelContent}
    </div>
  );
};
