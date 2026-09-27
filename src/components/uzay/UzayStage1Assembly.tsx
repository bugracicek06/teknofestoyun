import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SPACECRAFT_PARTS, type SpacecraftPart, type SpacecraftPartId } from '../../data/uzayData';
import { SoundFx } from '../../game/utils/audio';
import {
  SatelliteDefs,
  SatelliteBodyGeometry,
  SatelliteSolarLeftGeometry,
  SatelliteSolarRightGeometry,
  SatelliteAntennaGeometry,
  SatelliteSensorGeometry,
  SatelliteHeatShieldGeometry,
  SatellitePartCardPreview,
  FullyAssembledSatellite,
} from './UzaySatelliteModel';

interface UzayStage1AssemblyProps {
  onComplete: () => void;
  onProgressChange?: (placedCount: number) => void;
}

interface DragSession {
  part: SpacecraftPart;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  pointerId: number;
}

export const UzayStage1Assembly: React.FC<UzayStage1AssemblyProps> = ({
  onComplete: _onComplete,
  onProgressChange,
}) => {
  const [placedPartIds, setPlacedPartIds] = useState<SpacecraftPartId[]>([]);
  const [dragSession, setDragSession] = useState<DragSession | null>(null);
  const [nearTargetPartId, setNearTargetPartId] = useState<SpacecraftPartId | null>(null);
  const [justSnappedPartId, setJustSnappedPartId] = useState<SpacecraftPartId | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [orderHint, setOrderHint] = useState<boolean>(false);

  const assemblySvgRef = useRef<SVGSVGElement | null>(null);
  const dragAvatarRef = useRef<HTMLDivElement | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);
  const cardBoundsRef = useRef<Map<SpacecraftPartId, DOMRect>>(new Map());

  const placedCount = placedPartIds.length;
  const isBodyPlaced = placedPartIds.includes('body');
  const isAllPlaced = placedCount === SPACECRAFT_PARTS.length;

  // Determine current suggested step in sequence (1: body, 2: solar_left, 3: solar_right, 4: antenna, 5: sensor, 6: heat_shield)
  const currentSuggestedPart = SPACECRAFT_PARTS.find(p => !placedPartIds.includes(p.id)) || SPACECRAFT_PARTS[0];

  useEffect(() => {
    onProgressChange?.(placedCount);
  }, [placedCount, onProgressChange]);

  // Update card bounds for smooth return animation on drop miss
  const updateCardBounds = useCallback(() => {
    SPACECRAFT_PARTS.forEach(part => {
      const el = document.getElementById(`part-card-${part.id}`);
      if (el) {
        cardBoundsRef.current.set(part.id, el.getBoundingClientRect());
      }
    });
  }, []);

  useEffect(() => {
    updateCardBounds();
    window.addEventListener('resize', updateCardBounds);
    return () => window.removeEventListener('resize', updateCardBounds);
  }, [updateCardBounds]);

  // Snap part into exact mounting coordinates
  const handleSnapPart = useCallback((part: SpacecraftPart) => {
    if (placedPartIds.includes(part.id)) return;

    SoundFx.playGearSnap();
    setJustSnappedPartId(part.id);
    setTimeout(() => setJustSnappedPartId(null), 650);

    const cheers = ['Harika! ✓', 'Süper! ✓', 'Çok İyi! ✓', 'Mükemmel! ✓'];
    const cheer = cheers[Math.floor(Math.random() * cheers.length)];
    setSuccessToast(cheer);
    setTimeout(() => setSuccessToast(null), 900);

    const nextPlaced = [...placedPartIds, part.id];
    setPlacedPartIds(nextPlaced);
    setDragSession(null);
    dragSessionRef.current = null;
    setNearTargetPartId(null);
    setOrderHint(false);

    if (nextPlaced.length === SPACECRAFT_PARTS.length) {
      setTimeout(() => {
        SoundFx.playSuccessTone();
      }, 350);
    }
  }, [placedPartIds]);

  // Cancel drag with smooth glide back to bottom tray
  const handleCancelDrag = useCallback(() => {
    if (!dragSessionRef.current) return;
    const session = dragSessionRef.current;
    const cardRect = cardBoundsRef.current.get(session.part.id);
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
      setNearTargetPartId(null);
    }, 220);
  }, []);

  // Pointer Down on draggable card
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, part: SpacecraftPart) => {
    if (placedPartIds.includes(part.id)) return;

    e.preventDefault();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    // If body is not placed and child picks up another part, show friendly reminder
    if (!isBodyPlaced && part.id !== 'body') {
      setOrderHint(true);
      SoundFx.playClickTone();
    } else {
      setOrderHint(false);
    }

    const session: DragSession = {
      part,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      pointerId: e.pointerId,
    };

    setDragSession(session);
    dragSessionRef.current = session;
    updateCardBounds();
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragSessionRef.current || dragSessionRef.current.pointerId !== e.pointerId) return;
    e.preventDefault();

    const curX = e.clientX;
    const curY = e.clientY;

    dragSessionRef.current.currentX = curX;
    dragSessionRef.current.currentY = curY;

    if (dragAvatarRef.current) {
      dragAvatarRef.current.style.transform = `translate3d(${curX}px, ${curY}px, 0) translate(-50%, -50%)`;
    }

    // Hit test with SVG assembly canvas (viewBox: 0 0 1000 700)
    if (assemblySvgRef.current) {
      const svgRect = assemblySvgRef.current.getBoundingClientRect();
      const normX = ((curX - svgRect.left) / svgRect.width) * 1000;
      const normY = ((curY - svgRect.top) / svgRect.height) * 700;

      const part = dragSessionRef.current.part;

      // If body is not placed, only body slot accepts snap!
      if (!isBodyPlaced && part.id !== 'body') {
        setNearTargetPartId(null);
        return;
      }

      const dx = normX - part.targetX;
      const dy = normY - part.targetY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Generous kid-friendly proximity detection
      if (dist <= part.snapRadius * 1.35) {
        setNearTargetPartId(part.id);
      } else {
        setNearTargetPartId(null);
      }
    }
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragSessionRef.current || dragSessionRef.current.pointerId !== e.pointerId) return;
    e.preventDefault();

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if already released
    }

    const session = dragSessionRef.current;
    const part = session.part;

    // Rule: if body not placed, guide to body
    if (!isBodyPlaced && part.id !== 'body') {
      setOrderHint(true);
      handleCancelDrag();
      return;
    }

    if (assemblySvgRef.current) {
      const svgRect = assemblySvgRef.current.getBoundingClientRect();
      const normX = ((e.clientX - svgRect.left) / svgRect.width) * 1000;
      const normY = ((e.clientY - svgRect.top) / svgRect.height) * 700;

      const dx = normX - part.targetX;
      const dy = normY - part.targetY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Generous kid snap tolerance (broad hit area)
      if (dist <= part.snapRadius * 1.15) {
        handleSnapPart(part);
        return;
      }
    }

    // If not snapped, cancel smoothly
    handleCancelDrag();
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragSessionRef.current || dragSessionRef.current.pointerId !== e.pointerId) return;
    handleCancelDrag();
  };

  // Check if a part slot is the current active target
  const isPartActiveTarget = (partId: SpacecraftPartId) => {
    if (dragSession) {
      return dragSession.part.id === partId;
    }
    return currentSuggestedPart.id === partId;
  };

  return (
    <div
      className="uzay-stage1-assembly"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '8px 24px 12px 24px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <style>{`
        @keyframes spaceFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        @keyframes targetPulse {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.6)); }
          50% { filter: drop-shadow(0 0 20px rgba(56, 189, 248, 1)); }
        }
        @keyframes bounceDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
        @keyframes cardPulseGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(56, 189, 248, 0.4); border-color: #38BDF8; }
          50% { box-shadow: 0 0 22px rgba(56, 189, 248, 0.9); border-color: #67E8F9; }
        }
        @keyframes cheerPop {
          0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      `}</style>

      {/* Three-Column Central Layout */}
      <div
        className="uzay-assembly-body"
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr 290px',
          gap: '16px',
          alignItems: 'stretch',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* ================= LEFT TASK & INSTRUCTION PANEL ================= */}
        <div
          className="uzay-left-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '10px',
            zIndex: 10,
          }}
        >
          {/* Kid-Friendly Instruction Card */}
          <div
            style={{
              background: 'rgba(8, 18, 38, 0.90)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '16px',
              padding: '16px 18px',
              boxShadow: '0 8px 32px rgba(2, 6, 23, 0.65)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0284C7, #38BDF8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  boxShadow: '0 0 16px rgba(56, 189, 248, 0.5)',
                }}
              >
                🚀
              </div>
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '17px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  UZAY ARACINI TASARLA
                </h2>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#38BDF8',
                    textTransform: 'uppercase',
                  }}
                >
                  PARÇALARI YUVASINA YERLEŞTİR
                </div>
              </div>
            </div>

            <p
              style={{
                margin: '10px 0 14px 0',
                fontSize: '13px',
                lineHeight: 1.5,
                color: '#CBD5E1',
              }}
            >
              Parçaları doğru yerlere sürükleyerek uzay aracını tamamla.
            </p>

            {/* Current Step Banner for Kids */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: !isBodyPlaced ? 'rgba(56, 189, 248, 0.16)' : isAllPlaced ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.14)',
                border: !isBodyPlaced ? '1.5px solid #38BDF8' : isAllPlaced ? '1.5px solid #34D399' : '1.5px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '12px',
                padding: '10px 14px',
                boxShadow: !isBodyPlaced ? '0 0 18px rgba(56, 189, 248, 0.25)' : 'none',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: isAllPlaced ? '#10B981' : '#0284C7',
                  border: isAllPlaced ? '1.5px solid #6EE7B7' : '1.5px solid #38BDF8',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '13px',
                  flexShrink: 0,
                }}
              >
                {isAllPlaced ? '✓' : currentSuggestedPart.stepNumber}
              </div>
              <div style={{ fontSize: '12px', lineHeight: 1.4 }}>
                <strong style={{ display: 'block', color: isAllPlaced ? '#34D399' : '#38BDF8', fontSize: '12.5px' }}>
                  {isAllPlaced
                    ? 'UZAY ARACI HAZIR!'
                    : `${currentSuggestedPart.stepNumber}. ADIM: ${currentSuggestedPart.name}`}
                </strong>
                <span style={{ color: '#E2E8F0' }}>
                  {isAllPlaced
                    ? 'Devam et butonuna basarak ilerle.'
                    : !isBodyPlaced
                    ? 'Önce Ana Gövdeyi yerleştir.'
                    : `${currentSuggestedPart.name} parçasını yuvaya sürükle.`}
                </span>
              </div>
            </div>
          </div>

          {/* Kaşif Mascot & Speech Bubble */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(6, 15, 30, 0.82)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '16px',
              padding: '12px 14px',
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* Mascot Avatar */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0284C7, #0F172A)',
                border: '2px solid #38BDF8',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                flexShrink: 0,
              }}
            >
              🤖
            </div>

            {/* Speech Bubble */}
            <div
              style={{
                position: 'relative',
                background: 'rgba(15, 23, 42, 0.95)',
                border: orderHint ? '1.5px solid #F59E0B' : '1px solid #38BDF8',
                borderRadius: '12px',
                padding: '9px 12px',
                fontSize: '12px',
                lineHeight: 1.45,
                color: orderHint ? '#FDE68A' : '#E0F2FE',
                boxShadow: '0 4px 16px rgba(56, 189, 248, 0.15)',
                transition: 'all 0.25s ease',
              }}
            >
              {orderHint
                ? 'Önce Ana Gövdeyi yerleştirmeliyiz. Diğer sistemler gövdeye bağlanacak!'
                : isAllPlaced
                ? 'Tebrikler Kaşif! Uzay aracımız hazır, harika bir iş çıkardın!'
                : !isBodyPlaced
                ? 'İlk olarak Ana Gövdeyi merkezdeki yuvaya yerleştir!'
                : `Çok iyi gidiyorsun! Şimdi ${currentSuggestedPart.name} parçasını takalım.`}
            </div>
          </div>
        </div>

        {/* ================= CENTER SPACECRAFT ASSEMBLY ZONE ================= */}
        <div
          className="uzay-center-zone"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: '20px',
            background: `radial-gradient(circle at 50% 45%, rgba(14, 116, 144, 0.2) 0%, rgba(2, 6, 23, 0.96) 75%), url('/assets/uzay/space_hangar_bg.jpg') center/cover no-repeat`,
            border: '1.5px solid rgba(56, 189, 248, 0.3)',
            boxShadow: 'inset 0 0 60px rgba(2, 6, 23, 0.85), 0 12px 40px rgba(0, 0, 0, 0.75)',
          }}
        >
          {/* Celebratory Joyful Snap Toast */}
          {successToast && (
            <div
              style={{
                position: 'absolute',
                top: '22%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.95), rgba(16, 185, 129, 0.95))',
                border: '2px solid #6EE7B7',
                borderRadius: '30px',
                padding: '10px 28px',
                color: '#FFFFFF',
                fontSize: '18px',
                fontWeight: 900,
                letterSpacing: '1px',
                boxShadow: '0 0 35px rgba(16, 185, 129, 0.8)',
                zIndex: 40,
                animation: 'cheerPop 0.35s ease-out forwards',
                pointerEvents: 'none',
              }}
            >
              {successToast}
            </div>
          )}

          {/* Top Status Notification Badge when fully assembled */}
          {isAllPlaced && (
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.95), rgba(16, 185, 129, 0.9))',
                border: '1.5px solid #34D399',
                borderRadius: '30px',
                padding: '9px 26px',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '1px',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.65)',
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '18px' }}>✓</span>
              <span>UZAY ARACI HAZIR!</span>
            </div>
          )}

          {/* SVG Assembly Canvas (1000 x 700 normalized coordinates) */}
          <svg
            ref={assemblySvgRef}
            viewBox="0 0 1000 700"
            preserveAspectRatio="xMidYMid meet"
            style={{
              width: '100%',
              height: '100%',
              maxHeight: '100%',
              display: 'block',
              overflow: 'visible',
            }}
          >
            <SatelliteDefs />

            {/* Hangar Floor Docking Pedestal with Concentric Glowing Rings */}
            <g id="hangar-docking-pedestal" opacity="0.85">
              <ellipse cx="500" cy="590" rx="340" ry="52" fill="none" stroke="#0284C7" strokeWidth="2.5" strokeOpacity="0.35" />
              <ellipse cx="500" cy="590" rx="260" ry="40" fill="none" stroke="#38BDF8" strokeWidth="1.8" strokeDasharray="8,6" strokeOpacity="0.55" />
              <ellipse cx="500" cy="590" rx="170" ry="26" fill="none" stroke="#38BDF8" strokeWidth="2" strokeOpacity="0.75" />
              <ellipse cx="500" cy="590" rx="105" ry="16" fill="rgba(56, 189, 248, 0.12)" stroke="#67E8F9" strokeWidth="1.5" />
              <circle cx="500" cy="590" r="5" fill="#38BDF8" filter="url(#cyanGlow)" />
            </g>

            {/* If all 6 parts are placed: render unified floating spacecraft without any slot guides! */}
            {isAllPlaced ? (
              <g style={{ animation: 'spaceFloat 4s ease-in-out infinite' }}>
                <FullyAssembledSatellite />
              </g>
            ) : (
              /* Modular Assembly Layers: COMPLETE BLUEPRINT SHOWN FROM THE VERY START! */
              <g id="modular-spacecraft-assembly">
                {/* 1. Left Solar Array */}
                {placedPartIds.includes('solar_left') ? (
                  <SatelliteSolarLeftGeometry />
                ) : (
                  <SatelliteSolarLeftGeometry
                    isGhost
                    isNear={nearTargetPartId === 'solar_left'}
                    isActiveTarget={isPartActiveTarget('solar_left')}
                  />
                )}

                {/* 2. Right Solar Array */}
                {placedPartIds.includes('solar_right') ? (
                  <SatelliteSolarRightGeometry />
                ) : (
                  <SatelliteSolarRightGeometry
                    isGhost
                    isNear={nearTargetPartId === 'solar_right'}
                    isActiveTarget={isPartActiveTarget('solar_right')}
                  />
                )}

                {/* 3. Heat Shield / Lower Module */}
                {placedPartIds.includes('heat_shield') ? (
                  <SatelliteHeatShieldGeometry />
                ) : (
                  <SatelliteHeatShieldGeometry
                    isGhost
                    isNear={nearTargetPartId === 'heat_shield'}
                    isActiveTarget={isPartActiveTarget('heat_shield')}
                  />
                )}

                {/* 4. Main Body Bus */}
                {placedPartIds.includes('body') ? (
                  <SatelliteBodyGeometry />
                ) : (
                  <g style={!isBodyPlaced ? { animation: 'targetPulse 2s ease-in-out infinite' } : undefined}>
                    <SatelliteBodyGeometry
                      isGhost
                      isNear={nearTargetPartId === 'body'}
                      isActiveTarget={isPartActiveTarget('body')}
                    />
                  </g>
                )}

                {/* 5. Communications Antenna Dish */}
                {placedPartIds.includes('antenna') ? (
                  <SatelliteAntennaGeometry />
                ) : (
                  <SatelliteAntennaGeometry
                    isGhost
                    isNear={nearTargetPartId === 'antenna'}
                    isActiveTarget={isPartActiveTarget('antenna')}
                  />
                )}

                {/* 6. Scientific Sensor Pod */}
                {placedPartIds.includes('sensor') ? (
                  <SatelliteSensorGeometry />
                ) : (
                  <SatelliteSensorGeometry
                    isGhost
                    isNear={nearTargetPartId === 'sensor'}
                    isActiveTarget={isPartActiveTarget('sensor')}
                  />
                )}

                {/* Visual Direct Guidance Marker for Step 1 (Ana Gövde) */}
                {!isBodyPlaced && (
                  <g id="body-step1-marker" transform="translate(500, 345)" pointerEvents="none">
                    <rect
                      x="-110"
                      y="-22"
                      width="220"
                      height="44"
                      rx="22"
                      fill="rgba(2, 132, 199, 0.85)"
                      stroke="#38BDF8"
                      strokeWidth="2"
                      filter="url(#cyanGlow)"
                    />
                    <text
                      x="0"
                      y="5"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="13"
                      fontWeight="900"
                      letterSpacing="0.8"
                      fontFamily="'Outfit', sans-serif"
                    >
                      BURAYA YERLEŞTİR ↓
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* Snap Lock Effect Spark */}
            {justSnappedPartId && (
              <g
                id="snap-spark"
                transform={`translate(${SPACECRAFT_PARTS.find(p => p.id === justSnappedPartId)?.targetX || 500}, ${
                  SPACECRAFT_PARTS.find(p => p.id === justSnappedPartId)?.targetY || 350
                })`}
              >
                <circle cx="0" cy="0" r="60" fill="none" stroke="#38BDF8" strokeWidth="3" opacity="0.8">
                  <animate attributeName="r" from="15" to="80" dur="0.45s" repeatCount="1" />
                  <animate attributeName="opacity" from="0.9" to="0" dur="0.45s" repeatCount="1" />
                </circle>
                <circle cx="0" cy="0" r="10" fill="#38BDF8" filter="url(#cyanGlow)" />
              </g>
            )}
          </svg>
        </div>

        {/* ================= RIGHT PREVIEW & CHECKLIST PANEL ================= */}
        <div
          className="uzay-right-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 10,
          }}
        >
          {/* Design Preview Card */}
          <div
            style={{
              background: 'rgba(8, 18, 38, 0.90)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '16px',
              padding: '12px 14px',
              boxShadow: '0 8px 32px rgba(2, 6, 23, 0.65)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ color: '#38BDF8', fontSize: '15px' }}>🛰️</span>
              <h3
                style={{
                  margin: 0,
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.8px',
                  color: '#38BDF8',
                  textTransform: 'uppercase',
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                TASARIM ÖNİZLEMESİ
              </h3>
            </div>

            {/* Scaled Preview Frame */}
            <div
              style={{
                width: '100%',
                height: '115px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9), rgba(15, 23, 42, 0.9))',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <svg viewBox="0 0 1000 700" style={{ width: '92%', height: '92%' }}>
                <SatelliteDefs />
                <FullyAssembledSatellite />
              </svg>
            </div>
          </div>

          {/* Mission Progress / Checklist Card */}
          <div
            style={{
              background: 'rgba(8, 18, 38, 0.90)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '16px',
              padding: '13px 15px',
              boxShadow: '0 8px 32px rgba(2, 6, 23, 0.65)',
              backdropFilter: 'blur(12px)',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#38BDF8', fontSize: '15px' }}>⚙️</span>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      fontWeight: 800,
                      letterSpacing: '0.8px',
                      color: '#38BDF8',
                      textTransform: 'uppercase',
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    GÖREV İLERLEMESİ
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 900,
                    color: isAllPlaced ? '#34D399' : '#38BDF8',
                    background: isAllPlaced ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '8px',
                  }}
                >
                  {placedCount} / 6
                </span>
              </div>

              {/* Simplified Checklist for Kids */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {SPACECRAFT_PARTS.map(part => {
                  const isPlaced = placedPartIds.includes(part.id);
                  const isCurrent = currentSuggestedPart.id === part.id && !isPlaced;

                  return (
                    <div
                      key={part.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: isPlaced
                          ? 'rgba(16, 185, 129, 0.15)'
                          : isCurrent
                          ? 'rgba(56, 189, 248, 0.15)'
                          : 'rgba(15, 23, 42, 0.6)',
                        border: isPlaced
                          ? '1px solid rgba(16, 185, 129, 0.45)'
                          : isCurrent
                          ? '1px solid #38BDF8'
                          : '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: isPlaced
                              ? '1.5px solid #34D399'
                              : isCurrent
                              ? '1.5px solid #38BDF8'
                              : '1.5px solid #64748B',
                            background: isPlaced ? '#10B981' : isCurrent ? 'rgba(56, 189, 248, 0.3)' : 'transparent',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 900,
                          }}
                        >
                          {isPlaced ? '✓' : isCurrent ? '▶' : '○'}
                        </div>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: isPlaced || isCurrent ? 700 : 500,
                            color: isPlaced ? '#A7F3D0' : isCurrent ? '#FFFFFF' : '#94A3B8',
                          }}
                        >
                          {part.name}
                        </span>
                      </div>
                      {isPlaced && (
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#34D399' }}>
                          TAMAM
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div style={{ marginTop: '10px' }}>
              <div
                style={{
                  width: '100%',
                  height: '7px',
                  borderRadius: '4px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  overflow: 'hidden',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(placedCount / 6) * 100}%`,
                    background: isAllPlaced
                      ? 'linear-gradient(90deg, #10B981, #34D399)'
                      : 'linear-gradient(90deg, #0284C7, #38BDF8)',
                    transition: 'width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM HORIZONTAL PARTS TRAY ================= */}
      <div
        className="uzay-bottom-tray"
        style={{
          marginTop: '10px',
          background: 'rgba(8, 18, 38, 0.94)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '16px',
          padding: '10px 16px',
          boxShadow: '0 8px 32px rgba(2, 6, 23, 0.65)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '1px',
              color: '#38BDF8',
              textTransform: 'uppercase',
            }}
          >
            PARÇALAR
          </span>
          <span style={{ fontSize: '11px', color: '#94A3B8' }}>
            {!isBodyPlaced
              ? 'Önce Ana Gövdeyi yerleştirin'
              : 'Parçayı basılı tutarak montaj alanına sürükleyin'}
          </span>
        </div>

        {/* 6 Horizontal Cards: Ana Gövde, Sol Güneş Paneli, Sağ Güneş Paneli, Haberleşme Anteni, Bilimsel Sensör, Isı Kalkanı */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '12px',
          }}
        >
          {SPACECRAFT_PARTS.map(part => {
            const isPlaced = placedPartIds.includes(part.id);
            const isBeingDragged = dragSession?.part.id === part.id;
            const isTargetHighlight = currentSuggestedPart.id === part.id && !isPlaced;

            return (
              <div
                id={`part-card-${part.id}`}
                key={part.id}
                onPointerDown={e => handlePointerDown(e, part)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                style={{
                  position: 'relative',
                  height: '118px',
                  borderRadius: '12px',
                  background: isPlaced
                    ? 'linear-gradient(180deg, rgba(6, 78, 59, 0.5) 0%, rgba(15, 23, 42, 0.85) 100%)'
                    : isTargetHighlight
                    ? 'linear-gradient(180deg, rgba(2, 132, 199, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)'
                    : 'linear-gradient(180deg, rgba(15, 23, 42, 0.92) 0%, rgba(8, 15, 30, 0.98) 100%)',
                  border: isPlaced
                    ? '1.5px solid rgba(16, 185, 129, 0.65)'
                    : isBeingDragged
                    ? '2px solid #67E8F9'
                    : isTargetHighlight
                    ? '1.5px solid #38BDF8'
                    : '1px solid rgba(56, 189, 248, 0.25)',
                  boxShadow: isBeingDragged
                    ? '0 0 24px rgba(56, 189, 248, 0.55)'
                    : isTargetHighlight
                    ? '0 0 16px rgba(56, 189, 248, 0.3)'
                    : '0 4px 12px rgba(2, 6, 23, 0.4)',
                  padding: '7px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: isPlaced ? 'default' : 'grab',
                  touchAction: 'none',
                  opacity: isBeingDragged ? 0.35 : 1,
                  transition: 'border 0.2s ease, box-shadow 0.2s ease, background 0.3s ease',
                  animation: isTargetHighlight ? 'cardPulseGlow 2.5s infinite ease-in-out' : 'none',
                }}
              >
                {/* Part Visual Preview (65% area, large, high-contrast, perfectly centered) */}
                <div
                  style={{
                    width: '100%',
                    height: '68px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'visible',
                  }}
                >
                  <SatellitePartCardPreview partId={part.id} />
                </div>

                {/* Part Name & Prominent Action Label for Kids */}
                <div style={{ textAlign: 'center', width: '100%' }}>
                  <div
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 800,
                      color: isPlaced ? '#A7F3D0' : '#FFFFFF',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {part.name}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: isPlaced ? '#34D399' : isTargetHighlight ? '#67E8F9' : '#38BDF8',
                      marginTop: '2px',
                      letterSpacing: '0.4px',
                    }}
                  >
                    {isPlaced ? '✓ YERLEŞTİRİLDİ' : isTargetHighlight ? 'SÜRÜKLE VE YERLEŞTİR' : 'Sürükle'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= FLOATING DRAG AVATAR ================= */}
      {dragSession && (
        <div
          ref={dragAvatarRef}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            transform: `translate3d(${dragSession.currentX}px, ${dragSession.currentY}px, 0) translate(-50%, -50%)`,
            width: '160px',
            height: '110px',
            pointerEvents: 'none',
            zIndex: 9999,
            filter: 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.75)) drop-shadow(0 0 20px rgba(56, 189, 248, 0.65))',
            willChange: 'transform',
          }}
        >
          <SatellitePartCardPreview partId={dragSession.part.id} />
        </div>
      )}
    </div>
  );
};
