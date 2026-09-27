import React, { useState, useRef, useEffect } from 'react';
import { MILLI_STAGES, MISSION_SENSORS, WAYPOINTS, type WaypointPoint, type MilliSensorId } from '../../data/milliData';
import { MilliStage1Assembly } from './MilliStage1Assembly';
import { MilliStage2Payload } from './MilliStage2Payload';
import { MilliStage3Route } from './MilliStage3Route';
import { MilliStage4Flight } from './MilliStage4Flight';
import { SoundFx } from '../../game/utils/audio';
import { GameStore } from '../../game/state/GameStore';
import { calculateResult } from '../../game/systems/scoring';
import { GameTopBar, GameAssistant } from '../game-ui';

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
  // Exactly 4 Stages: 1 = Tasarla, 2 = Modül Seç, 3 = Rota Belirle ve Gökyüzüne Yüksel, 4 = Görevi Tamamla
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3 | 4>(1);
  const [stage2SelectedSensorId, setStage2SelectedSensorId] = useState<MilliSensorId | null>(null);
  const [selectedSensorId, setSelectedSensorId] = useState<MilliSensorId>('elektro_optik');
  const [, setConfirmedWaypoints] = useState<WaypointPoint[]>(WAYPOINTS);
  const [stage3FlightState, setStage3FlightState] = useState<{
    isReady: boolean;
    isFlying: boolean;
    isCompleted: boolean;
  }>({ isReady: false, isFlying: false, isCompleted: false });
  const [stage3TriggerFlight, setStage3TriggerFlight] = useState<boolean>(false);
  const [isModuleFinished, setIsModuleFinished] = useState<boolean>(false);
  const [stage1PlacedCount, setStage1PlacedCount] = useState<number>(0);
  const [assistantOpen, setAssistantOpen] = useState<boolean>(false);

  const handleHelpToggle = () => {
    setAssistantOpen((prev) => !prev);
    onHelp?.();
  };

  // Etap değiştiğinde asistan tüyo balonunu otomatik kapat
  useEffect(() => {
    setAssistantOpen(false);
  }, [currentStage]);

  const startTimeRef = useRef<number>(Date.now());
  const completedRef = useRef<boolean>(false);

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
            currentStage <= 2
              ? 'radial-gradient(ellipse at center, rgba(3, 10, 22, 0.40) 35%, rgba(2, 8, 18, 0.58) 100%)'
              : 'radial-gradient(circle at 50% 50%, rgba(4, 9, 20, 0.2) 0%, rgba(4, 9, 20, 0.75) 100%)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* =========================================================================
          TOP NAVIGATION & HUD BAR
          ========================================================================= */}
      {/* STANDARDIZED TOP BAR */}
      <GameTopBar
        moduleNumber={5}
        moduleTitle="Millî Teknoloji"
        moduleSubtitle="Gökyüzüne Yüksel"
        missionTitle={
          currentStage === 1
            ? 'İHA parçalarını gövde üzerindeki yuvalarına yerleştir'
            : currentStage === 2
            ? 'Görevin için elektro-optik veya radar sensörünü seç'
            : currentStage === 3
            ? 'Uçuş kontrol noktalarını belirle ve rotanı çiz'
            : 'Otonom uçuşu başlat ve görevini başarıyla tamamla'
        }
        progressText={`${currentStage} / 4`}
        accentKey="milli_teknoloji"
        isAudioMuted={isAudioMuted}
        isFullscreen={fullscreen}
        onBack={onBack}
        onToggleAudio={onToggleAudio}
        onHelp={handleHelpToggle}
        onPause={onPause}
        onToggleFullscreen={onToggleFullscreen}
      />

      {/* STANDARDIZED GUIDE ROBOT ASSISTANT */}
      <GameAssistant
        message={
          currentStage === 1
            ? "Gövde, kanat ve kuyruk parçalarını doğru yuvalara yerleştir."
            : currentStage === 2
            ? 'Görev hedefine en uygun sensör veya kamera modülünü seç.'
            : currentStage === 3
            ? 'Rüzgâr ve batarya analizine göre en optimum uçuş rotasını onayla.'
            : 'Tüm sistemler devrede! Uçuşu tamamla ve üsse dön.'
        }
        isOpen={assistantOpen}
        onToggle={setAssistantOpen}
        placement="bottom-left"
        accentKey="milli_teknoloji"
      />

      {/* =========================================================================
          CONTENT ROW: LEFT PARCHMENT PANEL + STAGE INTERACTIVE CANVAS
          ========================================================================= */}
      <main
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          padding: 0,
          gap: 0,
          minHeight: 0,
          zIndex: 10,
        }}
      >

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
              selectedSensorId={stage2SelectedSensorId}
              onSelectSensor={setStage2SelectedSensorId}
              onComplete={() => {
                if (stage2SelectedSensorId) {
                  SoundFx.playSuccessTone();
                  setSelectedSensorId(stage2SelectedSensorId);
                  setCurrentStage(3);
                }
              }}
            />
          )}

          {currentStage === 3 && (
            <MilliStage3Route
              onFlightStateChange={setStage3FlightState}
              triggerFlight={stage3TriggerFlight}
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
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      fontSize: stage.id === 3 ? '10.5px' : '12px',
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? '#FDE68A' : isCompleted ? '#34D399' : 'rgba(255, 255, 255, 0.65)',
                      letterSpacing: '0.4px',
                      lineHeight: '1.2',
                    }}
                  >
                    {stage.id === 3 ? (
                      <>
                        <span>ROTANI BELİRLE VE</span>
                        <span>GÖKYÜZÜNE YÜKSEL</span>
                      </>
                    ) : (
                      <span>{stage.title}</span>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Footer Right Side: Stage Next Buttons */}
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
              minHeight: '48px',
              padding: '0 clamp(18px, 1.8vw, 26px)',
              borderRadius: '12px',
              border: stage1PlacedCount === 4 ? '1.5px solid #FDE68A' : '1px solid rgba(255, 255, 255, 0.15)',
              background: stage1PlacedCount === 4
                ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                : 'rgba(55, 65, 81, 0.55)',
              color: stage1PlacedCount === 4 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)',
              fontWeight: 800,
              fontSize: '14px',
              letterSpacing: '0.5px',
              cursor: stage1PlacedCount === 4 ? 'pointer' : 'not-allowed',
              boxShadow: stage1PlacedCount === 4 ? '0 0 20px rgba(245, 158, 11, 0.5)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.3s ease',
            }}
          >
            <span>Görev Modülünü Seç</span>
            <span style={{ fontSize: '16px' }}>→</span>
          </button>
        ) : currentStage === 2 ? (
          <button
            id="milli-stage2-next-btn"
            disabled={!stage2SelectedSensorId}
            onClick={() => {
              if (stage2SelectedSensorId) {
                SoundFx.playSuccessTone();
                setSelectedSensorId(stage2SelectedSensorId);
                setCurrentStage(3);
              }
            }}
            style={{
              minHeight: '48px',
              padding: '0 clamp(18px, 1.8vw, 26px)',
              borderRadius: '12px',
              border: stage2SelectedSensorId ? '1.5px solid #FDE68A' : '1px solid rgba(255, 255, 255, 0.15)',
              background: stage2SelectedSensorId
                ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                : 'rgba(55, 65, 81, 0.55)',
              color: stage2SelectedSensorId ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)',
              fontWeight: 800,
              fontSize: '14px',
              letterSpacing: '0.5px',
              cursor: stage2SelectedSensorId ? 'pointer' : 'not-allowed',
              boxShadow: stage2SelectedSensorId ? '0 0 20px rgba(245, 158, 11, 0.5)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.3s ease',
            }}
          >
            <span>Rotanı Belirle</span>
            <span style={{ fontSize: '16px' }}>→</span>
          </button>
        ) : currentStage === 3 ? (
          stage3FlightState.isCompleted ? (
            <button
              id="milli-stage3-next-btn"
              onClick={() => {
                SoundFx.playSuccessTone();
                handleFinishModule();
              }}
              style={{
                minHeight: '48px',
                padding: '0 clamp(18px, 1.8vw, 26px)',
                borderRadius: '12px',
                border: '1.5px solid #6EE7B7',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '14px',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.3s ease',
              }}
            >
              <span>6. Bölüme Geç</span>
              <span style={{ fontSize: '16px' }}>→</span>
            </button>
          ) : (
            <button
              id="milli-stage3-fly-btn"
              disabled={!stage3FlightState.isReady || stage3FlightState.isFlying}
              onClick={() => {
                if (stage3FlightState.isReady && !stage3FlightState.isFlying) {
                  setStage3TriggerFlight(true);
                }
              }}
              style={{
                minHeight: '48px',
                padding: '0 clamp(18px, 1.8vw, 26px)',
                borderRadius: '12px',
                border: stage3FlightState.isReady
                  ? '1.5px solid #FDE68A'
                  : '1px solid rgba(255, 255, 255, 0.15)',
                background: stage3FlightState.isReady
                  ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                  : 'rgba(55, 65, 81, 0.55)',
                color: stage3FlightState.isReady ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)',
                fontWeight: 800,
                fontSize: '14px',
                letterSpacing: '0.5px',
                cursor:
                  stage3FlightState.isReady && !stage3FlightState.isFlying
                    ? 'pointer'
                    : 'not-allowed',
                boxShadow: stage3FlightState.isReady
                  ? '0 0 20px rgba(245, 158, 11, 0.5)'
                  : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.3s ease',
              }}
            >
              <span>
                {stage3FlightState.isFlying
                  ? 'Uçuş Devam Ediyor...'
                  : 'Rotayı Onayla ve Uçuşa Geç'}
              </span>
              <span style={{ fontSize: '16px' }}>→</span>
            </button>
          )
        ) : (
          <button
            id="milli-stage4-finish-btn"
            onClick={handleFinishModule}
            style={{
              minHeight: '48px',
              padding: '0 clamp(18px, 1.8vw, 26px)',
              borderRadius: '12px',
              border: '1.5px solid #6EE7B7',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '14px',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.3s ease',
            }}
          >
            <span>6. Bölüme Geç</span>
            <span style={{ fontSize: '16px' }}>→</span>
          </button>
        )}
      </footer>
    </div>
  );
};
