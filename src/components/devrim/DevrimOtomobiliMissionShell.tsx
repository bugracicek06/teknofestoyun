import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DEVRIM_STEPS, ATATURK_QUOTE_DEVRIM, DEVRIM_ENGINE_PARTS } from '../../data/devrimData';
import { DevrimEngineAssembly } from './DevrimEngineAssembly';
import { SoundFx } from '../../game/utils/audio';
import { GameStore } from '../../game/state/GameStore';
import { EventBus } from '../../game/state/EventBus';
import { calculateResult } from '../../game/systems/scoring';

interface DevrimOtomobiliMissionShellProps {
  isAudioMuted: boolean;
  fullscreen: boolean;
  onHome: () => void;
  onBack: () => void;
  onToggleAudio: () => void;
  onHelp: () => void;
  onPause: () => void;
  onToggleFullscreen: () => void;
}

export const DevrimOtomobiliMissionShell: React.FC<DevrimOtomobiliMissionShellProps> = ({
  isAudioMuted,
  fullscreen,
  onHome,
  onBack,
  onToggleAudio,
  onHelp,
  onPause,
  onToggleFullscreen,
}) => {
  // Step State: 1 = Tanış, 2 = Kaput, 3 = İnşa Et, 4 = Çalıştır, 5 = Tamamla
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 2 Hood Animation State
  const [isHoodOpening, setIsHoodOpening] = useState(false);

  // Step 4 Ignition State
  const [isStartingEngine, setIsStartingEngine] = useState(false);
  const [isEngineRunning, setIsEngineRunning] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const completedRef = useRef<boolean>(false);

  const ignitionTimer1Ref = useRef<number | null>(null);
  const ignitionTimer2Ref = useRef<number | null>(null);
  const ignitionTimer3Ref = useRef<number | null>(null);

  // Clean up any pending ignition timers on unmount
  useEffect(() => {
    return () => {
      if (ignitionTimer1Ref.current) window.clearTimeout(ignitionTimer1Ref.current);
      if (ignitionTimer2Ref.current) window.clearTimeout(ignitionTimer2Ref.current);
      if (ignitionTimer3Ref.current) window.clearTimeout(ignitionTimer3Ref.current);
    };
  }, []);

  const stepConfig = DEVRIM_STEPS[currentStep];

  // Step 2: User clicks or swipes hood to open
  const handleOpenHood = () => {
    if (isHoodOpening) return;
    setIsHoodOpening(true);
    SoundFx.playLockSound?.();

    setTimeout(() => {
      SoundFx.playSuccessTone?.();
      setCurrentStep(3);
      setIsHoodOpening(false);
    }, 800);
  };

  // Step 3 -> 4: Assembly complete callback
  const handleAssemblyComplete = useCallback(() => {
    setCurrentStep(4);
  }, []);

  // Step 4: User presses the Ignition (Motoru Çalıştır) button
  const handleIgnition = useCallback(() => {
    if (isStartingEngine || isEngineRunning) return;
    setIsStartingEngine(true);
    SoundFx.playLeverPull?.();

    // Crank simulation
    ignitionTimer1Ref.current = window.setTimeout(() => {
      SoundFx.playGearSpin?.();
    }, 300);

    ignitionTimer2Ref.current = window.setTimeout(() => {
      setIsStartingEngine(false);
      setIsEngineRunning(true);
      SoundFx.playVictoryFanfare?.();

      // Transition to Step 5
      ignitionTimer3Ref.current = window.setTimeout(() => {
        setCurrentStep(5);
      }, 1200);
    }, 1400);
  }, [isStartingEngine, isEngineRunning]);

  // Step 5: "Sonraki Bölüme Geç →"
  const handleCompleteAndNext = () => {
    if (completedRef.current) return;
    completedRef.current = true;

    const elapsedSec = Math.max(12, Math.round((Date.now() - startTimeRef.current) / 1000));
    const choices = {
      Araç: 'Devrim 1961',
      Motor: '4 Silindirli Devrim Motoru',
      'Montaj Durumu': 'Eksiksiz Tamamlandı',
      Çalıştırma: 'Başarılı',
    };

    const stats = calculateResult(elapsedSec, 0, choices);
    GameStore.completeModule('sanayilesme');
    GameStore.saveResult('sanayilesme', stats);
    EventBus.emit('mission-result', 'sanayilesme');
  };

  return (
    <div
      className="devrim-mission-shell"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#070B14',
        color: '#FFFFFF',
        fontFamily: "'Outfit', 'Segoe UI', sans-serif",
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* 1961 Turkish Automotive Engineering Workshop Background (Clean, No UI) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/assets/devrim/devrim_workshop_bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: currentStep === 3 ? 'brightness(0.55)' : 'brightness(0.75)',
          transition: 'filter 0.5s ease',
          zIndex: 1,
        }}
      />

      {/* Workshop Atmosphere Dark/Vignette Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(7, 11, 20, 0.82) 0%, rgba(7, 11, 20, 0.45) 50%, rgba(7, 11, 20, 0.92) 100%)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* =========================================================================
          TOP HEADER BAR
          ========================================================================= */}
      <header
        style={{
          position: 'relative',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 28px',
          background: 'rgba(7, 11, 20, 0.75)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
        }}
      >
        {/* Left: Home & Back Nav Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onBack}
            aria-label="Geri"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid rgba(255, 255, 255, 0.25)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px',
              transition: 'all 0.2s',
            }}
          >
            ←
          </button>
          <button
            onClick={onHome}
            aria-label="Ana Menü"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid rgba(255, 255, 255, 0.25)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px',
              transition: 'all 0.2s',
            }}
          >
            ⌂
          </button>

          {/* Module Title Badge */}
          <div
            style={{
              padding: '6px 18px',
              borderRadius: '9999px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
            }}
          >
            <span style={{ color: '#F59E0B', fontWeight: '900', fontSize: '14px' }}>4 / 6</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>|</span>
            <span style={{ color: '#E2E8F0', fontWeight: '700', fontSize: '14px', letterSpacing: '0.3px' }}>
              Bilim ve Sanayileşme – Geleceği Üreten Türkiye
            </span>
          </div>
        </div>

        {/* Right: Controls (Ses, Yardım, Duraklat, Tam Ekran) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onToggleAudio}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#E2E8F0',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{isAudioMuted ? '🔇' : '🔊'}</span>
            <span>Ses: {isAudioMuted ? 'Kapalı' : 'Açık'}</span>
          </button>

          <button
            onClick={onHelp}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#E2E8F0',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            ? Yardım
          </button>

          <button
            onClick={onPause}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#E2E8F0',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            ⏸ Duraklat
          </button>

          <button
            onClick={onToggleFullscreen}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#E2E8F0',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            ⛶ {fullscreen ? 'Küçült' : 'Tam Ekran'}
          </button>
        </div>
      </header>

      {/* =========================================================================
          TOP STEP TITLE BANNER
          ========================================================================= */}
      <div
        style={{
          position: 'relative',
          zIndex: 15,
          display: 'flex',
          justifyContent: 'center',
          marginTop: '6px',
        }}
      >
        <div
          style={{
            position: 'relative',
            background: 'rgba(10, 16, 28, 0.85)',
            border: '2px solid #F59E0B',
            borderRadius: '12px',
            padding: '8px 36px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 0 20px rgba(245, 158, 11, 0.25)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div
            style={{
              color: '#F59E0B',
              fontSize: '12px',
              fontWeight: '800',
              letterSpacing: '2px',
            }}
          >
            — {stepConfig.badge} —
          </div>
          <div
            style={{
              color: '#FFFFFF',
              fontSize: '20px',
              fontWeight: '900',
              letterSpacing: '1px',
              margin: '2px 0',
            }}
          >
            {stepConfig.title}
          </div>
          <div
            style={{
              color: '#CBD5E1',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            {stepConfig.subTitle}
          </div>
        </div>
      </div>

      {/* =========================================================================
          MAIN WORKSHOP STAGE AREA
          ========================================================================= */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'grid',
          gridTemplateColumns: currentStep === 3 ? '300px 1fr 300px' : '320px 1fr 360px',
          alignItems: 'center',
          padding: '0 28px',
          gap: '24px',
          maxHeight: 'calc(100vh - 160px)',
        }}
      >
        {/* -----------------------------------------------------------------------
            LEFT: PARCHMENT INFO CARD (Common across all steps)
            ----------------------------------------------------------------------- */}
        <div
          className="devrim-parchment-card"
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #FBF6E9 0%, #F2E8D2 60%, #E7DAC1 100%)',
            border: '2px solid #9A7B56',
            borderRadius: '16px',
            padding: '24px 20px',
            boxShadow: '0 18px 36px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(180, 130, 80, 0.15)',
            color: '#2A1806',
            maxHeight: '480px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: "'Cinzel', Georgia, serif",
          }}
        >
          {/* Top Decorative Pin */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '14px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: '#5B3E25',
              border: '2px solid #D97706',
            }}
          />

          {/* Car / Engine Icon */}
          <div style={{ textAlign: 'center', fontSize: '32px' }}>
            {currentStep >= 3 ? '⚙️' : '🚗'}
          </div>

          <div style={{ textAlign: 'center', margin: '4px 0 10px 0' }}>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: '900',
                color: '#1B1204',
                margin: '0 0 4px 0',
                letterSpacing: '1px',
              }}
            >
              {stepConfig.parchment.title}
            </h1>
            <p
              style={{
                fontSize: '12px',
                fontStyle: 'italic',
                color: '#854D0E',
                margin: 0,
                fontWeight: '600',
              }}
            >
              {stepConfig.parchment.subTitle}
            </p>
          </div>

          <div
            style={{
              fontSize: '13px',
              lineHeight: '1.6',
              color: '#3B230C',
              textAlign: 'center',
              fontFamily: "'Outfit', 'Segoe UI', sans-serif",
              fontWeight: '500',
            }}
          >
            <p style={{ margin: '0 0 8px 0' }}>{stepConfig.parchment.body1}</p>
            {stepConfig.parchment.body2 && (
              <p style={{ margin: 0 }}>{stepConfig.parchment.body2}</p>
            )}
          </div>

          {/* Golden Callout Box */}
          <div
            style={{
              marginTop: '12px',
              fontSize: '12px',
              lineHeight: '1.5',
              color: '#2A1806',
              textAlign: 'center',
              fontWeight: '700',
              fontFamily: "'Outfit', 'Segoe UI', sans-serif",
              background: 'rgba(217, 119, 6, 0.14)',
              borderRadius: '10px',
              padding: '10px 12px',
              border: '1px solid rgba(217, 119, 6, 0.3)',
            }}
          >
            {stepConfig.parchment.callout}
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            CENTER: INTERACTIVE WORKPIECE DISPLAY PER STEP
            ----------------------------------------------------------------------- */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* STEP 1: Devrim Tanıtım Sahnesi */}
          {currentStep === 1 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
              }}
            >
              {/* Devrim Car Center Stage Frame */}
              <div
                style={{
                  position: 'relative',
                  width: '640px',
                  aspectRatio: '16 / 10',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                  border: '1.5px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                <img
                  src="/assets/devrim/devrim_car_closed.jpg"
                  alt="Devrim Otomobili 1961"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* CTA: Motoru İncele / Kaputu Aç */}
              <button
                onClick={() => {
                  SoundFx.playClickTone?.();
                  setCurrentStep(2);
                }}
                style={{
                  padding: '14px 44px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #D97706 100%)',
                  color: '#291705',
                  fontSize: '18px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(245, 158, 11, 0.5)',
                  transition: 'all 0.2s ease',
                  minHeight: '48px',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Motoru İncele →
              </button>
            </div>
          )}

          {/* STEP 2: Kaputu Aç Etkileşim Sahnesi */}
          {currentStep === 2 && (
            <div
              style={{
                position: 'relative',
                width: '640px',
                aspectRatio: '16 / 10',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                border: '2px solid rgba(245, 158, 11, 0.4)',
              }}
            >
              {/* Closed car transitioning smoothly to open car */}
              <img
                src="/assets/devrim/devrim_car_closed.jpg"
                alt="Devrim Otomobili Kapalı"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: isHoodOpening ? 0 : 1,
                  transition: 'opacity 0.7s ease',
                }}
              />
              <img
                src="/assets/devrim/devrim_car_open.jpg"
                alt="Devrim Otomobili Açık Kaput"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: isHoodOpening ? 1 : 0,
                  transition: 'opacity 0.7s ease',
                }}
              />

              {/* Pulsing Interactive Tap/Drag Zone on Hood */}
              {!isHoodOpening && (
                <div
                  onClick={handleOpenHood}
                  style={{
                    position: 'absolute',
                    top: '40%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '16px 28px',
                    borderRadius: '20px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '2px solid #F59E0B',
                    boxShadow: '0 0 30px rgba(245, 158, 11, 0.7)',
                    animation: 'pulseGlow 2s infinite',
                  }}
                >
                  <span style={{ fontSize: '30px', animation: 'bounce 1.5s infinite' }}>⬆️</span>
                  <span
                    style={{
                      color: '#FDE68A',
                      fontSize: '18px',
                      fontWeight: '900',
                      letterSpacing: '1px',
                      marginTop: '4px',
                    }}
                  >
                    KAPUTU AÇ
                  </span>
                  <span style={{ color: '#E2E8F0', fontSize: '11px', marginTop: '2px' }}>
                    (Dokun veya Tıkla)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Motor Parçalarını İnşa Et */}
          {currentStep === 3 && (
            <div style={{ width: '100%', height: '100%' }}>
              <DevrimEngineAssembly onComplete={handleAssemblyComplete} />
            </div>
          )}

          {/* STEP 4 & 5: Tamamlanmış Motor ve Çalıştırma */}
          {(currentStep === 4 || currentStep === 5) && (
            <div
              style={{
                position: 'relative',
                width: '660px',
                aspectRatio: '16 / 10',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 20px 45px rgba(0,0,0,0.7)',
                border: currentStep === 5 ? '3px solid #10B981' : '2px solid #F59E0B',
                animation: isStartingEngine ? 'engineVibrate 0.1s infinite' : 'none',
              }}
            >
              <img
                src="/assets/devrim/devrim_car_open.jpg"
                alt="Devrim Çalışan Motor"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Headlight Glowing Flare Effect in Step 5 or when running */}
              {(currentStep === 5 || isEngineRunning) && (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '22%',
                      left: '18%',
                      width: '90px',
                      height: '90px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(254, 240, 138, 0.8) 0%, rgba(245, 158, 11, 0.3) 50%, transparent 70%)',
                      boxShadow: '0 0 40px rgba(254, 240, 138, 0.9)',
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '22%',
                      right: '18%',
                      width: '90px',
                      height: '90px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(254, 240, 138, 0.8) 0%, rgba(245, 158, 11, 0.3) 50%, transparent 70%)',
                      boxShadow: '0 0 40px rgba(254, 240, 138, 0.9)',
                      pointerEvents: 'none',
                    }}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* -----------------------------------------------------------------------
            RIGHT: STEP SPECIFIC CONTROL CARDS
            ----------------------------------------------------------------------- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* STEP 2: "NASIL AÇILIR?" Rehber Kartı */}
          {currentStep === 2 && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.88)',
                border: '1.5px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 12px 28px rgba(0,0,0,0.5)',
              }}
            >
              <div
                style={{
                  color: '#F59E0B',
                  fontSize: '13px',
                  fontWeight: '800',
                  textAlign: 'center',
                  letterSpacing: '1px',
                }}
              >
                — NASIL AÇILIR? —
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#F59E0B',
                      color: '#0F172A',
                      fontWeight: '900',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    1
                  </div>
                  <span style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: '500' }}>
                    Kaputun üzerine dokun ve yukarı doğru kaydır.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#F59E0B',
                      color: '#0F172A',
                      fontWeight: '900',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    2
                  </div>
                  <span style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: '500' }}>
                    Kaput tamamen açıldığında motor parçalarını monte etmeye başlayacaksın.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: "BİLGİ PİLL" */}
          {currentStep === 3 && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.88)',
                border: '1.5px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 12px 28px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#F59E0B',
                  color: '#0F172A',
                  fontWeight: '900',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                ℹ
              </div>
              <span style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: '600' }}>
                Parçayı seç, sürükle ve doğru yuvaya bırak.
              </span>
            </div>
          )}

          {/* STEP 4: "MOTOR HAZIR" + PARÇALAR + BÜYÜK "MOTORU ÇALIŞTIR" BUTONU */}
          {currentStep === 4 && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.94)',
                border: '2px solid rgba(245, 158, 11, 0.55)',
                borderRadius: '18px',
                padding: '22px 18px',
                boxShadow: '0 16px 36px rgba(0,0,0,0.65)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              {/* MOTOR HAZIR Status Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 18px',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.18)',
                  border: '1.5px solid #10B981',
                  color: '#A7F3D0',
                  fontSize: '14px',
                  fontWeight: '900',
                  letterSpacing: '1.5px',
                  marginBottom: '14px',
                  boxShadow: '0 0 16px rgba(16, 185, 129, 0.3)',
                }}
              >
                <span>✓</span> MOTOR HAZIR
              </div>

              {/* Checklist Title */}
              <div
                style={{
                  color: '#F59E0B',
                  fontSize: '12px',
                  fontWeight: '800',
                  letterSpacing: '0.8px',
                  marginBottom: '8px',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                MONTE EDİLEN PARÇALAR
              </div>

              {/* Checklist */}
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginBottom: '18px',
                }}
              >
                {DEVRIM_ENGINE_PARTS.map(part => (
                  <div
                    key={part.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: '#A7F3D0',
                      fontWeight: '600',
                      background: 'rgba(16, 185, 129, 0.08)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <span style={{ color: '#10B981', fontWeight: '900' }}>✓</span>
                    <span>{part.name}</span>
                  </div>
                ))}
              </div>

              {/* Large MOTORU ÇALIŞTIR Button */}
              <button
                type="button"
                id="devrim-ignite-button"
                onClick={handleIgnition}
                disabled={isStartingEngine || isEngineRunning}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: '16px',
                  border: isEngineRunning
                    ? '2px solid #10B981'
                    : isStartingEngine
                    ? '2px solid #F59E0B'
                    : '2px solid #F59E0B',
                  background: isEngineRunning
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                    : isStartingEngine
                    ? 'linear-gradient(135deg, #D97706 0%, #B45309 100%)'
                    : 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #D97706 100%)',
                  color: isEngineRunning ? '#FFFFFF' : '#1E1002',
                  boxShadow: isEngineRunning
                    ? '0 0 30px rgba(16, 185, 129, 0.6)'
                    : '0 8px 25px rgba(245, 158, 11, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                  cursor: isEngineRunning || isStartingEngine ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  fontSize: '17px',
                  fontWeight: '900',
                  letterSpacing: '1px',
                  transition: 'all 0.25s ease',
                  minHeight: '56px',
                  pointerEvents: 'auto',
                }}
                onMouseEnter={e => {
                  if (!isStartingEngine && !isEngineRunning) {
                    e.currentTarget.style.transform = 'scale(1.03)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(245, 158, 11, 0.7)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isStartingEngine && !isEngineRunning) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.5)';
                  }
                }}
              >
                <span style={{ fontSize: '22px' }}>
                  {isEngineRunning ? '✓' : isStartingEngine ? '⚙️' : '⚡'}
                </span>
                <span>
                  {isEngineRunning
                    ? '✓ ÇALIŞIYOR'
                    : isStartingEngine
                    ? 'MARŞ BASILIYOR...'
                    : 'MOTORU ÇALIŞTIR'}
                </span>
              </button>

              <span
                style={{
                  fontSize: '12px',
                  color: isEngineRunning ? '#10B981' : '#CBD5E1',
                  fontWeight: '600',
                  marginTop: '12px',
                  textAlign: 'center',
                }}
              >
                {isEngineRunning
                  ? "Devrim'in motoru başarıyla çalıştırıldı!"
                  : 'Kontağa bas ve motoru çalıştır!'}
              </span>
            </div>
          )}

          {/* STEP 5: TEBRİKLER & SONRAKİ BÖLÜM BUTONU */}
          {currentStep === 5 && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.92)',
                border: '2px solid #10B981',
                borderRadius: '18px',
                padding: '24px 20px',
                boxShadow: '0 16px 36px rgba(0,0,0,0.6)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* Working Green Badge */}
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  border: '3px solid #10B981',
                  background: 'radial-gradient(circle, #059669 0%, #064E3B 100%)',
                  boxShadow: '0 0 30px rgba(16, 185, 129, 0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '26px' }}>⚡</span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '900',
                    color: '#A7F3D0',
                    letterSpacing: '0.5px',
                  }}
                >
                  ÇALIŞIYOR
                </span>
              </div>

              <div
                style={{
                  color: '#FDE68A',
                  fontSize: '18px',
                  fontWeight: '900',
                  marginTop: '12px',
                }}
              >
                Tebrikler!
              </div>
              <p
                style={{
                  color: '#E2E8F0',
                  fontSize: '12px',
                  textAlign: 'center',
                  margin: '4px 0 16px 0',
                }}
              >
                Devrim'in motorunu başarıyla çalıştırdın.
              </p>

              {/* Next Chapter CTA Button */}
              <button
                onClick={handleCompleteAndNext}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #D97706 100%)',
                  color: '#291705',
                  fontSize: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(245, 158, 11, 0.5)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Sonraki Bölüme Geç →
              </button>
            </div>
          )}
        </div>
      </main>

      {/* =========================================================================
          BOTTOM FOOTER: KAŞİF DIALOGUE & 5-STEP PROGRESS BAR
          ========================================================================= */}
      <footer
        style={{
          position: 'relative',
          zIndex: 20,
          background: 'rgba(7, 11, 20, 0.88)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(245, 158, 11, 0.25)',
          padding: '10px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Kaşif Avatar & Speech Bubble */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '380px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#F59E0B',
              border: '2px solid #FEF08A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            🧭
          </div>
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '12px',
              padding: '6px 12px',
              fontSize: '12px',
              color: '#BAE6FD',
              lineHeight: '1.4',
            }}
          >
            {stepConfig.kasifMessage}
          </div>
        </div>

        {/* Center: 5-Step Progress Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {[
            { num: 1, label: 'Tanış' },
            { num: 2, label: 'Kaput' },
            { num: 3, label: 'İnşa Et' },
            { num: 4, label: 'Çalıştır' },
            { num: 5, label: 'Tamamla' },
          ].map(s => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <div
                key={s.num}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: isCompleted
                      ? '#10B981'
                      : isCurrent
                      ? '#F59E0B'
                      : 'rgba(51, 65, 85, 0.6)',
                    border: isCurrent ? '2px solid #FEF08A' : 'none',
                    color: isCompleted || isCurrent ? '#0F172A' : '#94A3B8',
                    fontSize: '13px',
                    fontWeight: '900',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isCurrent ? '0 0 12px #F59E0B' : 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {isCompleted ? '✓' : s.num}
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: isCurrent ? '800' : '600',
                    color: isCurrent ? '#FDE68A' : isCompleted ? '#A7F3D0' : '#64748B',
                  }}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: Atatürk Quote & Signature */}
        <div style={{ textAlign: 'right', maxWidth: '320px' }}>
          <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#94A3B8' }}>
            {ATATURK_QUOTE_DEVRIM.quote}
          </div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#F59E0B',
              fontFamily: "'Cinzel', Georgia, serif",
              marginTop: '2px',
            }}
          >
            {ATATURK_QUOTE_DEVRIM.author}
          </div>
        </div>
      </footer>
    </div>
  );
};
