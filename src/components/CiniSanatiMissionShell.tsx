import React, { useState, useRef } from 'react';
import {
  CINI_OBJECTS,
  CINI_MOTIFS,
  CINI_COLORS,
  STEP_QUOTES,
  type CiniObject,
  type CiniMotif,
  type CiniColor,
} from '../data/ciniData';
import { CiniObjectRenderer } from './cini/CiniObjectRenderer';
import { ArtisanHandBrush } from './cini/ArtisanHandBrush';
import { MotifCardPreview } from './cini/CiniMotifSVGs';
import { SoundFx } from '../game/utils/audio';
import { GameStore } from '../game/state/GameStore';
import { calculateResult } from '../game/systems/scoring';
import { EventBus } from '../game/state/EventBus';
import ciniWorkshopBg from '../assets/cini_workshop_bg.jpg';

interface CiniSanatiMissionShellProps {
  isAudioMuted: boolean;
  fullscreen: boolean;
  onHome: () => void;
  onBack: () => void;
  onToggleAudio: () => void;
  onHelp: () => void;
  onPause: () => void;
  onToggleFullscreen: () => void;
}

export const CiniSanatiMissionShell: React.FC<CiniSanatiMissionShellProps> = ({
  isAudioMuted,
  fullscreen,
  onHome,
  onBack,
  onToggleAudio,
  onHelp,
  onPause,
  onToggleFullscreen,
}) => {
  // Current Step: 1 = Eser Seç, 2 = Desen Seç, 3 = Renk Seç, 4 = Deseni Uygula, 5 = Tamamla
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Selected State
  const [selectedObjectId, setSelectedObjectId] = useState<'tabak' | 'vazo' | 'karo'>('tabak');
  const [selectedMotifId, setSelectedMotifId] = useState<'lale' | 'karanfil' | 'rumi' | 'hatayi' | 'geometrik' | 'yaprak'>('lale');
  const [primaryColorId, setPrimaryColorId] = useState<string>('kobalt');
  const [secondaryColorId, setSecondaryColorId] = useState<string>('mercan');
  const [colorLayerTarget, setColorLayerTarget] = useState<'primary' | 'secondary'>('primary');

  // Step 4 Painting Progress State (Zones 0..5)
  const [paintedZones, setPaintedZones] = useState<number[]>([]);
  const [brushPos, setBrushPos] = useState<{ x: number; y: number }>({ x: 440, y: 340 });
  const [isBrushPainting, setIsBrushPainting] = useState<boolean>(false);

  const workpieceContainerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const completedRef = useRef<boolean>(false);

  // Lookups
  const selectedObject: CiniObject =
    CINI_OBJECTS.find((o) => o.id === selectedObjectId) || CINI_OBJECTS[0];
  const selectedMotif: CiniMotif =
    CINI_MOTIFS.find((m) => m.id === selectedMotifId) || CINI_MOTIFS[0];
  const primaryColor: CiniColor =
    CINI_COLORS.find((c) => c.id === primaryColorId) || CINI_COLORS[0];
  const secondaryColor: CiniColor =
    CINI_COLORS.find((c) => c.id === secondaryColorId) || CINI_COLORS[2];

  // Navigation handlers
  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      SoundFx.playSuccessTone();
    } else if (currentStep === 2) {
      setCurrentStep(3);
      SoundFx.playSuccessTone();
    } else if (currentStep === 3) {
      setCurrentStep(4);
      setPaintedZones([]);
      setBrushPos({ x: 440, y: 340 });
      SoundFx.playSuccessTone();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1 && currentStep < 5) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
      SoundFx.playSuccessTone();
    } else if (currentStep === 1) {
      onBack();
    }
  };

  // Step 4: User taps an interactive zone on the artwork
  const handlePaintZone = (zoneIndex: number, clientX: number, clientY: number) => {
    if (isBrushPainting || paintedZones.includes(zoneIndex)) return;

    // Move brush tip precisely to the tapped position within the workpiece container
    const rect = workpieceContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    setBrushPos({ x: relativeX, y: relativeY });
    setIsBrushPainting(true);
    SoundFx.playStoneDrag();

    setTimeout(() => {
      setIsBrushPainting(false);
      setPaintedZones((prev) => {
        if (prev.includes(zoneIndex)) return prev;
        const next = [...prev, zoneIndex];
        // If all 6 zones are completed, transition smoothly to Step 5!
        if (next.length === 6) {
          setTimeout(() => {
            setCurrentStep(5);
            SoundFx.playSuccessTone();
          }, 800);
        }
        return next;
      });
    }, 650);
  };

  // Step 5: "Tekrar Tasarla"
  const handleResetDesign = () => {
    setCurrentStep(1);
    setPaintedZones([]);
    completedRef.current = false;
    SoundFx.playSuccessTone();
  };

  // Step 5: "Eserimi Kaydet ve Devam Et →"
  const handleFinalizeAndContinue = () => {
    if (completedRef.current) return;
    completedRef.current = true;

    const elapsedSec = Math.max(10, Math.round((Date.now() - startTimeRef.current) / 1000));
    const choices = {
      Eser: selectedObject.name,
      Motif: selectedMotif.name,
      'Ana Renk': primaryColor.name,
      'İkinci Renk': secondaryColor.name,
      Sanat: 'Anadolu Çini Sanatı',
    };

    const stats = calculateResult(elapsedSec, 0, choices);
    GameStore.completeModule('anadolu_ustaligi');
    GameStore.saveResult('anadolu_ustaligi', stats);
    EventBus.emit('mission-result', 'anadolu_ustaligi');
  };

  // Dynamic Left Parchment Content per Step
  const getParchmentContent = () => {
    switch (currentStep) {
      case 1:
        return {
          subtitle: 'Renklerin ve Motiflerin Mirası',
          body: 'Anadolu’da çini sanatı, günlük hayatı güzelleştiren, kültürümüzü yüzyıllardır süsleyen eşsiz bir mirastır.',
          callout: 'Önce yapmak istediğin çini eserini seç. Sonra desenini ve renklerini belirle, eserini hayata geçir!',
        };
      case 2:
        return {
          subtitle: 'Desenlerin Dili',
          body: 'Anadolu çini sanatında her motifin bir anlamı vardır. Lale, karanfil, hayatı ve güzelliği; rumi, sonsuzluğu; hatayi ise doğanın zarafetini temsil eder.',
          callout: 'Beğendiğin deseni seç, sonraki adımda renklerini belirle!',
        };
      case 3:
        return {
          subtitle: 'Renklerin Büyüsü',
          body: 'Anadolu çinilerinde her renk bir anlam taşır. Mavi huzuru, kırmızı yaşamı, yeşil doğayı, beyaz ise saflığı temsil eder.',
          callout: 'Seçtiğin desen şimdi renklerle hayat bulacak! Geleneksel Anadolu renklerinden ilham al.',
        };
      case 4:
        return {
          subtitle: 'Ustalık ve Sabır',
          body: 'Seçtiğin desen ve renklerle çini eserini şimdi hayata geçir! Usta ellerin izinden giderek, deseni eserine işle.',
          callout: 'Geleneksel sanat, sabır ve özenle hayat bulur.',
        };
      case 5:
        return {
          subtitle: 'Geleceğe Bırakılan İz',
          body: 'Anadolu çini sanatında her desen, geçmişten bugüne uzanan bir hikâye taşır. Kendi tasarladığın bu eserle sen de bu hikâyenin bir parçası oldun.',
          callout: 'Geleneksel sanat, sabır ve özenle hayat bulur.',
        };
    }
  };

  const parchment = getParchmentContent();
  const progressPercent = Math.round((paintedZones.length / 6) * 100);

  return (
    <div
      className="cini-sanati-shell"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url(${ciniWorkshopBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        userSelect: 'none',
        overflow: 'hidden',
        fontFamily: "'Outfit', 'Segoe UI', sans-serif",
        zIndex: 50,
      }}
    >
      {/* Dark Ambient Vignette Layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.45) 75%, rgba(0,0,0,0.85) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* =========================================================================
          TOP GAME HEADER (Standard Kiosk Controls & Section Title)
          ========================================================================= */}
      <header
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 28px',
          background:
            'linear-gradient(180deg, rgba(10, 16, 28, 0.88) 0%, rgba(10, 16, 28, 0.4) 70%, transparent 100%)',
        }}
      >
        {/* Left: Back & Home Buttons & Section Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handlePrevStep}
            title="Geri Dön"
            aria-label="Geri Dön"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid rgba(255, 255, 255, 0.35)',
              color: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '22px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            ←
          </button>

          <button
            onClick={onHome}
            title="Ana Sayfa"
            aria-label="Ana Sayfaya Dön"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid rgba(255, 255, 255, 0.35)',
              color: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            🏠
          </button>

          {/* Section Title Plaque */}
          <div
            style={{
              padding: '10px 24px',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(10px)',
              border: '1.5px solid rgba(217, 119, 6, 0.65)',
              borderRadius: '9999px',
              color: '#FFFFFF',
              fontSize: '20px',
              fontWeight: '700',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            }}
          >
            <span style={{ color: '#F59E0B', fontWeight: '800' }}>3 / 6</span>
            <span style={{ opacity: 0.5 }}>|</span>
            <span>Anadolu Ustalığı – Ustalığın İzleri</span>
          </div>
        </div>

        {/* Center Top Plaque: Step Banner */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.92)',
            border: '1.5px solid rgba(217, 119, 6, 0.6)',
            borderRadius: '14px',
            padding: '8px 26px',
            textAlign: 'center',
            boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#F59E0B', letterSpacing: '1px' }}>
            {currentStep}. ADIM
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF' }}>
            {currentStep === 1 && 'ÇİNİ ESERİNİ SEÇ'}
            {currentStep === 2 && 'DESEN SEÇ'}
            {currentStep === 3 && 'RENK SEÇ'}
            {currentStep === 4 && 'DESENİ UYGULA'}
            {currentStep === 5 && 'TAMAMLANDI!'}
          </div>
          <div style={{ fontSize: '12px', color: '#CBD5E1', fontStyle: 'italic', marginTop: '2px' }}>
            {currentStep === 1 && 'Hangi eseri tasarlamak istersin?'}
            {currentStep === 2 && `${selectedObject.name} formuna hangi motifi işlemek istersin?`}
            {currentStep === 3 && 'Desenini geleneksel çini renkleriyle boyayalım.'}
            {currentStep === 4 && 'Seçtiğin deseni ve renkleri esere işliyoruz.'}
            {currentStep === 5 && 'Harika! Kendi çini eserini tasarladın.'}
          </div>
        </div>

        {/* Right Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onToggleAudio}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '9999px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
              color: '#F8FAFC',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <span>{isAudioMuted ? '🔇' : '🔊'}</span>
            <span>{isAudioMuted ? 'Ses: Kapalı' : 'Ses: Açık'}</span>
          </button>

          <button
            onClick={onHelp}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '9999px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
              color: '#F8FAFC',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <span>❓</span>
            <span>Yardım</span>
          </button>

          <button
            onClick={onPause}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '9999px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
              color: '#F8FAFC',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <span>⏸</span>
            <span>Duraklat</span>
          </button>

          <button
            onClick={onToggleFullscreen}
            aria-pressed={fullscreen}
            title={fullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '9999px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
              color: '#F8FAFC',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <span>⛶</span>
            <span>{fullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          MAIN WORKSHOP STAGE
          ========================================================================= */}
      <main
        className={`cini-main-grid step-${currentStep}`}
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'grid',
          gridTemplateColumns: currentStep === 1 ? '320px 1fr' : '320px 1fr 400px',
          alignItems: 'center',
          padding: '0 36px',
          gap: '24px',
          maxHeight: 'calc(100% - 150px)',
        }}
      >
        {/* -----------------------------------------------------------------------
            LEFT: PARCHMENT INFO CARD (Common to all 5 stages)
            ----------------------------------------------------------------------- */}
        <div
          className="cini-parchment-card"
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #FBF6E9 0%, #F2E8D2 60%, #E7DAC1 100%)',
            border: '2px solid #9A7B56',
            borderRadius: '16px',
            padding: '26px 22px',
            boxShadow:
              '0 18px 36px rgba(0, 0, 0, 0.45), inset 0 0 40px rgba(180, 130, 80, 0.15)',
            color: '#2A1806',
            maxHeight: '480px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: "'Cinzel', 'Trajan Pro', Georgia, serif",
          }}
        >
          {/* Top Decorative Pin */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '14px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#5B3E25',
              border: '2px solid #D97706',
            }}
          />

          <div style={{ textAlign: 'center', color: '#0047AB', fontSize: '26px' }}>۞</div>

          <div style={{ textAlign: 'center', margin: '6px 0 12px 0' }}>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: '900',
                color: '#1B1204',
                margin: '0 0 4px 0',
                letterSpacing: '1px',
              }}
            >
              ÇİNİ SANATI
            </h1>
            <p
              style={{
                fontSize: '13px',
                fontStyle: 'italic',
                color: '#854D0E',
                margin: 0,
                fontWeight: '600',
              }}
            >
              {parchment.subtitle}
            </p>
          </div>

          <div
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#3B230C',
              textAlign: 'center',
              fontFamily: "'Outfit', 'Segoe UI', sans-serif",
              fontWeight: '500',
            }}
          >
            {parchment.body}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              margin: '12px 0',
              color: '#0047AB',
              fontSize: '16px',
            }}
          >
            <span>—</span>
            <span>۞</span>
            <span>—</span>
          </div>

          <div
            style={{
              fontSize: '13px',
              lineHeight: '1.5',
              color: '#2A1806',
              textAlign: 'center',
              fontWeight: '600',
              fontFamily: "'Outfit', 'Segoe UI', sans-serif",
              background: 'rgba(217, 119, 6, 0.12)',
              borderRadius: '10px',
              padding: '12px 14px',
              border: '1px solid rgba(217, 119, 6, 0.25)',
            }}
          >
            {parchment.callout}
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            CENTER: WORKPIECE DISPLAY (Step 1: 4 Objects Grid | Steps 2-5: Center Piece)
            ----------------------------------------------------------------------- */}
        {currentStep === 1 ? (
          /* STEP 1: 3 ARTWORK OPTIONS GRID (Tabak, Vazo, Karo) */
          <div
            className="cini-step1-stage"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '28px',
              width: '100%',
              maxWidth: '1080px',
              margin: '0 auto',
              padding: '0 20px',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '28px',
                width: '100%',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {CINI_OBJECTS.map((obj) => {
                const isSelected = selectedObjectId === obj.id;
                return (
                  <div
                    key={obj.id}
                    onClick={() => {
                      setSelectedObjectId(obj.id);
                      SoundFx.playClickTone?.();
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '16px',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '1 / 1.05',
                        borderRadius: '22px',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isSelected
                          ? 'radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, rgba(15, 23, 42, 0.7) 75%)'
                          : 'rgba(15, 23, 42, 0.55)',
                        border: isSelected ? '3px solid #F59E0B' : '1.5px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: isSelected
                          ? '0 0 30px rgba(245, 158, 11, 0.55), 0 14px 32px rgba(0,0,0,0.5)'
                          : '0 8px 24px rgba(0,0,0,0.35)',
                        transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                    >
                      {/* Check badge when selected */}
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '14px',
                            right: '14px',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#F59E0B',
                            color: '#1E1002',
                            fontWeight: '900',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                            zIndex: 2,
                          }}
                        >
                          ✓
                        </div>
                      )}
                      <CiniObjectRenderer
                        object={obj}
                        motif={selectedMotif}
                        primaryColor={primaryColor}
                        secondaryColor={secondaryColor}
                        mode="selection"
                        scale={obj.id === 'vazo' ? 0.90 : 0.82}
                      />
                    </div>

                    {/* Object Name Pill Button */}
                    <button
                      type="button"
                      style={{
                        width: '100%',
                        minHeight: '48px',
                        padding: '10px 16px',
                        borderRadius: '9999px',
                        background: isSelected
                          ? 'linear-gradient(135deg, #2D1B08 0%, #170E04 100%)'
                          : 'rgba(15, 23, 42, 0.85)',
                        border: isSelected ? '2px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.25)',
                        color: isSelected ? '#FDE68A' : '#E2E8F0',
                        fontSize: '18px',
                        fontWeight: '800',
                        letterSpacing: '0.5px',
                        boxShadow: isSelected ? '0 0 16px rgba(245, 158, 11, 0.45)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {obj.name}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Confirm & Proceed Button centered under the 3 cards */}
            <button
              onClick={handleNextStep}
              style={{
                marginTop: '10px',
                padding: '16px 48px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #D97706 100%)',
                color: '#291705',
                fontSize: '19px',
                fontWeight: '900',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.5)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              Bu Eseri Seç ve Desene Geç →
            </button>
          </div>
        ) : (
          /* STEPS 2, 3, 4, 5: CENTER WORKPIECE */
          <div
            ref={workpieceContainerRef}
            className="cini-center-workpiece"
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <CiniObjectRenderer
              object={selectedObject}
              motif={selectedMotif}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              mode={
                currentStep === 2
                  ? 'draft'
                  : currentStep === 3
                  ? 'preview'
                  : currentStep === 4
                  ? 'interactive'
                  : 'completed'
              }
              paintedZones={paintedZones}
              onPaintZone={handlePaintZone}
            />

            {/* Step 4: Floating Animated Artisan Hand & Brush */}
            {currentStep === 4 && (
              <ArtisanHandBrush
                x={brushPos.x}
                y={brushPos.y}
                isPainting={isBrushPainting}
                brushColor={primaryColor.hex}
              />
            )}
          </div>
        )}

        {/* -----------------------------------------------------------------------
            RIGHT PANEL (Steps 2, 3, 4, 5 Action Panel)
            ----------------------------------------------------------------------- */}
        {currentStep > 1 && (
          <div
            className="cini-selection-panel"
            style={{
              background: 'rgba(10, 20, 35, 0.9)',
              backdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(217, 119, 6, 0.45)',
              borderRadius: '20px',
              padding: '22px 20px',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              color: '#FFFFFF',
              maxHeight: '560px',
              gap: '16px',
            }}
          >
            {/* STEP 2: DESEN SEÇ PANEL */}
            {currentStep === 2 && (
              <>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#F59E0B' }}>2. ADIM</div>
                  <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '2px 0 6px 0' }}>DESEN SEÇ</h2>
                  <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
                    {selectedObject.name} formuna hangi motifi işlemek istersin?
                  </p>
                </div>

                {/* 6 Motif Cards (2x3 grid) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {CINI_MOTIFS.map((m) => {
                    const isSelected = selectedMotifId === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedMotifId(m.id);
                          SoundFx.playClickTone?.();
                        }}
                        style={{
                          position: 'relative',
                          aspectRatio: '1 / 1.1',
                          borderRadius: '12px',
                          background: isSelected
                            ? 'linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%)'
                            : 'linear-gradient(135deg, #FDFBF7 0%, #F5EFE6 100%)',
                          border: isSelected ? '2.5px solid #00F2FE' : '1.5px solid rgba(180, 130, 80, 0.35)',
                          boxShadow: isSelected
                            ? '0 0 16px rgba(0, 242, 254, 0.65)'
                            : '0 4px 10px rgba(0,0,0,0.25)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                          transition: 'all 0.2s ease',
                          padding: '6px',
                        }}
                      >
                        {isSelected && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              background: '#00F2FE',
                              color: '#070B19',
                              fontSize: '10px',
                              fontWeight: '900',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            ✓
                          </div>
                        )}
                        <MotifCardPreview motifId={m.id} isSelected={isSelected} />
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B' }}>{m.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Action */}
                <button
                  onClick={handleNextStep}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #D97706 100%)',
                    color: '#291705',
                    fontSize: '18px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(245, 158, 11, 0.45)',
                  }}
                >
                  Bu Deseni Seç →
                </button>
              </>
            )}

            {/* STEP 3: RENK SEÇ PANEL */}
            {currentStep === 3 && (
              <>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#F59E0B' }}>3. ADIM</div>
                  <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '2px 0 6px 0' }}>RENK SEÇ</h2>
                  <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
                    Desenini geleneksel çini renkleriyle boyayalım.
                  </p>
                </div>

                {/* Primary vs Secondary Color Layer Selector */}
                <div
                  style={{
                    display: 'flex',
                    background: 'rgba(15, 23, 42, 0.8)',
                    borderRadius: '9999px',
                    padding: '3px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  <button
                    onClick={() => setColorLayerTarget('primary')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '9999px',
                      border: 'none',
                      background: colorLayerTarget === 'primary' ? '#0047AB' : 'transparent',
                      color: colorLayerTarget === 'primary' ? '#FFFFFF' : '#94A3B8',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer',
                    }}
                  >
                    Ana Renk ({primaryColor.name})
                  </button>
                  <button
                    onClick={() => setColorLayerTarget('secondary')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '9999px',
                      border: 'none',
                      background: colorLayerTarget === 'secondary' ? '#DC2626' : 'transparent',
                      color: colorLayerTarget === 'secondary' ? '#FFFFFF' : '#94A3B8',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer',
                    }}
                  >
                    2. Renk ({secondaryColor.name})
                  </button>
                </div>

                {/* 6 Large Color Swatches Grid (3x2) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {CINI_COLORS.map((c) => {
                    const isSelected =
                      colorLayerTarget === 'primary' ? primaryColorId === c.id : secondaryColorId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          if (colorLayerTarget === 'primary') {
                            setPrimaryColorId(c.id);
                          } else {
                            setSecondaryColorId(c.id);
                          }
                          SoundFx.playClickTone?.();
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          style={{
                            position: 'relative',
                            width: '54px',
                            height: '54px',
                            borderRadius: '50%',
                            background: c.hex,
                            border: isSelected ? '3px solid #FFFFFF' : '2px solid rgba(255, 255, 255, 0.4)',
                            boxShadow: isSelected
                              ? `0 0 20px ${c.hex}, 0 6px 14px rgba(0,0,0,0.5)`
                              : '0 4px 10px rgba(0,0,0,0.3)',
                            transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {isSelected && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '-2px',
                                right: '-2px',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                background: '#00F2FE',
                                color: '#070B19',
                                fontSize: '11px',
                                fontWeight: '900',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              ✓
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#F8FAFC' }}>{c.name}</span>
                        <span style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>{c.meaning}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Actions: Geri & Renkleri Uygula */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handlePrevStep}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      borderRadius: '14px',
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#F8FAFC',
                      fontSize: '15px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    ← Geri
                  </button>
                  <button
                    onClick={handleNextStep}
                    style={{
                      flex: 2,
                      padding: '14px 16px',
                      borderRadius: '14px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #D97706 100%)',
                      color: '#291705',
                      fontSize: '16px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px rgba(245, 158, 11, 0.45)',
                    }}
                  >
                    Renkleri Uygula →
                  </button>
                </div>
              </>
            )}

            {/* STEP 4: DESENİ UYGULA PANEL */}
            {currentStep === 4 && (
              <>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#F59E0B' }}>4. ADIM</div>
                  <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '2px 0 6px 0' }}>DESENİ UYGULA</h2>
                  <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
                    Seçtiğin deseni ve renkleri esere işliyoruz.
                  </p>
                </div>

                {/* Interactive Status & Progress */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '14px', color: '#E2E8F0', fontWeight: '600' }}>
                    {progressPercent === 100
                      ? 'Eserin ustalıkla tamamlandı!'
                      : 'Tabağın üzerindeki parlayan noktalara dokunarak fırçayı yönlendir!'}
                  </div>

                  {/* Progress bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>🖌️</span>
                    <div
                      style={{
                        flex: 1,
                        height: '14px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <div
                        style={{
                          width: `${progressPercent}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #06B6D4 0%, #F59E0B 100%)',
                          borderRadius: '9999px',
                          transition: 'width 0.4s ease-out',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: '#FEF08A' }}>
                      %{progressPercent}
                    </span>
                  </div>
                </div>

                {/* Cultural Tip Card */}
                <div
                  style={{
                    background: 'rgba(217, 119, 6, 0.12)',
                    border: '1px solid rgba(217, 119, 6, 0.35)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '13px',
                    color: '#FEF3C7',
                    lineHeight: '1.4',
                  }}
                >
                  <span style={{ fontSize: '22px' }}>💡</span>
                  <div>
                    <strong>İpucu:</strong> Her fırça darbesi, Anadolu’nun kadim mirasını yaşatır.
                  </div>
                </div>

                {/* Direct complete button if all painted */}
                {progressPercent === 100 && (
                  <button
                    onClick={() => setCurrentStep(5)}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '14px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                      fontSize: '18px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px rgba(16, 185, 129, 0.45)',
                    }}
                  >
                    ✓ Eseri Tamamla
                  </button>
                )}
              </>
            )}

            {/* STEP 5: TAMAMLANDI! PANEL */}
            {currentStep === 5 && (
              <>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#F59E0B' }}>5. ADIM</div>
                  <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#FDE68A', margin: '2px 0 4px 0' }}>
                    TAMAMLANDI!
                  </h2>
                  <p style={{ fontSize: '14px', color: '#E2E8F0', margin: 0 }}>
                    Harika! Kendi çini eserini tasarladın.
                  </p>
                </div>

                {/* 3 Accomplishment Badges */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { icon: '⭐', label: 'Kültürel Mirası Yaşattın' },
                    { icon: '🎨', label: 'Yaratıcılığını Kullandın' },
                    { icon: '❤️', label: 'Anadolu’nun İzlerini Bıraktın' },
                  ].map((badge, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '13px',
                        color: '#FEF3C7',
                        fontWeight: '700',
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </div>
                  ))}
                </div>

                {/* Primary CTA: Eserimi Kaydet ve Devam Et → */}
                <button
                  onClick={handleFinalizeAndContinue}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #D97706 100%)',
                    color: '#291705',
                    fontSize: '18px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(245, 158, 11, 0.5)',
                  }}
                >
                  Eserimi Kaydet ve Devam Et →
                </button>

                {/* Secondary CTA: Tekrar Tasarla */}
                <button
                  onClick={handleResetDesign}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'transparent',
                    border: '1.5px solid rgba(255, 255, 255, 0.3)',
                    color: '#CBD5E1',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  🔄 Tekrar Tasarla
                </button>
              </>
            )}
          </div>
        )}
      </main>

      {/* =========================================================================
          BOTTOM STEP PROGRESS BAR (Common across all 5 stages)
          ========================================================================= */}
      <footer
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 40px',
          background:
            'linear-gradient(0deg, rgba(10, 16, 28, 0.95) 0%, rgba(10, 16, 28, 0.7) 60%, transparent 100%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* 5-Step Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          {[
            { step: 1, label: 'Eser Seç' },
            { step: 2, label: 'Desen Seç' },
            { step: 3, label: 'Renk Seç' },
            { step: 4, label: 'Uygula' },
            { step: 5, label: 'Tamamla' },
          ].map((s) => {
            const isDone = currentStep > s.step;
            const isActive = currentStep === s.step;

            return (
              <div
                key={s.step}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isDone
                      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                      : isActive
                      ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                      : 'rgba(30, 41, 59, 0.7)',
                    border: isActive
                      ? '2px solid #FEF08A'
                      : isDone
                      ? '1.5px solid #6EE7B7'
                      : '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: isActive ? '0 0 14px rgba(245, 158, 11, 0.7)' : 'none',
                    color: isDone || isActive ? '#FFFFFF' : '#94A3B8',
                    fontSize: '14px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isDone ? '✓' : s.step}
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? '#FDE68A' : isDone ? '#E2E8F0' : '#64748B',
                  }}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right Quote matching the current step */}
        <div
          style={{
            fontStyle: 'italic',
            fontSize: '14px',
            color: '#E2E8F0',
            opacity: 0.85,
            fontFamily: "'Cinzel', Georgia, serif",
          }}
        >
          {STEP_QUOTES[currentStep - 1]}
        </div>
      </footer>
    </div>
  );
};
