import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DEVRIM_ENGINE_PARTS, type DevrimEnginePart } from '../../data/devrimData';
import { DevrimEnginePartSvg, DevrimEngineBayScene } from './DevrimEnginePartsSVGs';
import { SoundFx } from '../../game/utils/audio';
import { shuffleArray } from '../../utils/shuffle';

interface DevrimEngineAssemblyProps {
  onComplete: () => void;
  onPartPlaced?: (partId: string) => void;
  onFeedbackMessage?: (msg: string) => void;
}

interface DragState {
  partId: DevrimEnginePart['id'];
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export const DevrimEngineAssembly: React.FC<DevrimEngineAssemblyProps> = ({
  onComplete,
  onPartPlaced,
  onFeedbackMessage,
}) => {
  // Stable shuffled tray order: randomized ONCE on initial mount via Fisher-Yates
  const [shuffledParts] = useState<DevrimEnginePart[]>(() => shuffleArray(DEVRIM_ENGINE_PARTS));

  const [placedPartIds, setPlacedPartIds] = useState<string[]>([]);
  const [justSnappedPartId, setJustSnappedPartId] = useState<string | null>(null);
  const [shakingPartId, setShakingPartId] = useState<string | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);
  const [isAllCompleted, setIsAllCompleted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const onPartPlacedRef = useRef(onPartPlaced);
  onPartPlacedRef.current = onPartPlaced;

  const onFeedbackMessageRef = useRef(onFeedbackMessage);
  onFeedbackMessageRef.current = onFeedbackMessage;

  const completionTriggeredRef = useRef(false);
  const completionTimerRef = useRef<number | null>(null);
  const shakeTimerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  const dragAvatarRef = useRef<HTMLDivElement | null>(null);
  const dragRafRef = useRef<number | null>(null);
  const dragCoordsRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hoveredSlotIdRef = useRef<string | null>(null);
  const cachedSlotRectsRef = useRef<
    Map<
      string,
      {
        left: number;
        right: number;
        top: number;
        bottom: number;
        centerX: number;
        centerY: number;
        radiusTolerance: number;
      }
    >
  >(new Map());

  // Clean unmount cleanup
  useEffect(() => {
    return () => {
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      if (completionTimerRef.current !== null) {
        window.clearTimeout(completionTimerRef.current);
        completionTimerRef.current = null;
      }
      if (shakeTimerRef.current !== null) {
        window.clearTimeout(shakeTimerRef.current);
        shakeTimerRef.current = null;
      }
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }
    };
  }, []);

  const triggerCompletion = useCallback(() => {
    if (completionTriggeredRef.current) return;
    completionTriggeredRef.current = true;
    setIsAllCompleted(true);

    if (SoundFx.playVictoryFanfare) {
      SoundFx.playVictoryFanfare();
    } else {
      SoundFx.playSuccessTone?.();
    }

    const victoryMsg = 'Harika! Motor hazır. Şimdi çalıştıralım!';
    onFeedbackMessageRef.current?.(victoryMsg);

    if (completionTimerRef.current !== null) {
      window.clearTimeout(completionTimerRef.current);
    }
    // Auto-advance to Step 4 after 1350ms
    completionTimerRef.current = window.setTimeout(() => {
      onCompleteRef.current?.();
    }, 1350);
  }, []);

  const snapPartIntoSlot = useCallback(
    (partId: string) => {
      if (completionTriggeredRef.current) return;

      // Authentic mechanical lock SFX
      if (SoundFx.playLockSound) {
        SoundFx.playLockSound();
      } else {
        SoundFx.playClickTone?.();
      }

      setJustSnappedPartId(partId);
      setSelectedPartId(null);
      setHoveredSlotId(null);
      onPartPlacedRef.current?.(partId);

      window.setTimeout(() => {
        setJustSnappedPartId(null);
      }, 700);

      setPlacedPartIds(prev => {
        if (prev.includes(partId)) return prev;
        const next = [...prev, partId];
        if (next.length === DEVRIM_ENGINE_PARTS.length) {
          triggerCompletion();
        }
        return next;
      });
    },
    [triggerCompletion]
  );

  // Sync completion if state reaches target count
  useEffect(() => {
    if (placedPartIds.length >= DEVRIM_ENGINE_PARTS.length && !completionTriggeredRef.current) {
      triggerCompletion();
    }
  }, [placedPartIds, triggerCompletion]);

  // Generous Proximity & Overlap detection for kids (~55-60% overlap tolerance)
  const checkSlotProximity = useCallback((partId: string, clientX: number, clientY: number) => {
    const cached = cachedSlotRectsRef.current.get(partId);
    if (cached) {
      const distance = Math.hypot(clientX - cached.centerX, clientY - cached.centerY);
      const isInsideBounds =
        clientX >= cached.left - 40 &&
        clientX <= cached.right + 40 &&
        clientY >= cached.top - 40 &&
        clientY <= cached.bottom + 40;

      return isInsideBounds || distance < Math.max(90, cached.radiusTolerance);
    }

    const slotEl = slotRefs.current[partId];
    if (!slotEl) return false;

    const rect = slotEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distance = Math.hypot(clientX - centerX, clientY - centerY);
    const radiusTolerance = Math.max(rect.width, rect.height) * 0.62;

    const isInsideBounds =
      clientX >= rect.left - 40 &&
      clientX <= rect.right + 40 &&
      clientY >= rect.top - 40 &&
      clientY <= rect.bottom + 40;

    return isInsideBounds || distance < Math.max(90, radiusTolerance);
  }, []);

  // Pointer event drag handlers (Pointer Events with Pointer Capture)
  const handlePointerDown = (part: DevrimEnginePart, e: React.PointerEvent<HTMLDivElement>) => {
    if (completionTriggeredRef.current || isAllCompleted || placedPartIds.includes(part.id) || dragState) return;

    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // Safe fallback
    }

    // Cache slot target rects at pointerdown once to avoid getBoundingClientRect on move
    cachedSlotRectsRef.current.clear();
    Object.entries(slotRefs.current).forEach(([pId, el]) => {
      if (el) {
        const r = el.getBoundingClientRect();
        cachedSlotRectsRef.current.set(pId, {
          left: r.left,
          right: r.right,
          top: r.top,
          bottom: r.bottom,
          centerX: r.left + r.width / 2,
          centerY: r.top + r.height / 2,
          radiusTolerance: Math.max(r.width, r.height) * 0.62,
        });
      }
    });

    dragCoordsRef.current = { x: e.clientX, y: e.clientY };
    hoveredSlotIdRef.current = null;
    setHasInteracted(true);
    setDragState({
      partId: part.id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    });

    SoundFx.playClickTone?.();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.pointerId !== e.pointerId) return;

    const x = e.clientX;
    const y = e.clientY;
    dragCoordsRef.current = { x, y };

    if (dragRafRef.current !== null) cancelAnimationFrame(dragRafRef.current);
    dragRafRef.current = requestAnimationFrame(() => {
      if (dragAvatarRef.current) {
        dragAvatarRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(1.08)`;
      }
    });

    const isHovering = checkSlotProximity(dragState.partId, x, y);
    const targetHoverId = isHovering ? dragState.partId : null;
    if (targetHoverId !== hoveredSlotIdRef.current) {
      hoveredSlotIdRef.current = targetHoverId;
      setHoveredSlotId(targetHoverId);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.pointerId !== e.pointerId) return;

    if (dragRafRef.current !== null) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Safe fallback
    }

    const { partId, startX, startY } = dragState;
    const movedDist = Math.hypot(e.clientX - startX, e.clientY - startY);
    const isSnapped = checkSlotProximity(partId, e.clientX, e.clientY);

    if (isSnapped) {
      snapPartIntoSlot(partId);
    } else if (movedDist < 10) {
      // Tap-to-place toggle selection
      setSelectedPartId(prev => (prev === partId ? null : partId));
    } else {
      // Wrong drop: gentle shake, no harsh buzzer, return to tray smoothly
      setShakingPartId(partId);
      SoundFx.playClickTone?.();
      const retryMsg = 'Bir kez daha deneyelim!';
      onFeedbackMessageRef.current?.(retryMsg);

      if (shakeTimerRef.current !== null) window.clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = window.setTimeout(() => {
        setShakingPartId(null);
      }, 300);
    }

    setDragState(null);
    setHoveredSlotId(null);
    hoveredSlotIdRef.current = null;
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.pointerId !== e.pointerId) return;

    if (dragRafRef.current !== null) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Safe fallback
    }
    setDragState(null);
    setHoveredSlotId(null);
    hoveredSlotIdRef.current = null;
  };

  return (
    <div
      className="devrim-assembly-container"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        userSelect: 'none',
        padding: '0 16px 48px 16px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* =========================================================================
          TOP RIGHT FLOATING HUD: PARÇA MONTAJI: 0 / 4
          ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          top: '2px',
          right: '28px',
          zIndex: 35,
          padding: '5px 16px',
          borderRadius: '9999px',
          background: 'rgba(8, 14, 26, 0.92)',
          border: '1.2px solid rgba(245, 158, 11, 0.45)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span style={{ color: '#F5A400', fontSize: '11px', fontWeight: '900', letterSpacing: '1px' }}>
          PARÇA MONTAJI:
        </span>
        <span
          style={{
            color: placedPartIds.length === 4 ? '#10B981' : '#FEF08A',
            fontSize: '13.5px',
            fontWeight: '900',
          }}
        >
          {placedPartIds.length} / 4
        </span>
      </div>

      {/* =========================================================================
          MIDDLE ROW: LEFT MISSION PANEL + KAŞİF & CENTER ENGINE STAGE
          ========================================================================= */}
      <div
        style={{
          width: '100%',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          minHeight: 0,
        }}
      >
        {/* -----------------------------------------------------------------------
            LEFT: SLEEK FLOATING MISSION PANEL & KAŞİF MASCOT
            ----------------------------------------------------------------------- */}
        <div
          className="devrim-assembly-left-panel"
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: 'clamp(210px, 17vw, 260px)',
            zIndex: 30,
            pointerEvents: 'none',
          }}
        >
          {/* 🎯 GÖREV Card */}
          <div
            style={{
              position: 'relative',
              background: 'rgba(8, 14, 26, 0.9)',
              border: '1.5px solid rgba(245, 164, 0, 0.35)',
              borderRadius: '16px',
              padding: '14px 16px',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              pointerEvents: 'auto',
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
                lineHeight: '1.35',
              }}
            >
              Parçaları doğru yuvalara yerleştir.
            </div>
            <div
              style={{
                color: '#94A3B8',
                fontSize: '11px',
                lineHeight: '1.4',
                marginTop: '2px',
              }}
            >
              Tüm parçaları tamamladığında motor hazır olacak.
            </div>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            CENTER: THE CINEMATIC DEVRİM ENGINE BAY ASSEMBLY SCENE
            ----------------------------------------------------------------------- */}
        <div
          ref={stageRef}
          className="devrim-engine-stage"
          style={{
            position: 'relative',
            width: 'min(920px, 60vw)',
            aspectRatio: '16 / 10',
            maxHeight: 'calc(100vh - 250px)',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 24px 70px rgba(0,0,0,0.85), 0 0 0 1.5px rgba(245, 158, 11, 0.35)',
            background: '#070B14',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: isAllCompleted ? 'scale(1.015)' : 'scale(1)',
            transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          {/* Cinematic 1960s Devrim Car Front & Open Engine Bay Scene */}
          <DevrimEngineBayScene placedPartIds={placedPartIds} />

          {/* =====================================================================
              THE 4 TARGET SLOTS & SNAPPED PARTS
              100% Geometry, Aspect Ratio & Coordinate match with Draggable pieces
              ===================================================================== */}
          {DEVRIM_ENGINE_PARTS.map(part => {
            const isPlaced = placedPartIds.includes(part.id);
            const isHovered = hoveredSlotId === part.id;
            const isSelectedTarget = selectedPartId === part.id;
            const isJustSnapped = justSnappedPartId === part.id;

            return (
              <div
                key={part.id}
                ref={el => {
                  slotRefs.current[part.id] = el;
                }}
                onClick={() => {
                  if (selectedPartId === part.id) {
                    snapPartIntoSlot(part.id);
                  }
                }}
                style={{
                  position: 'absolute',
                  left: `${part.slot.leftPercent}%`,
                  top: `${part.slot.topPercent}%`,
                  width: `${part.slot.widthPercent}%`,
                  height: `${part.slot.heightPercent}%`,
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: selectedPartId === part.id ? 'pointer' : 'default',
                  zIndex: isHovered || isSelectedTarget || isJustSnapped ? 25 : isPlaced ? 15 : 10,
                  transition: 'transform 0.2s ease',
                }}
              >
                {/* Floating Slot Label Badge (Visible only when empty) */}
                {!isPlaced && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-13px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: isHovered
                        ? '#0284C7'
                        : isSelectedTarget
                        ? '#D97706'
                        : 'rgba(15, 23, 42, 0.92)',
                      color: isHovered || isSelectedTarget ? '#FFFFFF' : '#FEF08A',
                      fontSize: '9.5px',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      whiteSpace: 'nowrap',
                      border: isHovered
                        ? '1.2px solid #38BDF8'
                        : isSelectedTarget
                        ? '1.2px solid #F59E0B'
                        : '1px solid rgba(245, 158, 11, 0.5)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                      pointerEvents: 'none',
                      letterSpacing: '0.4px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {part.name}
                  </div>
                )}

                {/* Exact Geometry SVG: Slot Silhouette OR Full Snapped Part */}
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: isJustSnapped
                      ? 'devrimSnapPulse 0.5s ease-out'
                      : isHovered || isSelectedTarget
                      ? 'devrimHoverGlow 1.4s infinite ease-in-out'
                      : 'none',
                  }}
                >
                  {isPlaced ? (
                    <DevrimEnginePartSvg id={part.id} isSlot={false} />
                  ) : (
                    <DevrimEnginePartSvg
                      id={part.id}
                      isSlot={true}
                      glow={isHovered || isSelectedTarget}
                    />
                  )}
                </div>

                {/* Sparkle burst on successful snap */}
                {isJustSnapped && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: '-10px',
                      borderRadius: '16px',
                      border: '2px solid #10B981',
                      boxShadow: '0 0 35px rgba(16, 185, 129, 0.9), inset 0 0 20px rgba(16, 185, 129, 0.5)',
                      pointerEvents: 'none',
                      animation: 'devrimSparkleFade 0.65s ease-out forwards',
                    }}
                  />
                )}
              </div>
            );
          })}

          {/* 4/4 Completed Light Sweep Effect */}
          {isAllCompleted && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(105deg, transparent 20%, rgba(245, 158, 11, 0.4) 45%, rgba(56, 189, 248, 0.5) 55%, transparent 80%)',
                pointerEvents: 'none',
                zIndex: 40,
                animation: 'devrimCompletedSweep 1.2s ease-in-out forwards',
              }}
            />
          )}
        </div>
      </div>

      {/* =========================================================================
          BOTTOM: PARÇALAR TEPSİSİ (4 Draggable Cards, Shuffled at Start)
          ========================================================================= */}
      <div
        className="devrim-parts-tray-container"
        style={{
          width: 'min(920px, 60vw)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          zIndex: 30,
        }}
      >
        {/* Tray Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '0 8px',
          }}
        >
          <span
            style={{
              color: '#F5A400',
              fontSize: '11px',
              fontWeight: '900',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
            }}
          >
            PARÇALAR
          </span>
          <span style={{ color: '#94A3B8', fontSize: '10.5px', fontWeight: '500' }}>
            Parçayı sürükle ve motor üzerindeki yuvaya bırak
          </span>
        </div>

        {/* Tray Body with 4 Cards */}
        <div
          className="devrim-parts-tray"
          style={{
            width: '100%',
            padding: '6px 12px',
            background: 'rgba(10, 16, 28, 0.94)',
            border: '1.5px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.65)',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '12px',
            alignItems: 'center',
            boxSizing: 'border-box',
          }}
        >
          {shuffledParts.map((part, idx) => {
            const isPlaced = placedPartIds.includes(part.id);
            const isDraggingThis = dragState?.partId === part.id;
            const isSelected = selectedPartId === part.id;
            const isShaking = shakingPartId === part.id;

            return (
              <div
                key={part.id}
                onPointerDown={e => handlePointerDown(part, e)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  height: '76px',
                  background: isPlaced
                    ? 'rgba(15, 23, 42, 0.4)'
                    : isSelected
                    ? 'rgba(245, 158, 11, 0.25)'
                    : isDraggingThis
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(20, 30, 48, 0.88)',
                  border: isPlaced
                    ? '1.5px solid rgba(71, 85, 105, 0.35)'
                    : isSelected
                    ? '2px solid #F59E0B'
                    : isDraggingThis
                    ? '2px solid #38BDF8'
                    : '1.5px solid rgba(255, 255, 255, 0.14)',
                  boxShadow: isSelected
                    ? '0 0 16px rgba(245, 158, 11, 0.7)'
                    : isDraggingThis
                    ? '0 0 14px rgba(56, 189, 248, 0.6)'
                    : 'none',
                  cursor: isPlaced ? 'default' : 'grab',
                  opacity: isPlaced ? 0.35 : isDraggingThis ? 0.2 : 1,
                  touchAction: 'none',
                  userSelect: 'none',
                  transition: isDraggingThis ? 'none' : 'transform 0.2s ease, border-color 0.2s ease',
                  animation: isShaking ? 'devrimWrongDropShake 0.3s ease' : 'none',
                }}
              >
                {/* Minimal 6-Dot Grip Indicator on Left */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                    marginRight: '6px',
                    opacity: isPlaced ? 0.2 : 0.6,
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', gap: '3px' }}>
                    <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#94A3B8' }} />
                    <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#94A3B8' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#94A3B8' }} />
                    <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#94A3B8' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#94A3B8' }} />
                    <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#94A3B8' }} />
                  </div>
                </div>

                {/* Part Graphic & Name Container */}
                <div
                  style={{
                    flex: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minWidth: 0,
                  }}
                >
                  {/* Part Graphic */}
                  <div
                    style={{
                      width: '100%',
                      height: '50px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <DevrimEnginePartSvg id={part.id} width="88%" height="88%" />
                  </div>

                  {/* Part Name */}
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      color: isPlaced ? '#94A3B8' : '#F1F5F9',
                      textAlign: 'center',
                      lineHeight: '1.1',
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                    }}
                  >
                    {isPlaced ? `✓ ${part.name}` : part.name}
                  </span>
                </div>

                {/* Onboarding Interactive Hand Icon on first unplaced item */}
                {!hasInteracted && idx === 0 && !isPlaced && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '6px',
                      bottom: '6px',
                      pointerEvents: 'none',
                      animation: 'devrimHandBounce 1.8s infinite ease-in-out',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M8 12V4a2 2 0 114 0v6M12 10a2 2 0 114 0v2M16 12a2 2 0 114 0v4a7 7 0 11-14 0v-4"
                        stroke="#38BDF8"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          ACTIVE DRAG GHOST (Follows Cursor / Touch)
          GPU-accelerated translate3d with 60fps requestAnimationFrame
          ========================================================================= */}
      {dragState && (
        <div
          ref={dragAvatarRef}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            transform: `translate3d(${dragState.startX}px, ${dragState.startY}px, 0) translate(-50%, -50%) scale(1.08)`,
            width: '120px',
            height: '90px',
            pointerEvents: 'none',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(0 14px 28px rgba(0,0,0,0.8)) drop-shadow(0 0 18px rgba(245, 158, 11, 0.65))',
            willChange: 'transform',
          }}
        >
          <DevrimEnginePartSvg id={dragState.partId} width="100%" height="100%" />
        </div>
      )}
    </div>
  );
};
