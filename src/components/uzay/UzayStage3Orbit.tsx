import React, { useState } from 'react';
import { ORBIT_OPTIONS, type OrbitId, type OrbitOption } from '../../data/uzayData';
import { SoundFx } from '../../game/utils/audio';
import { SatelliteDefs, FullyAssembledSatellite } from './UzaySatelliteModel';

interface UzayStage3OrbitProps {
  onComplete?: () => void;
  onNextStage?: () => void;
  onOrbitSelected?: (orbitId: OrbitId | null, isCorrect: boolean) => void;
}

export const UzayStage3Orbit: React.FC<UzayStage3OrbitProps> = ({
  onComplete: _onComplete,
  onNextStage: _onNextStage,
  onOrbitSelected,
}) => {
  const [selectedOrbitId, setSelectedOrbitId] = useState<OrbitId | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: 'success' | 'hint';
  } | null>(null);

  const selectedOrbit: OrbitOption | null =
    ORBIT_OPTIONS.find(o => o.id === selectedOrbitId) || null;

  const isCorrectOrbit = selectedOrbit?.isCorrect === true;

  const handleSelectOrbit = (orbit: OrbitOption) => {
    setSelectedOrbitId(orbit.id);
    onOrbitSelected?.(orbit.id, true);

    SoundFx.playSuccessTone();
    setFeedbackMessage({
      text: `✓ ${orbit.code}: ${orbit.name.toUpperCase()} SEÇİLDİ.`,
      type: 'success',
    });
  };

  // Satellite position calculations (staging position when no orbit chosen yet)
  const satTarget = selectedOrbit
    ? selectedOrbit.satellitePos
    : { x: 260, y: 260, scale: 0.20, rotation: -10 };

  return (
    <div
      className="uzay-stage3-orbit"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '6px 24px 10px 24px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <style>{`
        @keyframes earthGlowPulse {
          0%, 100% { filter: drop-shadow(0 0 16px rgba(56, 189, 248, 0.45)); }
          50% { filter: drop-shadow(0 0 28px rgba(56, 189, 248, 0.75)); }
        }
        @keyframes orbitDash {
          to { stroke-dashoffset: -40; }
        }
        @keyframes satelliteHover {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes cardGlowPulse {
          0%, 100% { box-shadow: 0 0 10px rgba(56, 189, 248, 0.35); }
          50% { box-shadow: 0 0 24px rgba(56, 189, 248, 0.75); }
        }
      `}</style>

      {/* Main 3-Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr 290px',
          gap: '16px',
          alignItems: 'stretch',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* ================= LEFT TASK & INFO PANEL ================= */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '10px',
            zIndex: 10,
          }}
        >
          {/* Main Info Card */}
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
                  YÖRÜNGEYİ BELİRLE
                </h2>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#38BDF8',
                    textTransform: 'uppercase',
                  }}
                >
                  GÖREVİN İÇİN EN UYGUN YÖRÜNGEYİ SEÇ
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
              Uzay aracını Dünya çevresinde doğru yörüngeye yerleştir. Görev yükünün özelliklerine göre en uygun yörüngeyi seç.
            </p>

            {/* Instruction Tip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                background: isCorrectOrbit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.12)',
                border: isCorrectOrbit ? '1.5px solid #34D399' : '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '12px',
                padding: '10px 12px',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: isCorrectOrbit ? '#10B981' : '#0284C7',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '12px',
                  flexShrink: 0,
                }}
              >
                {isCorrectOrbit ? '✓' : '💡'}
              </div>
              <div style={{ fontSize: '11.5px', color: '#E0F2FE', lineHeight: 1.45 }}>
                <strong style={{ display: 'block', color: isCorrectOrbit ? '#34D399' : '#38BDF8', marginBottom: '2px' }}>
                  {isCorrectOrbit ? 'DOĞRU YÖRÜNGE!' : 'İPUCU:'}
                </strong>
                {selectedOrbit
                  ? selectedOrbit.hint
                  : 'Görev yükünün yaptığı gözlemi en iyi yapabileceği yörüngeyi seç!'}
              </div>
            </div>
          </div>
        </div>

        {/* ================= CENTER ORBITAL STAGE (EARTH + 3 ORBITS + SATELLITE) ================= */}
        <div
          className="uzay-center-zone"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: '20px',
            background: `radial-gradient(circle at 50% 48%, rgba(14, 116, 144, 0.22) 0%, rgba(2, 6, 23, 0.98) 78%), url('/assets/uzay/space_hangar_bg.jpg') center/cover no-repeat`,
            border: '1.5px solid rgba(56, 189, 248, 0.3)',
            boxShadow: 'inset 0 0 60px rgba(2, 6, 23, 0.85), 0 12px 40px rgba(0, 0, 0, 0.75)',
          }}
        >
          {/* Feedback Toast */}
          {feedbackMessage && (
            <div
              style={{
                position: 'absolute',
                top: '18px',
                left: '50%',
                transform: 'translateX(-50%)',
                background:
                  feedbackMessage.type === 'success'
                    ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.95), rgba(16, 185, 129, 0.92))'
                    : 'linear-gradient(135deg, rgba(120, 53, 15, 0.95), rgba(217, 119, 6, 0.92))',
                border: feedbackMessage.type === 'success' ? '1.5px solid #6EE7B7' : '1.5px solid #FCD34D',
                borderRadius: '30px',
                padding: '8px 26px',
                color: '#FFFFFF',
                fontSize: '13.5px',
                fontWeight: 800,
                letterSpacing: '0.8px',
                boxShadow:
                  feedbackMessage.type === 'success'
                    ? '0 0 30px rgba(16, 185, 129, 0.7)'
                    : '0 0 24px rgba(245, 158, 11, 0.6)',
                zIndex: 30,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                pointerEvents: 'none',
              }}
            >
              <span>{feedbackMessage.text}</span>
            </div>
          )}

          {/* SVG Canvas for Earth, Orbits & Satellite (viewBox 0 0 1000 700) */}
          <svg
            viewBox="0 0 1000 700"
            preserveAspectRatio="xMidYMid meet"
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              overflow: 'visible',
            }}
          >
            <SatelliteDefs />

            {/* Earth Circular Clip Definition */}
            <defs>
              <clipPath id="earthSphereClip">
                <circle cx="500" cy="335" r="125" />
              </clipPath>
              <filter id="earthAtmosphereGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feFlood floodColor="#38BDF8" floodOpacity="0.75" result="color" />
                <feComposite in2="blur" operator="in" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background Starfield Twinkles */}
            <g id="stars" opacity="0.45">
              {[
                [150, 100, 1.2],
                [240, 70, 1.5],
                [180, 220, 1.0],
                [820, 110, 1.3],
                [890, 250, 1.5],
                [760, 80, 1.0],
                [840, 520, 1.4],
                [160, 540, 1.2],
              ].map(([sx, sy, sr], idx) => (
                <circle key={idx} cx={sx} cy={sy} r={sr} fill="#FFFFFF" />
              ))}
            </g>

            {/* ================= 3 ORBITAL RINGS ================= */}
            {/* 1. LEO (Inner Cyan Orbit) */}
            <g
              id="orbit-leo"
              onClick={() => handleSelectOrbit(ORBIT_OPTIONS[0])}
              style={{ cursor: 'pointer' }}
            >
              <ellipse
                cx="500"
                cy="335"
                rx={ORBIT_OPTIONS[0].rx}
                ry={ORBIT_OPTIONS[0].ry}
                transform={`rotate(${ORBIT_OPTIONS[0].rotation} 500 335)`}
                fill="none"
                stroke={selectedOrbitId === 'leo' ? '#38BDF8' : '#0284C7'}
                strokeWidth={selectedOrbitId === 'leo' ? 3 : 1.8}
                strokeDasharray="7,5"
                opacity={selectedOrbitId === 'leo' ? 1.0 : selectedOrbitId ? 0.35 : 0.75}
                filter={selectedOrbitId === 'leo' ? 'url(#cyanGlow)' : undefined}
                style={{
                  animation: selectedOrbitId === 'leo' ? 'orbitDash 25s linear infinite' : 'none',
                }}
              />
            </g>

            {/* 2. MEO (Middle Amber Orbit) */}
            <g
              id="orbit-meo"
              onClick={() => handleSelectOrbit(ORBIT_OPTIONS[1])}
              style={{ cursor: 'pointer' }}
            >
              <ellipse
                cx="500"
                cy="335"
                rx={ORBIT_OPTIONS[1].rx}
                ry={ORBIT_OPTIONS[1].ry}
                transform={`rotate(${ORBIT_OPTIONS[1].rotation} 500 335)`}
                fill="none"
                stroke={selectedOrbitId === 'meo' ? '#F59E0B' : '#D97706'}
                strokeWidth={selectedOrbitId === 'meo' ? 3 : 1.8}
                strokeDasharray="7,5"
                opacity={selectedOrbitId === 'meo' ? 1.0 : selectedOrbitId ? 0.35 : 0.75}
                filter={selectedOrbitId === 'meo' ? 'url(#cyanGlow)' : undefined}
                style={{
                  animation: selectedOrbitId === 'meo' ? 'orbitDash 30s linear infinite' : 'none',
                }}
              />
            </g>

            {/* 3. GEO (Outer Purple Orbit) */}
            <g
              id="orbit-geo"
              onClick={() => handleSelectOrbit(ORBIT_OPTIONS[2])}
              style={{ cursor: 'pointer' }}
            >
              <ellipse
                cx="500"
                cy="335"
                rx={ORBIT_OPTIONS[2].rx}
                ry={ORBIT_OPTIONS[2].ry}
                transform={`rotate(${ORBIT_OPTIONS[2].rotation} 500 335)`}
                fill="none"
                stroke={selectedOrbitId === 'geo' ? '#C084FC' : '#9333EA'}
                strokeWidth={selectedOrbitId === 'geo' ? 3 : 1.8}
                strokeDasharray="7,5"
                opacity={selectedOrbitId === 'geo' ? 1.0 : selectedOrbitId ? 0.35 : 0.75}
                filter={selectedOrbitId === 'geo' ? 'url(#cyanGlow)' : undefined}
                style={{
                  animation: selectedOrbitId === 'geo' ? 'orbitDash 35s linear infinite' : 'none',
                }}
              />
            </g>

            {/* ================= REALISTIC PLANET EARTH ================= */}
            <g id="planet-earth-group" style={{ animation: 'earthGlowPulse 4s ease-in-out infinite' }}>
              {/* Outer Atmospheric Limb Glow */}
              <circle
                cx="500"
                cy="335"
                r="128"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="4"
                opacity="0.75"
                filter="url(#cyanGlow)"
              />
              {/* Photorealistic Earth Globe Image */}
              <image
                href="/assets/uzay/realistic_earth.jpg"
                x="375"
                y="210"
                width="250"
                height="250"
                clipPath="url(#earthSphereClip)"
                preserveAspectRatio="xMidYMid slice"
              />
            </g>

            {/* ================= CALLOUT PINS ON ORBITS ================= */}
            {/* LEO Callout Pin */}
            <g
              id="pin-leo"
              onClick={() => handleSelectOrbit(ORBIT_OPTIONS[0])}
              style={{ cursor: 'pointer' }}
            >
              <circle cx="340" cy="415" r="5" fill="#38BDF8" filter="url(#cyanGlow)" />
              <rect
                x="315"
                y="392"
                width="145"
                height="46"
                rx="8"
                fill={selectedOrbitId === 'leo' ? 'rgba(2, 132, 199, 0.95)' : 'rgba(8, 22, 50, 0.88)'}
                stroke="#38BDF8"
                strokeWidth={selectedOrbitId === 'leo' ? 2 : 1.2}
                filter={selectedOrbitId === 'leo' ? 'url(#cyanGlow)' : undefined}
              />
              <text x="387" y="411" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="800" fontFamily="'Outfit', sans-serif">
                Alçak Dünya Yörüngesi (LEO)
              </text>
              <text x="387" y="426" textAnchor="middle" fill="#67E8F9" fontSize="9.5" fontWeight="700" fontFamily="'Outfit', sans-serif">
                200 – 2.000 km
              </text>
            </g>

            {/* MEO Callout Pin */}
            <g
              id="pin-meo"
              onClick={() => handleSelectOrbit(ORBIT_OPTIONS[1])}
              style={{ cursor: 'pointer' }}
            >
              <circle cx="660" cy="140" r="5" fill="#F59E0B" filter="url(#cyanGlow)" />
              <rect
                x="640"
                y="117"
                width="145"
                height="46"
                rx="8"
                fill={selectedOrbitId === 'meo' ? 'rgba(217, 119, 6, 0.95)' : 'rgba(8, 22, 50, 0.88)'}
                stroke="#F59E0B"
                strokeWidth={selectedOrbitId === 'meo' ? 2 : 1.2}
              />
              <text x="712" y="136" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="800" fontFamily="'Outfit', sans-serif">
                Orta Dünya Yörüngesi (MEO)
              </text>
              <text x="712" y="151" textAnchor="middle" fill="#FDE68A" fontSize="9.5" fontWeight="700" fontFamily="'Outfit', sans-serif">
                2.000 – 35.786 km
              </text>
            </g>

            {/* GEO Callout Pin */}
            <g
              id="pin-geo"
              onClick={() => handleSelectOrbit(ORBIT_OPTIONS[2])}
              style={{ cursor: 'pointer' }}
            >
              <circle cx="700" cy="530" r="5" fill="#C084FC" filter="url(#cyanGlow)" />
              <rect
                x="680"
                y="507"
                width="145"
                height="46"
                rx="8"
                fill={selectedOrbitId === 'geo' ? 'rgba(147, 51, 234, 0.95)' : 'rgba(8, 22, 50, 0.88)'}
                stroke="#C084FC"
                strokeWidth={selectedOrbitId === 'geo' ? 2 : 1.2}
              />
              <text x="752" y="526" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="800" fontFamily="'Outfit', sans-serif">
                Jeosenkron Yörünge (GEO)
              </text>
              <text x="752" y="541" textAnchor="middle" fill="#E9D5FF" fontSize="9.5" fontWeight="700" fontFamily="'Outfit', sans-serif">
                35.786 km
              </text>
            </g>

            {/* ================= THE ASSEMBLED SATELLITE (FROM STAGE 1) ================= */}
            <g
              id="orbiting-satellite-unit"
              style={{
                transition: 'transform 0.85s cubic-bezier(0.25, 1, 0.5, 1)',
                transform: `translate(${satTarget.x}px, ${satTarget.y}px) rotate(${satTarget.rotation}deg) scale(${satTarget.scale}) translate(-500px, -350px)`,
                transformOrigin: '0 0',
              }}
            >
              <g style={{ animation: 'satelliteHover 3.5s ease-in-out infinite' }}>
                <FullyAssembledSatellite />
              </g>
            </g>
          </svg>
        </div>

        {/* ================= RIGHT PREVIEW & SPEC PANEL ================= */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 10,
          }}
        >
          {/* Header Title */}
          <div
            style={{
              background: 'rgba(8, 18, 38, 0.90)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '16px',
              padding: '14px 16px',
              boxShadow: '0 8px 32px rgba(2, 6, 23, 0.65)',
              backdropFilter: 'blur(12px)',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ color: '#38BDF8', fontSize: '16px' }}>🛰️</span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    fontWeight: 800,
                    letterSpacing: '0.8px',
                    color: '#38BDF8',
                    textTransform: 'uppercase',
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  SEÇİLEN YÖRÜNGE
                </h3>
              </div>

              {/* Miniature Earth Preview Sphere with chosen Orbit */}
              <div
                style={{
                  width: '100%',
                  height: '120px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(2, 6, 23, 0.95), rgba(15, 23, 42, 0.95))',
                  border: selectedOrbit ? `1.5px solid ${selectedOrbit.color}` : '1px solid rgba(56, 189, 248, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                  marginBottom: '14px',
                  transition: 'border 0.3s ease',
                }}
              >
                <img
                  src="/assets/uzay/realistic_earth.jpg"
                  alt="Dünya"
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    boxShadow: selectedOrbit ? `0 0 20px ${selectedOrbit.color}` : '0 0 16px rgba(56, 189, 248, 0.5)',
                    objectFit: 'cover',
                  }}
                />
                {selectedOrbit && (
                  <div
                    style={{
                      position: 'absolute',
                      width: selectedOrbit.id === 'leo' ? '92px' : selectedOrbit.id === 'meo' ? '106px' : '118px',
                      height: selectedOrbit.id === 'leo' ? '92px' : selectedOrbit.id === 'meo' ? '106px' : '118px',
                      borderRadius: '50%',
                      border: `2px dashed ${selectedOrbit.color}`,
                      boxShadow: `0 0 14px ${selectedOrbit.glowColor}`,
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </div>

              {/* Simplified Clean Parameters */}
              {!selectedOrbit ? (
                <div
                  style={{
                    padding: '24px 12px',
                    textAlign: 'center',
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '10px',
                    border: '1px dashed rgba(56, 189, 248, 0.25)',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
                    Henüz yörünge seçilmedi.
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.4 }}>
                    Aşağıdaki kartlardan birine tıklayarak uydun için yörünge belirle.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Orbit Name */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      borderLeft: `3px solid ${selectedOrbit.color}`,
                    }}
                  >
                    <div style={{ fontSize: '10.5px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Yörünge Adı
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: selectedOrbit.color }}>
                      {selectedOrbit.name}
                    </div>
                  </div>

                  {/* Altitude */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      borderLeft: '3px solid #38BDF8',
                    }}
                  >
                    <div style={{ fontSize: '10.5px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                      İrtifa
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                      {selectedOrbit.altitude}
                    </div>
                  </div>

                  {/* Ideal Task */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      borderLeft: isCorrectOrbit ? '3px solid #34D399' : '3px solid #F59E0B',
                    }}
                  >
                    <div style={{ fontSize: '10.5px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Uygun Görev
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: isCorrectOrbit ? '#34D399' : '#FCD34D',
                      }}
                    >
                      {selectedOrbit.idealFor}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Status Tip */}
            <div
              style={{
                marginTop: '12px',
                padding: '8px 10px',
                borderRadius: '8px',
                background: selectedOrbit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.7)',
                border: selectedOrbit ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '11px',
                color: selectedOrbit ? '#A7F3D0' : '#94A3B8',
                textAlign: 'center',
                fontWeight: 700,
              }}
            >
              {selectedOrbit
                ? `${selectedOrbit.name} başarıyla belirlendi! Devam edebilirsin.`
                : 'Aşağıdaki kartlardan uygun yörüngeyi seç.'}
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM ORBIT SELECTION CARDS ================= */}
      <div
        className="uzay-bottom-orbits"
        style={{
          marginTop: '10px',
          background: 'rgba(8, 18, 38, 0.94)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '16px',
          padding: '10px 18px',
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
            YÖRÜNGE SEÇENEKLERİ
          </span>
          <span style={{ fontSize: '11px', color: '#94A3B8' }}>
            Doğru yörünge kartına dokunarak seçiminizi yapın
          </span>
        </div>

        {/* 3 Horizontal Cards: LEO, MEO, GEO */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
          }}
        >
          {ORBIT_OPTIONS.map(orbit => {
            const isSelected = selectedOrbitId === orbit.id;

            return (
              <div
                id={`orbit-card-${orbit.id}`}
                key={orbit.id}
                onClick={() => handleSelectOrbit(orbit)}
                style={{
                  position: 'relative',
                  height: '115px',
                  borderRadius: '12px',
                  background: isSelected
                    ? `linear-gradient(180deg, ${orbit.id === 'leo' ? 'rgba(2, 132, 199, 0.25)' : orbit.id === 'meo' ? 'rgba(217, 119, 6, 0.25)' : 'rgba(147, 51, 234, 0.25)'} 0%, rgba(15, 23, 42, 0.95) 100%)`
                    : 'linear-gradient(180deg, rgba(15, 23, 42, 0.92) 0%, rgba(8, 15, 30, 0.98) 100%)',
                  border: isSelected
                    ? `2px solid ${orbit.color}`
                    : '1px solid rgba(56, 189, 248, 0.25)',
                  boxShadow: isSelected
                    ? `0 0 20px ${orbit.glowColor}`
                    : '0 4px 12px rgba(2, 6, 23, 0.4)',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  minHeight: '48px',
                }}
              >
                {/* Mini Earth with colored Orbit ring preview */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src="/assets/uzay/realistic_earth.jpg"
                    alt={orbit.name}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                  {/* Orbit Ring */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      border: `2px dashed ${orbit.color}`,
                      opacity: isSelected ? 1.0 : 0.65,
                      boxShadow: isSelected ? `0 0 10px ${orbit.glowColor}` : 'none',
                    }}
                  />
                </div>

                {/* Orbit Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: isSelected ? '#FFFFFF' : '#E2E8F0',
                      }}
                    >
                      {orbit.name}
                    </div>
                    {isSelected && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          color: '#FFFFFF',
                          background: orbit.color,
                          padding: '1px 6px',
                          borderRadius: '6px',
                        }}
                      >
                        ✓ SEÇİLDİ
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: orbit.color,
                      marginBottom: '6px',
                    }}
                  >
                    {orbit.altitude}
                  </div>

                  {/* 1 Short Usage Purpose */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: isSelected ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: `1px solid ${isSelected ? orbit.color : 'rgba(255, 255, 255, 0.08)'}`,
                    }}
                  >
                    <span style={{ color: orbit.color, fontSize: '11px', fontWeight: 900 }}>•</span>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: isSelected ? 800 : 600,
                        color: isSelected ? '#FFFFFF' : '#CBD5E1',
                      }}
                    >
                      {orbit.id === 'leo' ? 'Dünya Gözlemi' : orbit.id === 'meo' ? 'Navigasyon (GPS)' : 'İletişim & Yayın'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
