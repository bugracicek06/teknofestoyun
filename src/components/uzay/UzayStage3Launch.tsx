import React, { useState, useEffect } from 'react';
import { ORBIT_OPTIONS, type OrbitId, type OrbitOption } from '../../data/uzayData';
import { SatelliteDefs, FullyAssembledSatellite } from './UzaySatelliteModel';
import { SoundFx } from '../../game/utils/audio';

interface UzayStage3LaunchProps {
  selectedOrbitId?: OrbitId;
  onLaunchComplete?: () => void;
  onNextStage?: () => void;
}

export const UzayStage3Launch: React.FC<UzayStage3LaunchProps> = ({
  selectedOrbitId = 'leo',
  onLaunchComplete,
  onNextStage: _onNextStage,
}) => {
  // Success toast state (appears once orbit is established, fades after ~2s)
  const [showToast, setShowToast] = useState<boolean>(false);

  // Satellite orbit progress parameter t in [0, 1)
  const [orbitProgress, setOrbitProgress] = useState<number>(0.12);

  const orbit: OrbitOption =
    ORBIT_OPTIONS.find(o => o.id === selectedOrbitId) || ORBIT_OPTIONS[0];

  useEffect(() => {
    // 1. Give the player 2 seconds to see the satellite entering high orbit
    const notifyTimer = setTimeout(() => {
      setShowToast(true);
      SoundFx.playSuccessTone();
      onLaunchComplete?.();
    }, 2000);

    // 2. Auto-dismiss the success toast ~2 seconds later
    const hideTimer = setTimeout(() => {
      setShowToast(false);
    }, 4200);

    return () => {
      clearTimeout(notifyTimer);
      clearTimeout(hideTimer);
    };
  }, [onLaunchComplete]);

  // Continuous smooth orbital loop (13.5 seconds per full orbit, majestic and calm)
  useEffect(() => {
    let animId: number;
    let lastTime: number | null = null;
    const ORBIT_PERIOD_SEC = 13.5;

    const animateOrbit = (time: number) => {
      if (lastTime === null) lastTime = time;
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      setOrbitProgress(prev => (prev + dt / ORBIT_PERIOD_SEC) % 1);
      animId = requestAnimationFrame(animateOrbit);
    };

    animId = requestAnimationFrame(animateOrbit);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  // Invisible Parametric Elliptical 3D Orbit:
  // Coordinate space: 1600 x 900 (16:9 aspect ratio)
  // Center: Cx = 800, Cy = 305
  // Rx = 660, Ry = 110
  // Safe zone: strictly between Y = 20.9% and 46.3% of viewport height (upper half of screen, strictly above 50%)
  const getOrbitPosition = (t: number) => {
    const Cx = 800;
    const Cy = 305;
    const Rx = 660;
    const Ry = 110;
    const tiltRad = (-1.8 * Math.PI) / 180;

    // Phase: t = 0 starts on left horizon, loops across front (over Earth atmosphere), then far side
    const phi = Math.PI + t * 2 * Math.PI;

    const x0 = Rx * Math.cos(phi);
    const y0 = Ry * Math.sin(phi);

    const x = Cx + (x0 * Math.cos(tiltRad) - y0 * Math.sin(tiltRad));
    const y = Cy + (x0 * Math.sin(tiltRad) + y0 * Math.cos(tiltRad));

    // Tangent derivative for gentle orientation
    const dx0 = -Rx * Math.sin(phi);
    const dy0 = Ry * Math.cos(phi);
    const dx = dx0 * Math.cos(tiltRad) - dy0 * Math.sin(tiltRad);
    const dy = dx0 * Math.sin(tiltRad) + dy0 * Math.cos(tiltRad);
    const rawAngle = (Math.atan2(dy, dx) * 180) / Math.PI;

    // Depth: isFront when moving over Earth (phi between PI and 2PI)
    const isFront = Math.sin(phi) <= 0.05;
    const depthRatio = (-Math.sin(phi) + 1) / 2; // 1 at apex (top-front), 0 at rear

    // Perspective scale: 0.78 (rear) to 1.02 (front apex)
    const scale = 0.78 + depthRatio * 0.24;

    // Opacity: 0.80 (rear) to 1.0 (front)
    const opacity = 0.80 + depthRatio * 0.20;

    // Natural orientation: gentle attitude tilt matching flight path (clamped strictly between -12 and +12 deg)
    const clampedAngle = Math.max(Math.min(rawAngle * 0.20, 12), -12);

    return { x, y, angle: clampedAngle, scale, opacity, isFront };
  };

  const currentPos = getOrbitPosition(orbitProgress);

  return (
    <div
      className="uzay-stage3-cinematic-orbit"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        @keyframes pulseGreenDot {
          0%, 100% { opacity: 0.85; transform: scale(1); box-shadow: 0 0 6px #34D399; }
          50% { opacity: 1; transform: scale(1.25); box-shadow: 0 0 14px #34D399; }
        }
      `}</style>

      {/* ================= 1. PURE CLEAN CINEMATIC BACKGROUND ================= */}
      {/* Pristine high-resolution space & Earth asset without any overlaying dark layers */}
      <img
        src="/assets/uzay/earth_orbit_cinematic_bg.jpg"
        alt="Dünya ve Uzay"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* ================= 2. FOREGROUND SATELLITE CANVAS (INVISIBLE ORBIT PATH) ================= */}
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 5,
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        <SatelliteDefs />

        {/* ONLY 1 SATELLITE - Assembled model from Stage 1 moving smoothly along the invisible orbit in the upper space */}
        <g
          id="orbiting-single-satellite"
          style={{
            transform: `translate(${currentPos.x}px, ${currentPos.y}px) rotate(${currentPos.angle}deg) scale(${currentPos.scale * 0.14}) translate(-500px, -350px)`,
            transformOrigin: '0 0',
            opacity: currentPos.opacity,
            filter: currentPos.isFront
              ? 'drop-shadow(0 0 14px rgba(56, 189, 248, 0.75))'
              : 'drop-shadow(0 0 7px rgba(56, 189, 248, 0.35))',
            transition: 'opacity 0.2s ease',
          }}
        >
          <FullyAssembledSatellite />
        </g>
      </svg>

      {/* ================= 3. SLEEK COMPACT STATUS PILL (TOP-LEFT) ================= */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '24px',
          zIndex: 10,
          background: 'rgba(8, 18, 38, 0.72)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '14px',
          padding: '8px 16px',
          boxShadow: '0 8px 24px rgba(2, 6, 23, 0.55)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '380px',
        }}
      >
        {/* Pulsing Green Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0 }}>
          <div
            style={{
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background: '#34D399',
              animation: 'pulseGreenDot 2s infinite ease-in-out',
            }}
          />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#34D399',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
            }}
          >
            YÖRÜNGEDE AKTİF
          </span>
        </div>

        <div style={{ width: '1px', height: '18px', background: 'rgba(56, 189, 248, 0.25)', flexShrink: 0 }} />

        {/* Orbit Information */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {orbit.name}
          </span>
          <span style={{ fontSize: '10.5px', color: '#67E8F9', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {orbit.altitude} · {orbit.id === 'leo' ? 'Dünya Gözlemi' : orbit.idealFor}
          </span>
        </div>
      </div>

      {/* ================= 4. SUCCESS TOAST (DISPLAYS FOR ~2S ONCE ORBIT ESTABLISHED) ================= */}
      <div
        style={{
          position: 'absolute',
          top: '22px',
          left: '50%',
          transform: showToast ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-12px)',
          zIndex: 15,
          background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.95), rgba(16, 185, 129, 0.92))',
          border: '1.5px solid #6EE7B7',
          borderRadius: '24px',
          padding: '10px 28px',
          color: '#FFFFFF',
          textAlign: 'center',
          boxShadow: '0 0 32px rgba(16, 185, 129, 0.75)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          pointerEvents: 'none',
          opacity: showToast ? 1 : 0,
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        <div style={{ fontSize: '14.5px', fontWeight: 900, letterSpacing: '0.8px' }}>
          ✓ YÖRÜNGE GÖREVİ TAMAMLANDI
        </div>
        <div style={{ fontSize: '12px', color: '#D1FAE5', fontWeight: 600 }}>
          Uzay aracın seçilen yörüngeye başarıyla yerleşti.
        </div>
      </div>
    </div>
  );
};
