import React from 'react';
import type { CiniObject, CiniMotif, CiniColor, PaintedRegion } from '../../data/ciniData';
import { DECORATION_AREAS } from '../../data/ciniData';
import { MotifArtwork } from './CiniMotifSVGs';

export type CiniRenderMode = 'selection' | 'draft' | 'preview' | 'interactive' | 'completed';

interface CiniObjectRendererProps {
  object: CiniObject;
  motif: CiniMotif;
  primaryColor: CiniColor;
  secondaryColor: CiniColor;
  accentColor?: CiniColor;
  mode: CiniRenderMode;
  paintedZones?: number[]; // Legacy array for compatibility
  paintedRegions?: Record<string, PaintedRegion | string>; // Region-based painting state
  onPaintZone?: (zoneIndex: number, clientX: number, clientY: number) => void;
  onRegionClick?: (regionId: string, clientX: number, clientY: number, targetCenter: { x: number; y: number }) => void;
  hoveredRegion?: string | null;
  onRegionHover?: (regionId: string | null) => void;
  leadHintRegions?: string[];
  justPaintedRegion?: string | null;
  activeStepOrder?: number;
  shakingRegionId?: string | null;
  scale?: number;
}

export const CiniObjectRenderer: React.FC<CiniObjectRendererProps> = ({
  object,
  motif,
  primaryColor,
  secondaryColor,
  accentColor,
  mode,
  paintedZones = [0, 1, 2, 3, 4, 5],
  paintedRegions = {},
  onRegionClick,
  hoveredRegion,
  onRegionHover,
  leadHintRegions = [],
  justPaintedRegion = null,
  activeStepOrder = 1,
  shakingRegionId = null,
  scale = 1,
}) => {
  const pColor = primaryColor.hex;
  const sColor = secondaryColor.hex;
  const aColor = accentColor ? accentColor.hex : '#16B6C8';
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

  return (
    <div
      className={`cini-object-container mode-${mode}`}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: isInteractive || isCompleted ? 'min(76vh, 660px)' : `${520 * scale}px`,
        maxHeight: isInteractive || isCompleted ? 'min(76vh, 660px)' : undefined,
        aspectRatio: '1 / 1',
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
          {/* Ceramic Specular Glaze Sheen - gentle, non-tinting highlights */}
          <radialGradient id="ceramicShine" cx="35%" cy="28%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.14" />
            <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.04" />
            <stop offset="65%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
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
            <stop offset="0%" stopColor="#D8C4A5" />
            <stop offset="18%" stopColor="#F4ECE0" />
            <stop offset="38%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#F9F4EB" />
            <stop offset="88%" stopColor="#EADDC7" />
            <stop offset="100%" stopColor="#CBB594" />
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

          {/* SAFE DECORATION AREAS (clipPaths) */}
          {/* 1. PLATE: Centered circular basin inside the rim */}
          <clipPath id="plate-decoration-area">
            <circle cx="300" cy="300" r="236" />
          </clipPath>

          {/* 2. OVAL PANO: Symmetrical 2D vertical oval (aspect ratio width/height ≈ 0.76) */}
          <clipPath id="pano-decoration-area">
            <ellipse cx="300" cy="300" rx="192" ry="252" />
          </clipPath>

          {/* 3. TILE: Inner square basin inside the frame */}
          <clipPath id="tile-decoration-area">
            <rect x="98" y="98" width="404" height="404" rx="8" />
          </clipPath>
        </defs>

        {/* 1. BASE CERAMIC OBJECT BODY (TABAK / VAZO / KARO) */}

        {/* -------------------- TABAK (CERAMIC PLATE) -------------------- */}
        {object.id === 'tabak' && (
          <g id="body-tabak">
            {/* Dark Walnut Display Stand */}
            <g id="stand-tabak">
              <ellipse cx="300" cy="535" rx="145" ry="18" fill="rgba(0,0,0,0.35)" />
              <path d="M 210 525 L 230 460 L 255 460 L 240 525 Z" fill="url(#woodStandGrad)" />
              <path d="M 390 525 L 370 460 L 345 460 L 360 525 Z" fill="url(#woodStandGrad)" />
              <ellipse cx="300" cy="522" rx="135" ry="14" fill="url(#woodStandTop)" stroke="#221208" strokeWidth="1" />
              <circle cx="230" cy="460" r="7" fill="#8B5A2B" stroke="#251408" strokeWidth="1.5" />
              <circle cx="370" cy="460" r="7" fill="#8B5A2B" stroke="#251408" strokeWidth="1.5" />
            </g>

            {/* Outer Dish Silhouette with porcelain depth */}
            <circle cx="300" cy="300" r="282" fill="url(#ceramicIvory)" />
            <circle cx="300" cy="300" r="282" fill="url(#plateRim3D)" />

            {/* Authentic Iznik Cobalt Blue Border Rings */}
            <circle cx="300" cy="300" r="278" fill="none" stroke="#0C3875" strokeWidth="2.5" />
            <circle cx="300" cy="300" r="240" fill="none" stroke="#0C3875" strokeWidth="1.5" opacity="0.45" />
            {!isSelection && (
              <circle cx="300" cy="300" r="236" fill="none" stroke="#0C3875" strokeWidth="1.6" opacity="0.75" />
            )}
          </g>
        )}

        {/* -------------------- OVAL PANO (VERTICAL CERAMIC PANEL) -------------------- */}
        {object.id === 'pano' && (
          <g id="body-pano">
            {/* Dark Walnut Display Stand */}
            <g id="stand-pano">
              <ellipse cx="300" cy="542" rx="140" ry="16" fill="rgba(0,0,0,0.35)" />
              <path d="M 215 530 L 235 475 L 260 475 L 245 530 Z" fill="url(#woodStandGrad)" />
              <path d="M 385 530 L 365 475 L 340 475 L 355 530 Z" fill="url(#woodStandGrad)" />
              <ellipse cx="300" cy="526" rx="125" ry="12" fill="url(#woodStandTop)" stroke="#221208" strokeWidth="1" />
              <circle cx="235" cy="475" r="7" fill="#8B5A2B" stroke="#251408" strokeWidth="1.5" />
              <circle cx="365" cy="475" r="7" fill="#8B5A2B" stroke="#251408" strokeWidth="1.5" />
            </g>

            {/* Symmetrical 2D Vertical Oval Ceramic Panel (rx: 205, ry: 268 => width/height = 410/536 = 0.765) */}
            <ellipse
              cx="300"
              cy="300"
              rx="205"
              ry="268"
              fill="url(#ceramicIvory)"
              stroke="#111C2D"
              strokeWidth="2.8"
            />
            <ellipse cx="300" cy="300" rx="205" ry="268" fill="url(#plateRim3D)" />

            {/* Authentic Iznik Cobalt Blue Border Rings */}
            <ellipse cx="300" cy="300" rx="200" ry="262" fill="none" stroke="#0C3875" strokeWidth="2.5" />
            <ellipse cx="300" cy="300" rx="192" ry="252" fill="none" stroke="#0C3875" strokeWidth="1.4" opacity="0.45" />
            {!isSelection && (
              <ellipse cx="300" cy="300" rx="188" ry="248" fill="none" stroke="#0C3875" strokeWidth="1.6" opacity="0.75" />
            )}
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
            <rect x="95" y="95" width="410" height="410" rx="8" fill="none" stroke="#0C3875" strokeWidth="2.5" />
            <rect x="108" y="108" width="384" height="384" rx="6" fill="none" stroke="#0C3875" strokeWidth="1.4" opacity="0.5" />

            {/* Corner Spandrels (Köşebent) */}
            {!isSelection && (
              <g id="karo-spandrels" opacity={isDraft ? 0.35 : 0.9}>
                {[
                  'M 108 108 L 180 108 C 140 148 140 148 108 180 Z',
                  'M 492 108 L 420 108 C 460 148 460 148 492 180 Z',
                  'M 108 492 L 180 492 C 140 452 140 452 108 420 Z',
                  'M 492 492 L 420 492 C 460 452 460 452 492 420 Z',
                ].map((p, idx) => (
                  <path
                    key={`corner-${idx}`}
                    d={p}
                    fill={pColor}
                    stroke={isDraft ? draftStroke : tahrir}
                    strokeWidth="1.4"
                  />
                ))}
              </g>
            )}
          </g>
        )}

        {/* 2. PERIMETER RIM BORDER FOR PLATE */}
        {!isSelection && object.id === 'tabak' && (
          <g id="rim-border-tabak" opacity={isDraft ? 0.4 : 0.95}>
            {Array.from({ length: 16 }).map((_, i) => {
              const rot = (i * 360) / 16;
              const flowerColor = i % 2 === 0 ? pColor : sColor;
              return (
                <g key={`border-f-${i}`} transform={`rotate(${rot} 300 300) translate(300, 42)`}>
                  <path d="M -25 18 Q 0 8 25 18" fill="none" stroke={greenStem} strokeWidth="1.5" />
                  <path
                    d="M -7 18 C -10 10 -4 9 0 12 C 4 9 10 10 7 18 Z"
                    fill={flowerColor}
                    stroke={isDraft ? draftStroke : tahrir}
                    strokeWidth="1"
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* 3. MAIN MOTIF ARTWORK (Full coverage 70-90%, safely clipped) */}
        {!isSelection && (
          <g clipPath={`url(#${decorationArea.clipPathId})`}>
            <g id="main-motif-artwork" transform={decorationArea.transform}>
              <MotifArtwork
                motifId={motif.id}
                isDraft={isDraft}
                isInteractive={isInteractive}
                isCompleted={isCompleted}
                isZoneActive={isZoneActive}
                pColor={pColor}
                sColor={sColor}
                greenStem={greenStem}
                tahrir={tahrir}
                draftStroke={draftStroke}
                paintedRegions={paintedRegions}
                onRegionClick={onRegionClick}
                hoveredRegion={hoveredRegion}
                onRegionHover={onRegionHover}
                leadHintRegions={leadHintRegions}
                justPaintedRegion={justPaintedRegion}
                activeStepOrder={activeStepOrder}
                shakingRegionId={shakingRegionId}
                primaryColorHex={pColor}
                secondaryColorHex={sColor}
                accentColorHex={aColor}
              />
            </g>
          </g>
        )}

        {/* 4. Ceramic Glaze Specular Sheen (Gentle non-tinting gloss) */}
        <circle cx="300" cy="300" r="280" fill="url(#ceramicShine)" pointerEvents="none" opacity="0.6" />
      </svg>
    </div>
  );
};
