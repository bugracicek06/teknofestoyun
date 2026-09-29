import React from 'react';

/**
 * ============================================================================
 * UNIFIED SOURCE OF TRUTH: AEROSPACE INDUSTRIAL OBSERVATION UAV GEOMETRY
 * Master coordinate space: 1000 x 500
 * Ground contact plane: y = 425
 * ============================================================================
 */

export type DronePartKey = 'kanat' | 'motor' | 'kuyruk' | 'inis_takimi';

export interface DronePartMeta {
  id: DronePartKey;
  name: string;
  role: string;
  cardViewBox: string;
  mountPointPercent: { x: number; y: number };
}

const DRONE_PARTS_META: Record<DronePartKey, DronePartMeta> = {
  kanat: {
    id: 'kanat',
    name: 'KANAT',
    role: 'Aerodinamik taşıma ve süzülme performansı',
    cardViewBox: '35 150 930 170',
    mountPointPercent: { x: 50.0, y: 48.0 },
  },
  motor: {
    id: 'motor',
    name: 'MOTOR',
    role: 'Yüksek verimli pervaneli itki ünitesi',
    cardViewBox: '430 85 190 215',
    mountPointPercent: { x: 53.0, y: 39.5 },
  },
  kuyruk: {
    id: 'kuyruk',
    name: 'KUYRUK',
    role: 'Çift V-kuyruk ile aerodinamik yön dengesi',
    cardViewBox: '570 100 340 180',
    mountPointPercent: { x: 73.0, y: 39.0 },
  },
  inis_takimi: {
    id: 'inis_takimi',
    name: 'İNİŞ TAKIMI',
    role: 'Ağır hizmet tipi üç tekerlekli şok emici iniş takımı',
    cardViewBox: '240 315 480 135',
    mountPointPercent: { x: 48.0, y: 76.0 },
  },
};

/**
 * Shared SVG Gradients and Defs
 */
export const DroneSvgDefs: React.FC = () => (
  <defs>
    {/* Fuselage Upper Composite Skin Gradient */}
    <linearGradient id="fuselageUpperGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#FFFFFF" />
      <stop offset="35%" stopColor="#F4F7FA" />
      <stop offset="75%" stopColor="#E2E8F0" />
      <stop offset="100%" stopColor="#CBD5E1" />
    </linearGradient>

    {/* Fuselage Lower Belly Shadow Gradient */}
    <linearGradient id="fuselageLowerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#CBD5E1" />
      <stop offset="40%" stopColor="#94A3B8" />
      <stop offset="100%" stopColor="#64748B" />
    </linearGradient>

    {/* Brushed Aerospace Titanium Gradient (Struts & Shock Absorbers) */}
    <linearGradient id="strutTitaniumGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#64748B" />
      <stop offset="35%" stopColor="#E2E8F0" />
      <stop offset="70%" stopColor="#94A3B8" />
      <stop offset="100%" stopColor="#475569" />
    </linearGradient>

    {/* Polished Chrome Hydraulic Oleo Piston Gradient */}
    <linearGradient id="pistonChromeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#E2E8F0" />
      <stop offset="40%" stopColor="#FFFFFF" />
      <stop offset="80%" stopColor="#CBD5E1" />
      <stop offset="100%" stopColor="#94A3B8" />
    </linearGradient>

    {/* Wing Composite Upper Surface Skin */}
    <linearGradient id="wingUpperSkin" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#FFFFFF" />
      <stop offset="30%" stopColor="#F8FAFC" />
      <stop offset="70%" stopColor="#E2E8F0" />
      <stop offset="100%" stopColor="#CBD5E1" />
    </linearGradient>

    {/* Precision Turquoise Aero Accent */}
    <linearGradient id="cyanAeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#00F2FE" />
      <stop offset="100%" stopColor="#0284C7" />
    </linearGradient>

    {/* Autoclave Pre-preg Carbon Fiber Material */}
    <linearGradient id="carbonMaterial" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#334155" />
      <stop offset="40%" stopColor="#1E293B" />
      <stop offset="85%" stopColor="#0F172A" />
      <stop offset="100%" stopColor="#020617" />
    </linearGradient>

    {/* Heavy-Duty Aerospace Rubber Tire Gradient */}
    <radialGradient id="tireTreadGrad" cx="42%" cy="42%" r="58%">
      <stop offset="0%" stopColor="#475569" />
      <stop offset="35%" stopColor="#1E293B" />
      <stop offset="80%" stopColor="#0F172A" />
      <stop offset="100%" stopColor="#020617" />
    </radialGradient>

    {/* Billet Alloy Wheel Rim Radial Gradient */}
    <radialGradient id="alloyRimGrad" cx="45%" cy="45%" r="55%">
      <stop offset="0%" stopColor="#FFFFFF" />
      <stop offset="50%" stopColor="#E2E8F0" />
      <stop offset="85%" stopColor="#94A3B8" />
      <stop offset="100%" stopColor="#475569" />
    </radialGradient>

    {/* Multi-Coated Anti-Reflective Gimbal Lens Glass */}
    <linearGradient id="gimbalLensGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#00F2FE" stopOpacity={0.95} />
      <stop offset="45%" stopColor="#0284C7" stopOpacity={0.75} />
      <stop offset="100%" stopColor="#031525" stopOpacity={0.95} />
    </linearGradient>

    {/* Propeller Blade Bevel & Camber Shading */}
    <linearGradient id="bladeBevelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#64748B" />
      <stop offset="50%" stopColor="#1E293B" />
      <stop offset="100%" stopColor="#0F172A" />
    </linearGradient>

    {/* Mold Soft Glow Filter */}
    <filter id="moldGlowCyan" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="rgba(0, 230, 245, 0.85)" />
    </filter>
    <filter id="moldGlowGreen" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="rgba(20, 230, 180, 0.95)" />
    </filter>
  </defs>
);

/**
 * ============================================================================
 * 1. FIXED PART: FUSELAGE (GÖVDE)
 * Streamlined civilian observation UAV fuselage with PAÜ branding
 * ============================================================================
 */
export const DroneFuselageGeometry: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <g id="drone-fuselage-layer" style={style}>
    {/* Sensor Gimbal Ball Dome at Nose */}
    <ellipse cx="204" cy="305" rx="19" ry="17" fill="url(#gimbalLensGrad)" stroke="#00F2FE" strokeWidth="1.8" />
    <circle cx="200" cy="301" r="6" fill="#FFFFFF" opacity={0.75} />
    <ellipse cx="204" cy="305" rx="8" ry="7" fill="#020617" />
    <circle cx="204" cy="305" r="2.5" fill="#00F2FE" />

    {/* Main Aerodynamic Fuselage Body */}
    <path
      d="M 194,298 Q 220,236 335,226 L 600,230 Q 675,238 738,278 L 750,290 Q 724,324 635,328 L 315,332 Q 215,330 194,298 Z"
      fill="url(#fuselageUpperGrad)"
      stroke="#94A3B8"
      strokeWidth="1.8"
    />

    {/* Top Specular Highlight Bevel */}
    <path
      d="M 210,282 Q 235,240 335,232 L 600,236 Q 665,244 725,282 L 718,289 Q 658,250 595,244 L 335,240 Q 235,248 210,282 Z"
      fill="#FFFFFF"
      opacity={0.7}
    />

    {/* Lower Belly Shadow Panel */}
    <path
      d="M 245,322 L 605,320 Q 632,320 642,310 L 635,328 L 315,332 Q 260,331 245,322 Z"
      fill="url(#fuselageLowerGrad)"
    />

    {/* Avionics Bay Panel Seams */}
    <line x1="325" y1="234" x2="325" y2="328" stroke="#CBD5E1" strokeWidth="1.4" strokeDasharray="14 3" />
    <line x1="435" y1="234" x2="435" y2="326" stroke="#CBD5E1" strokeWidth="1.4" strokeDasharray="14 3" />
    <line x1="545" y1="238" x2="545" y2="324" stroke="#CBD5E1" strokeWidth="1.4" strokeDasharray="14 3" />

    {/* Dynamic Cyan Aero Stripes */}
    <path d="M 235,294 L 660,286" stroke="#00F2FE" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M 265,302 L 580,298" stroke="#0284C7" strokeWidth="1.6" strokeLinecap="round" />

    {/* PAÜ Crest Logo Badge */}
    <g transform="translate(360, 256)">
      <circle cx="16" cy="16" r="14.5" fill="#031B34" stroke="#00F2FE" strokeWidth="1.6" />
      <circle cx="16" cy="16" r="10.5" fill="none" stroke="#00F2FE" strokeWidth="0.8" strokeDasharray="2.5 1.5" />
      <text x="16" y="21" fill="#FFFFFF" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="0.5">
        PAÜ
      </text>
    </g>

    {/* PAMUKKALE ÜNİVERSİTESİ Typography */}
    <g transform="translate(402, 264)">
      <text x="0" y="11" fill="#0F172A" fontSize="11" fontWeight="900" letterSpacing="1.2">
        PAMUKKALE ÜNİVERSİTESİ
      </text>
      <text x="0" y="22" fill="#0284C7" fontSize="7.5" fontWeight="800" letterSpacing="1.6">
        SİVİL GÖZLEM VE ERKEN UYARI İHA
      </text>
    </g>

    {/* Nose Pitot Tube Sensor */}
    <line x1="168" y1="296" x2="194" y2="296" stroke="#64748B" strokeWidth="2.8" strokeLinecap="round" />
    <line x1="168" y1="294" x2="175" y2="294" stroke="#00F2FE" strokeWidth="1.6" />
  </g>
);

/**
 * ============================================================================
 * 2. PART 1: KANAT (WING ASSEMBLY)
 * High-aspect continuous dual aerofoil wing with winglets & flaps
 * ============================================================================
 */
export const DroneWingGeometry: React.FC<{
  section?: 'all' | 'left' | 'right';
  isMold?: boolean;
  isTargeted?: boolean;
  isMagneticNear?: boolean;
  style?: React.CSSProperties;
}> = ({ section = 'all', isMold = false, isTargeted = false, isMagneticNear = false, style }) => {
  const strokeColor = isMagneticNear ? '#14E6B4' : isTargeted ? '#00F2FE' : 'rgba(0, 230, 245, 0.9)';
  const fillColor = isMagneticNear
    ? 'rgba(20, 230, 180, 0.22)'
    : isTargeted
    ? 'rgba(0, 242, 254, 0.18)'
    : 'rgba(0, 220, 235, 0.12)';
  const filter = isMagneticNear ? 'url(#moldGlowGreen)' : isTargeted ? 'url(#moldGlowCyan)' : undefined;

  // Render Left Wing
  const renderLeftWing = (mold: boolean) => (
    <g id="drone-wing-left">
      {/* Left Winglet */}
      <polygon
        points="56,268 40,240 58,238 72,264"
        fill={mold ? fillColor : 'url(#cyanAeroGrad)'}
        stroke={mold ? strokeColor : '#00C4D6'}
        strokeWidth={mold ? 2 : 1.2}
        filter={mold ? filter : undefined}
      />
      {/* Left Wing Upper Surface */}
      <path
        d="M 465,236 L 72,264 Q 50,266 46,276 L 58,302 Q 68,310 86,308 L 455,262 Z"
        fill={mold ? fillColor : 'url(#wingUpperSkin)'}
        stroke={mold ? strokeColor : '#94A3B8'}
        strokeWidth={mold ? 2 : 1.8}
        strokeLinejoin="round"
        filter={mold ? filter : undefined}
      />
      {!mold && (
        <>
          {/* Leading Edge Highlight */}
          <path d="M 465,236 L 72,264 L 70,270 L 463,241 Z" fill="#FFFFFF" opacity={0.85} />
          {/* Flap & Aileron Panel Seams */}
          <line x1="120" y1="302" x2="425" y2="264" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="26 3.5" />
          <line x1="255" y1="282" x2="257" y2="298" stroke="#94A3B8" strokeWidth={1.2} />
          <line x1="365" y1="270" x2="367" y2="286" stroke="#94A3B8" strokeWidth={1.2} />
          {/* Turquoise Aero Decal */}
          <line x1="160" y1="284" x2="240" y2="274" stroke="#00F2FE" strokeWidth={3.5} strokeLinecap="round" />
          {/* Central Mount Bracket */}
          <rect x="466" y="231" width="46" height="26" rx="4" fill="url(#carbonMaterial)" stroke="#475569" strokeWidth={1.2} />
          <circle cx="480" cy="244" r="3.5" fill="#00F2FE" />
          <circle cx="498" cy="244" r="3.5" fill="#00F2FE" />
        </>
      )}
    </g>
  );

  // Render Right Wing (Background)
  const renderRightWing = (mold: boolean) => (
    <g id="drone-wing-right">
      {/* Right Winglet */}
      <polygon
        points="908,198 928,148 944,150 922,186"
        fill={mold ? fillColor : 'url(#cyanAeroGrad)'}
        stroke={mold ? strokeColor : '#00C4D6'}
        strokeWidth={mold ? 2 : 1.2}
        filter={mold ? filter : undefined}
      />
      {/* Right Wing Upper Surface */}
      <path
        d="M 505,236 L 902,202 Q 922,200 926,190 L 916,166 Q 906,160 886,162 L 505,236 Z"
        fill={mold ? fillColor : 'url(#wingUpperSkin)'}
        stroke={mold ? strokeColor : '#94A3B8'}
        strokeWidth={mold ? 2 : 1.5}
        strokeLinejoin="round"
        filter={mold ? filter : undefined}
      />
      {!mold && (
        <>
          {/* Flap & Aileron Panel Seams */}
          <line x1="550" y1="239" x2="852" y2="178" stroke="#94A3B8" strokeWidth={1.4} strokeDasharray="24 3" />
          {/* Turquoise Aero Decal */}
          <line x1="710" y1="208" x2="790" y2="196" stroke="#00F2FE" strokeWidth={3} strokeLinecap="round" />
        </>
      )}
    </g>
  );

  return (
    <g id={`drone-wing-${section}-${isMold ? 'mold' : 'solid'}`} style={style}>
      {(section === 'all' || section === 'right') && renderRightWing(isMold)}
      {(section === 'all' || section === 'left') && renderLeftWing(isMold)}
    </g>
  );
};

/**
 * ============================================================================
 * 3. PART 2: MOTOR (PROPULSION ASSEMBLY)
 * Streamlined turboprop nacelle + pylon + pusher propeller
 * ============================================================================
 */
export const DroneMotorGeometry: React.FC<{
  isMold?: boolean;
  isTargeted?: boolean;
  isMagneticNear?: boolean;
  isSpinning?: boolean;
  style?: React.CSSProperties;
}> = ({ isMold = false, isTargeted = false, isMagneticNear = false, isSpinning = false, style }) => {
  if (isMold) {
    const strokeColor = isMagneticNear ? '#14E6B4' : isTargeted ? '#00F2FE' : 'rgba(0, 230, 245, 0.9)';
    const fillColor = isMagneticNear
      ? 'rgba(20, 230, 180, 0.22)'
      : isTargeted
      ? 'rgba(0, 242, 254, 0.18)'
      : 'rgba(0, 220, 235, 0.12)';
    const filter = isMagneticNear ? 'url(#moldGlowGreen)' : isTargeted ? 'url(#moldGlowCyan)' : undefined;

    return (
      <g id="drone-motor-mold" style={style}>
        {/* Pylon Mount Silhouette */}
        <polygon points="488,226 502,246 542,246 556,226" fill={fillColor} stroke={strokeColor} strokeWidth={2} filter={filter} />
        {/* Nacelle Pod Silhouette */}
        <path
          d="M 454,222 Q 450,192 478,172 L 564,172 Q 588,190 592,204 L 566,222 Z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinejoin="round"
          filter={filter}
        />
        {/* Upper Propeller Blade Silhouette */}
        <path
          d="M 580,194 Q 594,136 602,98 Q 610,102 608,114 Q 598,150 582,200 Z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
          filter={filter}
        />
        {/* Lower Propeller Blade Silhouette */}
        <path
          d="M 580,208 Q 594,256 602,286 Q 610,282 608,270 Q 598,238 582,202 Z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
          filter={filter}
        />
      </g>
    );
  }

  // Real Solid Motor Assembly
  return (
    <g id="drone-motor-solid" style={style}>
      {/* Lower Mounting Pylon Bracket */}
      <polygon points="488,226 502,246 542,246 556,226" fill="url(#fuselageLowerGrad)" stroke="#475569" strokeWidth={1.2} />

      {/* Streamlined Engine Nacelle Body */}
      <path
        d="M 454,222 Q 450,192 478,172 L 564,172 Q 588,190 592,204 L 566,222 Z"
        fill="url(#fuselageUpperGrad)"
        stroke="#94A3B8"
        strokeWidth={1.6}
      />

      {/* Front NACA Air Intake Cowling */}
      <ellipse cx="464" cy="196" rx="12" ry="22" fill="url(#carbonMaterial)" stroke="#00F2FE" strokeWidth={1.6} />
      <ellipse cx="462" cy="196" rx="5" ry="12" fill="#020617" />

      {/* Nacelle Cyan Racing Stripe */}
      <path d="M 482,174 L 506,174 L 502,220 L 478,220 Z" fill="rgba(0, 242, 254, 0.4)" stroke="#00F2FE" strokeWidth={1} />

      {/* Rear Spinner Cone Hub */}
      <polygon points="566,186 592,200 566,214" fill="url(#carbonMaterial)" stroke="#00F2FE" strokeWidth={1.2} />

      {/* Propeller Rendering: High-Speed Motion-Blur Disc during flight, or stationary blades on ground */}
      {isSpinning ? (
        <g id="propeller-spinning-disc">
          {/* Subtle Pusher Prop Exhaust Wake */}
          <path
            d="M 590,195 L 635,188 L 635,212 L 590,205 Z"
            fill="rgba(0, 242, 254, 0.25)"
            filter="blur(4px)"
          />
          {/* High Velocity Outer Propeller Blur Disc */}
          <ellipse
            cx="582"
            cy="200"
            rx="7"
            ry="96"
            fill="rgba(30, 41, 59, 0.4)"
            stroke="rgba(0, 242, 254, 0.65)"
            strokeWidth="1.5"
          />
          {/* High-Visibility Golden Tip Streak Blur Rings */}
          <ellipse
            cx="582"
            cy="200"
            rx="5"
            ry="92"
            fill="rgba(245, 158, 11, 0.18)"
            stroke="rgba(245, 158, 11, 0.7)"
            strokeWidth="1.2"
            strokeDasharray="14 10"
          />
          {/* Inner Fast Rotation Blade Core */}
          <ellipse
            cx="582"
            cy="200"
            rx="3"
            ry="72"
            fill="rgba(255, 255, 255, 0.3)"
            filter="blur(1.5px)"
          />
        </g>
      ) : (
        <>
          {/* Carbon Propeller Blade 1 (Upper) */}
          <path
            d="M 580,194 Q 594,136 602,98 Q 610,102 608,114 Q 598,150 582,200 Z"
            fill="url(#bladeBevelGrad)"
            stroke="#475569"
            strokeWidth={1.2}
          />
          {/* Blade 1 High-Visibility Gold Safety Tip */}
          <path d="M 598,118 L 602,98 Q 610,102 608,114 L 602,128 Z" fill="#F59E0B" />

          {/* Carbon Propeller Blade 2 (Lower) */}
          <path
            d="M 580,208 Q 594,256 602,286 Q 610,282 608,270 Q 598,238 582,202 Z"
            fill="url(#bladeBevelGrad)"
            stroke="#475569"
            strokeWidth={1.2}
          />
          {/* Blade 2 High-Visibility Gold Safety Tip */}
          <path d="M 598,264 L 602,286 Q 610,282 608,270 L 602,254 Z" fill="#F59E0B" />
        </>
      )}

      {/* Central Hub Hex Bolt */}
      <circle cx="582" cy="200" r="4.5" fill="#E2E8F0" stroke="#00F2FE" strokeWidth={1.2} />
    </g>
  );
};

/**
 * ============================================================================
 * 4. PART 3: KUYRUK (TAIL ASSEMBLY)
 * Twin canted V-tail stabilizers with horizontal elevator bridge
 * ============================================================================
 */
export const DroneTailGeometry: React.FC<{
  isMold?: boolean;
  isTargeted?: boolean;
  isMagneticNear?: boolean;
  style?: React.CSSProperties;
}> = ({ isMold = false, isTargeted = false, isMagneticNear = false, style }) => {
  if (isMold) {
    const strokeColor = isMagneticNear ? '#14E6B4' : isTargeted ? '#00F2FE' : 'rgba(0, 230, 245, 0.9)';
    const fillColor = isMagneticNear
      ? 'rgba(20, 230, 180, 0.22)'
      : isTargeted
      ? 'rgba(0, 242, 254, 0.18)'
      : 'rgba(0, 220, 235, 0.12)';
    const filter = isMagneticNear ? 'url(#moldGlowGreen)' : isTargeted ? 'url(#moldGlowCyan)' : undefined;

    return (
      <g id="drone-tail-mold" style={style}>
        {/* Tail Assembly Silhouette */}
        <polygon points="680,256 746,256 732,274 695,274" fill={fillColor} stroke={strokeColor} strokeWidth={2} filter={filter} />
        <rect x="664" y="246" width="96" height="12" rx="3" fill={fillColor} stroke={strokeColor} strokeWidth={2} filter={filter} />
        {/* Left Fin Silhouette */}
        <path d="M 688,254 L 608,148 Q 600,138 612,134 L 648,138 L 716,246 Z" fill={fillColor} stroke={strokeColor} strokeWidth={2} filter={filter} />
        {/* Right Fin Silhouette */}
        <path d="M 716,246 L 838,130 Q 850,126 856,136 L 826,248 L 738,254 Z" fill={fillColor} stroke={strokeColor} strokeWidth={2} filter={filter} />
      </g>
    );
  }

  // Real Solid Tail Assembly
  return (
    <g id="drone-tail-solid" style={style}>
      {/* Central Tail Boom Mount Base */}
      <polygon points="680,256 746,256 732,274 695,274" fill="url(#fuselageLowerGrad)" stroke="#475569" strokeWidth={1.2} />
      {/* Horizontal Elevator Bridge */}
      <rect x="664" y="246" width="96" height="12" rx="3" fill="#CBD5E1" stroke="#94A3B8" strokeWidth={1.2} />

      {/* Left Canted Vertical Fin */}
      <path
        d="M 688,254 L 608,148 Q 600,138 612,134 L 648,138 L 716,246 Z"
        fill="url(#fuselageUpperGrad)"
        stroke="#94A3B8"
        strokeWidth={1.6}
      />
      {/* Left Tip Turquoise Aero Cap */}
      <polygon points="608,148 602,140 622,136 620,146" fill="url(#cyanAeroGrad)" stroke="#00C4D6" strokeWidth={1} />
      {/* Left Rudder Seam Line */}
      <line x1="628" y1="152" x2="704" y2="244" stroke="#94A3B8" strokeWidth={1.2} strokeDasharray="16 3" />

      {/* Right Canted Vertical Fin */}
      <path
        d="M 716,246 L 838,130 Q 850,126 856,136 L 826,248 L 738,254 Z"
        fill="url(#fuselageUpperGrad)"
        stroke="#94A3B8"
        strokeWidth={1.6}
      />
      {/* Right Tip Turquoise Aero Cap */}
      <polygon points="838,130 852,126 858,138 844,144" fill="url(#cyanAeroGrad)" stroke="#00C4D6" strokeWidth={1} />
      {/* Right Rudder Seam Line */}
      <line x1="832" y1="148" x2="786" y2="246" stroke="#64748B" strokeWidth={1.2} strokeDasharray="16 3" />

      {/* Turquoise Speed Decal Stripe */}
      <path d="M 710,246 L 790,164" stroke="#00F2FE" strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

/**
 * ============================================================================
 * 5. PART 4: İNİŞ TAKIMI (LANDING GEAR ASSEMBLY)
 * Tricycle landing gear: Steerable nose strut + left & right main shock struts
 * Touches ground plane exactly at y = 425
 * ============================================================================
 */
export const DroneLandingGearGeometry: React.FC<{
  isMold?: boolean;
  isTargeted?: boolean;
  isMagneticNear?: boolean;
  style?: React.CSSProperties;
}> = ({ isMold = false, isTargeted = false, isMagneticNear = false, style }) => {
  if (isMold) {
    const strokeColor = isMagneticNear ? '#14E6B4' : isTargeted ? '#00F2FE' : 'rgba(0, 230, 245, 0.9)';
    const fillColor = isMagneticNear
      ? 'rgba(20, 230, 180, 0.22)'
      : isTargeted
      ? 'rgba(0, 242, 254, 0.18)'
      : 'rgba(0, 220, 235, 0.12)';
    const filter = isMagneticNear ? 'drop-shadow(0 0 6px #14E6B4)' : isTargeted ? 'drop-shadow(0 0 5px #00F2FE)' : undefined;

    return (
      <g id="drone-gear-mold" style={{ ...style, filter }}>
        {/* Fuselage Belly Attachment Sockets */}
        <rect x="264" y="326" width="22" height="8" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth={2} />
        <rect x="428" y="324" width="24" height="8" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth={2} />
        <rect x="574" y="324" width="24" height="8" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth={2} />

        {/* Nose Gear Strut & Wheel Silhouette */}
        <rect x="272" y="330" width="6" height="78" rx="3" fill={strokeColor} stroke="none" />
        <ellipse cx="275" cy="410" rx="14" ry="17" fill={fillColor} stroke={strokeColor} strokeWidth={2} />

        {/* Left Main Gear Strut & Wheel Silhouette */}
        <path d="M 440,328 Q 454,370 468,394 L 468,406" fill="none" stroke={strokeColor} strokeWidth={5} strokeLinecap="round" />
        <ellipse cx="468" cy="410" rx="15" ry="18" fill={fillColor} stroke={strokeColor} strokeWidth={2} />

        {/* Right Main Gear Strut & Wheel Silhouette */}
        <path d="M 585,328 Q 604,366 618,392 L 618,404" fill="none" stroke={strokeColor} strokeWidth={5} strokeLinecap="round" />
        <ellipse cx="618" cy="408" rx="15" ry="18" fill={fillColor} stroke={strokeColor} strokeWidth={2} />
      </g>
    );
  }

  // Real Solid Landing Gear Assembly
  return (
    <g id="drone-gear-solid" style={style}>
      {/* Fuselage Belly Structural Mounting Sockets */}
      <rect x="264" y="326" width="22" height="8" rx="2" fill="#334155" stroke="#475569" strokeWidth={1} />
      <rect x="428" y="324" width="24" height="8" rx="2" fill="#334155" stroke="#475569" strokeWidth={1} />
      <rect x="574" y="324" width="24" height="8" rx="2" fill="#334155" stroke="#475569" strokeWidth={1} />

      {/* 1. NOSE GEAR: Steerable Oleo Strut (Titanium & Chrome) with 3D rect geometry for universal cross-platform rendering */}
      <rect x="271.5" y="330" width="7" height="54" rx="3.5" fill="#64748B" style={{ fill: 'url(#strutTitaniumGrad) #64748B' }} stroke="#475569" strokeWidth={0.8} />
      <rect x="272.75" y="380" width="4.5" height="28" rx="2" fill="#CBD5E1" style={{ fill: 'url(#pistonChromeGrad) #CBD5E1' }} stroke="#94A3B8" strokeWidth={0.6} />
      {/* Scissor Torque Link */}
      <polyline points="275,370 266,380 275,390" fill="none" stroke="#475569" strokeWidth={2} />
      {/* Nose Wheel Tire (Ground: y=425) */}
      <ellipse cx="275" cy="410" rx="14" ry="17" fill="#0F172A" style={{ fill: 'url(#tireTreadGrad) #0F172A' }} stroke="#334155" strokeWidth={1.8} />
      <circle cx="275" cy="410" r="7" fill="#CBD5E1" style={{ fill: 'url(#alloyRimGrad) #CBD5E1' }} stroke="#00F2FE" strokeWidth={1.2} />
      <circle cx="275" cy="410" r="2.8" fill="#0F172A" />

      {/* 2. LEFT MAIN GEAR: Cantilever Trailing-Arm Shock Strut */}
      <path
        d="M 440,328 Q 454,370 468,394 L 468,406"
        fill="none"
        stroke="#64748B"
        style={{ stroke: 'url(#strutTitaniumGrad) #64748B' }}
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="440" cy="328" r="4.5" fill="#334155" />
      {/* Left Wheel (Ground: y=425) */}
      <ellipse cx="468" cy="410" rx="15" ry="18" fill="#0F172A" style={{ fill: 'url(#tireTreadGrad) #0F172A' }} stroke="#334155" strokeWidth={1.8} />
      <circle cx="468" cy="410" r="7.5" fill="#CBD5E1" style={{ fill: 'url(#alloyRimGrad) #CBD5E1' }} stroke="#00F2FE" strokeWidth={1.2} />
      <circle cx="468" cy="410" r="2.8" fill="#0F172A" />

      {/* 3. RIGHT MAIN GEAR: Cantilever Trailing-Arm Shock Strut */}
      <path
        d="M 585,328 Q 604,366 618,392 L 618,404"
        fill="none"
        stroke="#64748B"
        style={{ stroke: 'url(#strutTitaniumGrad) #64748B' }}
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="585" cy="328" r="4.5" fill="#334155" />
      {/* Right Wheel (Ground: y=423) */}
      <ellipse cx="618" cy="408" rx="15" ry="18" fill="#0F172A" style={{ fill: 'url(#tireTreadGrad) #0F172A' }} stroke="#334155" strokeWidth={1.8} />
      <circle cx="618" cy="408" r="7.5" fill="#CBD5E1" style={{ fill: 'url(#alloyRimGrad) #CBD5E1' }} stroke="#00F2FE" strokeWidth={1.2} />
      <circle cx="618" cy="408" r="2.8" fill="#0F172A" />
    </g>
  );
};

/**
 * ============================================================================
 * 6. CARD VISUAL COMPONENT (For Bottom Cards and Drag Avatar)
 * Renders the real solid part cropped to its natural bounding box for cards
 * 100% opacity, pure contrast, no filters/masks/blend-modes
 * ============================================================================
 */
export const DronePartCardVisual: React.FC<{
  partKey: DronePartKey;
  isPlaced?: boolean;
  className?: string;
  style?: React.CSSProperties;
}> = ({ partKey, isPlaced = false, className = '', style = {} }) => {
  const meta = DRONE_PARTS_META[partKey];
  const opacity = isPlaced ? 0.92 : 1.0;

  return (
    <svg
      viewBox={meta.cardViewBox}
      className={`part-real-image ${className}`}
      style={{
        width: '82%',
        height: '68%',
        maxHeight: '100%',
        objectFit: 'contain',
        opacity,
        filter: 'none',
        mixBlendMode: 'normal',
        transition: 'all 0.2s ease',
        ...style,
      }}
    >
      {partKey === 'kanat' && <DroneWingGeometry section="all" />}
      {partKey === 'motor' && <DroneMotorGeometry />}
      {partKey === 'kuyruk' && <DroneTailGeometry />}
      {partKey === 'inis_takimi' && <DroneLandingGearGeometry />}
    </svg>
  );
};

/**
 * ============================================================================
 * 7. COMPLETE ASSEMBLED CIVILIAN UAV (100% Shared Across Stages 1, 2, 3)
 * Exact geometry, materials, Pamukkale Üniversitesi identity
 * Supports spinning propeller for flight animation mode
 * ============================================================================
 */
export const CompletedDroneSvg: React.FC<{
  isSpinning?: boolean;
  className?: string;
  style?: React.CSSProperties;
}> = ({ isSpinning = false, className = '', style }) => (
  <svg
    viewBox="0 0 1000 500"
    className={`completed-uav-svg ${className}`}
    style={{
      width: '100%',
      height: '100%',
      overflow: 'visible',
      filter: 'drop-shadow(0 16px 36px rgba(0, 0, 0, 0.85))',
      ...style,
    }}
  >
    <DroneSvgDefs />
    <DroneWingGeometry section="right" />
    <DroneTailGeometry />
    <DroneFuselageGeometry />
    <DroneLandingGearGeometry />
    <DroneWingGeometry section="left" />
    <DroneMotorGeometry isSpinning={isSpinning} />
  </svg>
);

