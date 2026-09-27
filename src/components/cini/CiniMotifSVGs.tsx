import React from 'react';
import { MOTIF_REGION_DEFINITIONS, type MotifRegionDef, type PaintedRegion } from '../../data/ciniData';

/**
 * Authentic Turkish / Anatolian Ceramic Motifs (İznik & Kütahya Çini Sanatı)
 * 6 Distinct Motifs with separate authentic SVG geometries and stable interactive regions:
 * 1. Lale (Ottoman Fluted Tulip)
 * 2. Karanfil (Ruffled Scalloped Carnation)
 * 3. Rumi (Seljuk & Ottoman Curvilinear Spiral Arabesque)
 * 4. Hatayi (Radial Peony/Lotus Rosette)
 * 5. Geometrik (Seljuk 8-Pointed Star Medallion)
 * 6. Yaprak (Serrated Saz Foliage & Spring Blossoms)
 */

export interface MotifZoneProps {
  isDraft: boolean;
  isZoneActive?: (zone: number) => boolean;
  pColor: string;
  sColor: string;
  greenStem: string;
  tahrir: string;
  draftStroke: string;
}

/**
 * Miniature SVG preview for Step 2 selection cards
 */
export const MotifCardPreview: React.FC<{ motifId: string; isSelected: boolean }> = ({
  motifId,
  isSelected,
}) => {
  const mainColor = isSelected ? '#0047AB' : '#1E293B';
  const accentColor = isSelected ? '#DC2626' : '#854D0E';
  const strokeColor = isSelected ? '#002B66' : '#334155';

  return (
    <svg width="52" height="52" viewBox="0 0 100 100" style={{ display: 'block' }}>
      {motifId === 'lale' && (
        <g transform="translate(50, 52)">
          <path d="M 0 38 Q 0 15 0 -5" fill="none" stroke="#15803D" strokeWidth="3" />
          <path d="M 0 35 C -15 25 -25 5 -18 -15 C -12 5 0 22 0 35 Z" fill="#15803D" opacity="0.85" />
          <path d="M 0 35 C 15 25 25 5 18 -15 C 12 5 0 22 0 35 Z" fill="#15803D" opacity="0.85" />
          <path
            d="M 0 5 C -18 -10 -26 -35 -14 -50 C -8 -30 -2 -18 0 -5 C 2 -18 8 -30 14 -50 C 26 -35 18 -10 0 5 Z"
            fill={accentColor}
            stroke={strokeColor}
            strokeWidth="2"
          />
          <path d="M 0 0 C -8 -15 -8 -38 0 -46 C 8 -38 8 -15 0 0 Z" fill={mainColor} />
        </g>
      )}

      {motifId === 'karanfil' && (
        <g transform="translate(50, 52)">
          <path d="M 0 38 L 0 15" fill="none" stroke="#15803D" strokeWidth="3" />
          <path d="M -8 18 C -10 5 10 5 8 18 Z" fill="#15803D" stroke={strokeColor} strokeWidth="1.5" />
          <path
            d="M -16 8 C -30 -5 -32 -25 -20 -38 C -14 -28 -10 -22 -4 -32 C 0 -22 4 -22 8 -32 C 14 -22 18 -28 24 -38 C 36 -25 34 -5 20 8 Z"
            fill={accentColor}
            stroke={strokeColor}
            strokeWidth="2"
          />
          <path
            d="M -12 6 C -20 -4 -22 -18 -12 -28 C -7 -20 -3 -16 0 -22 C 3 -16 7 -20 12 -28 C 22 -18 20 -4 12 6 Z"
            fill={mainColor}
          />
        </g>
      )}

      {motifId === 'rumi' && (
        <g transform="translate(50, 50)">
          <path
            d="M -25 25 C -35 5 -20 -20 0 -28 C 15 -35 32 -30 35 -15 C 38 0 25 15 10 18 C -5 20 -15 10 -15 0 C -15 -10 -5 -15 5 -12"
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
          />
          <path
            d="M -10 20 C -25 10 -28 -15 0 -35 C 10 -20 18 -8 28 -5 C 15 -2 5 8 -10 20 Z"
            fill={mainColor}
            stroke={strokeColor}
            strokeWidth="1.8"
          />
          <path
            d="M 8 -5 C 22 -12 32 -5 32 10 C 22 18 10 15 0 20 C 10 10 12 0 8 -5 Z"
            fill={accentColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
        </g>
      )}

      {motifId === 'hatayi' && (
        <g transform="translate(50, 50)">
          {Array.from({ length: 8 }).map((_, i) => (
            <g key={`prev-hatayi-${i}`} transform={`rotate(${i * 45})`}>
              <path
                d="M 0 -8 C -10 -18 -8 -38 0 -42 C 8 -38 10 -18 0 -8 Z"
                fill={i % 2 === 0 ? mainColor : accentColor}
                stroke={strokeColor}
                strokeWidth="1.2"
              />
            </g>
          ))}
          <circle cx="0" cy="0" r="10" fill="#F8FAFC" stroke={strokeColor} strokeWidth="2" />
          <circle cx="0" cy="0" r="5" fill={accentColor} />
        </g>
      )}

      {motifId === 'geometrik' && (
        <g transform="translate(50, 50)">
          <rect x="-28" y="-28" width="56" height="56" fill={mainColor} stroke={strokeColor} strokeWidth="1.8" rx="2" />
          <rect
            x="-28"
            y="-28"
            width="56"
            height="56"
            transform="rotate(45)"
            fill={accentColor}
            stroke={strokeColor}
            strokeWidth="1.8"
            opacity="0.85"
            rx="2"
          />
          <circle cx="0" cy="0" r="12" fill="#F8FAFC" stroke={strokeColor} strokeWidth="1.5" />
          <circle cx="0" cy="0" r="6" fill={mainColor} />
        </g>
      )}

      {motifId === 'yaprak' && (
        <g transform="translate(50, 52)">
          <path d="M 0 35 C -15 20 -20 0 -5 -25 C 10 -10 5 15 0 35 Z" fill="#15803D" stroke={strokeColor} strokeWidth="1.5" />
          <path d="M 0 35 C 15 20 20 0 5 -25 C -10 -10 -5 15 0 35 Z" fill="#15803D" stroke={strokeColor} strokeWidth="1.5" />
          <circle cx="-12" cy="5" r="7" fill={accentColor} stroke={strokeColor} strokeWidth="1.2" />
          <circle cx="15" cy="-8" r="7" fill={mainColor} stroke={strokeColor} strokeWidth="1.2" />
          <circle cx="-12" cy="5" r="2.5" fill="#FFFFFF" />
          <circle cx="15" cy="-8" r="2.5" fill="#FFFFFF" />
        </g>
      )}
    </svg>
  );
};

export interface MotifArtworkProps extends MotifZoneProps {
  motifId: string;
  isInteractive?: boolean;
  isCompleted?: boolean;
  paintedRegions?: Record<string, PaintedRegion | string>;
  onRegionClick?: (regionId: string, clientX: number, clientY: number, targetCenter: { x: number; y: number }) => void;
  hoveredRegion?: string | null;
  onRegionHover?: (regionId: string | null) => void;
  leadHintRegions?: string[];
  justPaintedRegion?: string | null;
  activeStepOrder?: number;
  shakingRegionId?: string | null;
  primaryColorHex?: string;
  secondaryColorHex?: string;
  accentColorHex?: string;
}

export const MotifArtwork: React.FC<MotifArtworkProps> = ({
  motifId,
  isDraft,
  isInteractive = false,
  isCompleted: _isCompleted = false,
  isZoneActive: _isZoneActive,
  pColor,
  sColor,
  greenStem,
  tahrir,
  draftStroke,
  paintedRegions = {},
  onRegionClick,
  hoveredRegion: _hoveredRegion,
  onRegionHover: _onRegionHover,
  leadHintRegions = [],
  justPaintedRegion = null,
  activeStepOrder = 1,
  shakingRegionId = null,
  primaryColorHex,
  secondaryColorHex,
  accentColorHex,
}) => {
  const regionDefs = MOTIF_REGION_DEFINITIONS[motifId] || MOTIF_REGION_DEFINITIONS.lale;
  const regionMap = React.useMemo(() => {
    const map = new Map<string, MotifRegionDef>();
    regionDefs.forEach((d) => map.set(d.id, d));
    return map;
  }, [regionDefs]);

  // Determine fill color for any region ID
  // Single Source of Truth: exact paintedRegions[regionId] or selectedPalette
  const getRegionFill = (regionId: string, _legacyZoneIndex?: number): string => {
    if (isDraft) return 'none';

    // Step 4 & 5: Check if custom color painted (exact hex value)
    const paintedEntry = paintedRegions[regionId];
    if (paintedEntry) {
      return typeof paintedEntry === 'string' ? paintedEntry : paintedEntry.colorHex;
    }

    // Step 4 (Interactive): Unpainted regions show gentle cream biscuit tone
    if (isInteractive) {
      return '#FAF6ED';
    }

    // Step 3 (Preview) & Step 5 (Completed unpainted fallback):
    // Use user's exact selected palette with semantic role mapping
    const effectivePrimary = primaryColorHex || pColor;
    const effectiveSecondary = secondaryColorHex || sColor;
    const effectiveAccent = accentColorHex || effectiveSecondary;

    const def = regionMap.get(regionId);
    const role =
      def?.paletteRole ||
      (def ? (def.order % 3 === 1 ? 'primary' : def.order % 3 === 2 ? 'secondary' : 'accent') : 'primary');

    if (role === 'primary') return effectivePrimary;
    if (role === 'secondary') return effectiveSecondary;
    return effectiveAccent;
  };

  const getRegionStroke = (regionId: string): string => {
    if (isDraft) return draftStroke;
    if (isInteractive && !paintedRegions[regionId]) {
      return '#1554A4'; // Distinct, elegant cobalt contour
    }
    return tahrir; // Dark rich cobalt outline
  };

  const isPainted = (regionId: string): boolean => {
    return Boolean(paintedRegions[regionId]);
  };

  // Helper to attach pointer handlers and hit-area
  const renderInteractiveRegion = (
    regionId: string,
    children: React.ReactNode,
    hitGeometry: React.ReactNode
  ) => {
    const def = regionMap.get(regionId);
    const center = def ? def.center : { x: 300, y: 300 };
    const painted = isPainted(regionId);
    const isLeadHint = isInteractive && !painted && leadHintRegions.includes(regionId);
    const isJustPainted = justPaintedRegion === regionId;

    const handlePointerDown = (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isInteractive || !onRegionClick) return;
      onRegionClick(regionId, e.clientX, e.clientY, center);
    };

    return (
      <g
        id={regionId}
        className={`cini-motif-region ${painted ? 'is-painted' : 'is-unpainted'} ${
          isLeadHint ? 'is-lead-hint' : ''
        } ${isJustPainted ? 'is-just-painted' : ''}`}
        style={{
          cursor: isInteractive ? 'pointer' : 'default',
          transformOrigin: `${center.x}px ${center.y}px`,
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onPointerDown={handlePointerDown}
      >
        {/* Visual elements */}
        {children}

        {/* Generous Invisible Touch Target (60-80px hit coverage) */}
        {isInteractive && (
          <g
            className="cini-touch-hitbox"
            stroke="transparent"
            strokeWidth="50"
            fill="transparent"
            style={{ pointerEvents: 'all' }}
          >
            {hitGeometry}
          </g>
        )}
      </g>
    );
  };

  // Step 4: Numbered Painting Guidance Badges Overlay (1, 2, 3...)
  // Single Source of Truth: activeStepOrder (currentPaintStep)
  const renderNumberBadgesOverlay = () => {
    if (!isInteractive) return null;

    return (
      <g id="cini-number-badges-overlay" pointerEvents="all">
        {regionDefs.map((def) => {
          // Completed numbers are hidden (region is painted)
          if (def.order < activeStepOrder) return null;

          const isActive = def.order === activeStepOrder;
          const isShaking = shakingRegionId === def.id;
          const pos = def.labelPosition || def.center;

          const handleBadgePointerDown = (e: React.PointerEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isInteractive || !onRegionClick) return;
            onRegionClick(def.id, e.clientX, e.clientY, pos);
          };

          return (
            <g
              key={`badge-${def.id}`}
              id={`badge-${def.id}`}
              className="cini-number-badge"
              transform={`translate(${pos.x}, ${pos.y})`}
              style={{
                cursor: 'pointer',
                pointerEvents: 'all',
              }}
              onPointerDown={handleBadgePointerDown}
            >
              <g
                className={`cini-badge-content ${isActive ? 'is-active' : 'is-passive'} ${
                  isShaking ? 'is-shaking' : ''
                }`}
              >
                {isActive ? (
                  /* 11. Aktif hedef: sabit görünür, altın/turuncu halka, ortada numara, opacity: 1, pulse 1 -> 1.06 -> 1 */
                  <g>
                    {/* Subtle outer accent ring */}
                    <circle
                      r="25"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="1.8"
                      strokeDasharray="3 3"
                      opacity="0.8"
                    />
                    {/* Deep Navy High-Contrast Base Disc with bold gold border */}
                    <circle
                      r="21"
                      fill="#0B132B"
                      stroke="#F59E0B"
                      strokeWidth="3"
                      filter="drop-shadow(0 3px 6px rgba(0, 0, 0, 0.65))"
                    />
                    {/* Bold White Number in center */}
                    <text
                      textAnchor="middle"
                      dy="6.5"
                      fill="#FFFFFF"
                      fontSize="18"
                      fontWeight="900"
                      fontFamily="'Outfit', 'Segoe UI', sans-serif"
                      letterSpacing="0.2px"
                    >
                      {def.order}
                    </text>
                  </g>
                ) : (
                  /* 12. Pasif hedef: 6, 7, 8... sonraki numaralar soluk şekilde SABİT görünmeli */
                  <g>
                    <circle
                      r="16.5"
                      fill="rgba(11, 19, 43, 0.85)"
                      stroke="rgba(245, 158, 11, 0.45)"
                      strokeWidth="1.6"
                      filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.45))"
                    />
                    <text
                      textAnchor="middle"
                      dy="5.5"
                      fill="#CBD5E1"
                      fontSize="14"
                      fontWeight="800"
                      fontFamily="'Outfit', 'Segoe UI', sans-serif"
                    >
                      {def.order}
                    </text>
                  </g>
                )}
              </g>
            </g>
          );
        })}
      </g>
    );
  };

  switch (motifId) {
    /* =========================================================================
       1. LALE (Ottoman Stylized Iznik Tulip - Zarafet & Tevazu)
       ========================================================================= */
    case 'lale':
    default:
      return (
        <g id="motif-lale-full-composition">
          {/* 1. Neck / Rim Border Band (Filling upper vase neck or plate rim) */}
          {renderInteractiveRegion(
            'motif-lale-neck-band',
            <g id="lale-neck-band">
              <path
                d="M 230 130 C 265 142 335 142 370 130"
                fill="none"
                stroke={getRegionStroke('motif-lale-neck-band')}
                strokeWidth="2"
              />
              {[-50, -25, 0, 25, 50].map((offset, i) => (
                <g key={`lale-neck-fl-${i}`} transform={`translate(${300 + offset}, 132)`}>
                  <path
                    d="M 0 0 C -7 -10 -5 -22 0 -26 C 5 -22 7 -10 0 0 Z"
                    fill={getRegionFill('motif-lale-neck-band', 5)}
                    stroke={getRegionStroke('motif-lale-neck-band')}
                    strokeWidth="1.2"
                  />
                </g>
              ))}
            </g>,
            <rect x="220" y="100" width="160" height="50" rx="8" />
          )}

          {/* 2. Main Central Stem and Basal Calyx */}
          {renderInteractiveRegion(
            'motif-lale-stem',
            <g id="lale-stem">
              {/* Grand undulating central stem */}
              <path
                d="M 300 480 Q 300 370 300 240"
                fill="none"
                stroke={isDraft ? draftStroke : getRegionFill('motif-lale-stem', 0) || greenStem}
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Left & Right connecting branches */}
              <path
                d="M 300 420 C 235 390 195 330 195 260"
                fill="none"
                stroke={isDraft ? draftStroke : getRegionFill('motif-lale-stem', 0) || greenStem}
                strokeWidth="2.8"
              />
              <path
                d="M 300 420 C 365 390 405 330 405 260"
                fill="none"
                stroke={isDraft ? draftStroke : getRegionFill('motif-lale-stem', 0) || greenStem}
                strokeWidth="2.8"
              />
              {/* Basal tuft scroll */}
              <path
                d="M 300 475 C 265 470 230 440 245 400 C 265 435 285 455 300 475 Z"
                fill={getRegionFill('motif-lale-stem', 0)}
                stroke={getRegionStroke('motif-lale-stem')}
                strokeWidth="1.5"
              />
              <path
                d="M 300 475 C 335 470 370 440 355 400 C 335 435 315 455 300 475 Z"
                fill={getRegionFill('motif-lale-stem', 0)}
                stroke={getRegionStroke('motif-lale-stem')}
                strokeWidth="1.5"
              />
            </g>,
            <path d="M 300 480 L 300 240 M 300 420 L 195 260 M 300 420 L 405 260" />
          )}

          {/* 3. Left Saz Leaf */}
          {renderInteractiveRegion(
            'motif-lale-left-leaf',
            <g id="lale-left-leaf">
              <path
                d="M 295 440 C 215 425 155 355 165 260 C 185 320 235 390 295 440 Z"
                fill={getRegionFill('motif-lale-left-leaf', 0)}
                stroke={getRegionStroke('motif-lale-left-leaf')}
                strokeWidth="2"
              />
              {/* Serrated Leaf Veins */}
              <path
                d="M 175 275 C 190 310 220 350 265 395"
                fill="none"
                stroke={isDraft ? draftStroke : '#FFFFFF'}
                strokeWidth="1.4"
                opacity="0.75"
              />
            </g>,
            <circle cx="215" cy="350" r="50" />
          )}

          {/* 4. Right Saz Leaf */}
          {renderInteractiveRegion(
            'motif-lale-right-leaf',
            <g id="lale-right-leaf">
              <path
                d="M 305 440 C 385 425 445 355 435 260 C 415 320 365 390 305 440 Z"
                fill={getRegionFill('motif-lale-right-leaf', 0)}
                stroke={getRegionStroke('motif-lale-right-leaf')}
                strokeWidth="2"
              />
              <path
                d="M 425 275 C 410 310 380 350 335 395"
                fill="none"
                stroke={isDraft ? draftStroke : '#FFFFFF'}
                strokeWidth="1.4"
                opacity="0.75"
              />
            </g>,
            <circle cx="385" cy="350" r="50" />
          )}

          {/* 5. Left Flanking Ottoman Scalloped Carnation (Matching Reference Image) */}
          {renderInteractiveRegion(
            'motif-lale-left-flower',
            <g id="lale-left-flower" transform="translate(190, 260) rotate(-24)">
              {/* Outer scalloped fan tier */}
              <path
                d="M -22 10 C -42 -6 -46 -30 -30 -52 C -22 -38 -14 -30 -6 -42 C 2 -30 8 -30 16 -42 C 24 -30 30 -38 38 -52 C 54 -30 50 -6 28 10 Z"
                fill={getRegionFill('motif-lale-left-flower', 2)}
                stroke={getRegionStroke('motif-lale-left-flower')}
                strokeWidth="2.2"
              />
              {/* Inner scalloped tier */}
              <path
                d="M -14 6 C -26 -4 -28 -20 -18 -32 C -12 -22 -6 -16 0 -24 C 6 -16 12 -22 18 -32 C 28 -20 26 -4 14 6 Z"
                fill={isDraft ? 'none' : '#FFFFFF'}
                stroke={getRegionStroke('motif-lale-left-flower')}
                strokeWidth="1.4"
              />
              {/* Calyx cup */}
              <path d="M -12 10 C -15 22 15 22 12 10 Z" fill={greenStem} stroke={tahrir} strokeWidth="1.2" />
            </g>,
            <circle cx="190" cy="245" r="50" />
          )}

          {/* 6. Right Flanking Ottoman Scalloped Carnation (Matching Reference Image) */}
          {renderInteractiveRegion(
            'motif-lale-right-flower',
            <g id="lale-right-flower" transform="translate(410, 260) rotate(24)">
              {/* Outer scalloped fan tier */}
              <path
                d="M -28 10 C -50 -6 -54 -30 -38 -52 C -30 -38 -24 -30 -16 -42 C -8 -30 -2 -30 6 -42 C 14 -30 22 -38 30 -52 C 46 -30 42 -6 22 10 Z"
                fill={getRegionFill('motif-lale-right-flower', 3)}
                stroke={getRegionStroke('motif-lale-right-flower')}
                strokeWidth="2.2"
              />
              {/* Inner scalloped tier */}
              <path
                d="M -14 6 C -26 -4 -28 -20 -18 -32 C -12 -22 -6 -16 0 -24 C 6 -16 12 -22 18 -32 C 28 -20 26 -4 14 6 Z"
                fill={isDraft ? 'none' : '#FFFFFF'}
                stroke={getRegionStroke('motif-lale-right-flower')}
                strokeWidth="1.4"
              />
              {/* Calyx cup */}
              <path d="M -12 10 C -15 22 15 22 12 10 Z" fill={greenStem} stroke={tahrir} strokeWidth="1.2" />
            </g>,
            <circle cx="410" cy="245" r="50" />
          )}

          {/* 7. Grand Outer Tulip Wings (Left & Right Flaring Petals) */}
          {renderInteractiveRegion(
            'motif-lale-left-wing',
            <g id="lale-left-wing">
              <path
                d="M 300 240 C 255 210 215 150 250 80 C 265 130 280 180 300 210 Z"
                fill={getRegionFill('motif-lale-left-wing', 4)}
                stroke={getRegionStroke('motif-lale-left-wing')}
                strokeWidth="2.4"
              />
            </g>,
            <circle cx="260" cy="170" r="45" />
          )}

          {renderInteractiveRegion(
            'motif-lale-right-wing',
            <g id="lale-right-wing">
              <path
                d="M 300 240 C 345 210 385 150 350 80 C 335 130 320 180 300 210 Z"
                fill={getRegionFill('motif-lale-right-wing', 4)}
                stroke={getRegionStroke('motif-lale-right-wing')}
                strokeWidth="2.4"
              />
            </g>,
            <circle cx="340" cy="170" r="45" />
          )}

          {/* 8. Grand Central Master Tulip Body (Main focus of the artwork!) */}
          {renderInteractiveRegion(
            'motif-lale-center',
            <g id="lale-center">
              {/* Outer Flaring Heart */}
              <path
                d="M 300 240 C 270 210 260 140 300 70 C 340 140 330 210 300 240 Z"
                fill={getRegionFill('motif-lale-center', 1)}
                stroke={getRegionStroke('motif-lale-center')}
                strokeWidth="2.6"
              />
            </g>,
            <circle cx="300" cy="165" r="55" />
          )}

          {/* 9. Central Tulip Inner Crown Flame */}
          {renderInteractiveRegion(
            'motif-lale-center-inner',
            <g id="lale-center-inner">
              <path
                d="M 300 230 C 285 200 280 140 300 95 C 320 140 315 200 300 230 Z"
                fill={getRegionFill('motif-lale-center-inner', 1)}
                stroke={getRegionStroke('motif-lale-center-inner')}
                strokeWidth="1.8"
              />
              {/* Fine White Porcelain Glaze Highlight Strokes */}
              {!isDraft && (
                <path
                  d="M 300 115 L 300 210 M 292 145 C 290 170 292 195 296 210 M 308 145 C 310 170 308 195 304 210"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.85"
                />
              )}
            </g>,
            <circle cx="300" cy="180" r="35" />
          )}

          {/* 10. Top Hatayi Blossom (Above the tulip tips, matching reference image) */}
          {renderInteractiveRegion(
            'motif-lale-top-flower',
            <g id="lale-top-flower" transform="translate(300, 110)">
              {Array.from({ length: 6 }).map((_, i) => (
                <g key={`lale-top-fl-${i}`} transform={`rotate(${i * 60})`}>
                  <path
                    d="M 0 -6 C -6 -12 -5 -22 0 -24 C 5 -22 6 -12 0 -6 Z"
                    fill={getRegionFill('motif-lale-top-flower', 5)}
                    stroke={getRegionStroke('motif-lale-top-flower')}
                    strokeWidth="1.2"
                  />
                </g>
              ))}
              <circle cx="0" cy="0" r="7" fill={isDraft ? 'none' : '#FAF6EE'} stroke={tahrir} strokeWidth="1.2" />
              <circle cx="0" cy="0" r="3.5" fill={getRegionFill('motif-lale-top-flower', 1)} />
            </g>,
            <circle cx="300" cy="110" r="38" />
          )}

          {/* 11. Lower Basal Blossom (Where stem and leaf curves join, matching reference image) */}
          {renderInteractiveRegion(
            'motif-lale-lower-blossom',
            <g id="lale-lower-blossom" transform="translate(300, 440)">
              {Array.from({ length: 8 }).map((_, i) => (
                <g key={`lale-low-bl-${i}`} transform={`rotate(${i * 45})`}>
                  <path
                    d="M 0 -4 C -5 -9 -4 -16 0 -18 C 4 -16 5 -9 0 -4 Z"
                    fill={getRegionFill('motif-lale-lower-blossom', 4)}
                    stroke={getRegionStroke('motif-lale-lower-blossom')}
                    strokeWidth="1.2"
                  />
                </g>
              ))}
              <circle cx="0" cy="0" r="6" fill={isDraft ? 'none' : '#FAF6EE'} stroke={tahrir} strokeWidth="1" />
              <circle cx="0" cy="0" r="3" fill={getRegionFill('motif-lale-lower-blossom', 2)} />
            </g>,
            <circle cx="300" cy="440" r="36" />
          )}

          {/* Numbered Painting Badges Overlay */}
          {renderNumberBadgesOverlay()}
        </g>
      );

    /* =========================================================================
       2. KARANFİL (Layered Anatolian Carnation - Distinctly round & scalloped)
       ========================================================================= */
    case 'karanfil':
      return (
        <g id="motif-karanfil-full-composition">
          {/* Neck Band */}
          {renderInteractiveRegion(
            'motif-karanfil-neck-band',
            <g id="karanfil-neck-band">
              <path d="M 230 130 C 265 142 335 142 370 130" fill="none" stroke={getRegionStroke('motif-karanfil-neck-band')} strokeWidth="2" />
              {[-45, 0, 45].map((off, idx) => (
                <g key={`k-neck-${idx}`} transform={`translate(${300 + off}, 128)`}>
                  <path d="M -12 6 C -18 -4 -20 -18 -10 -26 C -5 -18 -2 -14 2 -20 C 6 -14 9 -18 14 -26 C 24 -18 22 -4 16 6 Z" fill={getRegionFill('motif-karanfil-neck-band', 5)} stroke={getRegionStroke('motif-karanfil-neck-band')} strokeWidth="1" />
                </g>
              ))}
            </g>,
            <rect x="220" y="100" width="160" height="50" rx="8" />
          )}

          {/* Stems */}
          {renderInteractiveRegion(
            'motif-karanfil-stem',
            <g id="karanfil-stem">
              <path d="M 300 480 Q 300 380 300 260" fill="none" stroke={isDraft ? draftStroke : getRegionFill('motif-karanfil-stem', 0) || greenStem} strokeWidth="4" strokeLinecap="round" />
              <path d="M 300 430 Q 235 385 215 320" fill="none" stroke={isDraft ? draftStroke : getRegionFill('motif-karanfil-stem', 0) || greenStem} strokeWidth="2.8" />
              <path d="M 300 430 Q 365 385 385 320" fill="none" stroke={isDraft ? draftStroke : getRegionFill('motif-karanfil-stem', 0) || greenStem} strokeWidth="2.8" />
              <path d="M 278 275 C 270 240 330 240 322 275 Z" fill={getRegionFill('motif-karanfil-stem', 0)} stroke={getRegionStroke('motif-karanfil-stem')} strokeWidth="2" />
            </g>,
            <path d="M 300 480 L 300 260 M 300 430 L 215 320 M 300 430 L 385 320" />
          )}

          {/* Foliage */}
          {renderInteractiveRegion(
            'motif-karanfil-leaves',
            <g id="karanfil-leaves">
              <path d="M 300 450 C 230 420 180 350 230 280 C 245 325 270 385 300 450 Z" fill={getRegionFill('motif-karanfil-leaves', 0)} stroke={getRegionStroke('motif-karanfil-leaves')} strokeWidth="1.8" />
              <path d="M 300 450 C 370 420 420 350 370 280 C 355 325 330 385 300 450 Z" fill={getRegionFill('motif-karanfil-leaves', 0)} stroke={getRegionStroke('motif-karanfil-leaves')} strokeWidth="1.8" />
            </g>,
            <circle cx="300" cy="380" r="55" />
          )}

          {/* Left Flanking Carnation */}
          {renderInteractiveRegion(
            'motif-karanfil-left-flower',
            <g id="karanfil-left-flower" transform="translate(215, 315) rotate(-22)">
              <path d="M -18 10 C -38 -5 -42 -30 -26 -50 C -18 -36 -10 -28 -4 -42 C 2 -28 8 -28 14 -42 C 20 -28 26 -36 34 -50 C 50 -30 46 -5 26 10 Z" fill={getRegionFill('motif-karanfil-left-flower', 2)} stroke={getRegionStroke('motif-karanfil-left-flower')} strokeWidth="2" />
              <path d="M -10 6 C -20 -4 -22 -20 -12 -32 C -6 -20 -2 -16 2 -24 C 6 -16 10 -20 16 -32 C 26 -20 24 -4 14 6 Z" fill={isDraft ? 'none' : '#FFFFFF'} stroke={getRegionStroke('motif-karanfil-left-flower')} strokeWidth="1.2" />
            </g>,
            <circle cx="215" cy="300" r="50" />
          )}

          {/* Right Flanking Carnation */}
          {renderInteractiveRegion(
            'motif-karanfil-right-flower',
            <g id="karanfil-right-flower" transform="translate(385, 315) rotate(22)">
              <path d="M -26 10 C -46 -5 -50 -30 -34 -50 C -26 -36 -20 -28 -14 -42 C -8 -28 -2 -28 4 -42 C 10 -28 16 -36 24 -50 C 40 -30 36 -5 16 10 Z" fill={getRegionFill('motif-karanfil-right-flower', 3)} stroke={getRegionStroke('motif-karanfil-right-flower')} strokeWidth="2" />
              <path d="M -14 6 C -24 -4 -26 -20 -16 -32 C -10 -20 -6 -16 -2 -24 C 2 -16 6 -20 12 -32 C 22 -20 20 -4 10 6 Z" fill={isDraft ? 'none' : '#FFFFFF'} stroke={getRegionStroke('motif-karanfil-right-flower')} strokeWidth="1.2" />
            </g>,
            <circle cx="385" cy="300" r="50" />
          )}

          {/* Left Upper Buds */}
          {renderInteractiveRegion(
            'motif-karanfil-left-buds',
            <g id="karanfil-left-buds" transform="translate(235, 200) rotate(-16)">
              <path d="M -14 0 C -26 -18 -24 -36 -12 -46 C -7 -34 -2 -28 3 -36 C 8 -28 13 -34 18 -46 C 30 -36 32 -18 20 0 Z" fill={getRegionFill('motif-karanfil-left-buds', 4)} stroke={getRegionStroke('motif-karanfil-left-buds')} strokeWidth="1.8" />
              <path d="M -10 0 C -12 10 12 10 10 0 Z" fill={greenStem} stroke={tahrir} strokeWidth="1.2" />
            </g>,
            <circle cx="235" cy="190" r="40" />
          )}

          {/* Right Upper Buds */}
          {renderInteractiveRegion(
            'motif-karanfil-right-buds',
            <g id="karanfil-right-buds" transform="translate(365, 200) rotate(16)">
              <path d="M -18 0 C -30 -18 -28 -36 -16 -46 C -11 -34 -6 -28 -1 -36 C 4 -28 9 -34 14 -46 C 26 -36 28 -18 16 0 Z" fill={getRegionFill('motif-karanfil-right-buds', 4)} stroke={getRegionStroke('motif-karanfil-right-buds')} strokeWidth="1.8" />
              <path d="M -14 0 C -16 10 16 10 14 0 Z" fill={greenStem} stroke={tahrir} strokeWidth="1.2" />
            </g>,
            <circle cx="365" cy="190" r="40" />
          )}

          {/* Grand Center Master Carnation - Outer Fan */}
          {renderInteractiveRegion(
            'motif-karanfil-center',
            <g id="karanfil-center" transform="translate(300, 245)">
              <path d="M -40 18 C -75 -18 -85 -75 -56 -120 C -40 -92 -28 -75 -12 -102 C 0 -78 12 -78 24 -102 C 40 -75 52 -92 68 -120 C 96 -75 86 -18 52 18 Z" fill={getRegionFill('motif-karanfil-center', 1)} stroke={getRegionStroke('motif-karanfil-center')} strokeWidth="2.6" />
            </g>,
            <circle cx="300" cy="195" r="65" />
          )}

          {/* Grand Center Master Carnation - Inner Katmer */}
          {renderInteractiveRegion(
            'motif-karanfil-center-mid',
            <g id="karanfil-center-mid" transform="translate(300, 245)">
              <path d="M -28 12 C -52 -14 -60 -58 -36 -92 C -24 -72 -16 -58 -6 -80 C 6 -58 16 -72 26 -92 C 50 -58 42 -14 20 12 Z" fill={getRegionFill('motif-karanfil-center-mid', 1)} stroke={getRegionStroke('motif-karanfil-center-mid')} strokeWidth="2" />
              <circle cx="0" cy="-25" r="14" fill={isDraft ? 'none' : '#FFFFFF'} stroke={getRegionStroke('motif-karanfil-center-mid')} strokeWidth="1.5" />
            </g>,
            <circle cx="300" cy="225" r="45" />
          )}

          {/* Numbered Painting Badges Overlay */}
          {renderNumberBadgesOverlay()}
        </g>
      );

    /* =========================================================================
       3. RUMİ (Seljuk & Ottoman Curvilinear Spiral Arabesque)
       ========================================================================= */
    case 'rumi':
      return (
        <g id="motif-rumi-full-composition">
          {/* Neck Band */}
          {renderInteractiveRegion(
            'motif-rumi-neck-band',
            <g id="rumi-neck-band">
              <path d="M 230 130 C 265 142 335 142 370 130" fill="none" stroke={getRegionStroke('motif-rumi-neck-band')} strokeWidth="2" />
              {[-40, 0, 40].map((off, i) => (
                <path key={`r-neck-${i}`} d={`M ${300 + off} 132 C ${285 + off} 120 ${290 + off} 105 ${305 + off} 105 C ${320 + off} 105 ${315 + off} 125 ${300 + off} 132 Z`} fill={getRegionFill('motif-rumi-neck-band', 5)} stroke={getRegionStroke('motif-rumi-neck-band')} strokeWidth="1.2" />
              ))}
            </g>,
            <rect x="220" y="100" width="160" height="50" rx="8" />
          )}

          {/* Stems */}
          {renderInteractiveRegion(
            'motif-rumi-stem',
            <g id="rumi-stem">
              <path d="M 300 480 C 240 450 200 380 230 310 C 260 240 340 240 370 310 C 400 380 360 450 300 480" fill="none" stroke={isDraft ? draftStroke : getRegionFill('motif-rumi-stem', 0) || greenStem} strokeWidth="4" />
              <path d="M 300 340 C 275 280 235 220 300 170 C 365 220 325 280 300 340" fill="none" stroke={isDraft ? draftStroke : getRegionFill('motif-rumi-stem', 0) || greenStem} strokeWidth="2.8" />
            </g>,
            <circle cx="300" cy="380" r="50" />
          )}

          {/* Left Wing */}
          {renderInteractiveRegion(
            'motif-rumi-left-wing',
            <g id="rumi-left-wing" transform="translate(225, 280)">
              <path d="M 22 55 C -35 32 -72 -18 -50 -78 C -32 -45 -16 -28 0 -16 C -16 -2 -24 20 -10 35 C 6 50 16 38 22 55 Z" fill={getRegionFill('motif-rumi-left-wing', 2)} stroke={getRegionStroke('motif-rumi-left-wing')} strokeWidth="2.4" />
              <path d="M 14 38 C -16 22 -38 -12 -28 -50 C -16 -28 -5 -16 5 -10 C -5 2 -8 16 0 28 Z" fill={isDraft ? 'none' : '#FFFFFF'} stroke={getRegionStroke('motif-rumi-left-wing')} strokeWidth="1.2" />
            </g>,
            <circle cx="205" cy="270" r="55" />
          )}

          {/* Right Wing */}
          {renderInteractiveRegion(
            'motif-rumi-right-wing',
            <g id="rumi-right-wing" transform="translate(375, 280)">
              <path d="M -22 55 C 35 32 72 -18 50 -78 C 32 -45 16 -28 0 -16 C 16 -2 24 20 10 35 C -6 50 -16 38 -22 55 Z" fill={getRegionFill('motif-rumi-right-wing', 3)} stroke={getRegionStroke('motif-rumi-right-wing')} strokeWidth="2.4" />
              <path d="M -14 38 C 16 22 38 -12 28 -50 C 16 -28 5 -16 -5 -10 C 5 2 8 16 0 28 Z" fill={isDraft ? 'none' : '#FFFFFF'} stroke={getRegionStroke('motif-rumi-right-wing')} strokeWidth="1.2" />
            </g>,
            <circle cx="395" cy="270" r="55" />
          )}

          {/* Left Lower Helezon */}
          {renderInteractiveRegion(
            'motif-rumi-left-scroll',
            <g id="rumi-left-scroll">
              <path d="M 230 370 C 180 390 190 450 250 450 C 280 450 290 410 260 390 C 230 370 210 390 220 420" fill={getRegionFill('motif-rumi-left-scroll', 0)} stroke={getRegionStroke('motif-rumi-left-scroll')} strokeWidth="2" />
            </g>,
            <circle cx="230" cy="410" r="45" />
          )}

          {/* Right Lower Helezon */}
          {renderInteractiveRegion(
            'motif-rumi-right-scroll',
            <g id="rumi-right-scroll">
              <path d="M 370 370 C 420 390 410 450 350 450 C 320 450 310 410 340 390 C 370 370 390 390 380 420" fill={getRegionFill('motif-rumi-right-scroll', 0)} stroke={getRegionStroke('motif-rumi-right-scroll')} strokeWidth="2" />
            </g>,
            <circle cx="370" cy="410" r="45" />
          )}

          {/* Top Finial */}
          {renderInteractiveRegion(
            'motif-rumi-top-finial',
            <g id="rumi-top-finial" transform="translate(300, 160)">
              <path d="M 0 40 C -28 22 -45 -18 -22 -52 C -11 -28 -2 -16 0 0 C 2 -16 11 -28 22 -52 C 45 -18 28 22 0 40 Z" fill={getRegionFill('motif-rumi-top-finial', 4)} stroke={getRegionStroke('motif-rumi-top-finial')} strokeWidth="2.2" />
              <circle cx="0" cy="-12" r="9" fill={isDraft ? 'none' : '#FFFFFF'} stroke={getRegionStroke('motif-rumi-top-finial')} strokeWidth="1.2" />
            </g>,
            <circle cx="300" cy="150" r="45" />
          )}

          {/* Center Knot Medallion */}
          {renderInteractiveRegion(
            'motif-rumi-center-knot',
            <g id="rumi-center-knot" transform="translate(300, 285)">
              <path d="M 0 -52 C -40 -28 -52 18 -28 52 C -6 24 6 24 28 52 C 52 18 40 -28 0 -52 Z" fill={getRegionFill('motif-rumi-center-knot', 1)} stroke={getRegionStroke('motif-rumi-center-knot')} strokeWidth="2.6" />
              <path d="M 0 -35 C -25 -18 -32 12 -18 35 C -2 18 2 18 18 35 C 32 12 25 -18 0 -35 Z" fill={getRegionFill('motif-rumi-center-eye', 1)} stroke={getRegionStroke('motif-rumi-center-knot')} strokeWidth="1.8" />
              <circle cx="0" cy="0" r="12" fill={isDraft ? 'none' : '#FFFFFF'} stroke={getRegionStroke('motif-rumi-center-knot')} strokeWidth="1.6" />
            </g>,
            <circle cx="300" cy="285" r="55" />
          )}

          {/* Numbered Painting Badges Overlay */}
          {renderNumberBadgesOverlay()}
        </g>
      );

    /* =========================================================================
       4. HATAYİ (Radial Lotus / Peony Symmetrical Rosette)
       ========================================================================= */
    case 'hatayi':
      return (
        <g id="motif-hatayi-full-composition">
          {/* Neck Band */}
          {renderInteractiveRegion(
            'motif-hatayi-neck-band',
            <g id="hatayi-neck-band">
              <path d="M 230 130 C 265 142 335 142 370 130" fill="none" stroke={getRegionStroke('motif-hatayi-neck-band')} strokeWidth="2" />
              {[-40, 0, 40].map((off, i) => (
                <circle key={`hat-neck-${i}`} cx={300 + off} cy="128" r="9" fill={getRegionFill('motif-hatayi-neck-band', 5)} stroke={getRegionStroke('motif-hatayi-neck-band')} strokeWidth="1.4" />
              ))}
            </g>,
            <rect x="220" y="100" width="160" height="50" rx="8" />
          )}

          {/* Stems */}
          {renderInteractiveRegion(
            'motif-hatayi-stem',
            <g id="hatayi-stem">
              <path d="M 300 480 Q 300 390 300 280" fill="none" stroke={isDraft ? draftStroke : getRegionFill('motif-hatayi-stem', 0) || greenStem} strokeWidth="4" strokeLinecap="round" />
              <path d="M 300 440 C 220 410 185 330 225 260" fill="none" stroke={isDraft ? draftStroke : getRegionFill('motif-hatayi-stem', 0) || greenStem} strokeWidth="2.8" />
              <path d="M 300 440 C 380 410 415 330 375 260" fill="none" stroke={isDraft ? draftStroke : getRegionFill('motif-hatayi-stem', 0) || greenStem} strokeWidth="2.8" />
            </g>,
            <path d="M 300 480 L 300 280 M 300 440 L 225 260 M 300 440 L 375 260" />
          )}

          {/* Leaves */}
          {renderInteractiveRegion(
            'motif-hatayi-leaves',
            <g id="hatayi-leaves">
              <path d="M 295 450 C 225 430 180 370 230 310 C 245 350 270 400 295 450 Z" fill={getRegionFill('motif-hatayi-leaves', 0)} stroke={getRegionStroke('motif-hatayi-leaves')} strokeWidth="1.8" />
              <path d="M 305 450 C 375 430 420 370 370 310 C 355 350 330 400 305 450 Z" fill={getRegionFill('motif-hatayi-leaves', 0)} stroke={getRegionStroke('motif-hatayi-leaves')} strokeWidth="1.8" />
            </g>,
            <circle cx="300" cy="390" r="55" />
          )}

          {/* Left Companion Blossom */}
          {renderInteractiveRegion(
            'motif-hatayi-left-flower',
            <g id="hatayi-left-flower" transform="translate(220, 270) rotate(-30)">
              <path d="M 0 16 C -28 0 -40 -34 -20 -56 C -12 -40 -2 -28 0 -16 C 2 -28 12 -40 20 -56 C 40 -34 28 0 0 16 Z" fill={getRegionFill('motif-hatayi-left-flower', 2)} stroke={getRegionStroke('motif-hatayi-left-flower')} strokeWidth="2" />
            </g>,
            <circle cx="215" cy="250" r="50" />
          )}

          {/* Right Companion Blossom */}
          {renderInteractiveRegion(
            'motif-hatayi-right-flower',
            <g id="hatayi-right-flower" transform="translate(380, 270) rotate(30)">
              <path d="M 0 16 C -28 0 -40 -34 -20 -56 C -12 -40 -2 -28 0 -16 C 2 -28 12 -40 20 -56 C 40 -34 28 0 0 16 Z" fill={getRegionFill('motif-hatayi-right-flower', 3)} stroke={getRegionStroke('motif-hatayi-right-flower')} strokeWidth="2" />
            </g>,
            <circle cx="385" cy="250" r="50" />
          )}

          {/* Top Bloom */}
          {renderInteractiveRegion(
            'motif-hatayi-top-bloom',
            <g id="hatayi-top-bloom" transform="translate(300, 155)">
              <path d="M 0 22 C -25 6 -34 -22 -18 -38 C -9 -25 0 -16 0 -6 C 0 -16 9 -25 18 -38 C 34 -22 25 6 0 22 Z" fill={getRegionFill('motif-hatayi-top-bloom', 4)} stroke={getRegionStroke('motif-hatayi-top-bloom')} strokeWidth="2" />
              <circle cx="0" cy="-6" r="8" fill={isDraft ? 'none' : '#FFFFFF'} stroke={getRegionStroke('motif-hatayi-top-bloom')} strokeWidth="1.2" />
            </g>,
            <circle cx="300" cy="150" r="45" />
          )}

          {/* Grand Center Hatayi Rosette - Outer Petals */}
          {renderInteractiveRegion(
            'motif-hatayi-outer-petals',
            <g id="hatayi-outer-petals" transform="translate(300, 280)">
              {Array.from({ length: 8 }).map((_, i) => (
                <g key={`hat-out-${i}`} transform={`rotate(${i * 45})`}>
                  <path d="M 0 -20 C -25 -40 -20 -85 0 -96 C 20 -85 25 -40 0 -20 Z" fill={getRegionFill('motif-hatayi-outer-petals', 1)} stroke={getRegionStroke('motif-hatayi-outer-petals')} strokeWidth="2.2" />
                </g>
              ))}
            </g>,
            <circle cx="300" cy="280" r="75" />
          )}

          {/* Inner Petal Ring */}
          {renderInteractiveRegion(
            'motif-hatayi-inner-ring',
            <g id="hatayi-inner-ring" transform="translate(300, 280)">
              {Array.from({ length: 8 }).map((_, i) => (
                <g key={`hat-in-${i}`} transform={`rotate(${i * 45 + 22.5})`}>
                  <path d="M 0 -14 C -14 -25 -12 -52 0 -60 C 12 -52 14 -25 0 -14 Z" fill={getRegionFill('motif-hatayi-inner-ring', 1)} stroke={getRegionStroke('motif-hatayi-inner-ring')} strokeWidth="1.5" />
                </g>
              ))}
            </g>,
            <circle cx="300" cy="280" r="50" />
          )}

          {/* Center Eye / Seed Core */}
          {renderInteractiveRegion(
            'motif-hatayi-center-eye',
            <g id="hatayi-center-eye" transform="translate(300, 280)">
              <circle cx="0" cy="0" r="25" fill={getRegionFill('motif-hatayi-center-eye', 1)} stroke={getRegionStroke('motif-hatayi-center-eye')} strokeWidth="2.4" />
              <circle cx="0" cy="0" r="16" fill={isDraft ? 'none' : '#FFFFFF'} stroke={getRegionStroke('motif-hatayi-center-eye')} strokeWidth="1.8" />
              <circle cx="0" cy="0" r="8" fill={pColor} />
            </g>,
            <circle cx="300" cy="280" r="35" />
          )}

          {/* Numbered Painting Badges Overlay */}
          {renderNumberBadgesOverlay()}
        </g>
      );

    /* =========================================================================
       5. KARO KOMPOZİSYONU (Geleneksel Türk Çini Sanatı - Hatayi, Lale, Karanfil & Rumi)
       ========================================================================= */
    case 'geometrik':
      return (
        <g id="motif-karo-full-composition">
          {/* 1. Kenar Kobalt Çini Bordürü (Perimeter Framing Border) */}
          {renderInteractiveRegion(
            'motif-geo-neck-band',
            <g id="karo-neck-band">
              {/* Outer boundary frame */}
              <rect
                x="116"
                y="116"
                width="368"
                height="368"
                rx="6"
                fill="none"
                stroke={getRegionStroke('motif-geo-neck-band')}
                strokeWidth="2.5"
              />
              <rect
                x="132"
                y="132"
                width="336"
                height="336"
                rx="4"
                fill="none"
                stroke={getRegionStroke('motif-geo-neck-band')}
                strokeWidth="1.4"
                opacity="0.6"
              />
              {/* Border floral garland rosettes along the 4 edges */}
              {[
                { x: 215, y: 124 }, { x: 300, y: 124 }, { x: 385, y: 124 },
                { x: 215, y: 476 }, { x: 300, y: 476 }, { x: 385, y: 476 },
                { x: 124, y: 215 }, { x: 124, y: 300 }, { x: 124, y: 385 },
                { x: 476, y: 215 }, { x: 476, y: 300 }, { x: 476, y: 385 },
              ].map((pos, idx) => (
                <g key={`karo-border-fl-${idx}`} transform={`translate(${pos.x}, ${pos.y})`}>
                  <circle cx="0" cy="0" r="5" fill={getRegionFill('motif-geo-neck-band', 5)} stroke={getRegionStroke('motif-geo-neck-band')} strokeWidth="1" />
                  <circle cx="0" cy="0" r="2" fill={isDraft ? 'none' : '#FAF6ED'} />
                </g>
              ))}
            </g>,
            <rect x="110" y="110" width="380" height="380" fill="none" stroke="transparent" strokeWidth="20" rx="8" />
          )}

          {/* 2. Dört Köşe Çini Rozetleri (Corner Floral Rosettes) */}
          {renderInteractiveRegion(
            'motif-geo-outer-ring',
            <g id="karo-outer-ring">
              {[
                { x: 165, y: 165 },
                { x: 435, y: 165 },
                { x: 165, y: 435 },
                { x: 435, y: 435 },
              ].map((pos, idx) => (
                <g key={`karo-corner-fl-${idx}`} transform={`translate(${pos.x}, ${pos.y})`}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <g key={`corner-petal-${idx}-${i}`} transform={`rotate(${i * 60})`}>
                      <path
                        d="M 0 -4 C -5 -9 -4 -16 0 -18 C 4 -16 5 -9 0 -4 Z"
                        fill={getRegionFill('motif-geo-outer-ring', 0)}
                        stroke={getRegionStroke('motif-geo-outer-ring')}
                        strokeWidth="1.2"
                      />
                    </g>
                  ))}
                  <circle cx="0" cy="0" r="6" fill={isDraft ? 'none' : '#FAF6ED'} stroke={tahrir} strokeWidth="1" />
                  <circle cx="0" cy="0" r="3" fill={getRegionFill('motif-geo-outer-ring', 0)} />
                </g>
              ))}
            </g>,
            <g>
              <circle cx="165" cy="165" r="45" />
              <circle cx="435" cy="165" r="45" />
              <circle cx="165" cy="435" r="45" />
              <circle cx="435" cy="435" r="45" />
            </g>
          )}

          {/* 3. 4 Yöne Yayılan Kıvrık Dallar (Spiral Scrolling Tendrils) */}
          {renderInteractiveRegion(
            'motif-geo-interlock-square',
            <g id="karo-interlock-square">
              {/* Diagonal sweeping vines */}
              <path
                d="M 270 270 C 230 230 190 220 170 200 C 185 245 225 270 260 280 Z"
                fill={getRegionFill('motif-geo-interlock-square', 1)}
                stroke={getRegionStroke('motif-geo-interlock-square')}
                strokeWidth="1.8"
              />
              <path
                d="M 330 270 C 370 230 410 220 430 200 C 415 245 375 270 340 280 Z"
                fill={getRegionFill('motif-geo-interlock-square', 1)}
                stroke={getRegionStroke('motif-geo-interlock-square')}
                strokeWidth="1.8"
              />
              <path
                d="M 270 330 C 230 370 190 380 170 400 C 185 355 225 330 260 320 Z"
                fill={getRegionFill('motif-geo-interlock-square', 1)}
                stroke={getRegionStroke('motif-geo-interlock-square')}
                strokeWidth="1.8"
              />
              <path
                d="M 330 330 C 370 370 410 380 430 400 C 415 355 375 330 340 320 Z"
                fill={getRegionFill('motif-geo-interlock-square', 1)}
                stroke={getRegionStroke('motif-geo-interlock-square')}
                strokeWidth="1.8"
              />
            </g>,
            <circle cx="300" cy="300" r="115" />
          )}

          {/* 4. Üst Zarif Büyük Lale (Crowning Tulip at Top) */}
          {renderInteractiveRegion(
            'motif-geo-top-points',
            <g id="karo-top-lale" transform="translate(300, 195)">
              <path
                d="M 0 35 C -30 20 -45 -18 -22 -55 C -12 -30 -4 -15 0 0 C 4 -15 12 -30 22 -55 C 45 -18 30 20 0 35 Z"
                fill={getRegionFill('motif-geo-top-points', 4)}
                stroke={getRegionStroke('motif-geo-top-points')}
                strokeWidth="2.4"
              />
              <path
                d="M 0 30 C -12 10 -14 -35 0 -48 C 14 -35 12 10 0 30 Z"
                fill={isDraft ? 'none' : '#FAF6ED'}
                stroke={getRegionStroke('motif-geo-top-points')}
                strokeWidth="1.6"
              />
              <path d="M -10 35 C -12 48 12 48 10 35 Z" fill={greenStem} stroke={tahrir} strokeWidth="1.2" />
            </g>,
            <circle cx="300" cy="180" r="55" />
          )}

          {/* 5. Sol Simetrik Karanfil (Left Scalloped Carnation) */}
          {renderInteractiveRegion(
            'motif-geo-left-points',
            <g id="karo-left-carnation" transform="translate(195, 300) rotate(-90)">
              <path
                d="M -22 10 C -42 -6 -46 -30 -30 -52 C -22 -38 -14 -30 -6 -42 C 2 -30 8 -30 16 -42 C 24 -30 30 -38 38 -52 C 54 -30 50 -6 28 10 Z"
                fill={getRegionFill('motif-geo-left-points', 2)}
                stroke={getRegionStroke('motif-geo-left-points')}
                strokeWidth="2.2"
              />
              <path
                d="M -14 6 C -26 -4 -28 -20 -18 -32 C -12 -22 -6 -16 0 -24 C 6 -16 12 -22 18 -32 C 28 -20 26 -4 14 6 Z"
                fill={isDraft ? 'none' : '#FAF6ED'}
                stroke={getRegionStroke('motif-geo-left-points')}
                strokeWidth="1.4"
              />
              <path d="M -12 10 C -15 22 15 22 12 10 Z" fill={greenStem} stroke={tahrir} strokeWidth="1.2" />
            </g>,
            <circle cx="180" cy="300" r="55" />
          )}

          {/* 6. Sağ Simetrik Karanfil (Right Scalloped Carnation) */}
          {renderInteractiveRegion(
            'motif-geo-right-points',
            <g id="karo-right-carnation" transform="translate(405, 300) rotate(90)">
              <path
                d="M -22 10 C -42 -6 -46 -30 -30 -52 C -22 -38 -14 -30 -6 -42 C 2 -30 8 -30 16 -42 C 24 -30 30 -38 38 -52 C 54 -30 50 -6 28 10 Z"
                fill={getRegionFill('motif-geo-right-points', 3)}
                stroke={getRegionStroke('motif-geo-right-points')}
                strokeWidth="2.2"
              />
              <path
                d="M -14 6 C -26 -4 -28 -20 -18 -32 C -12 -22 -6 -16 0 -24 C 6 -16 12 -22 18 -32 C 28 -20 26 -4 14 6 Z"
                fill={isDraft ? 'none' : '#FAF6ED'}
                stroke={getRegionStroke('motif-geo-right-points')}
                strokeWidth="1.4"
              />
              <path d="M -12 10 C -15 22 15 22 12 10 Z" fill={greenStem} stroke={tahrir} strokeWidth="1.2" />
            </g>,
            <circle cx="420" cy="300" r="55" />
          )}

          {/* 7. Alt Rumi & Kıvrımlı Yapraklar (Bottom Arabesque & Saz Foliage) */}
          {renderInteractiveRegion(
            'motif-geo-bottom-points',
            <g id="karo-bottom-rumi" transform="translate(300, 405)">
              <path
                d="M 0 -25 C -35 5 -45 42 -22 65 C -12 35 -6 20 0 10 C 6 20 12 35 22 65 C 45 42 35 5 0 -25 Z"
                fill={getRegionFill('motif-geo-bottom-points', 4)}
                stroke={getRegionStroke('motif-geo-bottom-points')}
                strokeWidth="2.4"
              />
              <path
                d="M 0 -10 C -25 15 -30 45 -12 55 C -6 32 0 15 0 -10 Z"
                fill={isDraft ? 'none' : '#FAF6ED'}
                stroke={getRegionStroke('motif-geo-bottom-points')}
                strokeWidth="1.5"
              />
              <path
                d="M 0 -10 C 25 15 30 45 12 55 C 6 32 0 15 0 -10 Z"
                fill={isDraft ? 'none' : '#FAF6ED'}
                stroke={getRegionStroke('motif-geo-bottom-points')}
                strokeWidth="1.5"
              />
            </g>,
            <circle cx="300" cy="420" r="55" />
          )}

          {/* 8. Yan Saz Yaprakları (Lateral Saz Leaves connecting to Carnations) */}
          {renderInteractiveRegion(
            'motif-geo-saz-leaves',
            <g id="karo-saz-leaves">
              <path
                d="M 245 365 C 195 385 165 345 155 315 C 175 355 210 375 245 365 Z"
                fill={getRegionFill('motif-geo-saz-leaves', 0)}
                stroke={getRegionStroke('motif-geo-saz-leaves')}
                strokeWidth="1.8"
              />
              <path
                d="M 355 365 C 405 385 435 345 445 315 C 425 355 390 375 355 365 Z"
                fill={getRegionFill('motif-geo-saz-leaves', 0)}
                stroke={getRegionStroke('motif-geo-saz-leaves')}
                strokeWidth="1.8"
              />
            </g>,
            <circle cx="200" cy="350" r="45" />
          )}

          {/* 9. Köşebent Bahar Çiçekleri (Spandrel Companion Blossoms) */}
          {renderInteractiveRegion(
            'motif-geo-corner-blossoms',
            <g id="karo-corner-blossoms">
              <path
                d="M 245 235 C 195 215 165 255 155 285 C 175 245 210 225 245 235 Z"
                fill={getRegionFill('motif-geo-corner-blossoms', 2)}
                stroke={getRegionStroke('motif-geo-corner-blossoms')}
                strokeWidth="1.8"
              />
              <path
                d="M 355 235 C 405 215 435 255 445 285 C 425 245 390 225 355 235 Z"
                fill={getRegionFill('motif-geo-corner-blossoms', 2)}
                stroke={getRegionStroke('motif-geo-corner-blossoms')}
                strokeWidth="1.8"
              />
            </g>,
            <circle cx="400" cy="350" r="45" />
          )}

          {/* 10. İç Çerçeve Bordürü (Inner Garland Frame) */}
          {renderInteractiveRegion(
            'motif-geo-inner-border',
            <g id="karo-inner-border">
              <rect
                x="142"
                y="142"
                width="316"
                height="316"
                rx="6"
                fill="none"
                stroke={getRegionStroke('motif-geo-inner-border')}
                strokeWidth="1.8"
                strokeDasharray="12 6"
              />
            </g>,
            <rect x="135" y="135" width="330" height="330" fill="none" stroke="transparent" strokeWidth="18" rx="8" />
          )}

          {/* 11. Merkez Hatayi Taç Yaprakları (Grand Central Peony/Lotus Rosette Petals) */}
          {renderInteractiveRegion(
            'motif-geo-center-star',
            <g id="karo-center-hatayi" transform="translate(300, 300)">
              {Array.from({ length: 8 }).map((_, i) => (
                <g key={`karo-hat-petal-${i}`} transform={`rotate(${i * 45})`}>
                  <path
                    d="M 0 -18 C -16 -32 -14 -60 0 -68 C 14 -60 16 -32 0 -18 Z"
                    fill={getRegionFill('motif-geo-center-star', 1)}
                    stroke={getRegionStroke('motif-geo-center-star')}
                    strokeWidth="2.2"
                  />
                  <path
                    d="M 0 -24 C -8 -34 -8 -50 0 -56 C 8 -50 8 -34 0 -24 Z"
                    fill={isDraft ? 'none' : '#FAF6ED'}
                    stroke={getRegionStroke('motif-geo-center-star')}
                    strokeWidth="1.2"
                  />
                </g>
              ))}
            </g>,
            <circle cx="300" cy="300" r="75" />
          )}

          {/* 12. Merkez Hatayi Tohum Göbeği (Central Golden Seed Eye Core) */}
          {renderInteractiveRegion(
            'motif-geo-center-core',
            <g id="karo-center-core" transform="translate(300, 300)">
              <circle
                cx="0"
                cy="0"
                r="22"
                fill={getRegionFill('motif-geo-center-core', 1)}
                stroke={getRegionStroke('motif-geo-center-core')}
                strokeWidth="2.4"
              />
              <circle cx="0" cy="0" r="14" fill={isDraft ? 'none' : '#FAF6ED'} stroke={tahrir} strokeWidth="1.5" />
              <circle cx="0" cy="0" r="7" fill={pColor} />
            </g>,
            <circle cx="300" cy="300" r="38" />
          )}

          {/* Numbered Painting Badges Overlay */}
          {renderNumberBadgesOverlay()}
        </g>
      );

    /* =========================================================================
       6. YAPRAK (Serrated Saz Foliage & Spring Blossoms)
       ========================================================================= */
    case 'yaprak':
      return (
        <g id="motif-yaprak-full-composition">
          {/* Neck Band */}
          {renderInteractiveRegion(
            'motif-yaprak-neck-band',
            <g id="yaprak-neck-band">
              <path d="M 230 130 C 265 142 335 142 370 130" fill="none" stroke={getRegionStroke('motif-yaprak-neck-band')} strokeWidth="2" />
              {[-40, 0, 40].map((off, i) => (
                <circle key={`yap-neck-${i}`} cx={300 + off} cy="128" r="8" fill={getRegionFill('motif-yaprak-neck-band', 5)} stroke={getRegionStroke('motif-yaprak-neck-band')} strokeWidth="1.2" />
              ))}
            </g>,
            <rect x="220" y="100" width="160" height="50" rx="8" />
          )}

          {/* Main Saz Stem */}
          {renderInteractiveRegion(
            'motif-yaprak-stem',
            <g id="yaprak-stem">
              <path d="M 300 480 C 265 390 275 290 320 200 C 340 150 320 120 300 90" fill="none" stroke={isDraft ? draftStroke : getRegionFill('motif-yaprak-stem', 0) || greenStem} strokeWidth="4" strokeLinecap="round" />
              <path d="M 285 430 C 215 395 175 315 210 240" fill="none" stroke={isDraft ? draftStroke : getRegionFill('motif-yaprak-stem', 0) || greenStem} strokeWidth="2.8" />
              <path d="M 315 390 C 385 365 430 295 400 220" fill="none" stroke={isDraft ? draftStroke : getRegionFill('motif-yaprak-stem', 0) || greenStem} strokeWidth="2.8" />
            </g>,
            <circle cx="300" cy="410" r="50" />
          )}

          {/* Left Saz Leaf */}
          {renderInteractiveRegion(
            'motif-yaprak-left-saz',
            <g id="yaprak-left-saz">
              <path d="M 290 430 C 215 395 160 340 180 240 C 200 275 235 330 290 430 Z" fill={getRegionFill('motif-yaprak-left-saz', 2)} stroke={getRegionStroke('motif-yaprak-left-saz')} strokeWidth="2.2" />
              <path d="M 180 240 C 195 265 215 295 248 335" fill="none" stroke={isDraft ? draftStroke : '#FFFFFF'} strokeWidth="1.4" opacity="0.8" />
            </g>,
            <circle cx="215" cy="320" r="55" />
          )}

          {/* Right Saz Leaf */}
          {renderInteractiveRegion(
            'motif-yaprak-right-saz',
            <g id="yaprak-right-saz">
              <path d="M 310 400 C 385 365 440 310 420 215 C 400 250 365 305 310 400 Z" fill={getRegionFill('motif-yaprak-right-saz', 3)} stroke={getRegionStroke('motif-yaprak-right-saz')} strokeWidth="2.2" />
              <path d="M 420 215 C 405 240 385 270 352 310" fill="none" stroke={isDraft ? draftStroke : '#FFFFFF'} strokeWidth="1.4" opacity="0.8" />
            </g>,
            <circle cx="385" cy="295" r="55" />
          )}

          {/* Left Blossom */}
          {renderInteractiveRegion(
            'motif-yaprak-left-blossom',
            <g id="yaprak-left-blossom" transform="translate(205, 215)">
              {Array.from({ length: 5 }).map((_, i) => (
                <circle
                  key={`y-bl-l-${i}`}
                  cx={Math.cos((i * 72 * Math.PI) / 180) * 14}
                  cy={Math.sin((i * 72 * Math.PI) / 180) * 14}
                  r="8.5"
                  fill={getRegionFill('motif-yaprak-left-blossom', 4)}
                  stroke={getRegionStroke('motif-yaprak-left-blossom')}
                  strokeWidth="1.4"
                />
              ))}
              <circle cx="0" cy="0" r="6" fill={isDraft ? 'none' : '#FFFFFF'} stroke={tahrir} strokeWidth="1.2" />
            </g>,
            <circle cx="205" cy="215" r="45" />
          )}

          {/* Right Blossom */}
          {renderInteractiveRegion(
            'motif-yaprak-right-blossom',
            <g id="motif-yaprak-right-blossom" transform="translate(395, 200)">
              {Array.from({ length: 5 }).map((_, i) => (
                <circle
                  key={`y-bl-r-${i}`}
                  cx={Math.cos((i * 72 * Math.PI) / 180) * 14}
                  cy={Math.sin((i * 72 * Math.PI) / 180) * 14}
                  r="8.5"
                  fill={getRegionFill('motif-yaprak-right-blossom', 5)}
                  stroke={getRegionStroke('motif-yaprak-right-blossom')}
                  strokeWidth="1.4"
                />
              ))}
              <circle cx="0" cy="0" r="6" fill={isDraft ? 'none' : '#FFFFFF'} stroke={tahrir} strokeWidth="1.2" />
            </g>,
            <circle cx="395" cy="200" r="45" />
          )}

          {/* Grand Central Curved Saz Leaf */}
          {renderInteractiveRegion(
            'motif-yaprak-main-saz',
            <g id="yaprak-main-saz">
              <path
                d="M 300 460 C 260 375 275 275 325 180 C 350 135 330 95 300 55 C 335 105 375 165 345 240 C 315 315 320 390 300 460 Z"
                fill={getRegionFill('motif-yaprak-main-saz', 1)}
                stroke={getRegionStroke('motif-yaprak-main-saz')}
                strokeWidth="2.8"
              />
            </g>,
            <circle cx="310" cy="240" r="65" />
          )}

          {/* Saz Spine and Vein */}
          {renderInteractiveRegion(
            'motif-yaprak-saz-vein',
            <g id="yaprak-saz-vein">
              <path
                d="M 300 445 C 282 360 292 280 330 190 C 342 160 330 120 308 80"
                fill="none"
                stroke={isDraft ? draftStroke : getRegionFill('motif-yaprak-saz-vein', 1) || sColor}
                strokeWidth="2.6"
              />
            </g>,
            <path d="M 300 445 C 282 360 292 280 330 190 C 342 160 330 120 308 80" stroke="transparent" strokeWidth="40" fill="none" />
          )}

          {/* Numbered Painting Badges Overlay */}
          {renderNumberBadgesOverlay()}
        </g>
      );
  }
};
