import React, { useEffect, useRef, useState } from 'react';
import { EventBus } from '../game/state/EventBus';
import { MODULE_NARRATIONS } from '../data/narrations';
import { stopNarration } from '../game/systems/narration';
import stageBg from '../assets/gobeklitepe_cinematic_stage.jpg';
import { GameTopBar, GameAssistant } from './game-ui';
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
  const [assistantOpen, setAssistantOpen] = useState<boolean>(false);

  const handleHelpToggle = () => {
    setAssistantOpen((prev) => !prev);
    onHelp?.();
  };

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
    // Parça başarıyla yerleştiğinde tüyoyu otomatik kapat
    setAssistantOpen(false);
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
      {/* 1. STANDARDIZED TOP BAR */}
      <GameTopBar
        moduleNumber={1}
        moduleTitle="Göbeklitepe"
        moduleSubtitle="Taşın Hafızası"
        missionTitle="Hayvan kabartmalarını T-biçimli dikilitaştaki doğru yerlerine yerleştir"
        progressText={`${placedCount} / 6`}
        accentKey="gobeklitepe"
        isAudioMuted={isAudioMuted}
        isFullscreen={fullscreen}
        onBack={onBack}
        onToggleAudio={onToggleAudio}
        onHelp={handleHelpToggle}
        onPause={onPause}
        onToggleFullscreen={onToggleFullscreen}
      />

      {/* STANDARDIZED GUIDE ROBOT ASISTANT */}
      {!isIntro && (
        <GameAssistant
          message={
            placedCount === 6
              ? 'Tebrikler! Taşın hafızasındaki tüm figürleri doğru yerleştirdin.'
              : selectedId
              ? 'Şimdi dikilitaş üzerindeki parlayan yuvasına dokunarak veya sürükleyerek yerleştir.'
              : placedCount > 0
              ? `${placedCount}/6 figür yerleşti. Alttan bir hayvan seç veya sürükle.`
              : 'Önce bir hayvana, sonra taş üzerindeki doğru yerine dokun.'
          }
          isOpen={assistantOpen}
          onToggle={setAssistantOpen}
          placement="bottom-left"
          accentKey="gobeklitepe"
          isNarrating={isNarrating}
          onListenNarration={onListenInstruction}
        />
      )}

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
