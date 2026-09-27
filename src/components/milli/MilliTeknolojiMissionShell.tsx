import React, { useState, useRef } from 'react';
import { MILLI_STAGES, MISSION_SENSORS, WAYPOINTS, type WaypointPoint, FOOTER_QUOTE_MILLI } from '../../data/milliData';
import { MilliStage1Assembly } from './MilliStage1Assembly';
import { MilliStage2Payload } from './MilliStage2Payload';
import { MilliStage3Route } from './MilliStage3Route';
import { MilliStage4Flight } from './MilliStage4Flight';
import { SoundFx } from '../../game/utils/audio';
import { GameStore } from '../../game/state/GameStore';
import { calculateResult } from '../../game/systems/scoring';

interface MilliTeknolojiMissionShellProps {
  isAudioMuted: boolean;
  fullscreen: boolean;
  onHome: () => void;
  onBack: () => void;
  onToggleAudio: () => void;
  onHelp: () => void;
  onPause: () => void;
  onToggleFullscreen: () => void;
  onNextMission?: () => void;
}

export const MilliTeknolojiMissionShell: React.FC<MilliTeknolojiMissionShellProps> = ({
  isAudioMuted,
  fullscreen,
  onBack,
  onToggleAudio,
  onHelp,
  onPause,
  onToggleFullscreen,
  onNextMission,
}) => {
  // Exactly 4 Stages: 1 = Tasarla, 2 = Modül Seç, 3 = Rota Belirle, 4 = Gökyüzüne Yüksel
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3 | 4>(1);
  const [selectedSensorId, setSelectedSensorId] = useState<'termal' | 'lidar' | 'multispektral'>('termal');
  const [, setConfirmedWaypoints] = useState<WaypointPoint[]>(WAYPOINTS);
  const [isModuleFinished, setIsModuleFinished] = useState<boolean>(false);
  const [stage1PlacedCount, setStage1PlacedCount] = useState<number>(0);

  const startTimeRef = useRef<number>(Date.now());
  const completedRef = useRef<boolean>(false);

  const stageConfig = MILLI_STAGES.find(s => s.id === currentStage) || MILLI_STAGES[0];
  const selectedSensor = MISSION_SENSORS.find(s => s.id === selectedSensorId) || MISSION_SENSORS[0];

  const handleFinishModule = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsModuleFinished(true);

    const elapsedSec = Math.max(15, Math.round((Date.now() - startTimeRef.current) / 1000));
    const choices = {
      'Hava Aracı': 'Pamukkale Üniversitesi Sivil İHA',
      'Gövde Montajı': 'Eksiksiz Tamamlandı',
      'Görev Sensörü': selectedSensor.name,
      'Uçuş Rotası': '4 Kontrol Noktası (18.6 km)',
      'Uçuş Durumu': 'Başarıyla Tamamlandı',
    };

    const stats = calculateResult(elapsedSec, 0, choices);
    GameStore.completeModule('milli_teknoloji');
    GameStore.saveResult('milli_teknoloji', stats);

    if (onNextMission) {
      onNextMission();
    } else {
      onBack();
    }
  };

  return (
    <div
      className="milli-mission-shell"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#040914',
        color: '#FFFFFF',
        fontFamily: "'Outfit', 'Segoe UI', sans-serif",
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(245, 158, 11, 0.4); transform: scale(1); }
          50% { box-shadow: 0 0 30px rgba(245, 158, 11, 0.8); transform: scale(1.05); }
        }
        @keyframes radarPulse {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes routeDashFlow {
          from { stroke-dashoffset: 20; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes scanline {
          0% { top: 0%; opacity: 0.8; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0.8; }
        }
        @keyframes thrustPulse {
          0% { opacity: 0.7; transform: rotate(18deg) scaleX(0.9); }
          100% { opacity: 1; transform: rotate(18deg) scaleX(1.1); }
        }
        @keyframes snapToGimbal {
          0% { transform: translate(-50%, 100%) scale(1); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(0.6); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* =========================================================================
          DYNAMIC BACKGROUND
          Stage 1 & 2: Helipad & PAÜ Rectorate View
          Stage 3 & 4: Aerial Campus Panorama
          ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            currentStage <= 2
              ? "url('/assets/milli/pau_helipad_bg.jpg')"
              : "url('/assets/milli/pau_aerial_bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transition: 'background-image 0.5s ease-in-out',
          zIndex: 1,
        }}
      />

      {/* Controlled Dark Navy Overlay (~42%) + Subtle Vignette for crisp white UAV foreground contrast */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            currentStage === 1
              ? 'radial-gradient(ellipse at center, rgba(3, 10, 22, 0.40) 35%, rgba(2, 8, 18, 0.58) 100%)'
              : 'radial-gradient(circle at 50% 50%, rgba(4, 9, 20, 0.2) 0%, rgba(4, 9, 20, 0.75) 100%)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* =========================================================================
          TOP NAVIGATION & HUD BAR
          ========================================================================= */}
      <header
        style={{
          position: 'relative',
          height: '68px',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(6, 15, 32, 0.92) 0%, rgba(4, 10, 22, 0.82) 100%)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(0, 242, 254, 0.25)',
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
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(10, 25, 50, 0.8))',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              color: '#00F2FE',
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
                background: 'rgba(0, 242, 254, 0.15)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              ✈️
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
                5 / 6 | Millî Teknoloji – Gökyüzüne Yüksel
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#00F2FE',
                  letterSpacing: '0.5px',
                }}
              >
                {currentStage === 1
                  ? "1. ETAP: İHA'NI TASARLA"
                  : `GÖREV: SİVİL GÖZLEM VE ERKEN UYARI (AŞAMA ${currentStage}/4)`}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Kiosk Top Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => {
              SoundFx.playClickTone();
              onToggleAudio();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <span>{isAudioMuted ? '🔇' : '🔊'}</span>
            <span>Ses: {isAudioMuted ? 'Kapalı' : 'Açık'}</span>
          </button>

          <button
            onClick={() => {
              SoundFx.playClickTone();
              onHelp();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <span>❓</span>
            <span>Yardım</span>
          </button>

          <button
            onClick={() => {
              SoundFx.playClickTone();
              onPause();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <span>⏸</span>
            <span>Duraklat</span>
          </button>

          <button
            onClick={() => {
              SoundFx.playClickTone();
              onToggleFullscreen();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <span>⛶</span>
            <span>{fullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          CONTENT ROW: LEFT PARCHMENT PANEL + STAGE INTERACTIVE CANVAS
          ========================================================================= */}
      <main
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          padding: currentStage === 1 ? 0 : '16px 24px',
          gap: currentStage === 1 ? 0 : '20px',
          minHeight: 0,
          zIndex: 10,
        }}
      >
        {/* Left Parchment Mission Info Panel (for stages 2, 3, 4) */}
        {currentStage > 1 && (
          <aside
            style={{
              width: '320px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
              flexShrink: 0,
              zIndex: 15,
            }}
          >
          {/* Main Parchment Card */}
          <div
            style={{
              background: '#FAF6EF',
              color: '#1E293B',
              borderRadius: '18px',
              padding: '22px',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
              border: '1px solid #E2D9C8',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#F59E0B',
                }}
              />
              <span style={{ fontSize: '18px', color: '#64748B' }}>⚙️</span>
            </div>

            <div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 900,
                  color: '#0F172A',
                  letterSpacing: '0.5px',
                }}
              >
                {stageConfig.title}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#0284C7',
                  letterSpacing: '0.6px',
                  marginTop: '2px',
                }}
              >
                {stageConfig.subtitle}
              </div>
            </div>

            <p
              style={{
                fontSize: '13px',
                color: '#334155',
                lineHeight: '1.5',
                margin: 0,
              }}
            >
              {stageConfig.parchmentText}
            </p>

            {/* Target Mission Badge Box */}
            <div
              style={{
                marginTop: '4px',
                background: '#F5EBE1',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid #E5D5C0',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>🎯</span>
                <span>GÖREV</span>
              </div>
              <div style={{ fontSize: '12px', color: '#1E293B', fontWeight: 600 }}>
                {stageConfig.taskBadge}
              </div>
            </div>
          </div>

          {/* Kaşif Robot Mascot Speech Bubble */}
          <div
            style={{
              background: 'rgba(6, 16, 36, 0.88)',
              border: '1px solid rgba(0, 242, 254, 0.35)',
              borderRadius: '16px',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            }}
          >
            <img
              src="/assets/kasif_3d.png"
              alt="Kaşif"
              style={{ width: '48px', height: '48px', objectFit: 'contain', flexShrink: 0 }}
            />
            <div
              style={{
                fontSize: '12px',
                color: '#FFFFFF',
                lineHeight: '1.4',
                fontWeight: 500,
              }}
            >
              {stageConfig.kasifText}
            </div>
          </div>
        </aside>
        )}

        {/* Center / Right Stage Content */}
        <section
          style={{
            position: 'relative',
            flex: 1,
            height: '100%',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {currentStage === 1 && (
            <MilliStage1Assembly
              onProgressChange={setStage1PlacedCount}
              onComplete={() => {
                SoundFx.playSuccessTone();
                setCurrentStage(2);
              }}
            />
          )}

          {currentStage === 2 && (
            <MilliStage2Payload
              onComplete={sensorId => {
                SoundFx.playSuccessTone();
                setSelectedSensorId(sensorId);
                setCurrentStage(3);
              }}
            />
          )}

          {currentStage === 3 && (
            <MilliStage3Route
              onComplete={waypoints => {
                SoundFx.playSuccessTone();
                setConfirmedWaypoints(waypoints);
                setCurrentStage(4);
              }}
            />
          )}

          {currentStage === 4 && (
            <MilliStage4Flight
              selectedSensor={selectedSensor}
              onFinishModule={handleFinishModule}
            />
          )}
        </section>
      </main>

      {/* =========================================================================
          BOTTOM PROGRESS BAR (STRICTLY 4 STAGES) & ACTION BUTTON
          Matching Reference Image: 4-stage connected timeline + completion button
          ========================================================================= */}
      <footer
        style={{
          position: 'relative',
          height: '64px',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(4, 10, 22, 0.88) 0%, rgba(2, 6, 16, 0.98) 100%)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(0, 242, 254, 0.25)',
          boxShadow: '0 -6px 20px rgba(0, 0, 0, 0.5)',
          zIndex: 30,
        }}
      >
        {/* Strictly 4 Progress Steps with connecting lines */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {MILLI_STAGES.map((stage, idx) => {
            const isCompleted = isModuleFinished || stage.id < currentStage;
            const isActive = !isModuleFinished && stage.id === currentStage;

            return (
              <React.Fragment key={stage.id}>
                {idx > 0 && (
                  <div
                    style={{
                      width: '36px',
                      height: '2px',
                      background: stage.id <= currentStage
                        ? 'rgba(0, 242, 254, 0.5)'
                        : 'rgba(255, 255, 255, 0.15)',
                      borderRadius: '1px',
                    }}
                  />
                )}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    opacity: isCompleted || isActive ? 1 : 0.45,
                  }}
                >
                  {/* Step Circle */}
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: isCompleted
                        ? 'linear-gradient(135deg, #10B981, #059669)'
                        : isActive
                        ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                        : 'rgba(255, 255, 255, 0.08)',
                      border: isCompleted
                        ? '2px solid #34D399'
                        : isActive
                        ? '2px solid #FDE68A'
                        : '1.5px solid rgba(255, 255, 255, 0.22)',
                      boxShadow: isActive
                        ? '0 0 15px rgba(245, 158, 11, 0.6)'
                        : isCompleted
                        ? '0 0 12px rgba(16, 185, 129, 0.4)'
                        : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: '#FFFFFF',
                    }}
                  >
                    {isCompleted ? '✓' : stage.id}
                  </div>

                  {/* Step Label */}
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? '#FDE68A' : isCompleted ? '#34D399' : 'rgba(255, 255, 255, 0.65)',
                      letterSpacing: '0.4px',
                    }}
                  >
                    {stage.title}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Footer Right Side: Stage 1 Next Button (Matching Reference) or Quote */}
        {currentStage === 1 ? (
          <button
            id="milli-stage1-next-btn"
            disabled={stage1PlacedCount < 4}
            onClick={() => {
              if (stage1PlacedCount >= 4) {
                SoundFx.playSuccessTone();
                setCurrentStage(2);
              }
            }}
            style={{
              padding: '10px 22px',
              borderRadius: '10px',
              border: stage1PlacedCount === 4 ? '1px solid #FDE68A' : '1px solid rgba(255, 255, 255, 0.15)',
              background: stage1PlacedCount === 4
                ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                : 'rgba(55, 65, 81, 0.55)',
              color: stage1PlacedCount === 4 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)',
              fontWeight: 800,
              fontSize: '13px',
              letterSpacing: '0.4px',
              cursor: stage1PlacedCount === 4 ? 'pointer' : 'not-allowed',
              boxShadow: stage1PlacedCount === 4 ? '0 0 20px rgba(245, 158, 11, 0.5)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
            }}
          >
            <span>Görev Modülünü Seç</span>
            <span style={{ fontSize: '15px' }}>→</span>
          </button>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'rgba(0, 242, 254, 0.85)',
              letterSpacing: '0.5px',
            }}
          >
            <span>{FOOTER_QUOTE_MILLI}</span>
            <span>✈️</span>
          </div>
        )}
      </footer>
    </div>
  );
};
