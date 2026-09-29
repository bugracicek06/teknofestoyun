import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DEVRIM_STEPS, ATATURK_QUOTE_DEVRIM, DEVRIM_ENGINE_PARTS } from '../../data/devrimData';
import { DevrimEngineAssembly } from './DevrimEngineAssembly';
import { SoundFx } from '../../game/utils/audio';
import { GameStore } from '../../game/state/GameStore';
import { EventBus } from '../../game/state/EventBus';
import { calculateResult } from '../../game/systems/scoring';
import { GameTopBar, GameAssistant } from '../game-ui';

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
  onHome: _onHome,
  onBack,
  onToggleAudio,
  onHelp,
  onPause,
  onToggleFullscreen,
}) => {
  // Step State: 1 = Tanış, 2 = Kaput, 3 = İnşa Et, 4 = Çalıştır, 5 = Tamamla
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Mechanical hood opening animation state (Step 1 -> Step 2)
  const [isOpeningHood, setIsOpeningHood] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  const handleHelpToggle = () => {
    setAssistantOpen((prev) => !prev);
    onHelp?.();
  };

  // Etap değiştiğinde asistan tüyo balonunu otomatik kapat
  useEffect(() => {
    setAssistantOpen(false);
  }, [currentStep]);

  // Step 4 Ignition State
  const [isStartingEngine, setIsStartingEngine] = useState(false);
  const [isEngineRunning, setIsEngineRunning] = useState(false);

  // Step 5 Car Driving Animation State: 'idle' -> 'driving' -> 'completed'
  const [step5Phase, setStep5Phase] = useState<'idle' | 'driving' | 'completed'>('idle');
  const step5StartedRef = useRef<boolean>(false);
  const step5Timer1Ref = useRef<number | null>(null);
  const step5Timer2Ref = useRef<number | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const completedRef = useRef<boolean>(false);

  const ignitionTimer1Ref = useRef<number | null>(null);
  const ignitionTimer2Ref = useRef<number | null>(null);
  const ignitionTimer3Ref = useRef<number | null>(null);
  const hoodTimerRef = useRef<number | null>(null);

  // Clean up any pending ignition timers on unmount
  useEffect(() => {
    return () => {
      const t1 = ignitionTimer1Ref.current;
      const t2 = ignitionTimer2Ref.current;
      const t3 = ignitionTimer3Ref.current;
      const tHood = hoodTimerRef.current;
      const tStep5_1 = step5Timer1Ref.current;
      const tStep5_2 = step5Timer2Ref.current;
      if (t1) window.clearTimeout(t1);
      if (t2) window.clearTimeout(t2);
      if (t3) window.clearTimeout(t3);
      if (tHood) window.clearTimeout(tHood);
      if (tStep5_1) window.clearTimeout(tStep5_1);
      if (tStep5_2) window.clearTimeout(tStep5_2);
    };
  }, []);

  // Step 2: Brief transition (~1100ms) with open hood and Kaşif speech, then auto-advance to Step 3
  useEffect(() => {
    if (currentStep === 2) {
      const timer = window.setTimeout(() => {
        setCurrentStep(3);
      }, 1100);
      return () => window.clearTimeout(timer);
    }
  }, [currentStep]);

  // Step 5: Realistic Vehicle Departure Animation sequence
  useEffect(() => {
    if (currentStep === 5 && !step5StartedRef.current) {
      step5StartedRef.current = true;
      setStep5Phase('idle');

      // 1. Play warm ignition purr at start
      SoundFx.playCarStart?.();

      // 2. Wait ~850ms, then start driving
      step5Timer1Ref.current = window.setTimeout(() => {
        setStep5Phase('driving');
        SoundFx.playCarDrive?.();

        // 3. After 3.0s car departure finishes, show celebration card
        step5Timer2Ref.current = window.setTimeout(() => {
          setStep5Phase('completed');
          SoundFx.playVictoryFanfare?.();
        }, 3000);
      }, 850);
    }
  }, [currentStep]);

  const stepConfig = DEVRIM_STEPS[currentStep];

  // Step 1: User taps the Hotspot on the Hood
  const handleOpenHood = useCallback(() => {
    if (isOpeningHood || currentStep !== 1) return;
    setIsOpeningHood(true);

    // Play authentic mechanical release SFX
    if (SoundFx.playLockSound) {
      SoundFx.playLockSound();
    } else if (SoundFx.playLeverPull) {
      SoundFx.playLeverPull();
    } else {
      SoundFx.playClickTone?.();
    }

    // Smooth cinematic crossfade transition: 750ms
    hoodTimerRef.current = window.setTimeout(() => {
      setCurrentStep(2);
      setIsOpeningHood(false);
      SoundFx.playClickTone?.();
    }, 750);
  }, [isOpeningHood, currentStep]);


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
        width: '100%',
        height: '100%',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#050811',
        color: '#FFFFFF',
        fontFamily: "'Outfit', 'Segoe UI', sans-serif",
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* =========================================================================
          1960s WORKSHOP ATMOSPHERE BACKGROUND
          ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/assets/devrim/devrim_workshop_bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: currentStep === 3 ? 'brightness(0.55) blur(1px)' : 'brightness(0.68) saturate(1.1) blur(1.5px)',
          transition: 'filter 0.6s ease',
          zIndex: 1,
        }}
      />

      {/* Cinematic Workshop Vignette & Lighting Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 60% 50%, transparent 35%, rgba(6, 10, 18, 0.45) 70%, rgba(3, 6, 12, 0.88) 100%)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Warm Tungsten Spotlight on Automobile Stage */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 58% 46%, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.04) 50%, transparent 75%)',
          zIndex: 3,
          pointerEvents: 'none',
          animation: 'devrimTungstenFlicker 6s infinite ease-in-out',
        }}
      />

      {/* =========================================================================
          TOP HUD BAR (Compact, Modern Museum Kiosk Header)
          ========================================================================= */}
      {/* STANDARDIZED TOP BAR */}
      <GameTopBar
        moduleNumber={4}
        moduleTitle="Bilim ve Sanayileşme"
        moduleSubtitle="Geleceği Üreten Türkiye"
        missionTitle={
          currentStep === 1
            ? 'Kaputa dokunarak motor bölmesini aç'
            : currentStep === 2
            ? 'Motor bölmesini incele ve parçaları hazırla'
            : currentStep === 3
            ? 'Motor parçalarını doğru yuvalarına yerleştir'
            : currentStep === 4
            ? 'Kontağa dokun ve motoru çalıştır'
            : 'Devrim yola çıkıyor, üretimin gururunu yaşa'
        }
        progressText={`${currentStep} / 5`}
        accentKey="sanayilesme"
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
          currentStep === 1
            ? "Devrim'in motorunu keşfetmek için kaput mandalına dokun."
            : currentStep === 2
            ? 'Harika! Şimdi motor parçalarını gövdeye yerleştirelim.'
            : currentStep === 3
            ? 'Motor parçalarını doğru yuvalarına sürükleyerek montajı tamamla.'
            : currentStep === 4
            ? "Montaj tamamlandı! Kontağa bas ve Devrim'in motorunu çalıştır."
            : 'Geleceği üreten mühendislerimizin mirası seninle yaşıyor!'
        }
        isOpen={assistantOpen}
        onToggle={setAssistantOpen}
        placement="bottom-left"
        accentKey="sanayilesme"
      />

      {/* =========================================================================
          CINEMATIC STEP MISSION TITLE (Floating Minimal Backdrop, No Big Box)
          ========================================================================= */}
      <div
        style={{
          position: 'relative',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '6px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            color: '#F5A400',
            fontSize: '11px',
            fontWeight: '900',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            textShadow: '0 0 14px rgba(245, 164, 0, 0.7)',
            marginBottom: '2px',
          }}
        >
          {currentStep}. ADIM
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              height: '1.5px',
              width: '50px',
              background: 'linear-gradient(90deg, transparent, #F5A400)',
            }}
          />
          <h2
            style={{
              fontSize: '24px',
              fontWeight: '900',
              letterSpacing: '1.5px',
              color: '#FFFFFF',
              margin: 0,
              textShadow: '0 2px 14px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)',
              textTransform: 'uppercase',
            }}
          >
            {currentStep === 1 ? 'DEVRİM İLE TANIŞ' : stepConfig.title}
          </h2>
          <div
            style={{
              height: '1.5px',
              width: '50px',
              background: 'linear-gradient(90deg, #F5A400, transparent)',
            }}
          />
        </div>
        <div
          style={{
            color: '#CBD5E1',
            fontSize: '13px',
            fontWeight: '500',
            letterSpacing: '0.4px',
            marginTop: '2px',
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}
        >
          {currentStep === 1 ? "Türkiye'nin ilk yerli ve millî otomobili." : stepConfig.subTitle}
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: currentStep === 3 ? 'center' : 'space-between',
          padding: currentStep === 3 ? '0 16px' : '0 clamp(12px, 2vw, 28px)',
          paddingBottom: currentStep === 3 ? '6px' : 'clamp(52px, 7vh, 72px)',
          gap: currentStep === 3 ? '0' : 'clamp(10px, 1.8vw, 24px)',
          maxHeight: 'calc(100% - 70px)',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* -----------------------------------------------------------------------
            LEFT: SLEEK GAME MISSION PANEL & KAŞİF MASCOT (Steps 1, 2, 4, 5)
            ----------------------------------------------------------------------- */}
        {currentStep !== 3 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(8px, 1.2vh, 14px)',
              width: currentStep === 4 ? 'clamp(230px, 18vw, 280px)' : 'clamp(260px, 22vw, 310px)',
              flexShrink: 0,
              justifyContent: 'center',
              zIndex: 15,
            }}
          >
            {/* Game Mission Panel */}
            <div
              style={{
                position: 'relative',
                background: 'rgba(8, 14, 26, 0.85)',
                border: '1.5px solid rgba(245, 164, 0, 0.35)',
                borderRadius: '16px',
                padding: '18px 20px',
                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Header: 1961 Pill Badge & Vintage Sedan SVG Icon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div
                  style={{
                    padding: '3px 12px',
                    borderRadius: '9999px',
                    background: 'rgba(245, 164, 0, 0.2)',
                    border: '1.2px solid rgba(245, 164, 0, 0.55)',
                    color: '#FEF08A',
                    fontSize: '12px',
                    fontWeight: '900',
                    letterSpacing: '1px',
                  }}
                >
                  1961
                </div>
                <svg width="30" height="18" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M3 13L5 7C5.5 5.5 7 4 9 4H20C22 4 23.5 5.5 24.5 7L27 13M3 13H29M3 13C2 13 1 14 1 15V16C1 16.5 1.5 17 2 17H5M29 13C30 13 31 14 31 15V16C31 16.5 30.5 17 30 17H27M5 17C5 18.5 6.5 19.5 8 19.5C9.5 19.5 11 18.5 11 17M27 17C27 18.5 25.5 19.5 24 19.5C22.5 19.5 21 18.5 21 17M11 17H21"
                    stroke="#FFFFFF"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="8" cy="17" r="1.5" fill="#FFFFFF" />
                  <circle cx="24" cy="17" r="1.5" fill="#FFFFFF" />
                  <path d="M15 6V13" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>

              <div>
                <h1
                  style={{
                    fontSize: '24px',
                    fontWeight: '900',
                    letterSpacing: '1.2px',
                    color: '#FFFFFF',
                    margin: '0 0 2px 0',
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                  }}
                >
                  DEVRİM
                </h1>
                <p
                  style={{
                    fontSize: '12.5px',
                    color: '#F5A400',
                    fontWeight: '700',
                    margin: 0,
                    letterSpacing: '0.2px',
                  }}
                >
                  Türkiye'nin ilk yerli otomobili.
                </p>
              </div>

              <p
                style={{
                  fontSize: '12px',
                  color: '#CBD5E1',
                  lineHeight: '1.5',
                  margin: 0,
                }}
              >
                Türk mühendis ve işçilerinin emeğiyle geliştirilen Devrim, ülkemizin üretim gücünün sembollerindendir.
              </p>

              {/* Decorative Divider */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: 0.5,
                  margin: '2px 0',
                }}
              >
                <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, transparent, #F5A400)' }} />
                <span style={{ color: '#F5A400', fontSize: '10px' }}>✦</span>
                <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, #F5A400, transparent)' }} />
              </div>

              {/* Compact Mission Goal Box */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(245, 164, 0, 0.3)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div
                  style={{
                    color: '#F5A400',
                    fontSize: '11px',
                    fontWeight: '900',
                    letterSpacing: '1px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>🎯</span>
                  <span>GÖREV</span>
                </div>
                <div
                  style={{
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: '700',
                    lineHeight: '1.4',
                  }}
                >
                  {currentStep === 1 && "Devrim'in motorunu keşfet."}
                  {currentStep === 2 && 'Motor bölmesi açılıyor...'}
                  {currentStep === 4 && 'Kontağa bas ve motoru çalıştır.'}
                  {currentStep === 5 && (step5Phase === 'completed' ? 'Devrim başarıyla yola çıktı!' : 'Devrim motoru başarıyla çalıştırıldı!')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            CENTER / STAGE: DEVRİM AUTOMOBILE (Step 1, 2, 4, 5) OR ASSEMBLY GAME (Step 3)
            ----------------------------------------------------------------------- */}
        {currentStep === 3 ? (
          /* Step 3: Pure Child-Friendly Drag & Drop Motor Montaj Sahnesi */
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DevrimEngineAssembly onComplete={handleAssemblyComplete} />
          </div>
        ) : (
          /* Steps 1, 2, 4, 5: Interactive Museum Vehicle Scene */
          <div
            style={{
              position: 'relative',
              flex: 1,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 10px',
              overflow: 'visible',
            }}
          >
            {/* If Step 5 and car has completed departure, show Centered Celebration Card */}
            {currentStep === 5 && step5Phase === 'completed' ? (
              <div
                style={{
                  position: 'relative',
                  background: 'rgba(8, 14, 26, 0.94)',
                  border: '2px solid #10B981',
                  borderRadius: '24px',
                  padding: '34px 40px',
                  boxShadow: '0 24px 60px rgba(0,0,0,0.85), 0 0 35px rgba(16, 185, 129, 0.4)',
                  backdropFilter: 'blur(16px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  maxWidth: '440px',
                  animation: 'devrimModalPop 320ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                  zIndex: 25,
                }}
              >
                {/* Big Green Check Badge */}
                <div
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
                    border: '3px solid #6EE7B7',
                    boxShadow: '0 0 25px rgba(16, 185, 129, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontSize: '36px',
                    fontWeight: '900',
                    marginBottom: '16px',
                  }}
                >
                  ✓
                </div>

                <h2
                  style={{
                    fontSize: '26px',
                    fontWeight: '900',
                    color: '#FEF08A',
                    letterSpacing: '1.2px',
                    margin: '0 0 8px 0',
                    textTransform: 'uppercase',
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                  }}
                >
                  DEVRİM YOLLARDA!
                </h2>

                <p
                  style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#E2E8F0',
                    lineHeight: '1.5',
                    margin: '0 0 24px 0',
                  }}
                >
                  Harika iş çıkardın!
                  <br />
                  Devrim’i başarıyla hazırladın.
                </p>

                <button
                  type="button"
                  onClick={handleCompleteAndNext}
                  style={{
                    width: '100%',
                    padding: '16px 28px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #FDE68A 0%, #F5A400 50%, #D97706 100%)',
                    color: '#291705',
                    fontSize: '17px',
                    fontWeight: '900',
                    letterSpacing: '0.8px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(245, 164, 0, 0.55)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  SONRAKİ BÖLÜME GEÇ →
                </button>
              </div>
            ) : (
              /* The Car Container */
              <div
                className={currentStep === 5 && step5Phase === 'driving' ? 'devrim-car-departing' : ''}
                style={{
                  position: 'relative',
                  width:
                    currentStep === 1
                      ? 'min(1000px, 64vw)'
                      : currentStep === 4
                      ? 'min(760px, calc(100vw - clamp(230px, 18vw, 280px) - clamp(220px, 18vw, 270px) - clamp(40px, 5vw, 80px)))'
                      : 'min(880px, 56vw)',
                  maxHeight: currentStep === 4 ? 'clamp(240px, 48vh, 480px)' : '62vh',
                  aspectRatio: '1376 / 768',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: isOpeningHood ? 'scale(1.03)' : 'scale(1)',
                  transition: 'transform 750ms cubic-bezier(0.25, 1, 0.5, 1), width 0.4s ease',
                  marginLeft: currentStep === 1 ? '35px' : '0',
                  animation:
                    currentStep === 5 && step5Phase === 'driving'
                      ? 'devrimCarDeparture 3.0s cubic-bezier(0.25, 0.1, 0.25, 1) forwards'
                      : isStartingEngine || (currentStep === 5 && step5Phase === 'idle')
                      ? 'devrimEngineVibrate 0.1s infinite'
                      : 'none',
                  willChange: 'transform',
                }}
              >
                {/* Natural Realistic Workshop Floor Contact Shadow (Moves with car) */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10%',
                    left: '12%',
                    width: '78%',
                    height: '38px',
                    borderRadius: '50%',
                    background:
                      'radial-gradient(ellipse at 50% 50%, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.45) 50%, transparent 80%)',
                    filter: 'blur(8px)',
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />

                {/* Base Open Car Image (Step 2, 4 and during Hood Opening) */}
                <img
                  src="/assets/devrim/devrim_car_open_clean.png"
                  alt="Devrim Otomobili Motor Bölmesi"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    zIndex: 5,
                    opacity: (currentStep === 2 || currentStep === 4 || isOpeningHood) ? 1 : 0,
                    transition: 'opacity 0.65s ease',
                    pointerEvents: 'none',
                  }}
                />

                {/* Base Closed Car Image (Step 1 and Step 5 Road Departure) */}
                <img
                  src="/assets/devrim/devrim_car_closed_clean.png"
                  alt="Devrim Otomobili 1961"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    zIndex: 6,
                    opacity: ((currentStep === 1 && !isOpeningHood) || currentStep === 5) ? 1 : 0,
                    transition: 'opacity 0.65s ease',
                    pointerEvents: 'none',
                  }}
                />

                {/* STEP 1: INTERACTIVE HOTSPOT ON THE HOOD */}
                {currentStep === 1 && !isOpeningHood && (
                  <div
                    className="devrim-hood-hotspot"
                    style={{
                      left: '37%',
                      top: '49%',
                      transform: 'translate(-50%, -50%)',
                    }}
                    onClick={handleOpenHood}
                    role="button"
                    tabIndex={0}
                    aria-label="Kaputa Dokun"
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') handleOpenHood();
                    }}
                  >
                    <div className="devrim-hood-badge">
                      <span>Kaputa Dokun</span>
                    </div>
                    <div className="devrim-hood-ring-wrapper">
                      <div className="devrim-hood-ring-pulse" />
                      <div className="devrim-hood-ring" />
                      <span className="devrim-hood-hand">👆</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* -----------------------------------------------------------------------
            RIGHT: STEP ACTIONS & CONTROLS (Only visible in Step 4)
            ----------------------------------------------------------------------- */}
        {currentStep === 4 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(8px, 1.2vh, 14px)',
              width: 'clamp(220px, 18vw, 270px)',
              flexShrink: 0,
              justifyContent: 'center',
              zIndex: 15,
            }}
          >
            <div
              style={{
                background: 'rgba(8, 14, 26, 0.94)',
                border: '2px solid rgba(245, 164, 0, 0.55)',
                borderRadius: '16px',
                padding: 'clamp(12px, 1.5vh, 18px) clamp(12px, 1.2vw, 16px)',
                boxShadow: '0 16px 36px rgba(0,0,0,0.65)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 14px',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.18)',
                  border: '1.5px solid #10B981',
                  color: '#A7F3D0',
                  fontSize: 'clamp(11px, 0.9vw, 13px)',
                  fontWeight: '900',
                  letterSpacing: '1.2px',
                  marginBottom: 'clamp(6px, 1vh, 10px)',
                  boxShadow: '0 0 16px rgba(16, 185, 129, 0.3)',
                }}
              >
                <span>✓</span> MOTOR HAZIR
              </div>

              <div
                style={{
                  color: '#F5A400',
                  fontSize: '11px',
                  fontWeight: '800',
                  letterSpacing: '0.8px',
                  marginBottom: '6px',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                MONTE EDİLEN PARÇALAR
              </div>

              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  marginBottom: 'clamp(8px, 1.5vh, 14px)',
                }}
              >
                {DEVRIM_ENGINE_PARTS.map(part => (
                  <div
                    key={part.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: 'clamp(10.5px, 0.8vw, 11.5px)',
                      color: '#A7F3D0',
                      fontWeight: '600',
                      background: 'rgba(16, 185, 129, 0.08)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <span style={{ color: '#10B981', fontWeight: '900' }}>✓</span>
                    <span>{part.name}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                id="devrim-ignite-button"
                onClick={handleIgnition}
                disabled={isStartingEngine || isEngineRunning}
                style={{
                  width: '100%',
                  padding: 'clamp(10px, 1.4vh, 14px) 14px',
                  borderRadius: '12px',
                  border: isEngineRunning
                    ? '2px solid #10B981'
                    : '2px solid #F5A400',
                  background: isEngineRunning
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                    : isStartingEngine
                    ? 'linear-gradient(135deg, #D97706 0%, #B45309 100%)'
                    : 'linear-gradient(135deg, #FDE68A 0%, #F5A400 50%, #D97706 100%)',
                  color: isEngineRunning ? '#FFFFFF' : '#1E1002',
                  boxShadow: isEngineRunning
                    ? '0 0 30px rgba(16, 185, 129, 0.6)'
                    : '0 8px 25px rgba(245, 164, 0, 0.5)',
                  cursor: isEngineRunning || isStartingEngine ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: 'clamp(12px, 0.95vw, 14px)',
                  fontWeight: '900',
                  letterSpacing: '0.8px',
                  transition: 'all 0.25s ease',
                  minHeight: '48px',
                  whiteSpace: 'nowrap',
                  boxSizing: 'border-box',
                  touchAction: 'manipulation',
                }}
              >
                <span style={{ fontSize: '18px' }}>
                  {isEngineRunning ? '✓' : isStartingEngine ? '⚙' : '⚡'}
                </span>
                <span>
                  {isEngineRunning
                    ? '✓ ÇALIŞIYOR'
                    : isStartingEngine
                    ? 'MARŞ BASILIYOR...'
                    : 'MOTORU ÇALIŞTIR'}
                </span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          BOTTOM CENTER FLOATING 5-STEP PROGRESS DOCK
          ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          bottom: 'clamp(10px, 1.8vh, 18px)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          background: 'rgba(8, 14, 26, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '9999px',
          padding: '6px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.6), 0 0 16px rgba(245, 164, 0, 0.15)',
        }}
      >
        {[
          { num: 1, label: 'TANIŞ' },
          { num: 2, label: 'KAPUT' },
          { num: 3, label: 'İNŞA ET' },
          { num: 4, label: 'ÇALIŞTIR' },
          { num: 5, label: 'TAMAMLA' },
        ].map((s, idx) => {
          const isCompleted = currentStep > s.num;
          const isCurrent = currentStep === s.num;

          return (
            <React.Fragment key={s.num}>
              {idx > 0 && (
                <div
                  style={{
                    width: '32px',
                    height: '2px',
                    background: currentStep > idx
                      ? '#10B981'
                      : 'rgba(255, 255, 255, 0.18)',
                    transition: 'background 0.4s ease',
                  }}
                />
              )}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
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
                      ? 'linear-gradient(135deg, #F5A400 0%, #D97706 100%)'
                      : 'rgba(255, 255, 255, 0.08)',
                    border: isCurrent
                      ? '2px solid #FEF08A'
                      : isCompleted
                      ? '1.5px solid #6EE7B7'
                      : '1.5px solid rgba(255, 255, 255, 0.2)',
                    color: isCompleted ? '#FFFFFF' : isCurrent ? '#0F172A' : '#94A3B8',
                    fontSize: '12px',
                    fontWeight: '900',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isCurrent
                      ? '0 0 16px rgba(245, 164, 0, 0.9)'
                      : isCompleted
                      ? '0 0 10px rgba(16, 185, 129, 0.5)'
                      : 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {isCompleted ? '✓' : s.num}
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: isCurrent ? '900' : '700',
                    color: isCurrent ? '#F5A400' : isCompleted ? '#A7F3D0' : '#64748B',
                    letterSpacing: '0.6px',
                  }}
                >
                  {s.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Subtle Atatürk Quote & Signature (Bottom Right Floating) */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '24px',
          textAlign: 'right',
          maxWidth: '280px',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: '10.5px', fontStyle: 'italic', color: '#94A3B8', lineHeight: '1.35' }}>
          {ATATURK_QUOTE_DEVRIM.quote}
        </div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#F5A400',
            marginTop: '2px',
          }}
        >
          {ATATURK_QUOTE_DEVRIM.author}
        </div>
      </div>
    </div>
  );
};
