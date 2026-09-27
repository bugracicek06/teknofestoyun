import React from 'react';
import { EventBus } from '../../game/state/EventBus';
import './gameUi.css';

export interface GameTopBarProps {
  moduleNumber: number;
  moduleTitle: string;
  moduleSubtitle?: string;
  missionTitle: string;
  progressText?: string;
  timeText?: string;
  accentKey?: 'gobeklitepe' | 'demir_cagi' | 'anadolu_ustaligi' | 'sanayilesme' | 'milli_teknoloji' | 'uzay_teknolojileri';
  isAudioMuted?: boolean;
  isPaused?: boolean;
  isFullscreen?: boolean;
  onBack: () => void;
  onToggleAudio?: () => void;
  onHelp?: () => void;
  onPause?: () => void;
  onToggleFullscreen?: () => void;
}

export const GameTopBar: React.FC<GameTopBarProps> = ({
  moduleNumber,
  moduleTitle,
  moduleSubtitle,
  missionTitle,
  progressText,
  timeText,
  accentKey,
  isAudioMuted = false,
  isPaused = false,
  isFullscreen = false,
  onBack,
  onToggleAudio,
  onHelp,
  onPause,
  onToggleFullscreen,
}) => {
  return (
    <header className="game-top-bar" data-module-accent={accentKey}>
      {/* SOL: Geri Butonu + Bölüm Bilgisi */}
      <div className="top-bar-left">
        <button
          type="button"
          className="top-bar-back-btn"
          onClick={onBack}
          aria-label="Haritaya Geri Dön"
          title="Bölüm Haritasına Dön"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="top-bar-module-badge">
          <span className="top-bar-eyebrow">BÖLÜM {moduleNumber} / 6</span>
          <div className="top-bar-title-wrap">
            <h1 className="top-bar-module-title">{moduleTitle}</h1>
            {moduleSubtitle && (
              <span className="top-bar-module-subtitle">• {moduleSubtitle}</span>
            )}
          </div>
        </div>
      </div>

      {/* ORTA: Aktif Görev Bilgisi */}
      <div className="top-bar-center">
        <div className="top-bar-mission-pill">
          <div className="top-bar-mission-icon-wrap" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="12 8 8 12 12 16 16 12 12 8" />
            </svg>
          </div>
          <div className="top-bar-mission-text-group">
            <span className="top-bar-mission-label">Aktif Görev</span>
            <span className="top-bar-mission-text" title={missionTitle}>{missionTitle}</span>
          </div>
          {progressText && (
            <div className="top-bar-progress-pill" title="İlerleme Durumu">
              <span>{progressText}</span>
            </div>
          )}
        </div>
      </div>

      {/* SAĞ: Süre + Sistem Kontrolleri */}
      <div className="top-bar-right">
        {timeText && (
          <div className="top-bar-timer-badge" title="Geçen Süre">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{timeText}</span>
          </div>
        )}

        <div className="top-bar-controls-cluster">
          {onToggleAudio && (
            <button
              type="button"
              className={`top-bar-ctrl-btn ${isAudioMuted ? 'is-muted' : ''}`}
              onClick={onToggleAudio}
              aria-label={isAudioMuted ? 'Sesi Aç' : 'Sesi Kapat'}
              title={isAudioMuted ? 'Sesi Aç' : 'Sesi Kapat'}
            >
              {isAudioMuted ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>
          )}

          <button
            type="button"
            className="top-bar-ctrl-btn"
            onClick={onHelp || (() => EventBus.emit('toggle-assistant'))}
            aria-label="Rehber Asistan İpucu"
            title="Rehber Asistandan İpucu Al"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>

          {onPause && (
            <button
              type="button"
              className={`top-bar-ctrl-btn ${isPaused ? 'is-active' : ''}`}
              onClick={onPause}
              aria-label={isPaused ? 'Devam Et' : 'Duraklat'}
              title={isPaused ? 'Devam Et' : 'Duraklat'}
            >
              {isPaused ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              )}
            </button>
          )}

          {onToggleFullscreen && (
            <button
              type="button"
              className="top-bar-ctrl-btn"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
              title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
            >
              {isFullscreen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
