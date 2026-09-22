import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DEVRIM_ENGINE_PARTS, type DevrimEnginePart } from '../../data/devrimData';
import { DevrimEnginePartSvg } from './DevrimEnginePartsSVGs';
import { SoundFx } from '../../game/utils/audio';

interface DevrimEngineAssemblyProps {
  onComplete: () => void;
  onPartPlaced?: (partId: string) => void;
}

interface DragState {
  partId: DevrimEnginePart['id'];
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  originRect: DOMRect;
}

export const DevrimEngineAssembly: React.FC<DevrimEngineAssemblyProps> = ({
  onComplete,
  onPartPlaced,
}) => {
  const [placedPartIds, setPlacedPartIds] = useState<string[]>([]);
  const [justSnappedPartId, setJustSnappedPartId] = useState<string | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);
  const [isAllCompleted, setIsAllCompleted] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const onPartPlacedRef = useRef(onPartPlaced);
  onPartPlacedRef.current = onPartPlaced;

  const completionTriggeredRef = useRef(false);
  const completionTimerRef = useRef<number | null>(null);

  // Clean unmount cleanup: only clear timer when component unmounts
  useEffect(() => {
    return () => {
      if (completionTimerRef.current !== null) {
        window.clearTimeout(completionTimerRef.current);
        completionTimerRef.current = null;
      }
    };
  }, []);

  const triggerCompletion = useCallback(() => {
    if (completionTriggeredRef.current) return;
    completionTriggeredRef.current = true;
    setIsAllCompleted(true);
    SoundFx.playSuccessTone?.();

    if (completionTimerRef.current !== null) {
      window.clearTimeout(completionTimerRef.current);
    }
    completionTimerRef.current = window.setTimeout(() => {
      onCompleteRef.current?.();
    }, 1500);
  }, []);

  const snapPartIntoSlot = useCallback((partId: string) => {
    if (completionTriggeredRef.current) return;

    SoundFx.playLockSound?.();
    setJustSnappedPartId(partId);
    setSelectedPartId(null);
    onPartPlacedRef.current?.(partId);

    setTimeout(() => {
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
  }, [triggerCompletion]);

  // Secondary guard: catches pre-filled state or external updates
  useEffect(() => {
    if (placedPartIds.length >= DEVRIM_ENGINE_PARTS.length && !completionTriggeredRef.current) {
      triggerCompletion();
    }
  }, [placedPartIds, triggerCompletion]);

  // Pointer event handlers for drag
  const handlePointerDown = (part: DevrimEnginePart, e: React.PointerEvent<HTMLDivElement>) => {
    if (completionTriggeredRef.current || isAllCompleted || placedPartIds.includes(part.id) || dragState) return;

    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const rect = target.getBoundingClientRect();

    setDragState({
      partId: part.id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      originRect: rect,
    });

    SoundFx.playClickTone?.();
  };

  const checkSlotProximity = useCallback((partId: string, clientX: number, clientY: number) => {
    const slotEl = slotRefs.current[partId];
    if (!slotEl) return false;

    const rect = slotEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Generous proximity detection (radius of 90px or inside rect)
    const distance = Math.hypot(clientX - centerX, clientY - centerY);
    const isInside =
      clientX >= rect.left - 30 &&
      clientX <= rect.right + 30 &&
      clientY >= rect.top - 30 &&
      clientY <= rect.bottom + 30;

    return isInside || distance < 90;
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.pointerId !== e.pointerId) return;

    setDragState(prev => (prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null));

    const isHovering = checkSlotProximity(dragState.partId, e.clientX, e.clientY);
    setHoveredSlotId(isHovering ? dragState.partId : null);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.pointerId !== e.pointerId) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if capture was already released
    }

    const { partId, startX, startY } = dragState;
    const movedDist = Math.hypot(e.clientX - startX, e.clientY - startY);
    const isSnapped = checkSlotProximity(partId, e.clientX, e.clientY);

    if (isSnapped) {
      snapPartIntoSlot(partId);
    } else if (movedDist < 10) {
      // User tapped without dragging: toggle selection for tap-to-place
      setSelectedPartId(prev => (prev === partId ? null : partId));
    } else {
      // Wrong drop, return to tray
      SoundFx.playErrorTone?.();
    }

    setDragState(null);
    setHoveredSlotId(null);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.pointerId !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Safe fallback
    }
    setDragState(null);
    setHoveredSlotId(null);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        userSelect: 'none',
      }}
    >
      {/* =========================================================================
          ENGINE BAY WORKSHOP STAGE (Middle Focus)
          ========================================================================= */}
      <div
        ref={stageRef}
        className="devrim-engine-stage"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1060px',
          aspectRatio: '16 / 9',
          maxHeight: 'calc(100vh - 290px)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.65), 0 0 0 1px rgba(245, 158, 11, 0.25)',
          background: '#0B111E',
        }}
      >
        {/* Real Engine Bay Backdrop (Clean photographic view) */}
        <img
          src="/assets/devrim/devrim_engine_bay.jpg"
          alt="Devrim Motor Bölmesi"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
        />

        {/* Ambient Dark Vignette & Glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.06) 0%, rgba(10, 16, 28, 0.3) 70%, rgba(5, 8, 15, 0.7) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* =======================================================================
            TARGET SLOTS OVERLAY ON MOTOR (5 Precise Mounting Points)
            ======================================================================= */}
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
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: selectedPartId === part.id ? 'pointer' : 'default',
                border: isPlaced
                  ? '2px solid rgba(16, 185, 129, 0.85)'
                  : isHovered || isSelectedTarget
                  ? '3px solid #38BDF8'
                  : '1.5px dashed rgba(245, 158, 11, 0.75)',
                background: isPlaced
                  ? 'rgba(16, 185, 129, 0.18)'
                  : isHovered || isSelectedTarget
                  ? 'rgba(56, 189, 248, 0.32)'
                  : 'rgba(15, 23, 42, 0.55)',
                boxShadow: isPlaced
                  ? '0 0 20px rgba(16, 185, 129, 0.6)'
                  : isHovered || isSelectedTarget
                  ? '0 0 25px rgba(56, 189, 248, 0.85)'
                  : 'none',
                transition: 'all 0.25s ease',
                zIndex: isHovered || isSelectedTarget || isJustSnapped ? 20 : 10,
              }}
            >
              {/* Part Label Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '-18px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: isPlaced
                    ? 'rgba(6, 78, 59, 0.92)'
                    : isHovered
                    ? '#0284C7'
                    : 'rgba(15, 23, 42, 0.88)',
                  color: isPlaced ? '#A7F3D0' : isHovered ? '#FFFFFF' : '#FDE68A',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  whiteSpace: 'nowrap',
                  border: isPlaced
                    ? '1px solid rgba(16, 185, 129, 0.7)'
                    : '1px solid rgba(245, 158, 11, 0.4)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                  pointerEvents: 'none',
                  letterSpacing: '0.3px',
                }}
              >
                {isPlaced ? `✓ ${part.name}` : part.name}
              </div>

              {/* Rendered Part when Placed */}
              {isPlaced && (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: isJustSnapped ? 'scalePulse 0.45s ease-out' : 'none',
                  }}
                >
                  <DevrimEnginePartSvg id={part.id} width="95%" height="95%" />
                </div>
              )}
            </div>
          );
        })}

        {/* All Parts Complete Toast Overlay */}
        {isAllCompleted && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(10, 16, 28, 0.85)',
              backdropFilter: 'blur(4px)',
              zIndex: 50,
              animation: 'fadeIn 0.4s ease-out',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
                color: '#FFFFFF',
                padding: '16px 36px',
                borderRadius: '9999px',
                fontSize: '24px',
                fontWeight: '900',
                letterSpacing: '1px',
                boxShadow: '0 0 35px rgba(16, 185, 129, 0.8)',
                border: '2px solid #6EE7B7',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span>✓</span> MOTOR TAMAMLANDI
            </div>
            <p
              style={{
                color: '#E2E8F0',
                fontSize: '16px',
                fontWeight: '600',
                marginTop: '12px',
              }}
            >
              Devrim'in motoru hazır! Marş adımına geçiliyor...
            </p>
          </div>
        )}
      </div>

      {/* =========================================================================
          BOTTOM TRAY: DRAGGABLE ENGINE PARTS
          ========================================================================= */}
      <div
        className="devrim-parts-tray"
        style={{
          width: '100%',
          maxWidth: '1060px',
          marginTop: '12px',
          padding: '12px 18px',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1.5px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          gap: '12px',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        {DEVRIM_ENGINE_PARTS.map(part => {
          const isPlaced = placedPartIds.includes(part.id);
          const isDraggingThis = dragState?.partId === part.id;
          const isSelected = selectedPartId === part.id;

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
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 6px',
                borderRadius: '12px',
                minHeight: '102px',
                background: isPlaced
                  ? 'rgba(30, 41, 59, 0.35)'
                  : isSelected
                  ? 'rgba(245, 158, 11, 0.28)'
                  : isDraggingThis
                  ? 'rgba(245, 158, 11, 0.25)'
                  : 'rgba(30, 41, 59, 0.85)',
                border: isPlaced
                  ? '1.5px solid rgba(71, 85, 105, 0.4)'
                  : isSelected
                  ? '2.5px solid #F59E0B'
                  : isDraggingThis
                  ? '2px solid #F59E0B'
                  : '1.5px solid rgba(255, 255, 255, 0.15)',
                boxShadow: isSelected ? '0 0 16px rgba(245, 158, 11, 0.7)' : 'none',
                cursor: isPlaced ? 'default' : 'grab',
                opacity: isPlaced ? 0.35 : isDraggingThis ? 0.25 : 1,
                touchAction: 'none',
                userSelect: 'none',
                transition: isDraggingThis ? 'none' : 'all 0.2s ease',
              }}
            >
              {/* Part SVG Graphic */}
              <div
                style={{
                  width: '100%',
                  height: '62px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <DevrimEnginePartSvg id={part.id} width="85%" height="85%" />
              </div>

              {/* Part Name */}
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: isPlaced ? '#94A3B8' : '#F1F5F9',
                  textAlign: 'center',
                  lineHeight: '1.2',
                  pointerEvents: 'none',
                  marginTop: '4px',
                }}
              >
                {part.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          ACTIVE DRAG GHOST (Follows Cursor / Touch)
          ========================================================================= */}
      {dragState && (
        <div
          style={{
            position: 'fixed',
            left: `${dragState.currentX}px`,
            top: `${dragState.currentY}px`,
            transform: 'translate(-50%, -50%) scale(1.15)',
            width: '120px',
            height: '95px',
            padding: '8px',
            borderRadius: '12px',
            background: 'rgba(15, 23, 42, 0.92)',
            border: '2px solid #F59E0B',
            boxShadow: '0 12px 30px rgba(0,0,0,0.6), 0 0 20px rgba(245, 158, 11, 0.5)',
            pointerEvents: 'none',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DevrimEnginePartSvg id={dragState.partId} width="90%" height="70%" />
          <span
            style={{
              fontSize: '11px',
              fontWeight: '800',
              color: '#FDE68A',
              marginTop: '4px',
            }}
          >
            {DEVRIM_ENGINE_PARTS.find(p => p.id === dragState.partId)?.name}
          </span>
        </div>
      )}
    </div>
  );
};
