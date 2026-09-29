import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  CINI_OBJECTS,
  CINI_MOTIFS,
  CINI_COLORS,
  MOTIF_REGION_DEFINITIONS,
  STEP_QUOTES,
  getCiniColorByHex,
  type CiniObject,
  type CiniMotif,
  type CiniColor,
  type PaintedRegion,
  type MotifRegionDef,
} from '../data/ciniData';
import { CiniObjectRenderer } from './cini/CiniObjectRenderer';
import { ArtisanHandBrush } from './cini/ArtisanHandBrush';
import { MotifCardPreview } from './cini/CiniMotifSVGs';
import { SoundFx } from '../game/utils/audio';
import { GameStore } from '../game/state/GameStore';
import { calculateResult } from '../game/systems/scoring';
import { EventBus } from '../game/state/EventBus';
import ciniWorkshopBg from '../assets/cini_workshop_bg.jpg';
import { GameTopBar, GameAssistant } from './game-ui';

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
  onHome: _onHome,
  onBack,
  onToggleAudio,
  onHelp,
  onPause,
  onToggleFullscreen,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [assistantOpen, setAssistantOpen] = useState<boolean>(false);

  const handleHelpToggle = () => {
    setAssistantOpen((prev) => !prev);
    onHelp?.();
  };

  // Etap değiştiğinde asistan tüyo balonunu otomatik kapat
  useEffect(() => {
    setAssistantOpen(false);
  }, [currentStep]);

  // Selected State
  const [selectedObjectId, setSelectedObjectId] = useState<'tabak' | 'pano' | 'karo'>('tabak');
  const [selectedMotifId, setSelectedMotifId] = useState<'lale' | 'karanfil' | 'rumi' | 'hatayi' | 'geometrik' | 'yaprak'>('lale');

  // Single Source of Truth for Colors across Step 3, 4, 5
  // User selects in Step 3, used in Step 3 preview, seamlessly carried to Step 4 & 5
  const [selectedPalette, setSelectedPalette] = useState<{
    primary: string;   // Mavi: #245DB5
    secondary: string; // Kırmızı: #E53935
    accent: string;    // Turkuaz: #16B6C8
  }>({
    primary: '#245DB5',
    secondary: '#E53935',
    accent: '#16B6C8',
  });
  const [colorLayerTarget, setColorLayerTarget] = useState<'primary' | 'secondary' | 'accent'>('primary');

  // Step 4 Painting State: Stable Region ID -> PaintedRegion object
  const [currentPaintStep, setCurrentPaintStep] = useState<number>(1);
  const [paintedRegions, setPaintedRegions] = useState<Record<string, PaintedRegion>>({});
  const [paintHistory, setPaintHistory] = useState<
    Array<{ regionId: string; previousRecord?: PaintedRegion; previousStep: number }>
  >([]);
  const [activeColorHex, setActiveColorHex] = useState<string>('#245DB5');
  const [justPaintedRegion, setJustPaintedRegion] = useState<string | null>(null);
  const [showStep4Hint, setShowStep4Hint] = useState<boolean>(true);
  const [shakingRegionId, setShakingRegionId] = useState<string | null>(null);
  const [, setWrongStepWarning] = useState<string | null>(null);

  // Brush Animation State & Interaction Lock
  const [brushPos, setBrushPos] = useState<{ x: number; y: number }>({ x: 300, y: 300 });
  const [isBrushPainting, setIsBrushPainting] = useState<boolean>(false);
  const [isHandVisible, setIsHandVisible] = useState<boolean>(false);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Synchronous lock and timers
  const isPaintingRef = useRef<boolean>(false);
  const paintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handRetractTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timers on unmount to prevent leaks and double-triggers
  useEffect(() => {
    return () => {
      if (paintTimerRef.current) clearTimeout(paintTimerRef.current);
      if (handRetractTimerRef.current) clearTimeout(handRetractTimerRef.current);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, []);

  // Modals
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState<boolean>(false);

  const workpieceContainerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const completedRef = useRef<boolean>(false);

  // Lookups
  const selectedObject: CiniObject =
    CINI_OBJECTS.find((o) => o.id === selectedObjectId) || CINI_OBJECTS[0];
  const selectedMotif: CiniMotif =
    CINI_MOTIFS.find((m) => m.id === selectedMotifId) || CINI_MOTIFS[0];

  // Exact color lookups based on single source of truth: selectedPalette
  const primaryColor: CiniColor = getCiniColorByHex(selectedPalette.primary);
  const secondaryColor: CiniColor = getCiniColorByHex(selectedPalette.secondary);
  const accentColor: CiniColor = getCiniColorByHex(selectedPalette.accent);
  const activeColorItem: CiniColor = getCiniColorByHex(activeColorHex);

  const totalRegionDefs = MOTIF_REGION_DEFINITIONS[selectedMotifId] || [];
  const totalRegionCount = totalRegionDefs.length;
  const paintedCount = Object.keys(paintedRegions).length;

  // Single Source of Truth for active target: currentPaintStep
  const activeRegionDef = useMemo(() => {
    const defs = MOTIF_REGION_DEFINITIONS[selectedMotifId] || [];
    return defs.find((r) => r.order === currentPaintStep) || null;
  }, [selectedMotifId, currentPaintStep]);

  const activeStepOrder = currentPaintStep;

  // Initial guidance: first 3 regions pulse with extra prominent glow to guide children
  const leadHintRegions = useMemo(() => {
    if (currentStep !== 4 || paintedCount > 0) return [];
    const defs = MOTIF_REGION_DEFINITIONS[selectedMotifId] || [];
    return defs.slice(0, 3).map((r) => r.id);
  }, [currentStep, paintedCount, selectedMotifId]);

  // Helper: auto-suggest default color for region based on its semantic palette role
  const getSuggestedColorForRegion = useCallback(
    (def: MotifRegionDef | null | undefined): string => {
      if (!def) return selectedPalette.primary;
      if (def.paletteRole === 'secondary') return selectedPalette.secondary;
      if (def.paletteRole === 'accent') return selectedPalette.accent;
      return selectedPalette.primary;
    },
    [selectedPalette]
  );

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
      setPaintedRegions({});
      setPaintHistory([]);
      setCurrentPaintStep(1);
      const firstDef = totalRegionDefs.find((r) => r.order === 1);
      setActiveColorHex(getSuggestedColorForRegion(firstDef));
      isPaintingRef.current = false;
      setIsBrushPainting(false);
      setIsHandVisible(false);
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

  // Step 4: Tap on any motif region (Atomic pointer interaction)
  const handleRegionClick = (
    regionId: string,
    clientX: number,
    clientY: number,
    _targetCenter: { x: number; y: number }
  ) => {
    // Prevent duplicate triggers / concurrent strokes
    if (isPaintingRef.current || isBrushPainting) return;

    const clickedDef = totalRegionDefs.find((r) => r.id === regionId);
    if (!clickedDef) return;

    // Check sequential order: must match currentPaintStep
    if (clickedDef.order !== currentPaintStep) {
      if (!paintedRegions[regionId]) {
        setShakingRegionId(regionId);
        setWrongStepWarning(`Önce ${currentPaintStep} numarayı boya!`);
        SoundFx.playClickTone?.();
        if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
        shakeTimerRef.current = setTimeout(() => {
          setShakingRegionId((curr) => (curr === regionId ? null : curr));
        }, 500);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        warningTimerRef.current = setTimeout(() => {
          setWrongStepWarning((curr) => (curr ? null : curr));
        }, 2400);
      }
      return;
    }

    // Interaction lock
    isPaintingRef.current = true;
    setWrongStepWarning(null);

    const rect = workpieceContainerRef.current?.getBoundingClientRect();
    if (!rect) {
      isPaintingRef.current = false;
      return;
    }

    // Relative coordinates inside the workpiece container
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    setBrushPos({ x: relativeX, y: relativeY });
    setIsHandVisible(true);
    setIsBrushPainting(true);
    setShowStep4Hint(false);
    SoundFx.playStoneDrag();

    // Record undo history with step
    const previousRecord = paintedRegions[regionId];
    const previousStep = currentPaintStep;
    setPaintHistory((prev) => [...prev, { regionId, previousRecord, previousStep }]);

    // Clear prior timers if any
    if (paintTimerRef.current) clearTimeout(paintTimerRef.current);
    if (handRetractTimerRef.current) clearTimeout(handRetractTimerRef.current);

    // Capture the paint color snapshot for this atomic stroke
    const paintColorHex = activeColorHex;
    const colorObj = getCiniColorByHex(paintColorHex);

    // Atomic Painting Flow:
    // 1. Brush arrives & paints (280ms)
    // 2. Region color is immutably stored in paintedRegions
    // 3. Step advances & next color is suggested from palette role
    // 4. Brush lifts & lock released (180ms)
    paintTimerRef.current = setTimeout(() => {
      setPaintedRegions((prev) => ({
        ...prev,
        [regionId]: {
          regionId,
          colorId: colorObj.id,
          colorHex: paintColorHex,
        },
      }));

      setJustPaintedRegion(regionId);
      setTimeout(() => {
        setJustPaintedRegion((curr) => (curr === regionId ? null : curr));
      }, 400);

      const nextStep = currentPaintStep + 1;
      setCurrentPaintStep(nextStep);

      const nextDef = totalRegionDefs.find((r) => r.order === nextStep);
      if (nextDef) {
        setActiveColorHex(getSuggestedColorForRegion(nextDef));
      }

      handRetractTimerRef.current = setTimeout(() => {
        setIsBrushPainting(false);
        setIsHandVisible(false);
        isPaintingRef.current = false;
      }, 180);
    }, 280);
  };

  // Undo last painted region
  const handleUndo = () => {
    if (paintHistory.length === 0 || isPaintingRef.current || isBrushPainting) return;
    const lastAction = paintHistory[paintHistory.length - 1];
    setPaintHistory((prev) => prev.slice(0, prev.length - 1));

    setPaintedRegions((prev) => {
      const next = { ...prev };
      if (lastAction.previousRecord) {
        next[lastAction.regionId] = lastAction.previousRecord;
      } else {
        delete next[lastAction.regionId];
      }
      return next;
    });

    if (lastAction.previousStep !== undefined) {
      setCurrentPaintStep(lastAction.previousStep);
      const targetDef = totalRegionDefs.find((r) => r.order === lastAction.previousStep);
      if (targetDef) {
        setActiveColorHex(getSuggestedColorForRegion(targetDef));
      }
    } else {
      setCurrentPaintStep((prev) => Math.max(1, prev - 1));
    }
    SoundFx.playClickTone?.();
  };

  // Clear all painted regions
  const handleClearAll = () => {
    if (paintTimerRef.current) clearTimeout(paintTimerRef.current);
    if (handRetractTimerRef.current) clearTimeout(handRetractTimerRef.current);
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    isPaintingRef.current = false;
    setCurrentPaintStep(1);
    setPaintedRegions({});
    setPaintHistory([]);
    setIsBrushPainting(false);
    setIsHandVisible(false);
    setJustPaintedRegion(null);
    setShowStep4Hint(true);
    setShakingRegionId(null);
    setWrongStepWarning(null);
    setShowClearConfirmModal(false);
    const firstDef = totalRegionDefs.find((r) => r.order === 1);
    setActiveColorHex(getSuggestedColorForRegion(firstDef));
    SoundFx.playClickTone?.();
  };

  // Complete Step 4 and proceed to Step 5
  const handleCompletePattern = () => {
    if (paintedCount < 2 && !showIncompleteModal) {
      setShowIncompleteModal(true);
      return;
    }
    setShowIncompleteModal(false);
    setIsHandVisible(false);
    setCurrentStep(5);
    SoundFx.playSuccessTone();
  };

  // Step 5: "Tekrar Tasarla"
  const handleResetDesign = () => {
    setCurrentStep(1);
    setPaintedRegions({});
    setPaintHistory([]);
    setJustPaintedRegion(null);
    setShowStep4Hint(true);
    setShakingRegionId(null);
    setWrongStepWarning(null);
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
      'Boyanan Bölge': `${paintedCount} parça`,
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
          subtitle: 'USTALIK VE SABIR',
          body: '“Rengini seç, motiflere dokun ve kendi çini eserini tamamla.”',
          callout: 'Çini eserini renklendir.',
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
            'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.40) 75%, rgba(0,0,0,0.85) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* =========================================================================
          TOP GAME HEADER
          ========================================================================= */}
      {/* STANDARDIZED TOP BAR */}
      <GameTopBar
        moduleNumber={3}
        moduleTitle="Anadolu Ustalığı"
        moduleSubtitle="Ustalığın İzleri"
        missionTitle={
          currentStep === 1
            ? 'Çini formunu seç ve tasarıma başla'
            : currentStep === 2
            ? `${selectedObject.name} formu için geleneksel motifi belirle`
            : currentStep === 3
            ? 'Geleneksel Anadolu renk paletini oluştur'
            : currentStep === 4
            ? 'Motif bölgelerine dokunarak çini eserini boya'
            : 'Eserini incele ve macerana devam et'
        }
        progressText={`${currentStep} / 5`}
        accentKey="anadolu_ustaligi"
        isAudioMuted={isAudioMuted}
        isFullscreen={fullscreen}
        onBack={currentStep > 1 ? handlePrevStep : onBack}
        onToggleAudio={onToggleAudio}
        onHelp={handleHelpToggle}
        onPause={onPause}
        onToggleFullscreen={onToggleFullscreen}
      />

      {/* STANDARDIZED GUIDE ROBOT ASSISTANT */}
      <GameAssistant
        message={
          currentStep === 1
            ? 'Önce eserini seç, ardından geleneksel desenini belirle.'
            : currentStep === 2
            ? `${selectedObject.name} üzerine işleyeceğin motifi seç.`
            : currentStep === 3
            ? 'Geleneksel çini renklerini belirleyerek paletini oluştur.'
            : currentStep === 4
            ? 'Rengini seç, motif üzerindeki parlayan bölgelere dokunarak boya.'
            : 'Harika bir ustalık eseri ortaya koydun!'
        }
        isOpen={assistantOpen}
        onToggle={setAssistantOpen}
        placement="bottom-left"
        accentKey="anadolu_ustaligi"
      />

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
          gridTemplateColumns: currentStep === 1 ? 'clamp(260px, 24vw, 320px) 1fr' : 'clamp(230px, 19vw, 290px) 1fr clamp(260px, 22vw, 350px)',
          alignItems: 'center',
          padding: '0 clamp(12px, 2vw, 28px)',
          gap: 'clamp(10px, 1.5vw, 20px)',
          maxHeight: 'calc(100% - 130px)',
        }}
      >
        {/* -----------------------------------------------------------------------
            LEFT COLUMN: PARCHMENT INFO CARD + MASCOT KAŞİF
            ----------------------------------------------------------------------- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '310px' }}>
          <div
            className="cini-parchment-card"
            style={{
              position: 'relative',
              background: 'linear-gradient(135deg, #FBF6E9 0%, #F2E8D2 60%, #E7DAC1 100%)',
              border: '2px solid #9A7B56',
              borderRadius: '16px',
              padding: currentStep === 4 ? '20px 18px' : '26px 22px',
              boxShadow:
                '0 18px 36px rgba(0, 0, 0, 0.45), inset 0 0 40px rgba(180, 130, 80, 0.15)',
              color: '#2A1806',
              fontFamily: "'Cinzel', 'Trajan Pro', Georgia, serif",
            }}
          >
            {/* Top Pin */}
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

            <div style={{ textAlign: 'center', color: '#0047AB', fontSize: '24px' }}>۞</div>

            <div style={{ textAlign: 'center', margin: '4px 0 8px 0' }}>
              <h1
                style={{
                  fontSize: '22px',
                  fontWeight: '900',
                  color: '#1B1204',
                  margin: '0 0 2px 0',
                  letterSpacing: '1px',
                }}
              >
                ÇİNİ SANATI
              </h1>
              <p
                style={{
                  fontSize: '12px',
                  fontStyle: 'italic',
                  color: '#854D0E',
                  margin: 0,
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                }}
              >
                {parchment.subtitle}
              </p>
            </div>

            <div
              style={{
                fontSize: currentStep === 4 ? '13.5px' : '14px',
                lineHeight: '1.5',
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
                gap: '8px',
                margin: '8px 0',
                color: '#0047AB',
                fontSize: '14px',
              }}
            >
              <span>—</span>
              <span>۞</span>
              <span>—</span>
            </div>

            {/* Mission Box */}
            <div
              style={{
                fontSize: '13px',
                lineHeight: '1.4',
                color: '#2A1806',
                textAlign: 'center',
                fontWeight: '600',
                fontFamily: "'Outfit', 'Segoe UI', sans-serif",
                background: 'rgba(217, 119, 6, 0.12)',
                borderRadius: '10px',
                padding: '10px 12px',
                border: '1px solid rgba(217, 119, 6, 0.28)',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#B45309', marginBottom: '2px' }}>
                🎯 GÖREV
              </div>
              <div>{parchment.callout}</div>
            </div>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            CENTER: WORKPIECE DISPLAY (Dominant, Majestic Centerpiece)
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
              gap: '24px',
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
                gap: '24px',
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
                      gap: '14px',
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
                        scale={0.82}
                      />
                    </div>

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

            <button
              onClick={handleNextStep}
              style={{
                marginTop: '6px',
                padding: '15px 44px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #D97706 100%)',
                color: '#291705',
                fontSize: '18px',
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
              width: '100%',
            }}
          >
            {/* Step 4: Initial Tutorial Guidance Toast */}
            {currentStep === 4 && showStep4Hint && paintedCount === 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.94) 0%, rgba(20, 38, 68, 0.94) 100%)',
                  border: '1.5px solid #38BDF8',
                  boxShadow: '0 8px 24px rgba(22, 182, 201, 0.45)',
                  borderRadius: '9999px',
                  padding: '8px 22px',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  zIndex: 25,
                  pointerEvents: 'none',
                  animation: 'fadeInDown 0.3s ease-out',
                }}
              >
                <span style={{ fontSize: '18px' }}>✨</span>
                <span>1 numaralı motiften başlayarak sırayla dokun ve boya!</span>
              </div>
            )}

            <CiniObjectRenderer
              object={selectedObject}
              motif={selectedMotif}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              accentColor={accentColor}
              mode={
                currentStep === 2
                  ? 'draft'
                  : currentStep === 3
                  ? 'preview'
                  : currentStep === 4
                  ? 'interactive'
                  : 'completed'
              }
              paintedRegions={paintedRegions}
              onRegionClick={handleRegionClick}
              hoveredRegion={hoveredRegion}
              onRegionHover={setHoveredRegion}
              leadHintRegions={leadHintRegions}
              justPaintedRegion={justPaintedRegion}
              activeStepOrder={activeStepOrder}
              shakingRegionId={shakingRegionId}
            />

            {/* Step 4: Floating Animated Artisan Hand & Brush */}
            {currentStep === 4 && (
              <ArtisanHandBrush
                x={brushPos.x}
                y={brushPos.y}
                isPainting={isBrushPainting}
                brushColor={activeColorHex}
                brushType="orta"
                visible={isHandVisible}
              />
            )}

            {/* Step 4: Progress Chip below artwork */}
            {currentStep === 4 && (
              <div
                style={{
                  marginTop: '6px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '9999px',
                  padding: '6px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#FEF08A',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                <span>🎨 BOYANAN BÖLGE:</span>
                <span style={{ color: '#FFFFFF', fontWeight: '900' }}>
                  {paintedCount} / {totalRegionCount}
                </span>
              </div>
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
              background: 'rgba(10, 20, 36, 0.94)',
              backdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(217, 119, 6, 0.45)',
              borderRadius: '22px',
              padding: currentStep === 4 ? '16px 16px' : '20px 18px',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.65)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              color: '#FFFFFF',
              maxHeight: currentStep === 4 ? 'min(86vh, 600px)' : '580px',
              overflow: 'hidden',
              gap: currentStep === 4 ? '10px' : '12px',
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

                {/* 3 Color Layer Tabs: Ana Renk, 2. Renk, Vurgu */}
                <div
                  style={{
                    display: 'flex',
                    background: 'rgba(15, 23, 42, 0.85)',
                    borderRadius: '9999px',
                    padding: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    gap: '4px',
                  }}
                >
                  <button
                    onClick={() => setColorLayerTarget('primary')}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '9999px',
                      border: 'none',
                      background: colorLayerTarget === 'primary' ? selectedPalette.primary : 'transparent',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: colorLayerTarget === 'primary' ? `0 0 14px ${selectedPalette.primary}` : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span
                      style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        background: selectedPalette.primary,
                        border: '1.5px solid #FFFFFF',
                      }}
                    />
                    <span>Ana ({primaryColor.name})</span>
                  </button>
                  <button
                    onClick={() => setColorLayerTarget('secondary')}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '9999px',
                      border: 'none',
                      background: colorLayerTarget === 'secondary' ? selectedPalette.secondary : 'transparent',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: colorLayerTarget === 'secondary' ? `0 0 14px ${selectedPalette.secondary}` : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span
                      style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        background: selectedPalette.secondary,
                        border: '1.5px solid #FFFFFF',
                      }}
                    />
                    <span>2. ({secondaryColor.name})</span>
                  </button>
                  <button
                    onClick={() => setColorLayerTarget('accent')}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '9999px',
                      border: 'none',
                      background: colorLayerTarget === 'accent' ? selectedPalette.accent : 'transparent',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: colorLayerTarget === 'accent' ? `0 0 14px ${selectedPalette.accent}` : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span
                      style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        background: selectedPalette.accent,
                        border: '1.5px solid #FFFFFF',
                      }}
                    />
                    <span>Vurgu ({accentColor.name})</span>
                  </button>
                </div>

                {/* 6 Net Çini Rengi Grid (3x2) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 10px' }}>
                  {CINI_COLORS.map((c) => {
                    const isSelected =
                      selectedPalette[colorLayerTarget].toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          const newHex = c.hex;
                          setSelectedPalette((prev) => ({
                            ...prev,
                            [colorLayerTarget]: newHex,
                          }));
                          if (colorLayerTarget === 'primary') {
                            setActiveColorHex(newHex);
                          }
                          SoundFx.playClickTone?.();
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          background: isSelected ? 'rgba(245, 158, 11, 0.16)' : 'rgba(15, 23, 42, 0.65)',
                          border: isSelected ? '2px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '14px',
                          padding: '10px 6px',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 0 16px rgba(245, 158, 11, 0.45)' : 'none',
                          transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                          transition: 'all 0.18s ease',
                        }}
                      >
                        <div
                          style={{
                            position: 'relative',
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: c.hex,
                            border: isSelected ? '3px solid #FFFFFF' : '2px solid rgba(255, 255, 255, 0.4)',
                            boxShadow: isSelected
                              ? `0 0 16px ${c.hex}, 0 4px 10px rgba(0,0,0,0.5)`
                              : '0 3px 8px rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isSelected && (
                            <span
                              style={{
                                color: '#FFFFFF',
                                fontSize: '16px',
                                fontWeight: '900',
                                textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                              }}
                            >
                              ✓
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: isSelected ? '#FEF08A' : '#F8FAFC', textAlign: 'center' }}>
                          {c.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

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

            {/* STEP 4: SIMPLIFIED ACTION PANEL (NO BRUSHES, NO SCROLLBAR, EXACT 6 CANONICAL COLORS) */}
            {currentStep === 4 && (
              <>
                {/* 0. BOYAMA SIRASI (Sequential Progress Guidance Card) */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                    border: '1.5px solid #F59E0B',
                    borderRadius: '14px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
                    flexShrink: 0,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        color: '#F59E0B',
                        letterSpacing: '0.8px',
                        textTransform: 'uppercase',
                      }}
                    >
                      BOYAMA SIRASI
                    </div>
                    <div
                      style={{
                        fontSize: '13.5px',
                        fontWeight: '700',
                        color: '#FEF08A',
                        marginTop: '2px',
                      }}
                    >
                      {activeRegionDef
                        ? `${activeRegionDef.order} numaralı motife dokun.`
                        : '✓ Tüm motifler boyandı!'}
                    </div>
                  </div>
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.2)',
                      border: '1px solid #F59E0B',
                      borderRadius: '9999px',
                      padding: '4px 12px',
                      fontSize: '13px',
                      fontWeight: '900',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span style={{ color: '#F59E0B', fontSize: '10px' }}>●</span>
                    <span>
                      {activeRegionDef ? activeRegionDef.order : totalRegionCount} / {totalRegionCount}
                    </span>
                  </div>
                </div>

                {/* 1. RENK SEÇ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>🎨</span>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '0.3px' }}>
                        RENK SEÇ
                      </span>
                    </div>

                    {/* Active Color Name Badge */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: `1.5px solid ${activeColorHex}`,
                        borderRadius: '9999px',
                        padding: '3px 10px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        color: '#F8FAFC',
                      }}
                    >
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: activeColorHex,
                          boxShadow: `0 0 6px ${activeColorHex}`,
                        }}
                      />
                      <span>{activeColorItem.name}</span>
                    </div>
                  </div>

                  {/* 6 Renk (3x2 Grid) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                    }}
                  >
                    {CINI_COLORS.map((color) => {
                      const isSelected = activeColorHex.toLowerCase() === color.hex.toLowerCase();
                      return (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => {
                            setActiveColorHex(color.hex);
                            SoundFx.playClickTone?.();
                          }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '5px',
                            background: isSelected
                              ? 'rgba(245, 158, 11, 0.18)'
                              : 'rgba(15, 23, 42, 0.65)',
                            border: isSelected
                              ? '2px solid #F59E0B'
                              : '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '12px',
                            padding: '8px 4px',
                            cursor: 'pointer',
                            boxShadow: isSelected
                              ? '0 0 14px rgba(245, 158, 11, 0.45)'
                              : 'none',
                            transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                            transition: 'all 0.18s ease',
                          }}
                        >
                          <div
                            style={{
                              position: 'relative',
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              background: color.hex,
                              border: isSelected
                                ? '3px solid #FFFFFF'
                                : '2px solid rgba(255, 255, 255, 0.35)',
                              boxShadow: isSelected
                                ? `0 0 14px ${color.hex}, 0 3px 8px rgba(0,0,0,0.5)`
                                : '0 2px 6px rgba(0,0,0,0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isSelected && (
                              <span
                                style={{
                                  color: '#FFFFFF',
                                  fontSize: '15px',
                                  fontWeight: '900',
                                  textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                                }}
                              >
                                ✓
                              </span>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: '12.5px',
                              fontWeight: isSelected ? '800' : '700',
                              color: isSelected ? '#FEF08A' : '#F8FAFC',
                              textAlign: 'center',
                            }}
                          >
                            {color.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. GERİ AL & TEMİZLE ACTIONS */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={paintHistory.length === 0}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '9px 12px',
                      borderRadius: '12px',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: paintHistory.length === 0 ? '#64748B' : '#E2E8F0',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: paintHistory.length === 0 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.18s ease',
                      opacity: paintHistory.length === 0 ? 0.5 : 1,
                    }}
                  >
                    <span>↺</span>
                    <span>Geri Al</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowClearConfirmModal(true)}
                    disabled={paintedCount === 0}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '9px 12px',
                      borderRadius: '12px',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: paintedCount === 0 ? '#64748B' : '#FCA5A5',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: paintedCount === 0 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.18s ease',
                      opacity: paintedCount === 0 ? 0.5 : 1,
                    }}
                  >
                    <span>🗑</span>
                    <span>Temizle</span>
                  </button>
                </div>

                {/* 3. DESENİ TAMAMLA PRIMARY CTA */}
                <button
                  type="button"
                  onClick={handleCompletePattern}
                  style={{
                    width: '100%',
                    padding: '13px 18px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #D97706 100%)',
                    color: '#291705',
                    fontSize: '16.5px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(245, 158, 11, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <span style={{ fontSize: '18px' }}>✓</span>
                  <span>Deseni Tamamla</span>
                </button>
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

                {/* Accomplishment Badges */}
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
          CONFIRMATION MODALS
          ========================================================================= */}
      {/* 1. Clear All Confirmation Modal */}
      {showClearConfirmModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 10, 20, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowClearConfirmModal(false)}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              border: '2px solid #F59E0B',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '380px',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              color: '#FFFFFF',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🗑️</div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px 0' }}>Tüm Boyamayı Temizle?</h3>
            <p style={{ fontSize: '14px', color: '#CBD5E1', margin: '0 0 20px 0', lineHeight: '1.5' }}>
              Boyadığın tüm desenleri baştan boyamak için temizlemek istiyor musun?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#F8FAFC',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Evet, Temizle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Incomplete Completion Gentle Prompt Modal */}
      {showIncompleteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 10, 20, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowIncompleteModal(false)}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              border: '2px solid #F59E0B',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '400px',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              color: '#FFFFFF',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🎨</div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px 0' }}>Birkaç Bölge Daha Boyamak İster misin?</h3>
            <p style={{ fontSize: '14px', color: '#CBD5E1', margin: '0 0 20px 0', lineHeight: '1.5' }}>
              Eserinde henüz renklendirilmeyi bekleyen kısımlar var. Yine de eseri bu haliyle tamamlamak ister misin?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowIncompleteModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)',
                  border: 'none',
                  color: '#291705',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Boyamaya Devam Et
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowIncompleteModal(false);
                  setIsHandVisible(false);
                  setCurrentStep(5);
                  SoundFx.playSuccessTone();
                }}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#F8FAFC',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Böyle Tamamla ✓
              </button>
            </div>
          </div>
        </div>
      )}

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
        {/* 5-Step Stepper */}
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
            textAlign: 'right',
            color: '#E2E8F0',
            fontFamily: "'Cinzel', Georgia, serif",
          }}
        >
          <div
            style={{
              fontStyle: 'italic',
              fontSize: '13px',
              fontWeight: '700',
              opacity: 0.9,
              letterSpacing: '0.4px',
            }}
          >
            {STEP_QUOTES[currentStep - 1].toUpperCase()}
          </div>
          {currentStep === 4 && (
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#F59E0B', marginTop: '2px' }}>
              K. Atatürk
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};
