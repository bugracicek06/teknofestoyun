import React from 'react';

/**
 * Artisan Hand & Fine Calligraphy Brush (Osmanlı / İznik Çini Sanatı Fırçası)
 * Features exact hotspot alignment: The visual tip of the brush hairs is at coordinate (10, 5).
 * By offsetting with translate(-10px, -5px) and pivoting from transformOrigin '10px 5px',
 * the brush tip lands with pinpoint sub-pixel accuracy exactly on the target touch coordinate.
 */

const BRUSH_TIP_OFFSET = { x: 10, y: 5 };

interface ArtisanHandBrushProps {
  x: number;
  y: number;
  isPainting: boolean;
  brushColor?: string;
}

export const ArtisanHandBrush: React.FC<ArtisanHandBrushProps> = ({
  x,
  y,
  isPainting,
  brushColor = '#0C3875',
}) => {
  return (
    <div
      className={`artisan-hand-brush ${isPainting ? 'is-brushing' : ''}`}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        pointerEvents: 'none',
        zIndex: 45,
        transform: `translate(-${BRUSH_TIP_OFFSET.x}px, -${BRUSH_TIP_OFFSET.y}px) ${
          isPainting ? 'rotate(-10deg) scale(1.05)' : 'rotate(0deg)'
        }`,
        transformOrigin: `${BRUSH_TIP_OFFSET.x}px ${BRUSH_TIP_OFFSET.y}px`,
        transition:
          'left 0.38s cubic-bezier(0.22, 1, 0.36, 1), top 0.38s cubic-bezier(0.22, 1, 0.36, 1), transform 0.22s ease-in-out',
      }}
    >
      <svg
        width="230"
        height="230"
        viewBox="0 0 220 220"
        style={{
          overflow: 'visible',
          filter: 'drop-shadow(0 16px 28px rgba(0, 0, 0, 0.55))',
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
        </defs>

        {/* 1. Traditional Ottoman Embroidered Linen Sleeve (Entering from bottom-right) */}
        <path
          d="M 140 180 C 130 150 150 120 180 110 L 220 160 L 190 220 Z"
          fill="url(#sleeveLinen)"
          stroke="#8A7E6C"
          strokeWidth="1.5"
        />
        {/* Anatolian Red Geometric Embroidery Trim */}
        <path
          d="M 145 175 Q 160 145 185 115"
          fill="none"
          stroke="#B3261E"
          strokeWidth="4.5"
          strokeDasharray="5 3"
        />

        {/* 2. Master Artisan Hand (Gripping the handle with precision) */}
        {/* Palm & Thumb Base */}
        <path
          d="M 115 130 C 105 105 130 85 155 100 C 175 115 160 145 135 150 Z"
          fill="url(#artisanSkin)"
        />
        {/* Forefinger guiding the ferrule */}
        <path
          d="M 125 110 C 95 90 75 75 60 70 C 55 75 65 90 85 105 C 100 118 115 125 125 110 Z"
          fill="url(#artisanSkin)"
          stroke="#995D3A"
          strokeWidth="0.8"
        />
        {/* Curled Middle & Ring Fingers */}
        <path
          d="M 130 125 C 115 118 105 125 100 135 C 105 145 120 145 135 138 Z"
          fill="#D9A180"
        />

        {/* 3. The Fine Hair Artisan Calligraphy Brush */}
        {/* Bamboo/Turned Wood Shaft */}
        <path
          d="M 45 50 L 175 155 L 180 150 L 50 45 Z"
          fill="url(#brushWoodHandle)"
          stroke="#2E1B0D"
          strokeWidth="1"
        />
        {/* Brass Gold Ferrule */}
        <path
          d="M 38 42 L 52 54 L 46 60 L 32 48 Z"
          fill="url(#brushBrassFerrule)"
          stroke="#7A5805"
          strokeWidth="1"
        />
        {/* Fine Horsehair Brush Bristles */}
        <path
          d="M 35 39 C 24 25 15 12 10 5 C 14 15 22 30 30 44 Z"
          fill="#1C1917"
        />

        {/* Fresh Mineral Pigment Bead at the exact Tip (10, 5) */}
        <circle cx="10" cy="5" r="4.5" fill={brushColor} />
        <circle cx="11" cy="4" r="1.8" fill="#FFFFFF" opacity="0.85" />
      </svg>
    </div>
  );
};
