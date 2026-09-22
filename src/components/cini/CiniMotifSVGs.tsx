import React from 'react';

/**
 * Authentic Turkish / Anatolian Ceramic Motifs (İznik & Kütahya Çini Sanatı)
 * 6 Distinct Motifs with separate authentic SVG geometries and 6 interactive zones each:
 * 1. Lale (Ottoman Fluted Tulip)
 * 2. Karanfil (Ruffled Scalloped Carnation)
 * 3. Rumi (Seljuk & Ottoman Curvilinear Spiral Arabesque)
 * 4. Hatayi (Radial Peony/Lotus Rosette)
 * 5. Geometrik (Seljuk 8-Pointed Star Medallion)
 * 6. Yaprak (Serrated Saz Foliage & Spring Blossoms)
 */

export interface MotifZoneProps {
  isDraft: boolean;
  isZoneActive: (zone: number) => boolean;
  pColor: string;
  sColor: string;
  greenStem: string;
  tahrir: string;
  draftStroke: string;
}

/**
 * Clean, museum-grade miniature SVG preview for selection cards (Step 2)
 * NO emojis - authentic vector iconography
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
          {/* Stem & Leaves */}
          <path d="M 0 38 Q 0 15 0 -5" fill="none" stroke="#15803D" strokeWidth="3" />
          <path d="M 0 35 C -15 25 -25 5 -18 -15 C -12 5 0 22 0 35 Z" fill="#15803D" opacity="0.85" />
          <path d="M 0 35 C 15 25 25 5 18 -15 C 12 5 0 22 0 35 Z" fill="#15803D" opacity="0.85" />
          {/* Fluted Tulip Blossom */}
          <path
            d="M 0 5 C -18 -10 -26 -35 -14 -50 C -8 -30 -2 -18 0 -5 C 2 -18 8 -30 14 -50 C 26 -35 18 -10 0 5 Z"
            fill={accentColor}
            stroke={strokeColor}
            strokeWidth="2"
          />
          <path
            d="M 0 0 C -8 -15 -8 -38 0 -46 C 8 -38 8 -15 0 0 Z"
            fill={mainColor}
          />
        </g>
      )}

      {motifId === 'karanfil' && (
        <g transform="translate(50, 52)">
          {/* Stem & Calyx */}
          <path d="M 0 38 L 0 15" fill="none" stroke="#15803D" strokeWidth="3" />
          <path d="M -8 18 C -10 5 10 5 8 18 Z" fill="#15803D" stroke={strokeColor} strokeWidth="1.5" />
          {/* Round Layered Scalloped Carnation Petals */}
          <path
            d="M -16 8 C -30 -5 -32 -25 -20 -38 C -14 -28 -10 -22 -4 -32 C 0 -22 4 -22 8 -32 C 14 -22 18 -28 24 -38 C 36 -25 34 -5 20 8 Z"
            fill={accentColor}
            stroke={strokeColor}
            strokeWidth="2"
          />
          {/* Inner Scalloped Tier */}
          <path
            d="M -12 6 C -20 -4 -22 -18 -12 -28 C -7 -20 -3 -16 0 -22 C 3 -16 7 -20 12 -28 C 22 -18 20 -4 12 6 Z"
            fill={mainColor}
          />
        </g>
      )}

      {motifId === 'rumi' && (
        <g transform="translate(50, 50)">
          {/* Spiraling Arabesque Rumi Wing */}
          <path
            d="M -25 25 C -35 5 -20 -20 0 -28 C 15 -35 32 -30 35 -15 C 38 0 25 15 10 18 C -5 20 -15 10 -15 0 C -15 -10 -5 -15 5 -12"
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
          />
          {/* Main Rumi Beak / Wing */}
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
          {/* Symmetrical Radial Lotus / Peony Rosette */}
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
          {/* Center Eye / Seed core */}
          <circle cx="0" cy="0" r="10" fill="#F8FAFC" stroke={strokeColor} strokeWidth="2" />
          <circle cx="0" cy="0" r="5" fill={accentColor} />
        </g>
      )}

      {motifId === 'geometrik' && (
        <g transform="translate(50, 50)">
          {/* Seljuk 8-Pointed Star (Two interlocking squares) */}
          <rect
            x="-28"
            y="-28"
            width="56"
            height="56"
            fill={mainColor}
            stroke={strokeColor}
            strokeWidth="1.8"
            rx="2"
          />
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
        <g transform="translate(50, 50)">
          {/* Sweeping Saz Leaf with Plum Blossoms */}
          <path
            d="M -25 35 Q -10 10 25 -25"
            fill="none"
            stroke="#15803D"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M -25 35 C -5 20 15 5 35 -30 C 15 -15 0 -5 -25 35 Z"
            fill="#15803D"
            stroke={strokeColor}
            strokeWidth="1.5"
            opacity="0.85"
          />
          {/* Little floral blossoms */}
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
}

/**
 * Renders the full 6-zone vector artwork for any selected motif.
 * In Step 2 (isDraft = true), renders delicate charcoal/tahrir blueprint outlines with NO fill.
 */
export const MotifArtwork: React.FC<MotifArtworkProps> = ({
  motifId,
  isDraft,
  isZoneActive,
  pColor,
  sColor,
  greenStem,
  tahrir,
  draftStroke,
}) => {

  // Helper for fill color: In draft mode, ALWAYS 'none'!
  const getFill = (zone: number, color: string) => {
    if (isDraft) return 'none';
    return isZoneActive(zone) ? color : 'none';
  };

  const getStroke = (zone: number, activeColor: string) => {
    if (isDraft) return draftStroke;
    return isZoneActive(zone) ? activeColor : draftStroke;
  };

  const getOpacity = (zone: number) => {
    if (isDraft) return 0.5;
    return isZoneActive(zone) ? 1 : 0.3;
  };

  switch (motifId) {
    /* =========================================================================
       1. KARANFİL (Layered Anatolian Carnation - Distinctly round & scalloped)
       ========================================================================= */
    case 'karanfil':
      return (
        <g id="motif-karanfil-group">
          {/* ZONE 0: Calyx & Stems */}
          <g id="zone-0-karanfil" opacity={getOpacity(0)}>
            {/* Main Central Stem */}
            <path
              d="M 300 455 Q 300 370 300 280"
              fill="none"
              stroke={getStroke(0, greenStem)}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Curving side stems */}
            <path
              d="M 300 420 Q 235 375 220 315"
              fill="none"
              stroke={getStroke(0, greenStem)}
              strokeWidth="2.5"
            />
            <path
              d="M 300 420 Q 365 375 380 315"
              fill="none"
              stroke={getStroke(0, greenStem)}
              strokeWidth="2.5"
            />
            {/* Central Calyx Cup (Çanak Yaprak) */}
            <path
              d="M 282 280 C 275 250 325 250 318 280 Z"
              fill={getFill(0, greenStem)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="2"
            />
          </g>

          {/* ZONE 2: Left Flanking Carnation Bloom */}
          <g id="zone-2-karanfil" transform="translate(220, 310) rotate(-20)" opacity={getOpacity(2)}>
            <path
              d="M -16 10 C -34 -5 -38 -28 -24 -46 C -16 -34 -10 -26 -4 -38 C 2 -26 8 -26 14 -38 C 20 -26 26 -34 32 -46 C 46 -28 42 -5 24 10 Z"
              fill={getFill(2, sColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="1.8"
            />
            <path
              d="M -10 6 C -20 -4 -22 -20 -12 -30 C -6 -20 -2 -16 2 -22 C 6 -16 10 -20 16 -30 C 26 -20 24 -4 14 6 Z"
              fill={getFill(2, pColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="1.2"
            />
          </g>

          {/* ZONE 3: Right Flanking Carnation Bloom */}
          <g id="zone-3-karanfil" transform="translate(380, 310) rotate(20)" opacity={getOpacity(3)}>
            <path
              d="M -24 10 C -42 -5 -46 -28 -32 -46 C -26 -34 -20 -26 -14 -38 C -8 -26 -2 -26 4 -38 C 10 -26 16 -34 24 -46 C 38 -28 34 -5 16 10 Z"
              fill={getFill(3, sColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="1.8"
            />
            <path
              d="M -14 6 C -24 -4 -26 -20 -16 -30 C -10 -20 -6 -16 -2 -22 C 2 -16 6 -20 12 -30 C 22 -20 20 -4 10 6 Z"
              fill={getFill(3, pColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="1.2"
            />
          </g>

          {/* ZONE 4: Upper Carnation Buds & Calyx Accents */}
          <g id="zone-4-karanfil" opacity={getOpacity(4)}>
            <g transform="translate(235, 215) rotate(-15)">
              <path
                d="M -12 0 C -22 -16 -20 -32 -10 -40 C -6 -30 -2 -24 2 -32 C 6 -24 10 -30 14 -40 C 24 -32 26 -16 16 0 Z"
                fill={getFill(4, pColor)}
                stroke={isDraft ? draftStroke : tahrir}
                strokeWidth="1.5"
              />
              <path d="M -8 0 C -10 8 10 8 8 0 Z" fill={getFill(4, greenStem)} stroke={tahrir} strokeWidth="1" />
            </g>
            <g transform="translate(365, 215) rotate(15)">
              <path
                d="M -16 0 C -26 -16 -24 -32 -14 -40 C -10 -30 -6 -24 -2 -32 C 2 -24 6 -30 10 -40 C 20 -32 22 -16 12 0 Z"
                fill={getFill(4, pColor)}
                stroke={isDraft ? draftStroke : tahrir}
                strokeWidth="1.5"
              />
              <path d="M -8 0 C -10 8 10 8 8 0 Z" fill={getFill(4, greenStem)} stroke={tahrir} strokeWidth="1" />
            </g>
          </g>

          {/* ZONE 1: Grand Central Multi-Tiered Serrated Carnation (Taraklı Karanfil) */}
          <g id="zone-1-karanfil" transform="translate(300, 245)" opacity={getOpacity(1)}>
            {/* Outer Flaring Fan of Scalloped Petals */}
            <path
              d="M -35 15 C -65 -15 -75 -65 -50 -105 C -36 -80 -25 -65 -10 -90 C 0 -68 10 -68 20 -90 C 35 -65 46 -80 60 -105 C 85 -65 75 -15 45 15 Z"
              fill={getFill(1, pColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="2.4"
            />
            {/* Middle Scalloped Tier */}
            <path
              d="M -25 10 C -45 -12 -52 -50 -32 -80 C -22 -62 -14 -50 -5 -70 C 5 -50 14 -62 24 -80 C 44 -50 38 -12 18 10 Z"
              fill={getFill(1, sColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="1.8"
            />
            {/* Inner Crown Core */}
            <path
              d="M -15 6 C -28 -8 -30 -35 -18 -55 C -10 -42 -2 -34 4 -48 C 10 -34 18 -42 26 -55 C 38 -35 36 -8 22 6 Z"
              fill={getFill(1, '#FFFFFF')}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="1.4"
            />
            {/* Calyx Support Ring */}
            <path d="M -22 15 C -25 28 25 28 22 15 Z" fill={getFill(1, greenStem)} stroke={tahrir} strokeWidth="1.5" />
          </g>
        </g>
      );

    /* =========================================================================
       2. RUMİ (Seljuk & Ottoman Curvilinear Spiral Arabesque)
       ========================================================================= */
    case 'rumi':
      return (
        <g id="motif-rumi-group">
          {/* ZONE 0: Interlocking S-Curved Helezon Vines */}
          <g id="zone-0-rumi" opacity={getOpacity(0)}>
            <path
              d="M 300 460 C 240 430 210 370 230 310 C 250 250 350 250 370 310 C 390 370 360 430 300 460"
              fill="none"
              stroke={getStroke(0, greenStem)}
              strokeWidth="3.5"
            />
            <path
              d="M 300 330 C 280 270 240 220 300 170 C 360 220 320 270 300 330"
              fill="none"
              stroke={getStroke(0, greenStem)}
              strokeWidth="2.5"
            />
          </g>

          {/* ZONE 2: Left Sweeping Rumi Wing with Dendan Notches */}
          <g id="zone-2-rumi" transform="translate(230, 290)" opacity={getOpacity(2)}>
            <path
              d="M 20 50 C -30 30 -65 -15 -45 -70 C -30 -40 -15 -25 0 -15 C -15 -2 -22 18 -10 32 C 5 45 15 35 20 50 Z"
              fill={getFill(2, pColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="2"
            />
            {/* Inner Sarılma Rumi Notch */}
            <path
              d="M 12 35 C -15 20 -35 -10 -25 -45 C -15 -25 -5 -15 5 -10 C -5 2 -8 15 0 25 Z"
              fill={getFill(2, sColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="1.2"
            />
          </g>

          {/* ZONE 3: Right Sweeping Rumi Wing with Dendan Notches */}
          <g id="zone-3-rumi" transform="translate(370, 290)" opacity={getOpacity(3)}>
            <path
              d="M -20 50 C 30 30 65 -15 45 -70 C 30 -40 15 -25 0 -15 C 15 -2 22 18 10 32 C -5 45 -15 35 -20 50 Z"
              fill={getFill(3, pColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="2"
            />
            <path
              d="M -12 35 C 15 20 35 -10 25 -45 C 15 -25 5 -15 -5 -10 C 5 2 8 15 0 25 Z"
              fill={getFill(3, sColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="1.2"
            />
          </g>

          {/* ZONE 4: Top Finial Rumi (Tepe Rumi) */}
          <g id="zone-4-rumi" transform="translate(300, 160)" opacity={getOpacity(4)}>
            <path
              d="M 0 35 C -25 20 -40 -15 -20 -45 C -10 -25 -2 -15 0 0 C 2 -15 10 -25 20 -45 C 40 -15 25 20 0 35 Z"
              fill={getFill(4, sColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="1.8"
            />
            <circle cx="0" cy="-10" r="8" fill={getFill(4, '#FFFFFF')} stroke={tahrir} strokeWidth="1.2" />
          </g>

          {/* ZONE 1: Central Interlocking Double Rumi Knot (Sarılma Rumi) */}
          <g id="zone-1-rumi" transform="translate(300, 285)" opacity={getOpacity(1)}>
            {/* Center Arabesque Medallion */}
            <path
              d="M 0 -45 C -35 -25 -45 15 -25 45 C -5 20 5 20 25 45 C 45 15 35 -25 0 -45 Z"
              fill={getFill(1, pColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="2.2"
            />
            <path
              d="M 0 -30 C -22 -15 -28 10 -15 30 C -2 15 2 15 15 30 C 28 10 22 -15 0 -30 Z"
              fill={getFill(1, sColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="1.5"
            />
            <circle cx="0" cy="0" r="10" fill={getFill(1, '#FFFFFF')} stroke={tahrir} strokeWidth="1.5" />
          </g>
        </g>
      );

    /* =========================================================================
       3. HATAYİ (Radial Lotus / Peony Symmetrical Rosette)
       ========================================================================= */
    case 'hatayi':
      return (
        <g id="motif-hatayi-group">
          {/* ZONE 0: Curved Tendril Stems */}
          <g id="zone-0-hatayi" opacity={getOpacity(0)}>
            <path
              d="M 300 460 Q 300 375 300 280"
              fill="none"
              stroke={getStroke(0, greenStem)}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M 300 430 C 220 400 190 320 230 250"
              fill="none"
              stroke={getStroke(0, greenStem)}
              strokeWidth="2.5"
            />
            <path
              d="M 300 430 C 380 400 410 320 370 250"
              fill="none"
              stroke={getStroke(0, greenStem)}
              strokeWidth="2.5"
            />
          </g>

          {/* ZONE 2: Left Hatayi Lotus Petals & Buds */}
          <g id="zone-2-hatayi" transform="translate(225, 275) rotate(-30)" opacity={getOpacity(2)}>
            <path
              d="M 0 15 C -25 0 -35 -30 -18 -50 C -10 -35 -2 -25 0 -15 C 2 -25 10 -35 18 -50 C 35 -30 25 0 0 15 Z"
              fill={getFill(2, sColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="1.8"
            />
            <path
              d="M 0 5 C -12 -5 -16 -25 -8 -38 C 0 -22 8 -22 16 -38 C 24 -25 20 -5 0 5 Z"
              fill={getFill(2, pColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="1.2"
            />
          </g>

          {/* ZONE 3: Right Hatayi Lotus Petals & Buds */}
          <g id="zone-3-hatayi" transform="translate(375, 275) rotate(30)" opacity={getOpacity(3)}>
            <path
              d="M 0 15 C -25 0 -35 -30 -18 -50 C -10 -35 -2 -25 0 -15 C 2 -25 10 -35 18 -50 C 35 -30 25 0 0 15 Z"
              fill={getFill(3, sColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="1.8"
            />
            <path
              d="M 0 5 C -12 -5 -16 -25 -8 -38 C 0 -22 8 -22 16 -38 C 24 -25 20 -5 0 5 Z"
              fill={getFill(3, pColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="1.2"
            />
          </g>

          {/* ZONE 4: Top Hatayi Apex Blossom */}
          <g id="zone-4-hatayi" transform="translate(300, 155)" opacity={getOpacity(4)}>
            <path
              d="M 0 20 C -22 5 -30 -20 -15 -35 C -8 -22 0 -15 0 -5 C 0 -15 8 -22 15 -35 C 30 -20 22 5 0 20 Z"
              fill={getFill(4, pColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="1.8"
            />
            <circle cx="0" cy="-5" r="7" fill={getFill(4, '#FFFFFF')} stroke={tahrir} strokeWidth="1.2" />
          </g>

          {/* ZONE 1: Grand Central Radial Hatayi Rosette Flower */}
          <g id="zone-1-hatayi" transform="translate(300, 280)" opacity={getOpacity(1)}>
            {/* 8 Radiating Rounded Outer Petals */}
            {Array.from({ length: 8 }).map((_, i) => (
              <g key={`hatayi-p-${i}`} transform={`rotate(${i * 45})`}>
                <path
                  d="M 0 -18 C -22 -35 -18 -75 0 -85 C 18 -75 22 -35 0 -18 Z"
                  fill={getFill(1, i % 2 === 0 ? pColor : sColor)}
                  stroke={isDraft ? draftStroke : tahrir}
                  strokeWidth="1.8"
                />
              </g>
            ))}
            {/* Inner Petal Ring */}
            {Array.from({ length: 8 }).map((_, i) => (
              <g key={`hatayi-inner-${i}`} transform={`rotate(${i * 45 + 22.5})`}>
                <path
                  d="M 0 -12 C -12 -22 -10 -45 0 -52 C 10 -45 12 -22 0 -12 Z"
                  fill={getFill(1, '#FFFFFF')}
                  stroke={isDraft ? draftStroke : tahrir}
                  strokeWidth="1.2"
                />
              </g>
            ))}
            {/* Central Core Eye (Tohumluk) */}
            <circle cx="0" cy="0" r="22" fill={getFill(1, pColor)} stroke={tahrir} strokeWidth="2" />
            <circle cx="0" cy="0" r="14" fill={getFill(1, '#FFFFFF')} stroke={tahrir} strokeWidth="1.5" />
            <circle cx="0" cy="0" r="7" fill={getFill(1, sColor)} />
          </g>
        </g>
      );

    /* =========================================================================
       4. GEOMETRİK (Seljuk 8-Pointed Star & Girih Interlace)
       ========================================================================= */
    case 'geometrik':
      return (
        <g id="motif-geometrik-group">
          {/* ZONE 0: Geometric Grid & Foundation Lines */}
          <g id="zone-0-geometrik" opacity={getOpacity(0)}>
            {/* Radial 8-fold axes */}
            {Array.from({ length: 4 }).map((_, i) => (
              <line
                key={`geo-axis-${i}`}
                x1="300"
                y1="120"
                x2="300"
                y2="480"
                transform={`rotate(${i * 45} 300 300)`}
                stroke={getStroke(0, draftStroke)}
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            ))}
            <circle cx="300" cy="300" r="160" fill="none" stroke={getStroke(0, greenStem)} strokeWidth="2" />
          </g>

          {/* ZONE 2: Left & Diagonal Interlocking Star Points */}
          <g id="zone-2-geometrik" opacity={getOpacity(2)}>
            <g transform="translate(300, 300)">
              {[-135, -90, -45].map((angle) => (
                <g key={`geo-pt-left-${angle}`} transform={`rotate(${angle})`}>
                  <polygon
                    points="0,-120 28,-75 0,-60 -28,-75"
                    fill={getFill(2, sColor)}
                    stroke={isDraft ? draftStroke : tahrir}
                    strokeWidth="1.8"
                  />
                </g>
              ))}
            </g>
          </g>

          {/* ZONE 3: Right & Diagonal Interlocking Star Points */}
          <g id="zone-3-geometrik" opacity={getOpacity(3)}>
            <g transform="translate(300, 300)">
              {[45, 90, 135].map((angle) => (
                <g key={`geo-pt-right-${angle}`} transform={`rotate(${angle})`}>
                  <polygon
                    points="0,-120 28,-75 0,-60 -28,-75"
                    fill={getFill(3, sColor)}
                    stroke={isDraft ? draftStroke : tahrir}
                    strokeWidth="1.8"
                  />
                </g>
              ))}
            </g>
          </g>

          {/* ZONE 4: Top & Bottom Cardinal Star Apex Knots */}
          <g id="zone-4-geometrik" opacity={getOpacity(4)}>
            <g transform="translate(300, 300)">
              {[0, 180].map((angle) => (
                <g key={`geo-pt-cardinal-${angle}`} transform={`rotate(${angle})`}>
                  <polygon
                    points="0,-140 32,-85 0,-70 -32,-85"
                    fill={getFill(4, pColor)}
                    stroke={isDraft ? draftStroke : tahrir}
                    strokeWidth="2"
                  />
                </g>
              ))}
            </g>
          </g>

          {/* ZONE 1: Central Seljuk 8-Pointed Star Medallion */}
          <g id="zone-1-geometrik" transform="translate(300, 300)" opacity={getOpacity(1)}>
            {/* Square 1 */}
            <rect
              x="-65"
              y="-65"
              width="130"
              height="130"
              fill={getFill(1, pColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="2.5"
              rx="4"
            />
            {/* Square 2 (Rotated 45 degrees) */}
            <rect
              x="-65"
              y="-65"
              width="130"
              height="130"
              transform="rotate(45)"
              fill={getFill(1, sColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="2.5"
              rx="4"
              opacity="0.92"
            />
            {/* Central Octagon & Rosette */}
            <polygon
              points="0,-32 23,-23 32,0 23,23 0,32 -23,23 -32,0 -23,-23"
              fill={getFill(1, '#FFFFFF')}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="2"
            />
            <circle cx="0" cy="0" r="14" fill={getFill(1, pColor)} stroke={tahrir} strokeWidth="1.5" />
            <circle cx="0" cy="0" r="6" fill={getFill(1, sColor)} />
          </g>
        </g>
      );

    /* =========================================================================
       5. YAPRAK (Serrated Saz Foliage & Spring Blossoms)
       ========================================================================= */
    case 'yaprak':
      return (
        <g id="motif-yaprak-group">
          {/* ZONE 0: Gracefully curving Saz Stems */}
          <g id="zone-0-yaprak" opacity={getOpacity(0)}>
            <path
              d="M 300 460 C 270 380 280 290 320 200 C 340 150 320 120 300 90"
              fill="none"
              stroke={getStroke(0, greenStem)}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M 285 410 C 215 380 180 300 210 230"
              fill="none"
              stroke={getStroke(0, greenStem)}
              strokeWidth="2.5"
            />
            <path
              d="M 310 370 C 375 350 420 280 395 210"
              fill="none"
              stroke={getStroke(0, greenStem)}
              strokeWidth="2.5"
            />
          </g>

          {/* ZONE 2: Left Serrated Feathered Leaf */}
          <g id="zone-2-yaprak" opacity={getOpacity(2)}>
            <path
              d="M 290 410 C 220 380 170 330 185 240 C 205 270 235 320 290 410 Z"
              fill={getFill(2, greenStem)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="2"
            />
            {/* Serrated Leaf Ridges */}
            <path
              d="M 185 240 C 195 260 215 285 245 320"
              fill="none"
              stroke={isDraft ? draftStroke : '#FFFFFF'}
              strokeWidth="1.2"
              opacity="0.8"
            />
          </g>

          {/* ZONE 3: Right Serrated Feathered Leaf */}
          <g id="zone-3-yaprak" opacity={getOpacity(3)}>
            <path
              d="M 310 380 C 380 350 430 300 415 210 C 395 240 365 290 310 380 Z"
              fill={getFill(3, greenStem)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="2"
            />
            <path
              d="M 415 210 C 405 230 385 255 355 290"
              fill="none"
              stroke={isDraft ? draftStroke : '#FFFFFF'}
              strokeWidth="1.2"
              opacity="0.8"
            />
          </g>

          {/* ZONE 4: Spring Plum Blossoms (Bahar Çiçekleri) */}
          <g id="zone-4-yaprak" opacity={getOpacity(4)}>
            {/* Blossom 1 (Left) */}
            <g transform="translate(210, 220)">
              {Array.from({ length: 5 }).map((_, i) => (
                <circle
                  key={`blossom-l-${i}`}
                  cx={Math.cos((i * 72 * Math.PI) / 180) * 12}
                  cy={Math.sin((i * 72 * Math.PI) / 180) * 12}
                  r="7"
                  fill={getFill(4, pColor)}
                  stroke={isDraft ? draftStroke : tahrir}
                  strokeWidth="1.2"
                />
              ))}
              <circle cx="0" cy="0" r="5" fill={getFill(4, '#FFFFFF')} stroke={tahrir} strokeWidth="1" />
            </g>
            {/* Blossom 2 (Right) */}
            <g transform="translate(390, 205)">
              {Array.from({ length: 5 }).map((_, i) => (
                <circle
                  key={`blossom-r-${i}`}
                  cx={Math.cos((i * 72 * Math.PI) / 180) * 12}
                  cy={Math.sin((i * 72 * Math.PI) / 180) * 12}
                  r="7"
                  fill={getFill(4, sColor)}
                  stroke={isDraft ? draftStroke : tahrir}
                  strokeWidth="1.2"
                />
              ))}
              <circle cx="0" cy="0" r="5" fill={getFill(4, '#FFFFFF')} stroke={tahrir} strokeWidth="1" />
            </g>
          </g>

          {/* ZONE 1: Grand Central Curved Saz Leaf (Büyük Hançer Saz Yaprağı) */}
          <g id="zone-1-yaprak" opacity={getOpacity(1)}>
            <path
              d="M 300 450 C 265 370 280 280 325 190 C 345 150 330 110 300 70 C 330 115 365 170 340 240 C 315 310 320 380 300 450 Z"
              fill={getFill(1, pColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="2.4"
            />
            {/* Inner Saz Vein Accent */}
            <path
              d="M 300 440 C 285 360 295 285 330 200 C 340 170 330 135 310 95"
              fill="none"
              stroke={isDraft ? draftStroke : sColor}
              strokeWidth="2"
            />
          </g>
        </g>
      );

    /* =========================================================================
       6. LALE (Ottoman Stylized Iznik Tulip - Zarafet & Tevazu)
       ========================================================================= */
    case 'lale':
    default:
      return (
        <g id="motif-lale-group">
          {/* ZONE 0: Stems & Base Saz Leaves */}
          <g id="zone-0-lale" opacity={getOpacity(0)}>
            <path
              d="M 300 455 Q 300 365 300 245"
              fill="none"
              stroke={getStroke(0, greenStem)}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M 300 440 C 230 430 180 370 185 290 C 195 340 240 405 300 440 Z"
              fill={getFill(0, greenStem)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="1.5"
            />
            <path
              d="M 300 440 C 370 430 420 370 415 290 C 405 340 360 405 300 440 Z"
              fill={getFill(0, greenStem)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="1.5"
            />
          </g>

          {/* ZONE 2: Left Flanking Tulip Petal / Bud */}
          <g id="zone-2-lale" transform="translate(230, 305) rotate(-22)" opacity={getOpacity(2)}>
            <path
              d="M 0 0 C -22 -15 -35 -45 -22 -75 C -15 -50 -5 -35 0 -20 C 5 -35 15 -50 22 -75 C 35 -45 22 -15 0 0 Z"
              fill={getFill(2, pColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="1.8"
            />
            <path
              d="M 0 -8 C -12 -25 -10 -55 0 -68 C 10 -55 12 -25 0 -8 Z"
              fill={getFill(2, sColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="1"
            />
          </g>

          {/* ZONE 3: Right Flanking Tulip Petal / Bud */}
          <g id="zone-3-lale" transform="translate(370, 305) rotate(22)" opacity={getOpacity(3)}>
            <path
              d="M 0 0 C -22 -15 -35 -45 -22 -75 C -15 -50 -5 -35 0 -20 C 5 -35 15 -50 22 -75 C 35 -45 22 -15 0 0 Z"
              fill={getFill(3, pColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="1.8"
            />
            <path
              d="M 0 -8 C -12 -25 -10 -55 0 -68 C 10 -55 12 -25 0 -8 Z"
              fill={getFill(3, sColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="1"
            />
          </g>

          {/* ZONE 4: Upper Accent Blooms */}
          <g id="zone-4-lale" opacity={getOpacity(4)}>
            <g transform="translate(225, 220) rotate(-18)">
              <path
                d="M -15 0 C -35 -20 -38 -45 -30 -60 C -22 -45 -18 -40 -12 -48 C -6 -35 -2 -42 2 -48 C 6 -38 12 -45 16 -58 C 22 -45 32 -30 25 -5 Z"
                fill={getFill(4, sColor)}
                stroke={isDraft ? draftStroke : tahrir}
                strokeWidth="1.8"
              />
              <path d="M -12 0 C -15 12 15 12 12 0 Z" fill={getFill(4, greenStem)} stroke={tahrir} strokeWidth="1.2" />
            </g>
            <g transform="translate(375, 220) rotate(18)">
              <path
                d="M -25 -5 C -32 -30 -22 -45 -16 -58 C -12 -45 -6 -38 -2 -48 C 2 -42 6 -35 12 -48 C 18 -40 22 -45 30 -60 C 38 -45 35 -20 15 0 Z"
                fill={getFill(4, sColor)}
                stroke={isDraft ? draftStroke : tahrir}
                strokeWidth="1.8"
              />
              <path d="M -12 0 C -15 12 15 12 12 0 Z" fill={getFill(4, greenStem)} stroke={tahrir} strokeWidth="1.2" />
            </g>
          </g>

          {/* ZONE 1: Grand Central Master Tulip Blossom */}
          <g id="zone-1-lale" transform="translate(300, 245)" opacity={getOpacity(1)}>
            {/* Outer Flaring Wings */}
            <path
              d="M 0 0 C -32 -25 -50 -75 -32 -135 C -20 -95 -8 -60 0 -35 C 8 -60 20 -95 32 -135 C 50 -75 32 -25 0 0 Z"
              fill={getFill(1, pColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="2.2"
            />
            {/* Inner Crown Petal */}
            <path
              d="M 0 -12 C -18 -40 -16 -95 0 -125 C 16 -95 18 -40 0 -12 Z"
              fill={getFill(1, sColor)}
              stroke={isDraft ? draftStroke : tahrir}
              strokeWidth="1.5"
            />
            {/* White Tahrir Highlights */}
            {!isDraft && isZoneActive(1) && (
              <path
                d="M 0 -25 L 0 -105 M -8 -45 C -12 -65 -8 -85 0 -95 M 8 -45 C 12 -65 8 -85 0 -95"
                stroke="#FFFFFF"
                strokeWidth="1.2"
                fill="none"
                opacity="0.85"
              />
            )}
          </g>
        </g>
      );
  }
};
