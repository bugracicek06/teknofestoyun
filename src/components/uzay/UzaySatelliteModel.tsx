import React from 'react';
import type { SpacecraftPartId } from '../../data/uzayData';

export const SatelliteDefs: React.FC = () => (
  <defs>
    {/* Metallic Body Gradients */}
    <linearGradient id="bodyMetalMain" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#FFFFFF" />
      <stop offset="25%" stopColor="#F1F5F9" />
      <stop offset="60%" stopColor="#E2E8F0" />
      <stop offset="85%" stopColor="#CBD5E1" />
      <stop offset="100%" stopColor="#94A3B8" />
    </linearGradient>

    <linearGradient id="bodyMetalSide" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#CBD5E1" />
      <stop offset="50%" stopColor="#94A3B8" />
      <stop offset="100%" stopColor="#64748B" />
    </linearGradient>

    <linearGradient id="bodyTopCap" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#FFFFFF" />
      <stop offset="100%" stopColor="#CBD5E1" />
    </linearGradient>

    <linearGradient id="darkTitanium" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#475569" />
      <stop offset="50%" stopColor="#334155" />
      <stop offset="100%" stopColor="#1E293B" />
    </linearGradient>

    {/* Solar Photovoltaic Cell Pattern & Gradients */}
    <linearGradient id="solarCellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#1E3A8A" />
      <stop offset="35%" stopColor="#1D4ED8" />
      <stop offset="70%" stopColor="#1E3A8A" />
      <stop offset="100%" stopColor="#0F172A" />
    </linearGradient>

    <pattern id="solarGridPattern" width="16" height="16" patternUnits="userSpaceOnUse">
      <rect width="16" height="16" fill="url(#solarCellGrad)" stroke="#38BDF8" strokeWidth="0.6" strokeOpacity="0.4" />
      <line x1="8" y1="0" x2="8" y2="16" stroke="#F59E0B" strokeWidth="0.4" strokeOpacity="0.6" />
      <line x1="0" y1="8" x2="16" y2="8" stroke="#93C5FD" strokeWidth="0.3" strokeOpacity="0.5" />
    </pattern>

    {/* Gold Multi-Layer Insulation (MLI) Foil */}
    <linearGradient id="goldMliGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#FEF08A" />
      <stop offset="25%" stopColor="#FACC15" />
      <stop offset="50%" stopColor="#EAB308" />
      <stop offset="75%" stopColor="#CA8A04" />
      <stop offset="100%" stopColor="#854D0E" />
    </linearGradient>

    <linearGradient id="goldTrussGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#FDE047" />
      <stop offset="50%" stopColor="#EAB308" />
      <stop offset="100%" stopColor="#A16207" />
    </linearGradient>

    {/* Antenna Dish Gradient */}
    <radialGradient id="dishRadialGrad" cx="45%" cy="40%" r="55%">
      <stop offset="0%" stopColor="#FFFFFF" />
      <stop offset="40%" stopColor="#F1F5F9" />
      <stop offset="75%" stopColor="#CBD5E1" />
      <stop offset="90%" stopColor="#94A3B8" />
      <stop offset="100%" stopColor="#475569" />
    </radialGradient>

    <radialGradient id="dishInnerShade" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#0F172A" stopOpacity="0.7" />
      <stop offset="70%" stopColor="#334155" stopOpacity="0.2" />
      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
    </radialGradient>

    {/* Optical Lens Gradients */}
    <radialGradient id="lensAperture" cx="40%" cy="35%" r="60%">
      <stop offset="0%" stopColor="#38BDF8" />
      <stop offset="25%" stopColor="#0284C7" />
      <stop offset="55%" stopColor="#1E1B4B" />
      <stop offset="85%" stopColor="#090D16" />
      <stop offset="100%" stopColor="#020617" />
    </radialGradient>

    <linearGradient id="lensFlare" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
      <stop offset="50%" stopColor="#818CF8" stopOpacity="0.3" />
      <stop offset="100%" stopColor="#C084FC" stopOpacity="0" />
    </linearGradient>

    {/* Glow & Shadow Filters */}
    <filter id="cyanGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feFlood floodColor="#38BDF8" floodOpacity="0.9" result="color" />
      <feComposite in2="blur" operator="in" result="glow" />
      <feMerge>
        <feMergeNode in="glow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3.5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="partDropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="#020617" floodOpacity="0.65" />
    </filter>

    {/* Holographic Blueprint Outline Filter */}
    <filter id="blueprintGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#38BDF8" floodOpacity="0.6" />
    </filter>
  </defs>
);

interface GeometryGhostProps {
  isGhost?: boolean;
  isNear?: boolean;
  isActiveTarget?: boolean;
}

// 1. Central Bus / Body Geometry (Center: 500, 350)
export const SatelliteBodyGeometry: React.FC<GeometryGhostProps> = ({
  isGhost = false,
  isNear = false,
  isActiveTarget = false,
}) => {
  if (isGhost) {
    const strokeColor = isNear ? '#67E8F9' : isActiveTarget ? '#38BDF8' : '#0284C7';
    const strokeW = isNear ? 2.4 : isActiveTarget ? 2.0 : 1.6;
    const opacityVal = isNear ? 1.0 : isActiveTarget ? 0.85 : 0.42;

    return (
      <g
        className="satellite-ghost-body"
        style={{
          opacity: opacityVal,
          filter: isNear || isActiveTarget ? 'drop-shadow(0 0 6px #38BDF8)' : 'drop-shadow(0 0 3px rgba(56, 189, 248, 0.6))',
        }}
      >
        {/* Main hexagon/octagonal hull outline */}
        <polygon
          points="425,250 575,250 620,290 620,410 575,440 425,440 380,410 380,290"
          fill="rgba(8, 22, 50, 0.45)"
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeDasharray={isNear ? 'none' : '5,4'}
        />
        {/* Left mounting bracket */}
        <rect x="360" y="335" width="20" height="30" rx="3" fill="rgba(8, 22, 50, 0.45)" stroke={strokeColor} strokeWidth={strokeW * 0.8} strokeDasharray="3,3" />
        {/* Right mounting bracket */}
        <rect x="620" y="335" width="20" height="30" rx="3" fill="rgba(8, 22, 50, 0.45)" stroke={strokeColor} strokeWidth={strokeW * 0.8} strokeDasharray="3,3" />
        {/* Top antenna collar */}
        <ellipse cx="500" cy="250" rx="36" ry="11" fill="none" stroke={strokeColor} strokeWidth={strokeW * 0.8} strokeDasharray="3,3" />
        {/* Bottom adapter ring */}
        <ellipse cx="500" cy="440" rx="52" ry="13" fill="none" stroke={strokeColor} strokeWidth={strokeW * 0.8} strokeDasharray="3,3" />
        {/* Center sensor aperture ring */}
        <circle cx="475" cy="350" r="28" fill="none" stroke={strokeColor} strokeWidth={strokeW * 0.7} strokeDasharray="3,3" />
        {/* Blueprint guide crosshair */}
        <line x1="435" y1="350" x2="565" y2="350" stroke={strokeColor} strokeWidth="0.8" strokeDasharray="2,3" opacity="0.6" />
        <line x1="500" y1="285" x2="500" y2="415" stroke={strokeColor} strokeWidth="0.8" strokeDasharray="2,3" opacity="0.6" />
      </g>
    );
  }

  return (
    <g id="satellite-body-group" style={{ filter: 'drop-shadow(0 5px 8px rgba(2, 6, 23, 0.65))' }}>
      {/* Structural side panels (Left facet) */}
      <polygon points="380,290 425,268 425,430 380,410" fill="url(#bodyMetalSide)" stroke="#94A3B8" strokeWidth="1" />

      {/* Structural side panels (Right facet) */}
      <polygon points="575,268 620,290 620,410 575,430" fill="url(#bodyMetalSide)" stroke="#64748B" strokeWidth="1" />

      {/* Main Front Panel Face */}
      <polygon points="425,268 575,268 575,430 425,430" fill="url(#bodyMetalMain)" stroke="#CBD5E1" strokeWidth="1.2" />

      {/* Top Deck Surface */}
      <polygon points="425,268 500,245 575,268 500,275" fill="url(#bodyTopCap)" stroke="#E2E8F0" strokeWidth="1" />

      {/* Top Antenna Gimbal Collar */}
      <ellipse cx="500" cy="250" rx="36" ry="11" fill="url(#darkTitanium)" stroke="#64748B" strokeWidth="1.5" />
      <ellipse cx="500" cy="250" rx="22" ry="7" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />

      {/* Bottom Structural Coupling Ring */}
      <ellipse cx="500" cy="440" rx="54" ry="13" fill="url(#darkTitanium)" stroke="#94A3B8" strokeWidth="1.5" />
      <ellipse cx="500" cy="440" rx="40" ry="9" fill="#090D16" />

      {/* Left Solar Array Support Bracket Assembly */}
      <g id="left-bus-mount">
        <rect x="360" y="335" width="20" height="30" rx="3" fill="url(#darkTitanium)" stroke="#94A3B8" strokeWidth="1" />
        <circle cx="370" cy="350" r="4" fill="#F59E0B" stroke="#78350F" strokeWidth="1" />
        <line x1="360" y1="342" x2="380" y2="342" stroke="#64748B" strokeWidth="0.8" />
        <line x1="360" y1="358" x2="380" y2="358" stroke="#64748B" strokeWidth="0.8" />
      </g>

      {/* Right Solar Array Support Bracket Assembly */}
      <g id="right-bus-mount">
        <rect x="620" y="335" width="20" height="30" rx="3" fill="url(#darkTitanium)" stroke="#94A3B8" strokeWidth="1" />
        <circle cx="630" cy="350" r="4" fill="#F59E0B" stroke="#78350F" strokeWidth="1" />
        <line x1="620" y1="342" x2="640" y2="342" stroke="#64748B" strokeWidth="0.8" />
        <line x1="620" y1="358" x2="640" y2="358" stroke="#64748B" strokeWidth="0.8" />
      </g>

      {/* Front Face Radiator & Equipment Panels */}
      <rect x="435" y="280" width="130" height="38" rx="3" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" opacity="0.9" />
      {[286, 292, 298, 304, 310].map((y, idx) => (
        <line key={idx} x1="440" y1={y} x2="560" y2={y} stroke="#94A3B8" strokeWidth="1" strokeOpacity="0.5" />
      ))}

      {/* Center Scientific Payload Recessed Port */}
      <circle cx="475" cy="350" r="28" fill="url(#darkTitanium)" stroke="#64748B" strokeWidth="2" />
      <circle cx="475" cy="350" r="22" fill="#090D16" stroke="#38BDF8" strokeWidth="0.8" strokeDasharray="3,2" />

      {/* Right avionics bay inspection hatch */}
      <rect x="518" y="335" width="46" height="30" rx="2" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1" />
      <circle cx="523" cy="340" r="1.5" fill="#64748B" />
      <circle cx="559" cy="340" r="1.5" fill="#64748B" />
      <circle cx="523" cy="360" r="1.5" fill="#64748B" />
      <circle cx="559" cy="360" r="1.5" fill="#64748B" />
      <text x="541" y="353" textAnchor="middle" fill="#0284C7" fontSize="7" fontWeight="bold" fontFamily="'Outfit', sans-serif">
        AVIONIC
      </text>

      {/* Lower MLI thermal blanket band */}
      <rect x="435" y="390" width="130" height="30" rx="2" fill="url(#goldMliGrad)" stroke="#B45309" strokeWidth="1" />
      <line x1="465" y1="390" x2="475" y2="420" stroke="#78350F" strokeWidth="0.8" strokeOpacity="0.7" />
      <line x1="500" y1="390" x2="505" y2="420" stroke="#78350F" strokeWidth="0.8" strokeOpacity="0.7" />
      <line x1="535" y1="390" x2="530" y2="420" stroke="#78350F" strokeWidth="0.8" strokeOpacity="0.7" />

      {/* Mission Badge & Serial */}
      <text x="500" y="278" textAnchor="middle" fill="#0369A1" fontSize="8" fontWeight="bold" letterSpacing="1" fontFamily="'Outfit', sans-serif">
        TÜRKİYE • UZAY TEKNOLOJİLERİ
      </text>
    </g>
  );
};

// 2. Left Solar Array Geometry (Center: 250, 350)
export const SatelliteSolarLeftGeometry: React.FC<GeometryGhostProps> = ({
  isGhost = false,
  isNear = false,
  isActiveTarget = false,
}) => {
  if (isGhost) {
    const strokeColor = isNear ? '#67E8F9' : isActiveTarget ? '#38BDF8' : '#0284C7';
    const strokeW = isNear ? 2.4 : isActiveTarget ? 2.0 : 1.6;
    const opacityVal = isNear ? 1.0 : isActiveTarget ? 0.85 : 0.42;

    return (
      <g
        className="satellite-ghost-solar-left"
        style={{
          opacity: opacityVal,
          filter: isNear || isActiveTarget ? 'drop-shadow(0 0 6px #38BDF8)' : 'drop-shadow(0 0 3px rgba(56, 189, 248, 0.6))',
        }}
      >
        <rect x="135" y="280" width="225" height="140" rx="4" fill="rgba(8, 22, 50, 0.45)" stroke={strokeColor} strokeWidth={strokeW} strokeDasharray={isNear ? 'none' : '5,4'} />
        <line x1="245" y1="280" x2="245" y2="420" stroke={strokeColor} strokeWidth="1.2" strokeDasharray="3,3" />
        <polygon points="360,335 380,350 360,365" fill="none" stroke={strokeColor} strokeWidth={strokeW * 0.8} strokeDasharray="3,2" />
        <line x1="140" y1="350" x2="355" y2="350" stroke={strokeColor} strokeWidth="0.8" strokeDasharray="2,3" opacity="0.6" />
      </g>
    );
  }

  return (
    <g id="satellite-solar-left-group" style={{ filter: 'drop-shadow(0 5px 8px rgba(2, 6, 23, 0.65))' }}>
      {/* Titanium & Gold Articulation Truss */}
      <g id="left-truss-root">
        <polygon points="360,335 380,350 360,365" fill="url(#darkTitanium)" stroke="#94A3B8" strokeWidth="1" />
        <line x1="360" y1="338" x2="378" y2="350" stroke="url(#goldTrussGrad)" strokeWidth="2" />
        <line x1="360" y1="362" x2="378" y2="350" stroke="url(#goldTrussGrad)" strokeWidth="2" />
        <circle cx="360" cy="350" r="5" fill="#EAB308" stroke="#78350F" strokeWidth="1.2" />
      </g>

      {/* Main Panel Frame */}
      <rect x="135" y="280" width="225" height="140" rx="4" fill="#0F172A" stroke="url(#goldTrussGrad)" strokeWidth="2" />

      {/* Photovoltaic Arrays */}
      <rect x="250" y="286" width="104" height="128" rx="2" fill="url(#solarGridPattern)" stroke="#1E40AF" strokeWidth="1.2" />
      <rect x="141" y="286" width="104" height="128" rx="2" fill="url(#solarGridPattern)" stroke="#1E40AF" strokeWidth="1.2" />

      {/* Structural Truss */}
      <line x1="247" y1="280" x2="247" y2="420" stroke="url(#goldTrussGrad)" strokeWidth="2.5" />
      <circle cx="247" cy="290" r="3" fill="#FDE047" stroke="#78350F" strokeWidth="1" />
      <circle cx="247" cy="410" r="3" fill="#FDE047" stroke="#78350F" strokeWidth="1" />
      <line x1="141" y1="350" x2="354" y2="350" stroke="#F59E0B" strokeWidth="1.2" strokeOpacity="0.8" />

      {/* Corner Brackets */}
      <path d="M 135 290 L 135 280 L 145 280" fill="none" stroke="#FDE047" strokeWidth="2" />
      <path d="M 135 410 L 135 420 L 145 420" fill="none" stroke="#FDE047" strokeWidth="2" />
      <polygon points="145,290 220,290 175,410 145,410" fill="#38BDF8" fillOpacity="0.08" />
    </g>
  );
};

// 3. Right Solar Array Geometry (Center: 750, 350)
export const SatelliteSolarRightGeometry: React.FC<GeometryGhostProps> = ({
  isGhost = false,
  isNear = false,
  isActiveTarget = false,
}) => {
  if (isGhost) {
    const strokeColor = isNear ? '#67E8F9' : isActiveTarget ? '#38BDF8' : '#0284C7';
    const strokeW = isNear ? 2.4 : isActiveTarget ? 2.0 : 1.6;
    const opacityVal = isNear ? 1.0 : isActiveTarget ? 0.85 : 0.42;

    return (
      <g
        className="satellite-ghost-solar-right"
        style={{
          opacity: opacityVal,
          filter: isNear || isActiveTarget ? 'drop-shadow(0 0 6px #38BDF8)' : 'drop-shadow(0 0 3px rgba(56, 189, 248, 0.6))',
        }}
      >
        <rect x="640" y="280" width="225" height="140" rx="4" fill="rgba(8, 22, 50, 0.45)" stroke={strokeColor} strokeWidth={strokeW} strokeDasharray={isNear ? 'none' : '5,4'} />
        <line x1="755" y1="280" x2="755" y2="420" stroke={strokeColor} strokeWidth="1.2" strokeDasharray="3,3" />
        <polygon points="640,335 620,350 640,365" fill="none" stroke={strokeColor} strokeWidth={strokeW * 0.8} strokeDasharray="3,2" />
        <line x1="645" y1="350" x2="860" y2="350" stroke={strokeColor} strokeWidth="0.8" strokeDasharray="2,3" opacity="0.6" />
      </g>
    );
  }

  return (
    <g id="satellite-solar-right-group" style={{ filter: 'drop-shadow(0 5px 8px rgba(2, 6, 23, 0.65))' }}>
      {/* Titanium & Gold Articulation Truss */}
      <g id="right-truss-root">
        <polygon points="640,335 620,350 640,365" fill="url(#darkTitanium)" stroke="#94A3B8" strokeWidth="1" />
        <line x1="640" y1="338" x2="622" y2="350" stroke="url(#goldTrussGrad)" strokeWidth="2" />
        <line x1="640" y1="362" x2="622" y2="350" stroke="url(#goldTrussGrad)" strokeWidth="2" />
        <circle cx="640" cy="350" r="5" fill="#EAB308" stroke="#78350F" strokeWidth="1.2" />
      </g>

      {/* Main Panel Frame */}
      <rect x="640" y="280" width="225" height="140" rx="4" fill="#0F172A" stroke="url(#goldTrussGrad)" strokeWidth="2" />

      {/* Photovoltaic Arrays */}
      <rect x="646" y="286" width="104" height="128" rx="2" fill="url(#solarGridPattern)" stroke="#1E40AF" strokeWidth="1.2" />
      <rect x="755" y="286" width="104" height="128" rx="2" fill="url(#solarGridPattern)" stroke="#1E40AF" strokeWidth="1.2" />

      {/* Structural Truss */}
      <line x1="753" y1="280" x2="753" y2="420" stroke="url(#goldTrussGrad)" strokeWidth="2.5" />
      <circle cx="753" cy="290" r="3" fill="#FDE047" stroke="#78350F" strokeWidth="1" />
      <circle cx="753" cy="410" r="3" fill="#FDE047" stroke="#78350F" strokeWidth="1" />
      <line x1="646" y1="350" x2="859" y2="350" stroke="#F59E0B" strokeWidth="1.2" strokeOpacity="0.8" />

      {/* Corner Brackets */}
      <path d="M 865 290 L 865 280 L 855 280" fill="none" stroke="#FDE047" strokeWidth="2" />
      <path d="M 865 410 L 865 420 L 855 420" fill="none" stroke="#FDE047" strokeWidth="2" />
      <polygon points="655,290 730,290 685,410 655,410" fill="#38BDF8" fillOpacity="0.08" />
    </g>
  );
};

// 4. Parabolic Communications Antenna Dish Geometry (Center: 500, 160)
export const SatelliteAntennaGeometry: React.FC<GeometryGhostProps> = ({
  isGhost = false,
  isNear = false,
  isActiveTarget = false,
}) => {
  if (isGhost) {
    const strokeColor = isNear ? '#67E8F9' : isActiveTarget ? '#38BDF8' : '#0284C7';
    const strokeW = isNear ? 2.4 : isActiveTarget ? 2.0 : 1.6;
    const opacityVal = isNear ? 1.0 : isActiveTarget ? 0.85 : 0.42;

    return (
      <g
        className="satellite-ghost-antenna"
        style={{
          opacity: opacityVal,
          filter: isNear || isActiveTarget ? 'drop-shadow(0 0 6px #38BDF8)' : 'drop-shadow(0 0 3px rgba(56, 189, 248, 0.6))',
        }}
      >
        <ellipse cx="500" cy="140" rx="125" ry="46" fill="rgba(8, 22, 50, 0.45)" stroke={strokeColor} strokeWidth={strokeW} strokeDasharray={isNear ? 'none' : '5,4'} />
        <line x1="500" y1="75" x2="445" y2="140" stroke={strokeColor} strokeWidth="1.2" strokeDasharray="3,3" />
        <line x1="500" y1="75" x2="555" y2="140" stroke={strokeColor} strokeWidth="1.2" strokeDasharray="3,3" />
        <circle cx="500" cy="72" r="9" fill="none" stroke={strokeColor} strokeWidth="1.4" strokeDasharray="2,2" />
        <line x1="500" y1="180" x2="500" y2="250" stroke={strokeColor} strokeWidth={strokeW * 0.8} strokeDasharray="3,2" />
      </g>
    );
  }

  return (
    <g id="satellite-antenna-group" style={{ filter: 'drop-shadow(0 5px 8px rgba(2, 6, 23, 0.65))' }}>
      {/* Gimbal Mounting Base */}
      <g id="antenna-gimbal-mount">
        <polygon points="488,250 512,250 508,205 492,205" fill="url(#darkTitanium)" stroke="#94A3B8" strokeWidth="1" />
        <rect x="490" y="200" width="20" height="15" rx="3" fill="#CBD5E1" stroke="#475569" strokeWidth="1" />
        <circle cx="500" cy="195" r="5" fill="#F59E0B" stroke="#78350F" strokeWidth="1.2" />
      </g>

      {/* Dish Structure */}
      <ellipse cx="500" cy="152" rx="120" ry="38" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
      <ellipse cx="500" cy="140" rx="124" ry="46" fill="url(#dishRadialGrad)" stroke="#E2E8F0" strokeWidth="1.8" />
      <ellipse cx="500" cy="140" rx="124" ry="46" fill="url(#dishInnerShade)" />

      {/* Concentric Calibration Rings */}
      <ellipse cx="500" cy="140" rx="90" ry="32" fill="none" stroke="#94A3B8" strokeWidth="0.8" strokeOpacity="0.6" />
      <ellipse cx="500" cy="140" rx="55" ry="19" fill="none" stroke="#64748B" strokeWidth="0.8" strokeOpacity="0.7" />
      <ellipse cx="500" cy="140" rx="22" ry="8" fill="url(#darkTitanium)" stroke="#38BDF8" strokeWidth="1" />

      {/* Feedhorn Tripod Struts */}
      <line x1="435" y1="145" x2="500" y2="85" stroke="url(#darkTitanium)" strokeWidth="2.2" />
      <line x1="565" y1="145" x2="500" y2="85" stroke="url(#darkTitanium)" strokeWidth="2.2" />
      <line x1="500" y1="155" x2="500" y2="85" stroke="url(#darkTitanium)" strokeWidth="1.5" />

      {/* Apex Feedhorn */}
      <polygon points="492,88 508,88 504,75 496,75" fill="url(#goldTrussGrad)" stroke="#B45309" strokeWidth="1" />
      <circle cx="500" cy="72" r="8" fill="url(#bodyMetalMain)" stroke="#38BDF8" strokeWidth="1.2" />
      <circle cx="500" cy="72" r="4" fill="#0284C7" />
      <ellipse cx="500" cy="140" rx="123" ry="45" fill="none" stroke="#38BDF8" strokeWidth="0.6" strokeOpacity="0.4" />
    </g>
  );
};

// 5. Scientific Sensor & Optical Pod Geometry (Center: 475, 350)
export const SatelliteSensorGeometry: React.FC<GeometryGhostProps> = ({
  isGhost = false,
  isNear = false,
  isActiveTarget = false,
}) => {
  if (isGhost) {
    const strokeColor = isNear ? '#67E8F9' : isActiveTarget ? '#38BDF8' : '#0284C7';
    const strokeW = isNear ? 2.4 : isActiveTarget ? 2.0 : 1.6;
    const opacityVal = isNear ? 1.0 : isActiveTarget ? 0.85 : 0.42;

    return (
      <g
        className="satellite-ghost-sensor"
        style={{
          opacity: opacityVal,
          filter: isNear || isActiveTarget ? 'drop-shadow(0 0 6px #38BDF8)' : 'drop-shadow(0 0 3px rgba(56, 189, 248, 0.6))',
        }}
      >
        <circle cx="475" cy="350" r="36" fill="rgba(8, 22, 50, 0.45)" stroke={strokeColor} strokeWidth={strokeW} strokeDasharray={isNear ? 'none' : '4,3'} />
        <circle cx="475" cy="350" r="24" fill="none" stroke={strokeColor} strokeWidth="1.2" strokeDasharray="3,2" />
        <line x1="455" y1="350" x2="495" y2="350" stroke={strokeColor} strokeWidth="1" strokeDasharray="2,2" />
        <line x1="475" y1="330" x2="475" y2="370" stroke={strokeColor} strokeWidth="1" strokeDasharray="2,2" />
      </g>
    );
  }

  return (
    <g id="satellite-sensor-group" style={{ filter: 'drop-shadow(0 5px 8px rgba(2, 6, 23, 0.65))' }}>
      {/* Titanium Barrel Flange & Mounting Ring */}
      <circle cx="475" cy="350" r="34" fill="url(#darkTitanium)" stroke="#94A3B8" strokeWidth="2" />
      <circle cx="475" cy="350" r="30" fill="#090D16" stroke="#64748B" strokeWidth="1" />

      {/* Gold Thermal MLI Baffle */}
      <circle cx="475" cy="350" r="27" fill="url(#goldMliGrad)" stroke="#B45309" strokeWidth="1.2" />

      {/* Internal Stepped Baffles */}
      <circle cx="475" cy="350" r="22" fill="#020617" stroke="#334155" strokeWidth="1" />
      <circle cx="475" cy="350" r="18" fill="url(#darkTitanium)" />

      {/* Multi-Element Optical Glass Lens */}
      <circle cx="475" cy="350" r="16" fill="url(#lensAperture)" stroke="#38BDF8" strokeWidth="1.5" />

      {/* Specular Glint & Flare */}
      <path
        d="M 463 343 Q 475 339 485 345 Q 477 349 463 343 Z"
        fill="url(#lensFlare)"
      />
      <ellipse cx="470" cy="344" rx="3.5" ry="1.5" fill="#FFFFFF" opacity="0.9" />

      {/* Hex Mounting Bolts */}
      {[0, 60, 120, 180, 240, 300].map((deg, idx) => {
        const rad = (deg * Math.PI) / 180;
        const bx = 475 + 31 * Math.cos(rad);
        const by = 350 + 31 * Math.sin(rad);
        return <circle key={idx} cx={bx} cy={by} r="1.5" fill="#CBD5E1" stroke="#334155" strokeWidth="0.5" />;
      })}
    </g>
  );
};

// 6. Heat Shield & Propulsion Lower Module (Center: 500, 495)
export const SatelliteHeatShieldGeometry: React.FC<GeometryGhostProps> = ({
  isGhost = false,
  isNear = false,
  isActiveTarget = false,
}) => {
  if (isGhost) {
    const strokeColor = isNear ? '#67E8F9' : isActiveTarget ? '#38BDF8' : '#0284C7';
    const strokeW = isNear ? 2.4 : isActiveTarget ? 2.0 : 1.6;
    const opacityVal = isNear ? 1.0 : isActiveTarget ? 0.85 : 0.42;

    return (
      <g
        className="satellite-ghost-heat-shield"
        style={{
          opacity: opacityVal,
          filter: isNear || isActiveTarget ? 'drop-shadow(0 0 6px #38BDF8)' : 'drop-shadow(0 0 3px rgba(56, 189, 248, 0.6))',
        }}
      >
        <polygon
          points="442,440 558,440 575,500 425,500"
          fill="rgba(8, 22, 50, 0.45)"
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeDasharray={isNear ? 'none' : '5,4'}
        />
        <polygon points="475,500 525,500 538,540 462,540" fill="none" stroke={strokeColor} strokeWidth="1.4" strokeDasharray="3,3" />
        <ellipse cx="500" cy="540" rx="38" ry="10" fill="none" stroke={strokeColor} strokeWidth="1.4" strokeDasharray="3,3" />
      </g>
    );
  }

  return (
    <g id="satellite-heat-shield-group" style={{ filter: 'drop-shadow(0 5px 8px rgba(2, 6, 23, 0.65))' }}>
      {/* Top Interface Adapter Ring */}
      <ellipse cx="500" cy="440" rx="56" ry="12" fill="url(#darkTitanium)" stroke="#94A3B8" strokeWidth="1.5" />

      {/* Gold Foil Thermal Shield Facets */}
      <polygon points="444,443 556,443 574,500 426,500" fill="url(#goldMliGrad)" stroke="#B45309" strokeWidth="1.5" />
      <line x1="480" y1="443" x2="472" y2="500" stroke="#78350F" strokeWidth="1" strokeOpacity="0.8" />
      <line x1="520" y1="443" x2="528" y2="500" stroke="#78350F" strokeWidth="1" strokeOpacity="0.8" />
      <line x1="444" y1="473" x2="556" y2="473" stroke="#FDE047" strokeWidth="0.8" strokeOpacity="0.6" />

      {/* RCS Thruster Pods */}
      <rect x="420" y="480" width="12" height="15" rx="2" fill="url(#darkTitanium)" stroke="#64748B" strokeWidth="0.8" />
      <polygon points="418,485 412,481 412,489" fill="#334155" />
      <rect x="568" y="480" width="12" height="15" rx="2" fill="url(#darkTitanium)" stroke="#64748B" strokeWidth="0.8" />
      <polygon points="582,485 588,481 588,489" fill="#334155" />

      {/* Titanium Thermal Barrier */}
      <polygon points="432,500 568,500 560,510 440,510" fill="url(#darkTitanium)" stroke="#64748B" strokeWidth="1" />

      {/* Apogee Propulsion Nozzle */}
      <polygon points="476,509 524,509 538,543 462,543" fill="url(#darkTitanium)" stroke="#475569" strokeWidth="1.5" />
      <ellipse cx="500" cy="543" rx="38" ry="10" fill="#090D16" stroke="#CA8A04" strokeWidth="1.5" />
      <ellipse cx="500" cy="543" rx="28" ry="6" fill="#1E293B" stroke="#F59E0B" strokeWidth="0.8" />
    </g>
  );
};

export const SatellitePartCardPreview: React.FC<{ partId: SpacecraftPartId }> = ({ partId }) => {
  return (
    <svg
      viewBox="0 0 160 110"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        overflow: 'visible',
      }}
    >
      {partId === 'body' && (
        <g transform="translate(80, 55) scale(0.44) translate(-500, -350)">
          <SatelliteBodyGeometry />
        </g>
      )}
      {partId === 'solar_left' && (
        <g transform="translate(80, 55) scale(0.55) translate(-250, -350)">
          <SatelliteSolarLeftGeometry />
        </g>
      )}
      {partId === 'solar_right' && (
        <g transform="translate(80, 55) scale(0.55) translate(-750, -350)">
          <SatelliteSolarRightGeometry />
        </g>
      )}
      {partId === 'antenna' && (
        <g transform="translate(80, 55) scale(0.52) translate(-500, -160)">
          <SatelliteAntennaGeometry />
        </g>
      )}
      {partId === 'sensor' && (
        <g transform="translate(80, 55) scale(1.15) translate(-475, -350)">
          <SatelliteSensorGeometry />
        </g>
      )}
      {partId === 'heat_shield' && (
        <g transform="translate(80, 55) scale(0.72) translate(-500, -495)">
          <SatelliteHeatShieldGeometry />
        </g>
      )}
    </svg>
  );
};

// Fully Assembled Unified Satellite View
export const FullyAssembledSatellite: React.FC = () => {
  return (
    <g id="fully-assembled-satellite" style={{ filter: 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.45))' }}>
      {/* 1. Left Solar Array */}
      <SatelliteSolarLeftGeometry />
      {/* 2. Right Solar Array */}
      <SatelliteSolarRightGeometry />
      {/* 3. Heat Shield / Lower Module */}
      <SatelliteHeatShieldGeometry />
      {/* 4. Main Body Bus */}
      <SatelliteBodyGeometry />
      {/* 5. Communications Antenna Dish */}
      <SatelliteAntennaGeometry />
      {/* 6. Scientific Sensor Pod */}
      <SatelliteSensorGeometry />

      {/* Orbital Rim Lighting Sweep */}
      <path
        d="M 140 285 L 860 285 L 860 295 L 140 295 Z"
        fill="url(#lensAperture)"
        opacity="0.25"
      />
    </g>
  );
};
