import React, { useEffect, useRef, useState } from 'react';
import { EventBus } from '../game/state/EventBus';
import { MODULE_NARRATIONS } from '../data/narrations';
import { stopNarration } from '../game/systems/narration';
import stageBg from '../assets/gobeklitepe_cinematic_stage.jpg';
import {
  GOBEKLITEPE_ANIMALS,
  shuffleAnimals,
  type AnimalItem,
} from '../data/gobeklitepeAnimals';

export type { AnimalItem };
export { GOBEKLITEPE_ANIMALS };

interface GobeklitepeMissionShellProps {
  placedCount: number;
  placedIds: string[];
  selectedId: string | null;
  isAudioMuted: boolean;
  fullscreen: boolean;
  isIntro: boolean;
  isNarrating?: boolean;
  onHazirim: () => void;
  onListenInstruction: () => void;
  onHome: () => void;
  onBack: () => void;
  onToggleAudio: () => void;
  onHelp: () => void;
  onPause: () => void;
  onToggleFullscreen: () => void;
  onSelectAnimal: (animalId: string) => void;
}

export const GobeklitepeMissionShell: React.FC<GobeklitepeMissionShellProps> = ({
  placedCount,
  placedIds,
  selectedId,
  isAudioMuted,
  fullscreen,
  isIntro,
  isNarrating = false,
  onHazirim,
  onListenInstruction,
  onHome,
  onBack,
  onToggleAudio,
  onHelp,
  onPause,
  onToggleFullscreen,
  onSelectAnimal,
}) => {
  // Fisher-Yates shuffle initialized once per session start
  const [shuffledAnimals, setShuffledAnimals] = useState<AnimalItem[]>(() =>
    shuffleAnimals(GOBEKLITEPE_ANIMALS)
  );

  // When session resets (placedCount drops back to 0), re-shuffle
  const prevPlacedCountRef = useRef(placedCount);
  useEffect(() => {
    if (prevPlacedCountRef.current > 0 && placedCount === 0) {
      setShuffledAnimals(shuffleAnimals(GOBEKLITEPE_ANIMALS));
    }
    prevPlacedCountRef.current = placedCount;
  }, [placedCount]);

  useEffect(() => {
    return () => {
      stopNarration();
    };
  }, []);
  const handleTilePointerDown = (e: React.PointerEvent<HTMLButtonElement>, animalId: string) => {
    if (placedIds.includes(animalId)) return;

    const target = e.currentTarget;
    const pointerId = e.pointerId;
    try {
      target.setPointerCapture(pointerId);
    } catch {
      // Fallback if browser/platform does not support pointer capture
    }

    const startX = e.clientX;
    const startY = e.clientY;
    let isDragging = false;
    let isCleanedUp = false;

    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      try {
        if (target.hasPointerCapture(pointerId)) {
          target.releasePointerCapture(pointerId);
        }
      } catch {
        // Ignore errors releasing capture
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
    };

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      const dist = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
      if (dist > 8 && !isDragging) {
        isDragging = true;
        EventBus.emit('gobeklitepe-drag-start', {
          pieceId: animalId,
          clientX: moveEvent.clientX,
          clientY: moveEvent.clientY,
        });
      }
      if (isDragging) {
        EventBus.emit('gobeklitepe-drag-move', {
          pieceId: animalId,
          clientX: moveEvent.clientX,
          clientY: moveEvent.clientY,
        });
      }
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return;
      try {
        if (isDragging) {
          EventBus.emit('gobeklitepe-drag-end', {
            pieceId: animalId,
            clientX: upEvent.clientX,
            clientY: upEvent.clientY,
          });
        } else {
          // Clean tap/click selection
          onSelectAnimal(animalId);
        }
      } finally {
        cleanup();
      }
    };

    const onPointerCancel = (cancelEvent: PointerEvent) => {
      if (cancelEvent.pointerId !== pointerId) return;
      try {
        if (isDragging) {
          EventBus.emit('gobeklitepe-drag-end', {
            pieceId: animalId,
            clientX: cancelEvent.clientX || startX,
            clientY: cancelEvent.clientY || startY,
          });
        }
      } finally {
        cleanup();
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
  };

  return (
    <div className={`gobeklitepe-shell ${isIntro ? 'is-intro-mode' : 'is-play-mode'}`}>
      {/* 1. TOP HUD */}
      <header className="gobeklitepe-hud">
        <button
          type="button"
          className="hud-back-btn"
          onClick={onBack}
          title="Görev Haritasına Dön"
          aria-label="Görev Haritasına Dön"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="hud-mission-pill">
          <span className="hud-mission-title">Göbeklitepe – Taşın Hafızası</span>
          <span className="hud-pill-divider" aria-hidden="true" />
          <span className="hud-progress-counter">{placedCount}/6</span>
          <div className="hud-progress-dots" aria-label={`${placedCount} / 6 hayvan yerleştirildi`}>
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <span
                key={idx}
                className={`hud-dot ${idx < placedCount ? 'is-filled' : ''}`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        <nav className="hud-controls" aria-label="Oyun kontrolleri">
          <button
            type="button"
            className="hud-ctrl-btn"
            onClick={onToggleAudio}
            title={isAudioMuted ? 'Sesi Aç' : 'Sesi Kapat'}
            aria-pressed={!isAudioMuted}
          >
            {isAudioMuted ? (
              <svg className="control-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg className="control-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
            <span>{isAudioMuted ? 'Ses: Kapalı' : 'Ses: Açık'}</span>
          </button>

          <button
            type="button"
            className="hud-ctrl-btn"
            onClick={onHelp}
            title="Yardım ve Oyun Bilgisi"
          >
            <svg className="control-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Yardım</span>
          </button>

          <button
            type="button"
            className="hud-ctrl-btn"
            onClick={onPause}
            title="Oyunu Duraklat"
          >
            <svg className="control-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
            <span>Duraklat</span>
          </button>

          <button
            type="button"
            className="hud-ctrl-btn"
            onClick={onToggleFullscreen}
            title={fullscreen ? 'Ekranı Küçült' : 'Tam Ekran'}
          >
            <svg className="control-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {fullscreen ? (
                <>
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              ) : (
                <>
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              )}
            </svg>
            <span>{fullscreen ? 'Ekranı Küçült' : 'Tam Ekran'}</span>
          </button>
        </nav>
      </header>

      {/* 2. MAIN GAME STAGE & INTEGRATED MISSION INTRO */}
      <section
        className={`gobeklitepe-stage-panel ${isIntro ? 'is-visible' : 'is-dismissed'}`}
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(4,12,24,0.92) 0%, rgba(4,12,24,0.78) 40%, rgba(4,12,24,0.30) 62%, rgba(4,12,24,0.12) 85%, rgba(4,12,24,0.35) 100%), linear-gradient(180deg, rgba(4,12,24,0.45) 0%, transparent 25%, transparent 75%, rgba(4,12,24,0.75) 100%), url(${stageBg})`,
        }}
        aria-label="Göbeklitepe Giriş Paneli"
      >
        <div className="stage-panel-inner">
          {/* Left Column: Mission Description and Primary CTA */}
          <div className="stage-left-content">
            <p className="stage-eyebrow">◆ 1. DURAK</p>
            <h1 className="stage-title">
              Göbeklitepe –<br />
              <span className="title-gold">Taşın Hafızası</span>
            </h1>
            <p className="stage-instruction">
              {MODULE_NARRATIONS.gobeklitepe.displayInstruction}
            </p>

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
                <svg className="cta-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                <svg width="22" height="16" viewBox="0 0 24 16" fill="none" stroke="var(--accent-cyan)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="2" y1="8" x2="20" y2="8" />
                  <polyline points="14 2 20 8 14 14" />
                </svg>
                <span className="hint-icon-target">◎</span>
              </div>
              <p className="hint-text">Hayvanı seç, sonra taş üzerindeki yerine dokun veya sürükle.</p>
            </div>

            <div className="stage-motto" aria-hidden="true">
              <span className="motto-diamond">◆</span>
              <span>KEŞFET · ÖĞREN · TASARLA</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BOTTOM ANIMAL SELECTION TRAY */}
      <footer className="gobeklitepe-bottom-tray">
        <div className="animal-tiles-row" role="region" aria-label="Hayvan Seçim Tepsisi">
          {shuffledAnimals.map((animal) => {
            const isPlaced = placedIds.includes(animal.id);
            const isSelected = selectedId === animal.id;

            return (
              <button
                key={animal.id}
                type="button"
                className={`animal-tile ${isSelected ? 'is-selected' : ''} ${isPlaced ? 'is-placed' : ''}`}
                disabled={isPlaced}
                onPointerDown={(e) => handleTilePointerDown(e, animal.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectAnimal(animal.id);
                  }
                }}
                aria-label={`${animal.name} ${isPlaced ? '(Yerleştirildi)' : isSelected ? '(Seçili)' : ''}`}
              >
                <div className="animal-tile-icon-wrap">
                  <img
                    src={animal.icon}
                    alt=""
                    className="animal-tile-svg"
                    draggable={false}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  />
                  {isPlaced && (
                    <span className="tile-placed-badge" aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </div>
                <span className="animal-tile-name">{animal.name}</span>
                {isPlaced && <span className="animal-tile-status">Yerleştirildi</span>}
              </button>
            );
          })}
        </div>
      </footer>
    </div>
  );
};
