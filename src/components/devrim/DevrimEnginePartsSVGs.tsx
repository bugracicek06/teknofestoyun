import React from 'react';

export type DevrimPartId = 'motor_blogu' | 'radyator' | 'aku' | 'hava_filtresi' | 'atesleme';

interface PartSvgProps {
  id: DevrimPartId;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
}

export const DevrimEnginePartSvg: React.FC<PartSvgProps> = ({
  id,
  width = '100%',
  height = '100%',
  style,
  className,
}) => {
  switch (id) {
    case 'motor_blogu':
      return (
        <svg
          viewBox="0 0 160 140"
          width={width}
          height={height}
          style={style}
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="mbCast" x1="0" y1="0" x2="0" y2="100%">
              <stop offset="0%" stopColor="#CBD5E1" />
              <stop offset="30%" stopColor="#64748B" />
              <stop offset="70%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
            <radialGradient id="mbCylinder" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="70%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#475569" />
            </radialGradient>
          </defs>
          {/* Main Heavy Cast Engine Block */}
          <rect x="20" y="15" width="120" height="110" rx="8" fill="url(#mbCast)" stroke="#0F172A" strokeWidth="2.5" />
          
          {/* 4 In-line Cylinder Bores */}
          {[32, 58, 84, 110].map((cy, i) => (
            <g key={i}>
              <ellipse cx="80" cy={cy} rx="36" ry="9" fill="url(#mbCylinder)" stroke="#94A3B8" strokeWidth="1.5" />
              <ellipse cx="80" cy={cy} rx="28" ry="6" fill="#020617" />
            </g>
          ))}

          {/* Cooling Fins / Ribs on sides */}
          <line x1="22" y1="35" x2="36" y2="35" stroke="#94A3B8" strokeWidth="2" />
          <line x1="22" y1="60" x2="36" y2="60" stroke="#94A3B8" strokeWidth="2" />
          <line x1="22" y1="85" x2="36" y2="85" stroke="#94A3B8" strokeWidth="2" />
          <line x1="22" y1="110" x2="36" y2="110" stroke="#94A3B8" strokeWidth="2" />

          <line x1="124" y1="35" x2="138" y2="35" stroke="#94A3B8" strokeWidth="2" />
          <line x1="124" y1="60" x2="138" y2="60" stroke="#94A3B8" strokeWidth="2" />
          <line x1="124" y1="85" x2="138" y2="85" stroke="#94A3B8" strokeWidth="2" />
          <line x1="124" y1="110" x2="138" y2="110" stroke="#94A3B8" strokeWidth="2" />

          {/* Oil Sump / Pan Flange */}
          <rect x="15" y="122" width="130" height="8" rx="2" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
        </svg>
      );

    case 'radyator':
      return (
        <svg
          viewBox="0 0 200 90"
          width={width}
          height={height}
          style={style}
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="radTank" x1="0" y1="0" x2="0" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="50%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
            <linearGradient id="radBrassCap" x1="0" y1="0" x2="100%" y2="0">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
          </defs>
          {/* Main Radiator Core Grille */}
          <rect x="15" y="24" width="170" height="52" rx="4" fill="#0B0F19" stroke="#334155" strokeWidth="2" />

          {/* Cooling Ribs / Dense Mesh */}
          {Array.from({ length: 26 }).map((_, i) => (
            <line
              key={i}
              x1={20 + i * 6.2}
              y1="26"
              x2={20 + i * 6.2}
              y2="74"
              stroke="#475569"
              strokeWidth="1.5"
              opacity="0.75"
            />
          ))}

          {/* Top Tank Header */}
          <rect x="10" y="16" width="180" height="14" rx="4" fill="url(#radTank)" stroke="#1E293B" strokeWidth="1.5" />

          {/* Radiator Cap in Center */}
          <ellipse cx="100" cy="12" rx="14" ry="5" fill="url(#radBrassCap)" stroke="#78350F" strokeWidth="1.2" />
          <circle cx="100" cy="11" r="4" fill="#F59E0B" />

          {/* Bottom Tank Header */}
          <rect x="10" y="74" width="180" height="10" rx="3" fill="url(#radTank)" stroke="#1E293B" strokeWidth="1.5" />
        </svg>
      );

    case 'aku':
      return (
        <svg
          viewBox="0 0 140 120"
          width={width}
          height={height}
          style={style}
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="battBody" x1="0" y1="0" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
          </defs>
          {/* Battery Box Casing */}
          <rect x="15" y="30" width="110" height="80" rx="6" fill="url(#battBody)" stroke="#090D16" strokeWidth="2.5" />

          {/* Ribbed casing texture */}
          <line x1="38" y1="36" x2="38" y2="104" stroke="#0F172A" strokeWidth="2" />
          <line x1="60" y1="36" x2="60" y2="104" stroke="#0F172A" strokeWidth="2" />
          <line x1="82" y1="36" x2="82" y2="104" stroke="#0F172A" strokeWidth="2" />
          <line x1="104" y1="36" x2="104" y2="104" stroke="#0F172A" strokeWidth="2" />

          {/* Top Cell Caps (6 cells for 12V) */}
          {[26, 44, 62, 80, 98, 114].map((cx, i) => (
            <circle key={i} cx={cx} cy="30" r="4" fill="#F59E0B" stroke="#78350F" strokeWidth="1" />
          ))}

          {/* Positive Terminal (Red) */}
          <rect x="25" y="16" width="12" height="14" rx="2" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1.2" />
          <text x="31" y="12" fill="#EF4444" fontSize="12" fontWeight="900" textAnchor="middle">+</text>

          {/* Negative Terminal (Blue/Black) */}
          <rect x="103" y="16" width="12" height="14" rx="2" fill="#2563EB" stroke="#1E3A8A" strokeWidth="1.2" />
          <text x="109" y="12" fill="#60A5FA" fontSize="12" fontWeight="900" textAnchor="middle">-</text>

          {/* Vintage "DEVRİM 12V" Label Plate */}
          <rect x="35" y="60" width="70" height="26" rx="4" fill="#0F172A" stroke="#F59E0B" strokeWidth="1.2" />
          <text x="70" y="77" fill="#FDE68A" fontSize="10" fontWeight="900" textAnchor="middle" letterSpacing="1">
            12V DEVRİM
          </text>
        </svg>
      );

    case 'hava_filtresi':
      return (
        <svg
          viewBox="0 0 120 120"
          width={width}
          height={height}
          style={style}
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="hfChrome" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="45%" stopColor="#CBD5E1" />
              <stop offset="80%" stopColor="#64748B" />
              <stop offset="100%" stopColor="#334155" />
            </radialGradient>
            <linearGradient id="hfMesh" x1="0" y1="0" x2="100%" y2="0">
              <stop offset="0%" stopColor="#451A03" />
              <stop offset="50%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#451A03" />
            </linearGradient>
          </defs>
          {/* Circular Pleated Mesh Body */}
          <ellipse cx="60" cy="65" rx="50" ry="38" fill="url(#hfMesh)" stroke="#1E293B" strokeWidth="2.5" />

          {/* Radial Mesh Ribs */}
          {Array.from({ length: 20 }).map((_, i) => {
            const angle = (i * Math.PI) / 10;
            const x1 = 60 + Math.cos(angle) * 22;
            const y1 = 65 + Math.sin(angle) * 16;
            const x2 = 60 + Math.cos(angle) * 50;
            const y2 = 65 + Math.sin(angle) * 38;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1E293B" strokeWidth="1.5" opacity="0.65" />;
          })}

          {/* Top Chrome Cover Lid */}
          <ellipse cx="60" cy="50" rx="48" ry="26" fill="url(#hfChrome)" stroke="#0F172A" strokeWidth="2.5" />
          <ellipse cx="60" cy="50" rx="38" ry="18" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.75" />

          {/* Center Fastening Wing Nut */}
          <circle cx="60" cy="50" r="9" fill="#1E293B" stroke="#F59E0B" strokeWidth="2" />
          <ellipse cx="60" cy="50" rx="16" ry="4" fill="#F59E0B" opacity="0.95" />
        </svg>
      );

    case 'atesleme':
      return (
        <svg
          viewBox="0 0 110 130"
          width={width}
          height={height}
          style={style}
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="distBody" x1="0" y1="0" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EA580C" />
              <stop offset="50%" stopColor="#9A3412" />
              <stop offset="100%" stopColor="#431407" />
            </linearGradient>
            <linearGradient id="distBase" x1="0" y1="0" x2="100%" y2="0">
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="50%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
          </defs>
          {/* Metal Mounting Shaft */}
          <rect x="46" y="80" width="18" height="42" rx="3" fill="url(#distBase)" stroke="#0F172A" strokeWidth="1.5" />
          <circle cx="55" cy="115" r="5" fill="#CBD5E1" stroke="#334155" strokeWidth="1" />

          {/* Bakelite Distributor Cap (Orange/Brown Vintage) */}
          <path
            d="M 25 50 C 25 32 38 22 55 22 C 72 22 85 32 85 50 L 85 80 L 25 80 Z"
            fill="url(#distBody)"
            stroke="#1C0A04"
            strokeWidth="2.5"
          />

          {/* 4 Spark Plug Tower Terminals */}
          <rect x="32" y="14" width="8" height="16" rx="2" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
          <rect x="47" y="10" width="8" height="18" rx="2" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
          <rect x="62" y="10" width="8" height="18" rx="2" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
          <rect x="76" y="14" width="8" height="16" rx="2" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />

          {/* Central High-Tension Coil Lead */}
          <ellipse cx="55" cy="36" rx="6" ry="4" fill="#F59E0B" stroke="#78350F" strokeWidth="1" />

          {/* Vacuum Advance Capsule on Side */}
          <ellipse cx="18" cy="65" rx="10" ry="8" fill="url(#distBase)" stroke="#0F172A" strokeWidth="1.2" />
          <line x1="26" y1="65" x2="32" y2="65" stroke="#94A3B8" strokeWidth="2" />
        </svg>
      );

    default:
      return null;
  }
};
