import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IHA_PARTS, type IhaPart } from '../../data/milliData';
import { SoundFx } from '../../game/utils/audio';
import {
  DroneSvgDefs,
  DroneFuselageGeometry,
  DroneWingGeometry,
  DroneMotorGeometry,
  DroneTailGeometry,
  DroneLandingGearGeometry,
  DronePartCardVisual,
  type DronePartKey,
} from './MilliDroneModel';

interface MilliStage1AssemblyProps {
  onComplete: () => void;
  onProgressChange?: (placedCount: number) => void;
}

interface DragSession {
  part: IhaPart;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export const MilliStage1Assembly: React.FC<MilliStage1AssemblyProps> = ({
  onComplete: _onComplete,
  onProgressChange,
}) => {
  const [placedParts, setPlacedParts] = useState<Set<string>>(new Set());
  const [dragSession, setDragSession] = useState<DragSession | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [justSnappedKey, setJustSnappedKey] = useState<string | null>(null);
  const [isSnapping, setIsSnapping] = useState<boolean>(false);
  const [isNearTargetZone, setIsNearTargetZone] = useState<boolean>(false);

  const assemblyBoxRef = useRef<HTMLDivElement | null>(null);
  const dragAvatarRef = useRef<HTMLDivElement | null>(null);
  const dragRafRef = useRef<number | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const cardBoundsRef = useRef<Map<string, DOMRect>>(new Map());

  const placedCount = IHA_PARTS.filter(p => placedParts.has(p.stableKey) || placedParts.has(p.id)).length;
  const isAllPlaced = placedCount === IHA_PARTS.length;

  useEffect(() => {
    onProgressChange?.(placedCount);
  }, [placedCount, onProgressChange]);

  useEffect(() => {
    return () => {
      if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);
    };
  }, []);

  // Update card bounds for return animation
  const updateCardBounds = useCallback(() => {
    IHA_PARTS.forEach(part => {
      const cardEl = document.getElementById(`part-card-${part.stableKey}`);
      if (cardEl) {
        cardBoundsRef.current.set(part.stableKey, cardEl.getBoundingClientRect());
      }
    });
  }, []);

  useEffect(() => {
    updateCardBounds();
    window.addEventListener('resize', updateCardBounds);
    return () => window.removeEventListener('resize', updateCardBounds);
  }, [updateCardBounds]);

  // Snap part into place
  const handleSnapPart = useCallback((part: IhaPart) => {
    if (placedParts.has(part.stableKey) || placedParts.has(part.id)) return;

    SoundFx.playGearSnap();
    setJustSnappedKey(part.stableKey);
    setTimeout(() => setJustSnappedKey(null), 700);

    setPlacedParts(prev => {
      const next = new Set(prev);
      next.add(part.stableKey);
      next.add(part.id);
      return next;
    });

    setSelectedKey(null);
    setDragSession(null);
    dragSessionRef.current = null;
    activePointerIdRef.current = null;
    setIsSnapping(false);
    setIsNearTargetZone(false);

    if (placedCount + 1 === IHA_PARTS.length) {
      setTimeout(() => {
        SoundFx.playSuccessTone();
      }, 350);
    }
  }, [placedParts, placedCount]);

  // Cancel drag: smooth return to card without error popups or screen shake
  const handleCancelDrag = useCallback(() => {
    if (!dragSessionRef.current) return;
    const session = dragSessionRef.current;
    const cardRect = cardBoundsRef.current.get(session.part.stableKey);
    const returnX = cardRect ? cardRect.left + cardRect.width / 2 : session.startX;
    const returnY = cardRect ? cardRect.top + cardRect.height / 2 : session.startY;

    if (dragAvatarRef.current) {
      dragAvatarRef.current.style.transition = 'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.22s ease';
      dragAvatarRef.current.style.transform = `translate3d(${returnX}px, ${returnY}px, 0) translate(-50%, -50%) scale(0.85)`;
      dragAvatarRef.current.style.opacity = '0.2';
    }

    setTimeout(() => {
      setDragSession(null);
      dragSessionRef.current = null;
      activePointerIdRef.current = null;
      setIsSnapping(false);
      setIsNearTargetZone(false);
    }, 230);
  }, []);

  // Global safety listener for pointer up / cancel
  useEffect(() => {
    const handleGlobalPointerUp = (e: PointerEvent) => {
      if (activePointerIdRef.current !== null && e.pointerId === activePointerIdRef.current) {
        if (dragSessionRef.current && !isSnapping) {
          handleCancelDrag();
        }
      }
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [handleCancelDrag, isSnapping]);

  // Pointer Down on Part Card
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, part: IhaPart) => {
    if (placedParts.has(part.stableKey) || placedParts.has(part.id) || isSnapping) return;

    e.preventDefault();
    e.stopPropagation();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
      activePointerIdRef.current = e.pointerId;
    } catch {
      // Safe fallback
    }

    updateCardBounds();
    SoundFx.playClickTone();
    setSelectedKey(part.stableKey);

    const initialSession: DragSession = {
      part,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    };
    dragSessionRef.current = initialSession;
    setDragSession(initialSession);
  };

  // Pointer Move during Drag: 60fps via requestAnimationFrame + magnetic proximity check
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragSessionRef.current || isSnapping) return;
    if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;

    const x = e.clientX;
    const y = e.clientY;

    if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);
    dragRafRef.current = requestAnimationFrame(() => {
      if (dragAvatarRef.current) {
        dragAvatarRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(1.06)`;
      }
    });

    // Check proximity to target mold for magnetic visual feedback
    const box = assemblyBoxRef.current;
    if (box) {
      const boxRect = box.getBoundingClientRect();
      const currentPart = dragSessionRef.current.part;
      const targetCenterX = boxRect.left + (currentPart.mountPointPercent.x / 100) * boxRect.width;
      const targetCenterY = boxRect.top + (currentPart.mountPointPercent.y / 100) * boxRect.height;
      const dist = Math.hypot(x - targetCenterX, y - targetCenterY);
      setIsNearTargetZone(dist <= 180);
    }
  };

  // Pointer Up / Drop Detection
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragSessionRef.current || isSnapping) return;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Safe fallback
    }
    activePointerIdRef.current = null;

    const currentPart = dragSessionRef.current.part;
    const box = assemblyBoxRef.current;
    if (!box) {
      handleCancelDrag();
      return;
    }

    const boxRect = box.getBoundingClientRect();
    const dropX = e.clientX;
    const dropY = e.clientY;

    const targetCenterX = boxRect.left + (currentPart.mountPointPercent.x / 100) * boxRect.width;
    const targetCenterY = boxRect.top + (currentPart.mountPointPercent.y / 100) * boxRect.height;

    let isHit = false;
    const distFromMount = Math.hypot(dropX - targetCenterX, dropY - targetCenterY);

    // Generous radial margin around mount silhouette (220px radius)
    if (distFromMount <= 220) {
      isHit = true;
    } else {
      // Also check normalized 1000x500 box coordinates
      const normX = ((dropX - boxRect.left) / boxRect.width) * 1000;
      const normY = ((dropY - boxRect.top) / boxRect.height) * 500;
      const margin = 140;
      const targetX = (currentPart.mountPointPercent.x / 100) * 1000;
      const targetY = (currentPart.mountPointPercent.y / 100) * 500;
      if (
        normX >= targetX - margin &&
        normX <= targetX + margin &&
        normY >= targetY - margin &&
        normY <= targetY + margin
      ) {
        isHit = true;
      }
    }

    if (isHit) {
      setIsSnapping(true);
      // Execute 200ms smooth snap animation into exact final target
      if (dragAvatarRef.current) {
        dragAvatarRef.current.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease';
        dragAvatarRef.current.style.transform = `translate3d(${targetCenterX}px, ${targetCenterY}px, 0) translate(-50%, -50%) scale(0.95)`;
        dragAvatarRef.current.style.opacity = '0.9';
      }
      setTimeout(() => {
        handleSnapPart(currentPart);
      }, 200);
      return;
    }

    // Invalid drop: smooth return to card
    handleCancelDrag();
  };

  // Direct Click / Touch on Ghost Mold (accessible kiosk fallback)
  const handleMoldClick = (part: IhaPart) => {
    if (placedParts.has(part.stableKey) || placedParts.has(part.id) || isSnapping) return;
    handleSnapPart(part);
  };

  // Direct Click on Card: select or snap if already selected
  const handleCardClick = (part: IhaPart) => {
    if (placedParts.has(part.stableKey) || placedParts.has(part.id)) return;
    if (selectedKey === part.stableKey) {
      handleSnapPart(part);
    } else {
      setSelectedKey(part.stableKey);
      SoundFx.playClickTone();
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <style>{`
        .part-real-image {
          opacity: 1;
          filter: none !important;
          mix-blend-mode: normal !important;
          mask: none !important;
          -webkit-mask: none !important;
        }
        .part-target-ghost {
          opacity: 0.85;
        }
        @keyframes moldPulse {
          0%, 100% { opacity: 0.85; filter: drop-shadow(0 0 8px rgba(0, 230, 245, 0.70)); }
          50% { opacity: 1; filter: drop-shadow(0 0 16px rgba(0, 230, 245, 0.95)); }
        }
        @keyframes moldMagnetPulse {
          0%, 100% { filter: drop-shadow(0 0 16px rgba(20, 230, 180, 0.95)); }
          50% { filter: drop-shadow(0 0 24px rgba(20, 230, 180, 1)); }
        }
      `}</style>

      {/* =========================================================================
          LEFT HUD: INSTRUCTION & MISSION PROGRESS
          Compact, semi-transparent glass panel over the darkened background
          ========================================================================= */}
      <aside
        style={{
          position: 'absolute',
          top: '20px',
          left: '24px',
          width: '330px',
          background: 'linear-gradient(135deg, rgba(6, 18, 38, 0.88) 0%, rgba(4, 12, 26, 0.76) 100%)',
          borderRadius: '16px',
          padding: '14px 18px',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 242, 254, 0.28)',
          boxShadow: '0 10px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          zIndex: 25,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(0, 242, 254, 0.15)',
              border: '1px solid rgba(0, 242, 254, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#00F2FE',
            }}
          >
            ⚙️
          </div>
          <div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '0.8px',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)',
              }}
            >
              İHA’NI TASARLA
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#00F2FE',
                letterSpacing: '0.6px',
                marginTop: '1px',
                textShadow: '0 0 10px rgba(0, 242, 254, 0.6)',
              }}
            >
              MİLLÎ TEKNOLOJİ, GÜVENLİ YARINLAR
            </div>
          </div>
        </div>

        <p
          style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.92)',
            lineHeight: '1.4',
            margin: 0,
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)',
          }}
        >
          Parçaları doğru montaj kalıplarına sürükleyerek İHA’yı tamamla.
        </p>

        {/* Görev Info Box */}
        <div
          style={{
            background: 'rgba(0, 242, 254, 0.08)',
            borderLeft: '3px solid #00F2FE',
            borderRadius: '6px',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              letterSpacing: '0.5px',
            }}
          >
            <span>🎯</span>
            <span>GÖREV</span>
          </div>
          <div
            style={{
              fontSize: '11px',
              color: '#FFFFFF',
              fontWeight: 600,
              lineHeight: '1.35',
            }}
          >
            Kanat, kuyruk, motor ve iniş takımını doğru kalıplara yerleştir.
          </div>
        </div>

        {/* Progress Tracker (0/4 .. 4/4) */}
        <div style={{ marginTop: '2px' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: isAllPlaced ? '#10B981' : '#00F2FE',
              marginBottom: '6px',
              letterSpacing: '0.4px',
              textShadow: '0 0 10px rgba(0, 242, 254, 0.6)',
            }}
          >
            {placedCount} / 4 Parça Yerleştirildi
          </div>
          {/* Step line with 4 dots */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.18)',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${(placedCount / 4) * 100}%`,
                background: 'linear-gradient(90deg, #00F2FE, #10B981)',
                borderRadius: '2px',
                transition: 'width 0.3s ease',
              }}
            />
            {[1, 2, 3, 4].map(stepIndex => {
              const isDone = stepIndex <= placedCount;
              return (
                <div
                  key={stepIndex}
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: isDone ? '#10B981' : 'rgba(12, 26, 48, 0.95)',
                    border: `2px solid ${isDone ? '#34D399' : 'rgba(0, 242, 254, 0.5)'}`,
                    boxShadow: isDone ? '0 0 10px #10B981' : 'none',
                    zIndex: 2,
                    transition: 'all 0.3s ease',
                  }}
                />
              );
            })}
          </div>
        </div>
      </aside>

      {/* =========================================================================
          CENTER STAGE: CIVILIAN UAV ON THE HELIPAD WITH GHOST MOUNTING MOLDS
          ========================================================================= */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 0,
          padding: '10px 20px',
        }}
      >
        {/* Normalized 1000x500 Aircraft Frame */}
        <div
          ref={assemblyBoxRef}
          style={{
            position: 'relative',
            width: 'clamp(920px, 60vw, 1160px)',
            aspectRatio: '1000 / 500',
            maxHeight: 'clamp(410px, 56vh, 580px)',
            transform: 'translateY(clamp(32px, 5vh, 58px))',
          }}
        >
          <svg
            viewBox="0 0 1000 500"
            width="100%"
            height="100%"
            style={{
              overflow: 'visible',
              filter: 'drop-shadow(0 16px 36px rgba(0, 0, 0, 0.85))',
            }}
          >
            <DroneSvgDefs />

            {/* 1. Ground Contact Shadow (Helipad tarmac) */}
            <ellipse cx="480" cy="425" rx="350" ry="20" fill="rgba(1, 4, 10, 0.70)" filter="blur(10px)" />
            <ellipse cx="460" cy="423" rx="230" ry="12" fill="rgba(1, 3, 8, 0.85)" filter="blur(4px)" />

            {/* Sharp Wheel Contact Shadows when landing gear is fitted */}
            {(placedParts.has('landingGear') || placedParts.has('inis_takimi') || isAllPlaced) && (
              <>
                <ellipse cx="275" cy="425" rx="16" ry="4" fill="rgba(0, 1, 4, 0.95)" filter="blur(1px)" />
                <ellipse cx="468" cy="425" rx="18" ry="4.5" fill="rgba(0, 1, 4, 0.95)" filter="blur(1px)" />
                <ellipse cx="618" cy="423" rx="18" ry="4.5" fill="rgba(0, 1, 4, 0.95)" filter="blur(1px)" />
              </>
            )}

            {/* Temporary Maintenance Stands before landing gear is fitted */}
            {!placedParts.has('landingGear') && !placedParts.has('inis_takimi') && !isAllPlaced && (
              <g id="maintenance-stands">
                <rect x="330" y="328" width="16" height="96" rx="3" fill="#475569" stroke="#334155" strokeWidth="1.2" />
                <polygon points="322,424 354,424 348,428 328,428" fill="#334155" />
                <rect x="570" y="324" width="16" height="100" rx="3" fill="#475569" stroke="#334155" strokeWidth="1.2" />
                <polygon points="562,424 594,424 588,428 568,428" fill="#334155" />
              </g>
            )}

            {/* LAYER 1: Right Wing (behind fuselage) */}
            {(placedParts.has('wing') || placedParts.has('kanat')) && <DroneWingGeometry section="right" />}

            {/* LAYER 2: Tail Assembly */}
            {placedParts.has('tail') || placedParts.has('kuyruk') ? (
              <g style={{ filter: justSnappedKey === 'tail' || justSnappedKey === 'kuyruk' ? 'drop-shadow(0 0 20px #00F2FE)' : 'none', transition: 'filter 0.5s ease' }}>
                <DroneTailGeometry />
              </g>
            ) : (
              <g
                id="mold-tail"
                onClick={() => {
                  const part = IHA_PARTS.find(p => p.stableKey === 'tail');
                  if (part) handleMoldClick(part);
                }}
                style={{ cursor: 'pointer' }}
              >
                <DroneTailGeometry
                  isMold={true}
                  isTargeted={dragSession?.part.stableKey === 'tail' || selectedKey === 'tail'}
                  isMagneticNear={(dragSession?.part.stableKey === 'tail' || selectedKey === 'tail') && isNearTargetZone}
                />
              </g>
            )}

            {/* LAYER 3: Fuselage Body */}
            <DroneFuselageGeometry />

            {/* LAYER 4: Landing Gear Assembly (Rendered over belly sockets for crisp attachment) */}
            {placedParts.has('landingGear') || placedParts.has('inis_takimi') ? (
              <g style={{ filter: justSnappedKey === 'landingGear' || justSnappedKey === 'inis_takimi' ? 'drop-shadow(0 0 20px #00F2FE)' : 'none', transition: 'filter 0.5s ease' }}>
                <DroneLandingGearGeometry />
              </g>
            ) : (
              <g
                id="mold-gear"
                onClick={() => {
                  const part = IHA_PARTS.find(p => p.stableKey === 'landingGear');
                  if (part) handleMoldClick(part);
                }}
                style={{ cursor: 'pointer' }}
              >
                <DroneLandingGearGeometry
                  isMold={true}
                  isTargeted={dragSession?.part.stableKey === 'landingGear' || selectedKey === 'landingGear'}
                  isMagneticNear={(dragSession?.part.stableKey === 'landingGear' || selectedKey === 'landingGear') && isNearTargetZone}
                />
              </g>
            )}

            {/* LAYER 5: Wing Assembly (Left Wing in foreground, or full mold when unplaced) */}
            {placedParts.has('wing') || placedParts.has('kanat') ? (
              <g
                id="left-wing-front"
                style={{ filter: justSnappedKey === 'wing' || justSnappedKey === 'kanat' ? 'drop-shadow(0 0 20px #00F2FE)' : 'none', transition: 'filter 0.5s ease' }}
              >
                <DroneWingGeometry section="left" />
              </g>
            ) : (
              <g
                id="mold-wing"
                onClick={() => {
                  const part = IHA_PARTS.find(p => p.stableKey === 'wing');
                  if (part) handleMoldClick(part);
                }}
                style={{ cursor: 'pointer' }}
              >
                <DroneWingGeometry
                  section="all"
                  isMold={true}
                  isTargeted={dragSession?.part.stableKey === 'wing' || selectedKey === 'wing'}
                  isMagneticNear={(dragSession?.part.stableKey === 'wing' || selectedKey === 'wing') && isNearTargetZone}
                />
              </g>
            )}

            {/* LAYER 6: Motor Assembly (Top Spine) */}
            {placedParts.has('engine') || placedParts.has('motor') ? (
              <g style={{ filter: justSnappedKey === 'engine' || justSnappedKey === 'motor' ? 'drop-shadow(0 0 20px #00F2FE)' : 'none', transition: 'filter 0.5s ease' }}>
                <DroneMotorGeometry />
              </g>
            ) : (
              <g
                id="mold-motor"
                onClick={() => {
                  const part = IHA_PARTS.find(p => p.stableKey === 'engine');
                  if (part) handleMoldClick(part);
                }}
                style={{ cursor: 'pointer' }}
              >
                <DroneMotorGeometry
                  isMold={true}
                  isTargeted={dragSession?.part.stableKey === 'engine' || selectedKey === 'engine'}
                  isMagneticNear={(dragSession?.part.stableKey === 'engine' || selectedKey === 'engine') && isNearTargetZone}
                />
              </g>
            )}
          </svg>

          {/* Success Banner when 4/4 assembled */}
          {isAllPlaced && (
            <div
              style={{
                position: 'absolute',
                top: '-46px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))',
                padding: '8px 24px',
                borderRadius: '30px',
                boxShadow: '0 8px 30px rgba(16, 185, 129, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '14px',
                letterSpacing: '0.8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'fadeInDown 0.4s ease-out',
                zIndex: 30,
              }}
            >
              <span>✓</span>
              <span>İHA montajı başarıyla tamamlandı.</span>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          BOTTOM 4 PART CARDS (Clean Single Source of Truth, 100% Opacity)
          Single row: [ KANAT ] [ MOTOR ] [ KUYRUK ] [ İNİŞ TAKIMI ]
          ========================================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'center',
          gap: '16px',
          width: '100%',
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '0 24px clamp(12px, 1.8vh, 18px)',
          zIndex: 25,
        }}
      >
        {IHA_PARTS.map(part => {
          const isPlaced = placedParts.has(part.stableKey) || placedParts.has(part.id);
          const isDragging = dragSession?.part.stableKey === part.stableKey;
          const isSelected = selectedKey === part.stableKey;

          return (
            <div
              key={part.id}
              id={`part-card-${part.stableKey}`}
              onPointerDown={e => handlePointerDown(e, part)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handleCancelDrag}
              onClick={() => handleCardClick(part)}
              style={{
                position: 'relative',
                flex: 1,
                maxWidth: '320px',
                minWidth: '200px',
                height: 'clamp(145px, 17vh, 175px)',
                borderRadius: '16px',
                background: isPlaced
                  ? 'linear-gradient(180deg, rgba(8, 36, 32, 0.96) 0%, rgba(4, 22, 18, 0.96) 100%)'
                  : isSelected || isDragging
                  ? 'linear-gradient(180deg, rgba(12, 36, 68, 0.96) 0%, rgba(6, 20, 42, 0.98) 100%)'
                  : 'linear-gradient(180deg, rgba(10, 27, 48, 0.96) 0%, rgba(5, 20, 36, 0.96) 100%)',
                border: isPlaced
                  ? '1.5px solid rgba(16, 185, 129, 0.65)'
                  : isSelected || isDragging
                  ? '1.5px solid #00F2FE'
                  : '1.5px solid rgba(0, 242, 254, 0.35)',
                boxShadow: isPlaced
                  ? '0 8px 24px rgba(0, 0, 0, 0.45), 0 0 14px rgba(16, 185, 129, 0.25)'
                  : isSelected || isDragging
                  ? '0 12px 36px rgba(0, 0, 0, 0.65), 0 0 18px rgba(0, 242, 254, 0.45)'
                  : '0 10px 28px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: isPlaced ? 'default' : 'grab',
                opacity: isDragging ? 0.35 : 1,
                transform: isSelected && !isPlaced ? 'translateY(-4px)' : 'none',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                touchAction: 'none',
                pointerEvents: isPlaced ? 'none' : 'auto',
                overflow: 'hidden',
              }}
            >
              {/* Card Upper Area: ~68% height, 100% opacity real part visual */}
              <div
                style={{
                  position: 'relative',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 14px 2px',
                  minHeight: 0,
                  overflow: 'hidden',
                }}
              >
                <DronePartCardVisual
                  partKey={part.id as DronePartKey}
                  isPlaced={isPlaced}
                />

                {/* Placed Watermark Badge */}
                {isPlaced && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '10px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.25)',
                      border: '1.5px solid #10B981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#34D399',
                      fontSize: '12px',
                      fontWeight: 900,
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>

              {/* Card Bottom Row: Icon, Title & Sürükle ve Tak Action */}
              <div
                style={{
                  height: '46px',
                  padding: '0 14px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: isPlaced
                    ? '1px solid rgba(16, 185, 129, 0.2)'
                    : '1px solid rgba(0, 242, 254, 0.12)',
                  background: isPlaced
                    ? 'rgba(6, 32, 24, 0.4)'
                    : 'rgba(4, 14, 30, 0.4)',
                }}
              >
                {/* Left: Component Type Icon */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      background: isPlaced
                        ? 'rgba(16, 185, 129, 0.18)'
                        : 'rgba(0, 242, 254, 0.12)',
                      border: `1px solid ${isPlaced ? 'rgba(16, 185, 129, 0.4)' : 'rgba(0, 242, 254, 0.3)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                    }}
                  >
                    {part.id === 'kanat' && '🛫'}
                    {part.id === 'motor' && '⚙️'}
                    {part.id === 'kuyruk' && '🛩️'}
                    {part.id === 'inis_takimi' && '🛞'}
                  </div>

                  {/* Title & Status */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: isPlaced ? '#34D399' : '#FFFFFF',
                        letterSpacing: '0.6px',
                        lineHeight: 1.2,
                      }}
                    >
                      {part.name}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: isPlaced ? '#10B981' : '#00F2FE',
                        letterSpacing: '0.3px',
                        lineHeight: 1.2,
                      }}
                    >
                      {isPlaced ? 'Yerleştirildi' : 'Sürükle ve Tak'}
                    </span>
                  </div>
                </div>

                {/* Right: Drag / Touch Affordance Icon */}
                <div
                  style={{
                    color: isPlaced ? '#34D399' : 'rgba(0, 242, 254, 0.8)',
                    fontSize: isPlaced ? '14px' : '15px',
                    fontWeight: 700,
                  }}
                >
                  {isPlaced ? '✓' : '👆'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          FLOATING DRAG AVATAR (Ultra-smooth 60fps translate3d via pointer events)
          ========================================================================= */}
      {dragSession && (
        <div
          ref={dragAvatarRef}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            transform: `translate3d(${dragSession.startX}px, ${dragSession.startY}px, 0) translate(-50%, -50%) scale(1.08)`,
            pointerEvents: 'none',
            zIndex: 100,
            filter: isNearTargetZone
              ? 'drop-shadow(0 12px 28px rgba(20, 230, 180, 0.95))'
              : 'drop-shadow(0 12px 28px rgba(0, 242, 254, 0.85))',
            willChange: 'transform',
            width: '260px',
            height: '140px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DronePartCardVisual partKey={dragSession.part.id as DronePartKey} />
        </div>
      )}
    </div>
  );
};
