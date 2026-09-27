import React from 'react';
import type { CiniBrush } from '../../data/ciniData';

/**
 * Master Artisan Hand & Ceramic Paintbrush (İznik & Anadolu Çini Ustası Eli)
 * Features exact hotspot alignment: The visual tip of the brush hairs is at coordinate (10, 5).
 * By offsetting with translate(-10px, -5px) and pivoting from transformOrigin '10px 5px',
 * the brush tip lands with pinpoint sub-pixel accuracy exactly on the target touch coordinate.
 */

const BRUSH_TIP_OFFSET = { x: 10, y: 5 };

export interface ArtisanHandBrushProps {
  x: number;
  y: number;
  isPainting: boolean;
  brushColor?: string;
  brushType?: CiniBrush['id'];
  visible?: boolean;
}

export const ArtisanHandBrush: React.FC<ArtisanHandBrushProps> = ({
  x,
  y,
  isPainting,
  brushColor = '#DC2626',
  brushType = 'orta',
  visible = true,
}) => {
  return (
    <div
      className={`artisan-hand-brush ${isPainting ? 'is-brushing' : ''}`}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        pointerEvents: 'none',
        zIndex: 55,
        opacity: visible ? 1 : 0,
        transform: `translate(-${BRUSH_TIP_OFFSET.x}px, -${BRUSH_TIP_OFFSET.y}px) ${
          isPainting ? 'rotate(-12deg) scale(1.04)' : 'rotate(0deg) scale(1)'
        }`,
        transformOrigin: `${BRUSH_TIP_OFFSET.x}px ${BRUSH_TIP_OFFSET.y}px`,
        transition: visible
          ? 'left 0.35s cubic-bezier(0.22, 1, 0.36, 1), top 0.35s cubic-bezier(0.22, 1, 0.36, 1), transform 0.25s ease-in-out, opacity 0.28s ease'
          : 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      <svg
        width="280"
        height="280"
        viewBox="0 0 240 240"
        style={{
          overflow: 'visible',
          filter: 'drop-shadow(0 20px 32px rgba(0, 0, 0, 0.65)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))',
        }}
      >
        <defs>
          <linearGradient id="brushWoodHandle" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C49A6C" />
            <stop offset="50%" stopColor="#8A5A36" />
            <stop offset="100%" stopColor="#4A2A12" />
          </linearGradient>

          <linearGradient id="brushBrassFerrule" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="50%" stopColor="#FFF3B8" />
            <stop offset="100%" stopColor="#997005" />
          </linearGradient>

          <linearGradient id="sleeveLinen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FAF7F2" />
            <stop offset="50%" stopColor="#E5DFD5" />
            <stop offset="100%" stopColor="#C5BEB0" />
          </linearGradient>

          <linearGradient id="artisanSkin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5D0B5" />
            <stop offset="50%" stopColor="#E2AE8D" />
            <stop offset="100%" stopColor="#C2825E" />
          </linearGradient>

          <radialGradient id="spongeTexture" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#F5D38E" />
            <stop offset="60%" stopColor="#C89745" />
            <stop offset="100%" stopColor="#8D5F1A" />
          </radialGradient>
        </defs>

        {/* 1. Traditional Ottoman Embroidered Linen Sleeve (Entering from bottom-right) */}
        <path
          d="M 140 185 C 130 155 150 125 180 115 L 235 165 L 205 235 Z"
          fill="url(#sleeveLinen)"
          stroke="#8A7E6C"
          strokeWidth="1.5"
        />
        {/* Anatolian Red Geometric Embroidery Pattern Band on Cuff */}
        <path
          d="M 145 180 Q 162 148 188 118"
          fill="none"
          stroke="#B3261E"
          strokeWidth="5"
          strokeDasharray="6 3.5"
        />
        <path
          d="M 150 185 Q 167 153 193 123"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="1.5"
        />

        {/* 2. Master Artisan Hand (Gripping the handle with precision) */}
        {/* Palm & Base of Hand */}
        <path
          d="M 115 132 C 105 106 130 86 155 102 C 176 116 162 146 136 152 Z"
          fill="url(#artisanSkin)"
        />
        {/* Forefinger guiding the ferrule */}
        <path
          d="M 125 112 C 95 92 74 76 58 71 C 53 76 64 92 84 107 C 100 120 115 127 125 112 Z"
          fill="url(#artisanSkin)"
          stroke="#995D3A"
          strokeWidth="0.8"
        />
        {/* Curled Middle & Ring Fingers */}
        <path
          d="M 132 127 C 117 120 106 127 101 137 C 106 147 121 147 136 140 Z"
          fill="#D9A180"
        />

        {/* 3. The Artisan Brush / Tool (Varies by brushType) */}
        {/* Bamboo / Turned Rosewood Shaft */}
        <path
          d="M 45 52 L 180 160 L 185 155 L 50 47 Z"
          fill="url(#brushWoodHandle)"
          stroke="#2E1B0D"
          strokeWidth="1"
        />

        {/* --- BRUSH TYPE: INCE (Fine Liner) --- */}
        {brushType === 'ince' && (
          <g id="brush-variant-ince">
            {/* Slender Brass Ferrule */}
            <path d="M 36 44 L 46 54 L 42 58 L 32 48 Z" fill="url(#brushBrassFerrule)" stroke="#7A5805" strokeWidth="0.8" />
            {/* Fine pointed sable hair */}
            <path d="M 34 42 C 24 28 16 14 10 5 C 13 14 22 28 30 46 Z" fill="#1C1917" />
            {/* Fine Pigment Drop */}
            <circle cx="10" cy="5" r="3.5" fill={brushColor} />
            <circle cx="11" cy="4" r="1.2" fill="#FFFFFF" opacity="0.9" />
          </g>
        )}

        {/* --- BRUSH TYPE: ORTA (Classic Round - Default) --- */}
        {brushType === 'orta' && (
          <g id="brush-variant-orta">
            {/* Classic Brass Gold Ferrule */}
            <path d="M 38 42 L 52 54 L 46 60 L 32 48 Z" fill="url(#brushBrassFerrule)" stroke="#7A5805" strokeWidth="1" />
            {/* Horsehair bristles */}
            <path d="M 35 39 C 24 25 15 12 10 5 C 14 15 22 30 30 44 Z" fill="#1C1917" />
            {/* Rich Pigment Bead at Tip (10, 5) */}
            <circle cx="10" cy="5" r="5" fill={brushColor} />
            <circle cx="11.5" cy="3.8" r="2" fill="#FFFFFF" opacity="0.85" />
          </g>
        )}

        {/* --- BRUSH TYPE: GENIS (Broad Flat Chisel) --- */}
        {brushType === 'genis' && (
          <g id="brush-variant-genis">
            {/* Wide Brass Ferrule */}
            <path d="M 40 40 L 56 56 L 48 64 L 32 48 Z" fill="url(#brushBrassFerrule)" stroke="#7A5805" strokeWidth="1.2" />
            {/* Broad flat bristles */}
            <path d="M 36 36 L 14 8 L 6 14 L 28 44 Z" fill="#1C1917" />
            {/* Wide Pigment Stroke */}
            <ellipse cx="10" cy="5" rx="7" ry="4" transform="rotate(-40 10 5)" fill={brushColor} />
            <ellipse cx="9" cy="4" rx="2.5" ry="1.2" transform="rotate(-40 9 4)" fill="#FFFFFF" opacity="0.85" />
          </g>
        )}

        {/* --- BRUSH TYPE: SUNGER (Natural Sea Sponge Dauber) --- */}
        {brushType === 'sunger' && (
          <g id="brush-variant-sunger">
            {/* Short brass neck */}
            <path d="M 36 44 L 48 54 L 44 58 L 32 48 Z" fill="url(#brushBrassFerrule)" stroke="#7A5805" strokeWidth="1" />
            {/* Round Porous Sponge Head */}
            <circle cx="14" cy="9" r="14" fill="url(#spongeTexture)" stroke="#7A5210" strokeWidth="1" />
            {/* Sponge pores */}
            <circle cx="11" cy="6" r="2" fill="#5C3807" opacity="0.6" />
            <circle cx="17" cy="11" r="2.5" fill="#5C3807" opacity="0.6" />
            <circle cx="13" cy="14" r="1.8" fill="#5C3807" opacity="0.5" />
            {/* Saturated Pigment Core at the tip */}
            <circle cx="10" cy="5" r="7" fill={brushColor} opacity="0.9" />
            <circle cx="12" cy="4" r="2.5" fill="#FFFFFF" opacity="0.8" />
          </g>
        )}
      </svg>
    </div>
  );
};
