import React, { useState, useRef } from 'react';
import { UZAY_STAGES, type OrbitId } from '../../data/uzayData';
import { UzayStage1Assembly } from './UzayStage1Assembly';
import { UzayStage3Orbit } from './UzayStage3Orbit';
import { UzayStage3Launch } from './UzayStage3Launch';
import { SoundFx } from '../../game/utils/audio';
import { GameStore } from '../../game/state/GameStore';
import { calculateResult } from '../../game/systems/scoring';
import { EventBus } from '../../game/state/EventBus';

interface UzayTeknolojileriMissionShellProps {
  isAudioMuted: boolean;
  fullscreen: boolean;
  onHome: () => void;
  onBack: () => void;
  onToggleAudio: () => void;
  onHelp: () => void;
  onPause: () => void;
  onToggleFullscreen: () => void;
  onCompleteAdventure?: () => void;
}

export const UzayTeknolojileriMissionShell: React.FC<UzayTeknolojileriMissionShellProps> = ({
  isAudioMuted,
  fullscreen,
  onBack,
  onToggleAudio,
  onHelp,
  onPause,
  onToggleFullscreen,
  onCompleteAdventure,
}) => {
  // Stage progression strictly starts at Stage 1 for every new entrance/reload
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3 | 4>(1);
  const [maxUnlockedStage, setMaxUnlockedStage] = useState<1 | 2 | 3 | 4>(1);
  const [stage1PlacedCount, setStage1PlacedCount] = useState<number>(0);
  const [selectedOrbitId, setSelectedOrbitId] = useState<OrbitId>('leo');
  const [stage2Completed, setStage2Completed] = useState<boolean>(false);
  const [stage3Completed, setStage3Completed] = useState<boolean>(false);

  const adventureCompletedRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());

  const handleFinishAdventure = () => {
    if (adventureCompletedRef.current) return;
    adventureCompletedRef.current = true;

    SoundFx.playSuccessTone();

    // 1. Calculate and save result for uzay_teknolojileri in central GameStore
    const elapsedSec = Math.max(15, Math.round((Date.now() - startTimeRef.current) / 1000));
    const choices = {
      'Uzay Aracı': 'Gözlem Uydusu (6 Parça)',
      'Montaj': 'Eksiksiz Tamamlandı (6/6)',
      'Yörünge': selectedOrbitId === 'leo' ? 'Alçak Dünya Yörüngesi (LEO)' : selectedOrbitId.toUpperCase(),
      'Görev': 'Dünya Gözlemi ve Yörünge Telemetrisi',
      'Yörünge Durumu': 'Başarıyla Yerleşti',
    };

    const stats = calculateResult(elapsedSec, 0, choices);
    GameStore.completeModule('uzay_teknolojileri');
    GameStore.saveResult('uzay_teknolojileri', stats);

    // 2. Open final grand celebration screen
    if (onCompleteAdventure) {
      onCompleteAdventure();
    } else {
      EventBus.emit('mission-result', 'uzay_teknolojileri');
    }
  };

  const activeStageInfo = UZAY_STAGES.find(s => s.id === currentStage) || UZAY_STAGES[0];

  return (
    <div
      className="uzay-mission-shell"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#030712',
        color: '#FFFFFF',
        fontFamily: "'Outfit', 'Segoe UI', sans-serif",
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <style>{`
        @keyframes pulseGlowCyan {
          0%, 100% { box-shadow: 0 0 15px rgba(56, 189, 248, 0.4); transform: scale(1); }
          50% { box-shadow: 0 0 25px rgba(56, 189, 248, 0.85); transform: scale(1.02); }
        }
        @keyframes pulseGlowPurple {
          0%, 100% { box-shadow: 0 0 15px rgba(168, 85, 247, 0.4); transform: scale(1); }
          50% { box-shadow: 0 0 28px rgba(168, 85, 247, 0.85); transform: scale(1.02); }
        }
        @keyframes pulseGlowGreen {
          0%, 100% { box-shadow: 0 0 15px rgba(168, 85, 247, 0.4); }
          50% { box-shadow: 0 0 30px rgba(168, 85, 247, 0.8); }
        }
      `}</style>

      {/* =========================================================================
          TOP NAVIGATION & CONTROLS BAR
          ========================================================================= */}
      <header
        style={{
          position: 'relative',
          height: '66px',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(8, 18, 38, 0.95) 0%, rgba(4, 10, 22, 0.88) 100%)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          zIndex: 30,
        }}
      >
        {/* Left: Back Arrow + Module Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => {
              SoundFx.playClickTone();
              onBack();
            }}
            title="Haritaya Dön"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(10, 25, 50, 0.8))',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38BDF8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px',
              transition: 'all 0.2s ease',
            }}
          >
            ←
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.3)',
              }}
            >
              🚀
            </div>
            <div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  letterSpacing: '0.8px',
                }}
              >
                6 / 6 | UZAY TEKNOLOJİLERİ
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#38BDF8',
                  letterSpacing: '0.5px',
                }}
              >
                {activeStageInfo.id}. ETAP: {activeStageInfo.title}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Audio, Help, Pause, Fullscreen Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Audio Button */}
          <button
            onClick={() => {
              SoundFx.playClickTone();
              onToggleAudio();
            }}
            title={isAudioMuted ? 'Sesi Aç' : 'Sesi Kapat'}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              background: 'rgba(15, 23, 42, 0.75)',
              color: '#E0F2FE',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{isAudioMuted ? '🔇' : '🔊'}</span>
            <span>Ses: {isAudioMuted ? 'Kapalı' : 'Açık'}</span>
          </button>

          {/* Help Button */}
          <button
            onClick={() => {
              SoundFx.playClickTone();
              onHelp();
            }}
            title="Yardım"
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              background: 'rgba(15, 23, 42, 0.75)',
              color: '#E0F2FE',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>❓</span>
            <span>Yardım</span>
          </button>

          {/* Pause Button */}
          <button
            onClick={() => {
              SoundFx.playClickTone();
              onPause();
            }}
            title="Duraklat"
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              background: 'rgba(15, 23, 42, 0.75)',
              color: '#E0F2FE',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>⏸</span>
            <span>Duraklat</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={() => {
              SoundFx.playClickTone();
              onToggleFullscreen();
            }}
            title={fullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              background: 'rgba(15, 23, 42, 0.75)',
              color: '#E0F2FE',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>⛶</span>
            <span>Tam Ekran</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          STAGE CONTENT AREA
          ========================================================================= */}
      <main
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          overflow: 'hidden',
          zIndex: 10,
        }}
      >
        {currentStage === 1 ? (
          <UzayStage1Assembly
            onComplete={() => {
              setStage1PlacedCount(6);
              setMaxUnlockedStage(prev => Math.max(prev, 2) as 1 | 2 | 3 | 4);
            }}
            onProgressChange={count => {
              setStage1PlacedCount(count);
              if (count >= 6) {
                setMaxUnlockedStage(prev => Math.max(prev, 2) as 1 | 2 | 3 | 4);
              }
            }}
          />
        ) : currentStage === 2 ? (
          <UzayStage3Orbit
            onOrbitSelected={(orbitId, isCorrect) => {
              if (orbitId) setSelectedOrbitId(orbitId);
              setStage2Completed(isCorrect);
              if (isCorrect) {
                setMaxUnlockedStage(prev => Math.max(prev, 3) as 1 | 2 | 3 | 4);
              }
            }}
            onNextStage={() => {
              setMaxUnlockedStage(prev => Math.max(prev, 3) as 1 | 2 | 3 | 4);
              setCurrentStage(3);
            }}
          />
        ) : currentStage === 3 ? (
          <UzayStage3Launch
            selectedOrbitId={selectedOrbitId}
            onLaunchComplete={() => {
              setStage3Completed(true);
              setMaxUnlockedStage(prev => Math.max(prev, 4) as 1 | 2 | 3 | 4);
            }}
            onNextStage={() => {
              setMaxUnlockedStage(prev => Math.max(prev, 4) as 1 | 2 | 3 | 4);
              setCurrentStage(4);
            }}
          />
        ) : (
          /* Stage 4: GÖREVİ TAMAMLA */
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              padding: '40px',
              background: 'radial-gradient(circle at 50% 40%, rgba(14, 116, 144, 0.25) 0%, rgba(2, 6, 23, 0.98) 75%)',
            }}
          >
            <div
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0284C7, #38BDF8)',
                border: '3px solid #7DD3FC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '44px',
                boxShadow: '0 0 36px rgba(56, 189, 248, 0.6)',
              }}
            >
              🏆
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '0.8px' }}>
              6. BÖLÜM: UZAY TEKNOLOJİLERİ
            </h2>
            <p
              style={{
                fontSize: '16px',
                lineHeight: 1.6,
                color: '#CBD5E1',
                maxWidth: '620px',
                textAlign: 'center',
                margin: 0,
              }}
            >
              Tebrikler Genç Kaşif! Uzay aracımız başarıyla fırlatıldı ve belirlenen yörüngeye yerleşti. İlk bilimsel gözlem telemetrisi ve yeryüzü görüntüleri başarıyla yer istasyonuna ulaştı!
            </p>
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '12px',
                padding: '12px 24px',
                color: '#38BDF8',
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '0.5px',
              }}
            >
              Tüm görevler tamamlandı. Başarı sertifikanı almak için aşağıdaki butona tıkla.
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          BOTTOM HUD / 4-STAGE PROGRESS BAR
          ========================================================================= */}
      <footer
        style={{
          position: 'relative',
          height: '66px',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(0deg, rgba(8, 18, 38, 0.98) 0%, rgba(4, 10, 22, 0.9) 100%)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.6)',
          zIndex: 30,
        }}
      >
        {/* Strictly 4-Stage Stepper Navigation with Unlocked Stage Guard */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {UZAY_STAGES.map((stage, idx) => {
            const isActive = stage.id === currentStage;
            const isCompleted = stage.id < currentStage;
            const isUnlocked = stage.id <= maxUnlockedStage;

            return (
              <React.Fragment key={stage.id}>
                {idx > 0 && (
                  <div
                    style={{
                      width: '28px',
                      height: '2px',
                      background: stage.id <= maxUnlockedStage ? 'rgba(56, 189, 248, 0.8)' : 'rgba(255, 255, 255, 0.15)',
                      transition: 'background 0.3s ease',
                    }}
                  />
                )}

                <div
                  onClick={() => {
                    // Lock navigation in stage 4 (final stage) - no going back
                    if (currentStage === 4) return;
                    // Only allow clicking already unlocked stages; cannot skip ahead!
                    if (isUnlocked && stage.id !== currentStage) {
                      SoundFx.playClickTone();
                      setCurrentStage(stage.id);
                    }
                  }}
                  title={
                    currentStage === 4
                      ? `${stage.id}. Etap: ${stage.title}`
                      : isUnlocked
                      ? `${stage.id}. Etap: ${stage.title}`
                      : `${stage.id}. Etap: Önceki etapları tamamlamalısın (Kilitli)`
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: isUnlocked ? 'pointer' : 'not-allowed',
                    opacity: isUnlocked ? 1 : 0.45,
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  {/* Step Number Circle */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isActive
                        ? 'linear-gradient(135deg, #7C3AED, #A855F7)'
                        : isCompleted
                        ? 'linear-gradient(135deg, #0284C7, #38BDF8)'
                        : isUnlocked
                        ? 'rgba(30, 41, 59, 0.9)'
                        : 'rgba(15, 23, 42, 0.6)',
                      border: isActive
                        ? '2px solid #C084FC'
                        : isCompleted
                        ? '2px solid #38BDF8'
                        : isUnlocked
                        ? '1.5px solid rgba(56, 189, 248, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.15)',
                      color: isUnlocked ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                      fontSize: '13px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isActive
                        ? '0 0 16px rgba(168, 85, 247, 0.6)'
                        : isCompleted
                        ? '0 0 12px rgba(56, 189, 248, 0.4)'
                        : 'none',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isCompleted ? '✓' : stage.id}
                  </div>

                  {/* Step Title Label */}
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? '#FFFFFF' : isCompleted ? '#38BDF8' : isUnlocked ? '#94A3B8' : '#475569',
                      letterSpacing: '0.6px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {stage.title}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Footer Right Side: DEVAM ET -> Button */}
        <div>
          {/* Stage 1: Tasarla -> Yörünge */}
          {currentStage === 1 && (
            <button
              id="uzay-stage1-next-btn"
              disabled={stage1PlacedCount < 6}
              onClick={() => {
                if (stage1PlacedCount >= 6) {
                  SoundFx.playSuccessTone();
                  setMaxUnlockedStage(prev => Math.max(prev, 2) as 1 | 2 | 3 | 4);
                  setCurrentStage(2);
                }
              }}
              style={{
                padding: '11px 26px',
                borderRadius: '10px',
                border: stage1PlacedCount === 6 ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.15)',
                background: stage1PlacedCount === 6
                  ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)'
                  : 'rgba(51, 65, 85, 0.55)',
                color: stage1PlacedCount === 6 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                fontWeight: 800,
                fontSize: '13.5px',
                letterSpacing: '0.6px',
                cursor: stage1PlacedCount === 6 ? 'pointer' : 'not-allowed',
                boxShadow: stage1PlacedCount === 6 ? '0 0 24px rgba(56, 189, 248, 0.5)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                animation: stage1PlacedCount === 6 ? 'pulseGlowCyan 2s infinite ease-in-out' : 'none',
              }}
            >
              <span>DEVAM ET</span>
              <span style={{ fontSize: '15px' }}>→</span>
            </button>
          )}

          {/* Stage 2: Yörüngeyi Belirle -> Yörüngeye Yerleş */}
          {currentStage === 2 && (
            <button
              id="uzay-stage2-next-btn"
              disabled={!stage2Completed}
              onClick={() => {
                if (stage2Completed) {
                  SoundFx.playSuccessTone();
                  setMaxUnlockedStage(prev => Math.max(prev, 3) as 1 | 2 | 3 | 4);
                  setCurrentStage(3);
                }
              }}
              style={{
                padding: '11px 28px',
                borderRadius: '12px',
                border: stage2Completed ? '1.5px solid #C084FC' : '1px solid rgba(255, 255, 255, 0.15)',
                background: stage2Completed
                  ? 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)'
                  : 'rgba(51, 65, 85, 0.55)',
                color: stage2Completed ? '#FFFFFF' : 'rgba(255, 255, 255, 0.35)',
                fontWeight: 800,
                fontSize: '14px',
                letterSpacing: '0.8px',
                cursor: stage2Completed ? 'pointer' : 'not-allowed',
                boxShadow: stage2Completed ? '0 0 25px rgba(168, 85, 247, 0.65)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                animation: stage2Completed ? 'pulseGlowPurple 2s infinite ease-in-out' : 'none',
              }}
            >
              <span>DEVAM ET</span>
              <span style={{ fontSize: '15px' }}>→</span>
            </button>
          )}

          {/* Stage 3: Yörüngeye Yerleş -> 4. Etap: Görevi Tamamla */}
          {currentStage === 3 && (
            <button
              id="uzay-stage3-next-btn"
              disabled={!stage3Completed}
              onClick={() => {
                if (stage3Completed) {
                  SoundFx.playSuccessTone();
                  setMaxUnlockedStage(prev => Math.max(prev, 4) as 1 | 2 | 3 | 4);
                  setCurrentStage(4);
                }
              }}
              style={{
                padding: '11px 28px',
                borderRadius: '12px',
                border: stage3Completed ? '1.5px solid #C084FC' : '1px solid rgba(255, 255, 255, 0.15)',
                background: stage3Completed
                  ? 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)'
                  : 'rgba(51, 65, 85, 0.55)',
                color: stage3Completed ? '#FFFFFF' : 'rgba(255, 255, 255, 0.35)',
                fontWeight: 800,
                fontSize: '14px',
                letterSpacing: '0.8px',
                cursor: stage3Completed ? 'pointer' : 'not-allowed',
                boxShadow: stage3Completed ? '0 0 25px rgba(168, 85, 247, 0.65)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                animation: stage3Completed ? 'pulseGlowPurple 2s infinite ease-in-out' : 'none',
              }}
            >
              <span>DEVAM ET</span>
              <span style={{ fontSize: '15px' }}>→</span>
            </button>
          )}

          {/* Stage 4: Tamamlandı -> GÖREVİ TAMAMLA */}
          {currentStage === 4 && (
            <button
              id="uzay-stage4-finish-btn"
              onClick={handleFinishAdventure}
              data-action="MACERAYI TAMAMLA"
              title="Görevi Tamamla"
              style={{
                padding: '12px 32px',
                borderRadius: '12px',
                border: '1.5px solid #34D399',
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '14px',
                letterSpacing: '0.8px',
                cursor: 'pointer',
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.65)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
              }}
            >
              <span>GÖREVİ TAMAMLA</span>
              <span style={{ fontSize: '15px' }}>→</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
