import React from 'react';

interface PartVisualProps {
  partId: 'kanat' | 'motor' | 'kuyruk' | 'inis_takimi';
  isPlaced?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface GhostMoldProps {
  partId: 'kanat' | 'motor' | 'kuyruk' | 'inis_takimi';
  isTargeted?: boolean;
  isMagneticNear?: boolean;
  isOtherDragging?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * =========================================================================
 * 1. REAL PART VISUALS (For Bottom Cards and Drag Avatar)
 * - 100% opacity (no dark filters, no blend modes, no masks)
 * - High-contrast white/light gray aircraft composite skin
 * - Turquoise (#00F2FE) aerodynamic tips and milli decals
 * - Carbon fiber / dark rubber tires with turquoise hub details
 * - Natural aspect ratio: contain, centered, responsive
 * =========================================================================
 */
export const IhaCardPartVisual: React.FC<PartVisualProps> = ({
  partId,
  isPlaced = false,
  className = '',
  style = {},
}) => {
  const baseOpacity = isPlaced ? 0.92 : 1.0;

  // -----------------------------------------------------------------------
  // 1. KANAT (Dual High-Aspect Aerodynamic Wing with Winglets)
  // -----------------------------------------------------------------------
  if (partId === 'kanat') {
    return (
      <svg
        viewBox="0 0 340 100"
        className={`part-real-image ${className}`}
        style={{
          width: '84%',
          height: '68%',
          maxHeight: '100%',
          objectFit: 'contain',
          opacity: baseOpacity,
          filter: 'drop-shadow(0 6px 14px rgba(0, 0, 0, 0.55))',
          mixBlendMode: 'normal',
          transition: 'all 0.2s ease',
          ...style,
        }}
      >
        <defs>
          <linearGradient id="wingSkinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#F8FAFC" />
            <stop offset="70%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id="wingHighlightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="cyanTipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F2FE" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="centerSparGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="50%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
        </defs>

        {/* Central Structural Mounting Spar */}
        <rect x="156" y="38" width="28" height="34" rx="4" fill="url(#centerSparGrad)" stroke="#475569" strokeWidth="1" />
        <circle cx="170" cy="46" r="3" fill="#00F2FE" />
        <circle cx="170" cy="62" r="3" fill="#00F2FE" />

        {/* Left Wing Main Aerofoil */}
        <path
          d="M 160,42 L 28,26 Q 18,24 16,34 L 24,68 Q 28,74 40,72 L 160,62 Z"
          fill="url(#wingSkinGrad)"
          stroke="#94A3B8"
          strokeWidth="1.2"
        />
        {/* Left Wing Leading Edge Highlight */}
        <path d="M 160,42 L 28,26 L 27,30 L 160,45 Z" fill="url(#wingHighlightGrad)" />
        {/* Left Wing Aileron / Flap Seam */}
        <line x1="45" y1="69" x2="145" y2="61" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="24 3" />
        {/* Left Wing Aero Stripe */}
        <line x1="80" y1="46" x2="135" y2="49" stroke="#00F2FE" strokeWidth="2.5" strokeLinecap="round" />
        {/* Left Winglet (Angled upward aerodynamic tip) */}
        <path
          d="M 28,26 L 12,12 Q 8,14 10,24 L 20,46 L 28,26 Z"
          fill="url(#cyanTipGrad)"
          stroke="#00C4D6"
          strokeWidth="1.2"
        />

        {/* Right Wing Main Aerofoil */}
        <path
          d="M 180,42 L 312,26 Q 322,24 324,34 L 316,68 Q 312,74 300,72 L 180,62 Z"
          fill="url(#wingSkinGrad)"
          stroke="#94A3B8"
          strokeWidth="1.2"
        />
        {/* Right Wing Leading Edge Highlight */}
        <path d="M 180,42 L 312,26 L 313,30 L 180,45 Z" fill="url(#wingHighlightGrad)" />
        {/* Right Wing Aileron / Flap Seam */}
        <line x1="295" y1="69" x2="195" y2="61" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="24 3" />
        {/* Right Wing Aero Stripe */}
        <line x1="260" y1="46" x2="205" y2="49" stroke="#00F2FE" strokeWidth="2.5" strokeLinecap="round" />
        {/* Right Winglet (Angled upward aerodynamic tip) */}
        <path
          d="M 312,26 L 328,12 Q 332,14 330,24 L 320,46 L 312,26 Z"
          fill="url(#cyanTipGrad)"
          stroke="#00C4D6"
          strokeWidth="1.2"
        />
      </svg>
    );
  }

  // -----------------------------------------------------------------------
  // 2. MOTOR (High-Efficiency Turboprop Engine Nacelle & Pusher Propeller)
  // -----------------------------------------------------------------------
  if (partId === 'motor') {
    return (
      <svg
        viewBox="0 0 240 120"
        className={`part-real-image ${className}`}
        style={{
          width: '74%',
          height: '68%',
          maxHeight: '100%',
          objectFit: 'contain',
          opacity: baseOpacity,
          filter: 'drop-shadow(0 6px 14px rgba(0, 0, 0, 0.55))',
          mixBlendMode: 'normal',
          transition: 'all 0.2s ease',
          ...style,
        }}
      >
        <defs>
          <linearGradient id="podBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#F8FAFC" />
            <stop offset="75%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id="podIntakeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0B132B" />
            <stop offset="50%" stopColor="#1C2541" />
            <stop offset="100%" stopColor="#3A506B" />
          </linearGradient>
          <linearGradient id="propBladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="50%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="pylonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
        </defs>

        {/* Lower Mounting Pylon Bracket */}
        <polygon points="65,72 88,106 128,106 138,72" fill="url(#pylonGrad)" stroke="#475569" strokeWidth="1.2" />

        {/* Main Aerodynamic Engine Nacelle */}
        <rect x="42" y="32" width="108" height="48" rx="14" fill="url(#podBodyGrad)" stroke="#94A3B8" strokeWidth="1.2" />

        {/* Front Air Intake Cowling */}
        <ellipse cx="44" cy="56" rx="14" ry="22" fill="url(#podIntakeGrad)" stroke="#00F2FE" strokeWidth="1.5" />
        <ellipse cx="43" cy="56" rx="6" ry="11" fill="#030712" />

        {/* Longitudinal Cyan Aero Stripe */}
        <path d="M 68,33 L 94,33 L 90,79 L 64,79 Z" fill="rgba(0, 242, 254, 0.35)" stroke="#00F2FE" strokeWidth="1" />

        {/* Rear Propeller Spinner Cone Hub */}
        <polygon points="149,46 176,56 149,66" fill="#334155" stroke="#00F2FE" strokeWidth="1.2" />

        {/* Carbon Fiber Propeller Blade 1 (Upper) */}
        <path
          d="M 162,52 Q 186,22 210,8 Q 218,10 216,16 Q 196,38 168,56 Z"
          fill="url(#propBladeGrad)"
          stroke="#475569"
          strokeWidth="1"
        />
        {/* Blade 1 High-Visibility Gold Warning Tip */}
        <path d="M 198,16 L 210,8 Q 218,10 216,16 L 204,23 Z" fill="#F59E0B" />

        {/* Carbon Fiber Propeller Blade 2 (Lower) */}
        <path
          d="M 162,60 Q 186,88 210,104 Q 218,102 216,96 Q 196,74 168,56 Z"
          fill="url(#propBladeGrad)"
          stroke="#475569"
          strokeWidth="1"
        />
        {/* Blade 2 High-Visibility Gold Warning Tip */}
        <path d="M 198,96 L 210,104 Q 218,102 216,96 L 204,89 Z" fill="#F59E0B" />

        {/* Center Hub Fastener */}
        <circle cx="164" cy="56" r="4.5" fill="#E2E8F0" stroke="#00F2FE" strokeWidth="1" />
      </svg>
    );
  }

  // -----------------------------------------------------------------------
  // 3. KUYRUK (Dual Canted V-Tail Stabilizer Assembly)
  // -----------------------------------------------------------------------
  if (partId === 'kuyruk') {
    return (
      <svg
        viewBox="0 0 280 120"
        className={`part-real-image ${className}`}
        style={{
          width: '80%',
          height: '68%',
          maxHeight: '100%',
          objectFit: 'contain',
          opacity: baseOpacity,
          filter: 'drop-shadow(0 6px 14px rgba(0, 0, 0, 0.55))',
          mixBlendMode: 'normal',
          transition: 'all 0.2s ease',
          ...style,
        }}
      >
        <defs>
          <linearGradient id="tailFinGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id="tailFinGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
          <linearGradient id="tailTipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F2FE" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="tailBoomGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
        </defs>

        {/* Central Tail Boom Mount Bracket */}
        <polygon points="116,92 164,92 154,112 126,112" fill="url(#tailBoomGrad)" stroke="#475569" strokeWidth="1.2" />
        {/* Horizontal Stabilizer Bridge */}
        <rect x="76" y="86" width="128" height="12" rx="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />

        {/* Left Canted Vertical Fin */}
        <path
          d="M 125,92 L 44,32 Q 38,26 46,22 L 86,24 L 140,86 Z"
          fill="url(#tailFinGrad1)"
          stroke="#94A3B8"
          strokeWidth="1.2"
        />
        {/* Left Tip Aero Cap */}
        <polygon points="44,32 38,24 60,23 56,34" fill="url(#tailTipGrad)" stroke="#00C4D6" strokeWidth="1" />
        {/* Left Rudder Control Line */}
        <line x1="68" y1="40" x2="132" y2="86" stroke="#94A3B8" strokeWidth="1" strokeDasharray="16 2" />

        {/* Right Canted Vertical Fin */}
        <path
          d="M 140,92 L 226,16 Q 236,12 242,22 L 210,90 L 155,92 Z"
          fill="url(#tailFinGrad2)"
          stroke="#94A3B8"
          strokeWidth="1.2"
        />
        {/* Right Tip Aero Cap */}
        <polygon points="226,16 240,13 245,26 230,32" fill="url(#tailTipGrad)" stroke="#00C4D6" strokeWidth="1" />
        {/* Right Rudder Control Line */}
        <line x1="220" y1="34" x2="178" y2="86" stroke="#64748B" strokeWidth="1.2" strokeDasharray="18 2" />

        {/* Turquoise Milli Speed Decal */}
        <path d="M 132,86 L 196,32" stroke="#00F2FE" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  // -----------------------------------------------------------------------
  // 4. İNİŞ TAKIMI (Heavy-Duty Tricycle Landing Gear Assembly)
  // -----------------------------------------------------------------------
  return (
    <svg
      viewBox="0 0 280 120"
      className={`part-real-image ${className}`}
      style={{
        width: '80%',
        height: '68%',
        maxHeight: '100%',
        objectFit: 'contain',
        opacity: baseOpacity,
        filter: 'drop-shadow(0 6px 14px rgba(0, 0, 0, 0.55))',
        mixBlendMode: 'normal',
        transition: 'all 0.2s ease',
        ...style,
      }}
    >
      <defs>
        <linearGradient id="strutGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#F1F5F9" />
          <stop offset="80%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
        <linearGradient id="tireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="40%" stopColor="#1E293B" />
          <stop offset="85%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <radialGradient id="hubGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#E2E8F0" />
          <stop offset="85%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </radialGradient>
      </defs>

      {/* Main Structural Attachment Crossbar Frame */}
      <rect x="42" y="16" width="196" height="14" rx="4" fill="url(#strutGrad)" stroke="#94A3B8" strokeWidth="1.2" />
      <circle cx="58" cy="23" r="3.5" fill="#00F2FE" />
      <circle cx="222" cy="23" r="3.5" fill="#00F2FE" />

      {/* 1. Nose Gear Leg (Steerable front oleo strut) */}
      <line x1="72" y1="28" x2="72" y2="70" stroke="url(#strutGrad)" strokeWidth="6" strokeLinecap="round" />
      <line x1="72" y1="60" x2="72" y2="82" stroke="#E2E8F0" strokeWidth="4" />
      {/* Front Nose Wheel Tire */}
      <ellipse cx="72" cy="94" rx="14" ry="18" fill="url(#tireGrad)" stroke="#475569" strokeWidth="1.5" />
      <circle cx="72" cy="94" r="7" fill="url(#hubGrad)" stroke="#00F2FE" strokeWidth="1.2" />
      <circle cx="72" cy="94" r="2.5" fill="#0F172A" />

      {/* 2. Left Main Gear Leg (Trailing-link arm) */}
      <path d="M 125,28 L 152,76 L 152,88" fill="none" stroke="url(#strutGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="125" cy="28" r="4" fill="#64748B" />
      {/* Left Main Wheel Tire */}
      <ellipse cx="152" cy="95" rx="15" ry="19" fill="url(#tireGrad)" stroke="#475569" strokeWidth="1.5" />
      <circle cx="152" cy="95" r="7.5" fill="url(#hubGrad)" stroke="#00F2FE" strokeWidth="1.2" />
      <circle cx="152" cy="95" r="2.5" fill="#0F172A" />

      {/* 3. Right Main Gear Leg (Trailing-link arm) */}
      <path d="M 195,28 L 228,76 L 228,88" fill="none" stroke="url(#strutGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="195" cy="28" r="4" fill="#64748B" />
      {/* Right Main Wheel Tire */}
      <ellipse cx="228" cy="95" rx="15" ry="19" fill="url(#tireGrad)" stroke="#475569" strokeWidth="1.5" />
      <circle cx="228" cy="95" r="7.5" fill="url(#hubGrad)" stroke="#00F2FE" strokeWidth="1.2" />
      <circle cx="228" cy="95" r="2.5" fill="#0F172A" />

      {/* Ground Contact Accent Shadow Line */}
      <ellipse cx="72" cy="112" rx="16" ry="3.5" fill="rgba(0,0,0,0.4)" />
      <ellipse cx="152" cy="113" rx="18" ry="4" fill="rgba(0,0,0,0.4)" />
      <ellipse cx="228" cy="113" rx="18" ry="4" fill="rgba(0,0,0,0.4)" />
    </svg>
  );
};

/**
 * =========================================================================
 * 2. GHOST MOUNTING SILHOUETTES / KALIPLAR (For Center UAV Frame)
 * - Exact 1:1 matching geometric silhouettes
 * - 10-15% cyan transparent fill: rgba(0, 220, 235, 0.12)
 * - 2px clean cyan outline: rgba(0, 230, 245, 0.80)
 * - Subtle inner glow
 * - Soft green/cyan (#14E6B4) transition upon magnetic proximity
 * =========================================================================
 */
export const IhaGhostMoldVisual: React.FC<GhostMoldProps> = ({
  partId,
  isTargeted = false,
  isMagneticNear = false,
  isOtherDragging = false,
  className = '',
  style = {},
}) => {
  const strokeColor = isMagneticNear
    ? '#14E6B4'
    : isTargeted
    ? 'rgba(0, 242, 254, 0.95)'
    : 'rgba(0, 230, 245, 0.80)';

  const fillColor = isMagneticNear
    ? 'rgba(20, 230, 180, 0.22)'
    : isTargeted
    ? 'rgba(0, 242, 254, 0.18)'
    : 'rgba(0, 220, 235, 0.12)';

  const filterStyle = isMagneticNear
    ? 'drop-shadow(0 0 16px rgba(20, 230, 180, 0.95))'
    : isTargeted
    ? 'drop-shadow(0 0 14px rgba(0, 242, 254, 0.85))'
    : 'drop-shadow(0 0 8px rgba(0, 220, 235, 0.40))';

  const moldOpacity = isOtherDragging ? 0.22 : isTargeted ? 1.0 : 0.78;

  // -----------------------------------------------------------------------
  // 1. KANAT GHOST MOLD (Exact match to wing geometry)
  // -----------------------------------------------------------------------
  if (partId === 'kanat') {
    return (
      <svg
        viewBox="0 0 340 100"
        className={`part-target-ghost ${className}`}
        style={{
          width: '100%',
          height: '100%',
          opacity: moldOpacity,
          filter: filterStyle,
          transition: 'all 0.22s ease',
          ...style,
        }}
      >
        {/* Center Spar */}
        <rect x="156" y="38" width="28" height="34" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />

        {/* Left Wing Body */}
        <path
          d="M 160,42 L 28,26 Q 18,24 16,34 L 24,68 Q 28,74 40,72 L 160,62 Z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Left Winglet */}
        <path
          d="M 28,26 L 12,12 Q 8,14 10,24 L 20,46 L 28,26 Z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="2"
        />
        {/* Left Alignment Axis */}
        <line x1="45" y1="52" x2="155" y2="52" stroke={strokeColor} strokeWidth="1.2" strokeDasharray="8 4" opacity={0.7} />

        {/* Right Wing Body */}
        <path
          d="M 180,42 L 312,26 Q 322,24 324,34 L 316,68 Q 312,74 300,72 L 180,62 Z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Right Winglet */}
        <path
          d="M 312,26 L 328,12 Q 332,14 330,24 L 320,46 L 312,26 Z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="2"
        />
        {/* Right Alignment Axis */}
        <line x1="185" y1="52" x2="295" y2="52" stroke={strokeColor} strokeWidth="1.2" strokeDasharray="8 4" opacity={0.7} />
      </svg>
    );
  }

  // -----------------------------------------------------------------------
  // 2. MOTOR GHOST MOLD (Exact match to engine geometry)
  // -----------------------------------------------------------------------
  if (partId === 'motor') {
    return (
      <svg
        viewBox="0 0 240 120"
        className={`part-target-ghost ${className}`}
        style={{
          width: '100%',
          height: '100%',
          opacity: moldOpacity,
          filter: filterStyle,
          transition: 'all 0.22s ease',
          ...style,
        }}
      >
        {/* Mounting Pylon */}
        <polygon points="65,72 88,106 128,106 138,72" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
        {/* Nacelle Body */}
        <rect x="42" y="32" width="108" height="48" rx="14" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
        {/* Front Intake */}
        <ellipse cx="44" cy="56" rx="14" ry="22" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
        {/* Propeller Hub */}
        <polygon points="149,46 176,56 149,66" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
        {/* Blade 1 */}
        <path d="M 162,52 Q 186,22 210,8 Q 218,10 216,16 Q 196,38 168,56 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
        {/* Blade 2 */}
        <path d="M 162,60 Q 186,88 210,104 Q 218,102 216,96 Q 196,74 168,56 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
      </svg>
    );
  }

  // -----------------------------------------------------------------------
  // 3. KUYRUK GHOST MOLD (Exact match to V-tail geometry)
  // -----------------------------------------------------------------------
  if (partId === 'kuyruk') {
    return (
      <svg
        viewBox="0 0 280 120"
        className={`part-target-ghost ${className}`}
        style={{
          width: '100%',
          height: '100%',
          opacity: moldOpacity,
          filter: filterStyle,
          transition: 'all 0.22s ease',
          ...style,
        }}
      >
        {/* Boom Mount */}
        <polygon points="116,92 164,92 154,112 126,112" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
        {/* Bridge */}
        <rect x="76" y="86" width="128" height="12" rx="3" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
        {/* Left Fin */}
        <path d="M 125,92 L 44,32 Q 38,26 46,22 L 86,24 L 140,86 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
        {/* Right Fin */}
        <path d="M 140,92 L 226,16 Q 236,12 242,22 L 210,90 L 155,92 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
      </svg>
    );
  }

  // -----------------------------------------------------------------------
  // 4. İNİŞ TAKIMI GHOST MOLD (Exact match to landing gear geometry)
  // -----------------------------------------------------------------------
  return (
    <svg
      viewBox="0 0 280 120"
      className={`part-target-ghost ${className}`}
      style={{
        width: '100%',
        height: '100%',
        opacity: moldOpacity,
        filter: filterStyle,
        transition: 'all 0.22s ease',
        ...style,
      }}
    >
      {/* Top Crossbar */}
      <rect x="42" y="16" width="196" height="14" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
      {/* Nose Gear Leg & Wheel */}
      <line x1="72" y1="28" x2="72" y2="82" stroke={strokeColor} strokeWidth="3" />
      <ellipse cx="72" cy="94" rx="14" ry="18" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
      {/* Left Main Leg & Wheel */}
      <path d="M 125,28 L 152,76 L 152,88" fill="none" stroke={strokeColor} strokeWidth="3" />
      <ellipse cx="152" cy="95" rx="15" ry="19" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
      {/* Right Main Leg & Wheel */}
      <path d="M 195,28 L 228,76 L 228,88" fill="none" stroke={strokeColor} strokeWidth="3" />
      <ellipse cx="228" cy="95" rx="15" ry="19" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
    </svg>
  );
};
