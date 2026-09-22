import React from 'react';
import type { CiniObject, CiniMotif, CiniColor } from '../../data/ciniData';
import { getPaintingTargetsForMotif, DECORATION_AREAS } from '../../data/ciniData';
import { MotifArtwork } from './CiniMotifSVGs';

export type CiniRenderMode = 'selection' | 'draft' | 'preview' | 'interactive' | 'completed';

interface CiniObjectRendererProps {
  object: CiniObject;
  motif: CiniMotif;
  primaryColor: CiniColor;
  secondaryColor: CiniColor;
  mode: CiniRenderMode;
  paintedZones?: number[]; // Array of zone indices [0, 1, 2, 3, 4, 5] that have been painted
  onPaintZone?: (zoneIndex: number, clientX: number, clientY: number) => void;
  scale?: number;
}

export const CiniObjectRenderer: React.FC<CiniObjectRendererProps> = ({
  object,
  motif,
  primaryColor,
  secondaryColor,
  mode,
  paintedZones = [0, 1, 2, 3, 4, 5],
  onPaintZone,
  scale = 1,
}) => {
  const pColor = primaryColor.hex;
  const sColor = secondaryColor.hex;
  const greenStem = '#1B5E38'; // Authentic mineral green
  const tahrir = '#111C2D'; // Carbon/manganese tahrir black-navy
  const draftStroke = 'rgba(17, 28, 45, 0.38)';

  const isSelection = mode === 'selection';
  const isDraft = mode === 'draft';
  const isCompleted = mode === 'completed';
  const isInteractive = mode === 'interactive';

  // Zone completion checks (zones 0..5)
  const isZoneActive = (z: number) => {
    if (isSelection || isDraft) return false;
    if (mode === 'preview' || mode === 'completed') return true;
    return paintedZones.includes(z);
  };

  const decorationArea = DECORATION_AREAS[object.id] || DECORATION_AREAS.tabak;
  const paintingTargets = getPaintingTargetsForMotif(motif.id);

  const handleTargetClick = (e: React.PointerEvent, zoneIdx: number) => {
    e.stopPropagation();
    if (onPaintZone && !paintedZones.includes(zoneIdx)) {
      onPaintZone(zoneIdx, e.clientX, e.clientY);
    }
  };

  return (
    <div
      className={`cini-object-container mode-${mode}`}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: `${520 * scale}px`,
        aspectRatio: object.id === 'vazo' ? '1 / 1.15' : '1 / 1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: isCompleted
          ? 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.65)) drop-shadow(0 0 45px rgba(245, 158, 11, 0.45))'
          : 'drop-shadow(0 20px 38px rgba(0, 0, 0, 0.55))',
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: isCompleted ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {/* Radiant Sunburst Rays for Final Completed Stage */}
      {isCompleted && (
        <div
          className="cini-radiant-rays"
          style={{
            position: 'absolute',
            inset: '-15%',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(254, 240, 138, 0.28) 0%, rgba(245, 158, 11, 0.12) 50%, transparent 70%)',
            animation: 'spin 45s linear infinite',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      {/* Step 2 Draft Tooltip Callout */}
      {isDraft && (
        <div
          style={{
            position: 'absolute',
            top: '16%',
            right: '-18px',
            background: 'linear-gradient(135deg, #FFFDF8 0%, #F8EFE0 100%)',
            border: '1.5px solid #9A7B56',
            borderRadius: '10px',
            padding: '10px 14px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
            color: '#3B230C',
            fontSize: '13px',
            fontWeight: '600',
            maxWidth: '175px',
            textAlign: 'center',
            lineHeight: '1.4',
            zIndex: 25,
            animation: 'popIn 0.4s ease-out forwards',
          }}
        >
          <span>Seçtiğin desen {object.name.toLowerCase()} üzerinde böyle görünecek.</span>
          {/* Callout Arrow pointer */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '-8px',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderRight: '8px solid #9A7B56',
            }}
          />
        </div>
      )}

      {/* Main Vector Ceramic Display */}
      <svg
        className="cini-svg-display"
        viewBox="0 0 600 600"
        style={{
          width: '100%',
          height: '100%',
          overflow: 'visible',
          filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.45))',
        }}
      >
        <defs>
          {/* Ceramic Specular Glaze Sheen */}
          <radialGradient id="ceramicShine" cx="35%" cy="28%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.12" />
            <stop offset="65%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
          </radialGradient>

          {/* Radial Ceramic Base: Warm Ivory Glaze */}
          <radialGradient id="ceramicIvory" cx="48%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#FFFEFC" />
            <stop offset="60%" stopColor="#FAF6ED" />
            <stop offset="88%" stopColor="#EFE5D3" />
            <stop offset="100%" stopColor="#DECDB2" />
          </radialGradient>

          {/* Deep Inner Bowl Shading */}
          <radialGradient id="bowlInnerShading" cx="50%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#E8DCC2" />
            <stop offset="70%" stopColor="#DAC9A8" />
            <stop offset="100%" stopColor="#C4B08A" />
          </radialGradient>

          {/* 3D Lip Rim for Plates */}
          <radialGradient id="plateRim3D" cx="50%" cy="48%" r="50%">
            <stop offset="84%" stopColor="transparent" />
            <stop offset="93%" stopColor="rgba(255,255,255,0.75)" />
            <stop offset="97%" stopColor="rgba(120,95,60,0.22)" />
            <stop offset="100%" stopColor="rgba(40,25,10,0.38)" />
          </radialGradient>

          {/* 3D Cylindrical Shading for Vase */}
          <linearGradient id="vaseShading3D" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#DFCDB0" />
            <stop offset="25%" stopColor="#FAF7F0" />
            <stop offset="50%" stopColor="#FFFFFF" />
            <stop offset="80%" stopColor="#F5ECE0" />
            <stop offset="100%" stopColor="#D5C2A2" />
          </linearGradient>

          {/* Wooden Display Stand Gradients */}
          <linearGradient id="woodStandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5C381E" />
            <stop offset="40%" stopColor="#432612" />
            <stop offset="100%" stopColor="#251408" />
          </linearGradient>
          <linearGradient id="woodStandTop" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#432612" />
            <stop offset="50%" stopColor="#6E4424" />
            <stop offset="100%" stopColor="#381D0B" />
          </linearGradient>

          {/* ===================================================================
              SAFE DECORATION AREAS (clipPaths)
              These strictly isolate the decoration surface so motifs NEVER overflow!
              =================================================================== */}

          {/* 1. PLATE: Centered circular basin inside the rim */}
          <clipPath id="plate-decoration-area">
            <circle cx="300" cy="300" r="226" />
          </clipPath>

          {/* 2. VASE: Sinuous middle belly of the vase (excluding neck & foot) */}
          <clipPath id="vase-decoration-area">
            <path d="M 220 270 C 135 335 125 450 175 510 C 235 540 365 540 425 510 C 475 450 465 335 380 270 Z" />
          </clipPath>

          {/* 3. TILE: Inner square basin inside the beveled frame */}
          <clipPath id="tile-decoration-area">
            <rect x="110" y="110" width="380" height="380" rx="8" />
          </clipPath>
        </defs>

        {/* =====================================================================
            1. BASE CERAMIC OBJECT BODY (TABAK / VAZO / KÂSE / KARO)
            In Step 1 (mode === 'selection'), objects are completely blank!
            ===================================================================== */}

        {/* -------------------- TABAK (CERAMIC PLATE) -------------------- */}
        {object.id === 'tabak' && (
          <g id="body-tabak">
            {/* Dark Walnut Display Stand supporting the plate */}
            <g id="stand-tabak">
              <ellipse cx="300" cy="535" rx="145" ry="18" fill="rgba(0,0,0,0.35)" />
              <path d="M 210 525 L 230 460 L 255 460 L 240 525 Z" fill="url(#woodStandGrad)" />
              <path d="M 390 525 L 370 460 L 345 460 L 360 525 Z" fill="url(#woodStandGrad)" />
              <ellipse cx="300" cy="522" rx="135" ry="14" fill="url(#woodStandTop)" stroke="#221208" strokeWidth="1" />
              {/* Supporting Front Pegs */}
              <circle cx="230" cy="460" r="7" fill="#8B5A2B" stroke="#251408" strokeWidth="1.5" />
              <circle cx="370" cy="460" r="7" fill="#8B5A2B" stroke="#251408" strokeWidth="1.5" />
            </g>

            {/* Outer Dish Silhouette with porcelain depth */}
            <circle cx="300" cy="300" r="282" fill="url(#ceramicIvory)" />
            <circle cx="300" cy="300" r="282" fill="url(#plateRim3D)" />

            {/* Authentic Iznik Cobalt Blue Border Rings */}
            <circle cx="300" cy="300" r="278" fill="none" stroke="#0C3875" strokeWidth="2.2" />
            <circle cx="300" cy="300" r="240" fill="none" stroke="#0C3875" strokeWidth="1.2" opacity="0.4" />
            {!isSelection && (
              <circle cx="300" cy="300" r="226" fill="none" stroke="#0C3875" strokeWidth="1.4" opacity="0.65" />
            )}
          </g>
        )}

        {/* -------------------- VAZO (AMPHORA VASE) -------------------- */}
        {object.id === 'vazo' && (
          <g id="body-vazo">
            {/* Wooden Pedestal Base */}
            <g id="stand-vazo">
              <ellipse cx="300" cy="552" rx="135" ry="16" fill="rgba(0,0,0,0.35)" />
              <path d="M 185 540 L 210 520 L 390 520 L 415 540 Z" fill="url(#woodStandGrad)" />
              <ellipse cx="300" cy="522" rx="105" ry="12" fill="url(#woodStandTop)" stroke="#251408" strokeWidth="1" />
            </g>

            {/* Ceramic Foot Ring */}
            <ellipse cx="300" cy="516" rx="88" ry="16" fill="#DDD0B8" stroke="#111C2D" strokeWidth="2" />

            {/* Sinuous Ottoman Vase Body */}
            <path
              d="M 235 105 C 215 150 240 220 225 260 C 135 330 115 455 170 512 C 230 542 370 542 430 512 C 485 455 465 330 375 260 C 360 220 385 150 365 105 C 345 88 255 88 235 105 Z"
              fill="url(#vaseShading3D)"
              stroke="#111C2D"
              strokeWidth="2.6"
            />

            {/* Flared Mouth Lip with Cobalt Accent */}
            <ellipse cx="300" cy="104" rx="72" ry="16" fill="#FAF6EE" stroke="#111C2D" strokeWidth="2" />
            <ellipse cx="300" cy="104" rx="68" ry="13" fill="none" stroke="#0C3875" strokeWidth="1.8" />

            {/* Subtle Neck Line */}
            <path d="M 235 190 Q 300 208 365 190" fill="none" stroke="#0C3875" strokeWidth="1.5" opacity="0.45" />
          </g>
        )}

        {/* -------------------- KARO (SQUARE TILE) -------------------- */}
        {object.id === 'karo' && (
          <g id="body-karo">
            {/* Wooden Easel Support */}
            <g id="stand-karo">
              <ellipse cx="300" cy="542" rx="145" ry="16" fill="rgba(0,0,0,0.35)" />
              <path d="M 215 530 L 235 480 L 260 480 L 245 530 Z" fill="url(#woodStandGrad)" />
              <path d="M 385 530 L 365 480 L 340 480 L 355 530 Z" fill="url(#woodStandGrad)" />
              <ellipse cx="300" cy="526" rx="125" ry="12" fill="url(#woodStandTop)" stroke="#221208" strokeWidth="1" />
              <circle cx="235" cy="480" r="7" fill="#8B5A2B" stroke="#251408" strokeWidth="1.5" />
              <circle cx="365" cy="480" r="7" fill="#8B5A2B" stroke="#251408" strokeWidth="1.5" />
            </g>

            {/* Square Tile Body with soft bevel */}
            <rect x="75" y="75" width="450" height="450" rx="12" fill="url(#ceramicIvory)" stroke="#111C2D" strokeWidth="3" />
            {/* Double Cobalt Frame */}
            <rect x="95" y="95" width="410" height="410" rx="8" fill="none" stroke="#0C3875" strokeWidth="2.2" />
            <rect x="108" y="108" width="384" height="384" rx="6" fill="none" stroke="#0C3875" strokeWidth="1.2" opacity="0.45" />

            {/* Corner Spandrels (Köşebent) only visible when motif is being applied/previewed */}
            {!isSelection && (
              <g id="karo-spandrels" opacity={isDraft ? 0.35 : isZoneActive(5) ? 0.95 : 0.25}>
                {[
                  'M 108 108 L 180 108 C 140 148 140 148 108 180 Z',
                  'M 492 108 L 420 108 C 460 148 460 148 492 180 Z',
                  'M 108 492 L 180 492 C 140 452 140 452 108 420 Z',
                  'M 492 492 L 420 492 C 460 452 460 452 492 420 Z',
                ].map((p, idx) => (
                  <path
                    key={`corner-${idx}`}
                    d={p}
                    fill={isZoneActive(5) ? pColor : 'none'}
                    stroke={isDraft ? draftStroke : tahrir}
                    strokeWidth="1.2"
                  />
                ))}
              </g>
            )}
          </g>
        )}

        {/* =====================================================================
            2. PERIMETER / RIM BORDER MOTIFS (ZONE 5) FOR PLATE
            Only rendered when NOT in initial blank selection mode!
            ===================================================================== */}
        {!isSelection && object.id === 'tabak' && (
          <g id="rim-border-tabak" opacity={isDraft ? 0.4 : isZoneActive(5) ? 0.95 : 0.25}>
            {Array.from({ length: 16 }).map((_, i) => {
              const rot = (i * 360) / 16;
              const flowerColor = i % 2 === 0 ? pColor : sColor;
              return (
                <g key={`border-f-${i}`} transform={`rotate(${rot} 300 300) translate(300, 42)`}>
                  <path d="M -25 18 Q 0 8 25 18" fill="none" stroke={greenStem} strokeWidth="1.5" />
                  <path
                    d="M -7 18 C -10 10 -4 9 0 12 C 4 9 10 10 7 18 Z"
                    fill={isZoneActive(5) ? flowerColor : 'none'}
                    stroke={isDraft ? draftStroke : tahrir}
                    strokeWidth="1"
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* =====================================================================
            3. MAIN MOTIF ARTWORK (ZONES 0, 1, 2, 3, 4)
            Safely clipped to each object's dedicated decoration area!
            ===================================================================== */}
        {!isSelection && (
          <g clipPath={`url(#${decorationArea.clipPathId})`}>
            <g id="main-motif-artwork" transform={decorationArea.transform}>
              <MotifArtwork
                motifId={motif.id}
                isDraft={isDraft}
                isZoneActive={isZoneActive}
                pColor={pColor}
                sColor={sColor}
                greenStem={greenStem}
                tahrir={tahrir}
                draftStroke={draftStroke}
              />

              {/* In Step 4, render interactive targets inside the same transform so they align to the motif geometry */}
              {isInteractive && (
                <g id="interactive-paint-targets">
                  {paintingTargets.map((tgt) => {
                    const isDone = paintedZones.includes(tgt.zone);
                    if (isDone) return null;

                    return (
                      <g
                        key={`target-${tgt.zone}`}
                        transform={`translate(${tgt.x}, ${tgt.y})`}
                        style={{ cursor: 'pointer' }}
                        onPointerDown={(e) => handleTargetClick(e, tgt.zone)}
                      >
                        {/* Generous touch hitbox (min 68px diameter for kiosk ease) */}
                        <circle cx="0" cy="0" r="34" fill="transparent" />

                        {/* Pulsing Target Ring */}
                        <circle
                          cx="0"
                          cy="0"
                          r="22"
                          fill="rgba(245, 158, 11, 0.28)"
                          stroke="#F59E0B"
                          strokeWidth="2.5"
                          strokeDasharray="4 2"
                          className="cini-pulse-ring"
                        />
                        {/* Central Target Core */}
                        <circle cx="0" cy="0" r="8" fill="#F59E0B" />
                        <circle cx="0" cy="0" r="3.5" fill="#FFFFFF" />

                        {/* Floating Tooltip Label */}
                        <g transform="translate(0, -34)">
                          <rect
                            x="-68"
                            y="-16"
                            width="136"
                            height="24"
                            rx="12"
                            fill="rgba(15, 23, 42, 0.92)"
                            stroke="#F59E0B"
                            strokeWidth="1.2"
                          />
                          <text
                            x="0"
                            y="-1"
                            textAnchor="middle"
                            fill="#FDE68A"
                            fontSize="11.5px"
                            fontWeight="bold"
                            fontFamily="'Outfit', sans-serif"
                          >
                            {tgt.label}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </g>
              )}
            </g>
          </g>
        )}

        {/* 4. Ceramic Glaze Specular Sheen (Glossy coating) */}
        <circle cx="300" cy="300" r="280" fill="url(#ceramicShine)" pointerEvents="none" style={{ mixBlendMode: 'screen' }} />
      </svg>
    </div>
  );
};
