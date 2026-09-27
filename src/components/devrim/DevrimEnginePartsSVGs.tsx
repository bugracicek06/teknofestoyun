import React from 'react';

export type DevrimPartId = 'motor_blogu' | 'radyator' | 'aku' | 'hava_filtresi';

export interface DevrimEnginePartSvgProps {
  id: DevrimPartId;
  isSlot?: boolean;
  glow?: boolean;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * High-precision, authentic 1960s mechanical engineering vector assets for Devrim Otomobili.
 * Both the draggable piece and the target slot use the EXACT SAME geometry, viewBox, and silhouette.
 */
export const DevrimEnginePartSvg: React.FC<DevrimEnginePartSvgProps> = ({
  id,
  isSlot = false,
  glow = false,
  width = '100%',
  height = '100%',
  style,
  className,
}) => {
  const strokeColor = glow ? '#38BDF8' : isSlot ? '#F59E0B' : '#0F172A';
  const filterStyle = glow
    ? 'drop-shadow(0 0 10px #38BDF8) drop-shadow(0 0 20px rgba(56, 189, 248, 0.75))'
    : isSlot
    ? 'drop-shadow(0 0 6px rgba(245, 164, 0, 0.5))'
    : 'none';

  switch (id) {
    // =========================================================================
    // 1. MOTOR BLOĞU (4 Silindirli Devrim Motor Bloğu) - viewBox: 0 0 170 270
    // =========================================================================
    case 'motor_blogu':
      return (
        <svg
          viewBox="0 0 170 270"
          width={width}
          height={height}
          style={{ ...style, filter: filterStyle }}
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="mbCastGrad" x1="0" y1="0" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="30%" stopColor="#334155" />
              <stop offset="70%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0B1120" />
            </linearGradient>
            <linearGradient id="mbBoreGrad" x1="0" y1="0" x2="0" y2="100%">
              <stop offset="0%" stopColor="#020617" />
              <stop offset="50%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="mbPulleyGrad" x1="0" y1="0" x2="100%" y2="0">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
            <linearGradient id="mbRimHoned" x1="0" y1="0" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="50%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>

          {isSlot ? (
            /* EXACT MATCHING SLOT OUTLINE & SILHOUETTE */
            <g>
              {/* Outer Cast Block Contour */}
              <path
                d="M 22 14 L 148 14 L 158 40 L 162 215 L 148 245 L 22 245 L 8 215 L 12 40 Z"
                fill="rgba(10, 16, 28, 0.72)"
                stroke={strokeColor}
                strokeWidth={glow ? 3 : 2}
                strokeDasharray={glow ? 'none' : '6 4'}
              />
              {/* 4 In-line Cylinder Guide Lines */}
              {[46, 96, 146, 196].map((cy, i) => (
                <g key={i}>
                  <ellipse
                    cx="85"
                    cy={cy}
                    rx="40"
                    ry="17"
                    stroke={glow ? 'rgba(56, 189, 248, 0.7)' : 'rgba(245, 164, 0, 0.45)'}
                    strokeWidth="1.6"
                    strokeDasharray="4 3"
                  />
                  <circle
                    cx="85"
                    cy={cy}
                    r="4"
                    fill={glow ? 'rgba(56, 189, 248, 0.5)' : 'rgba(245, 164, 0, 0.3)'}
                  />
                </g>
              ))}
              {/* Center Guidance Text */}
              <text
                x="85"
                y="235"
                fill={glow ? '#BAE6FD' : '#FDE68A'}
                fontSize="10"
                fontWeight="900"
                textAnchor="middle"
                letterSpacing="1"
                opacity="0.9"
              >
                MOTOR BLOĞU
              </text>
            </g>
          ) : (
            /* FULL REALISTIC 1960S MECHANICAL CAST ENGINE BLOCK */
            <g>
              {/* Main Cast Iron Block Structure */}
              <path
                d="M 22 14 L 148 14 L 158 40 L 162 215 L 148 245 L 22 245 L 8 215 L 12 40 Z"
                fill="url(#mbCastGrad)"
                stroke="#090D16"
                strokeWidth="2.5"
              />

              {/* Side Cooling Ribs & Casting Flanges */}
              {[38, 66, 94, 122, 150, 178, 206].map((y, idx) => (
                <React.Fragment key={idx}>
                  <line x1="8" y1={y} x2="20" y2={y} stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="150" y1={y} x2="162" y2={y} stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
                </React.Fragment>
              ))}

              {/* 4 Precision In-Line Cylinders & Piston Chambers */}
              {[46, 96, 146, 196].map((cy, i) => (
                <g key={i}>
                  {/* Outer Cylinder Honed Bevel Rim */}
                  <ellipse cx="85" cy={cy} rx="43" ry="18" fill="#1E293B" stroke="url(#mbRimHoned)" strokeWidth="1.8" />
                  {/* Cylinder Bore Depth */}
                  <ellipse cx="85" cy={cy} rx="36" ry="14" fill="url(#mbBoreGrad)" />
                  {/* Piston Crown Top Reflection */}
                  <ellipse cx="85" cy={cy + 1} rx="24" ry="8" fill="#334155" opacity="0.85" />
                  {/* Piston Dish Center */}
                  <ellipse cx="85" cy={cy + 2} rx="12" ry="4" fill="#0F172A" />
                  {/* Cylinder Number Stamping */}
                  <text x="85" y={cy + 4} fill="#CBD5E1" fontSize="9" fontWeight="900" textAnchor="middle">
                    #{i + 1}
                  </text>
                  {/* Cylinder Stud Head Bolts (Left & Right) */}
                  <circle cx="34" cy={cy} r="2.2" fill="#E2E8F0" stroke="#0F172A" strokeWidth="0.8" />
                  <circle cx="136" cy={cy} r="2.2" fill="#E2E8F0" stroke="#0F172A" strokeWidth="0.8" />
                </g>
              ))}

              {/* Front Crankshaft Timing Pulley (Brass/Gold Accents) */}
              <ellipse cx="85" cy="242" rx="28" ry="10" fill="url(#mbPulleyGrad)" stroke="#78350F" strokeWidth="1.5" />
              <circle cx="85" cy="242" r="5" fill="#0F172A" />
              <circle cx="85" cy="242" r="2" fill="#FEF08A" />

              {/* Authentic Technical Badge: "DEVRİM 1961" */}
              <rect x="36" y="218" width="98" height="12" rx="2.5" fill="#090D16" stroke="#F59E0B" strokeWidth="1" />
              <text x="85" y="227" fill="#FEF08A" fontSize="7.5" fontWeight="900" textAnchor="middle" letterSpacing="0.8">
                DEVRİM • 4 SİLİNDİR • 1961
              </text>
            </g>
          )}
        </svg>
      );

    // =========================================================================
    // 2. RADYATÖR (Geniş Yatay Ön Soğutma Bloğu) - viewBox: 0 0 460 110
    // =========================================================================
    case 'radyator':
      return (
        <svg
          viewBox="0 0 460 110"
          width={width}
          height={height}
          style={{ ...style, filter: filterStyle }}
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="radTankGrad" x1="0" y1="0" x2="0" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="35%" stopColor="#334155" />
              <stop offset="75%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0B1120" />
            </linearGradient>
            <linearGradient id="radBrassCapGrad" x1="0" y1="0" x2="100%" y2="0">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="45%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
          </defs>

          {isSlot ? (
            /* EXACT MATCHING SLOT OUTLINE */
            <g>
              {/* Radiator Pressure Cap Outline on Top */}
              <ellipse
                cx="230"
                cy="10"
                rx="22"
                ry="8"
                fill="rgba(10, 16, 28, 0.72)"
                stroke={strokeColor}
                strokeWidth={glow ? 2.5 : 1.8}
                strokeDasharray={glow ? 'none' : '4 3'}
              />
              {/* Main Wide Radiator Body Contour */}
              <rect
                x="14"
                y="18"
                width="432"
                height="84"
                rx="8"
                fill="rgba(10, 16, 28, 0.72)"
                stroke={strokeColor}
                strokeWidth={glow ? 3 : 2}
                strokeDasharray={glow ? 'none' : '6 4'}
              />
              {/* Inner Fin Mesh Grid Lines */}
              {Array.from({ length: 18 }).map((_, i) => (
                <line
                  key={i}
                  x1={34 + i * 23}
                  y1="34"
                  x2={34 + i * 23}
                  y2="88"
                  stroke={glow ? 'rgba(56, 189, 248, 0.55)' : 'rgba(245, 164, 0, 0.35)'}
                  strokeWidth="1.4"
                  strokeDasharray="3 3"
                />
              ))}
              <text
                x="230"
                y="66"
                fill={glow ? '#BAE6FD' : '#FDE68A'}
                fontSize="13"
                fontWeight="900"
                textAnchor="middle"
                letterSpacing="1.5"
                opacity="0.9"
              >
                RADYATÖR
              </text>
            </g>
          ) : (
            /* FULL REALISTIC COPPER-BRASS 1960S RADIATOR */
            <g>
              {/* Top Radiator Cap (Brass Pressure Cap with Knurling) */}
              <ellipse cx="230" cy="10" rx="22" ry="8" fill="url(#radBrassCapGrad)" stroke="#78350F" strokeWidth="1.8" />
              <rect x="225" y="3" width="10" height="7" rx="2" fill="#FEF08A" />

              {/* Main Body Housing */}
              <rect x="14" y="18" width="432" height="84" rx="8" fill="#0B0F19" stroke="#090D16" strokeWidth="2.5" />

              {/* Top Tank Header */}
              <rect x="14" y="18" width="432" height="18" rx="6" fill="url(#radTankGrad)" stroke="#1E293B" strokeWidth="1.5" />

              {/* Dense Corrugated Cooling Mesh Core */}
              <rect x="22" y="36" width="416" height="52" fill="#070A12" stroke="#334155" strokeWidth="1" />
              {Array.from({ length: 42 }).map((_, i) => (
                <line
                  key={i}
                  x1={28 + i * 9.8}
                  y1="38"
                  x2={28 + i * 9.8}
                  y2="86"
                  stroke="#475569"
                  strokeWidth="1.8"
                  opacity="0.85"
                />
              ))}

              {/* Coolant Core Central Channel Rib */}
              <line x1="22" y1="62" x2="438" y2="62" stroke="#1E293B" strokeWidth="2.5" />

              {/* Bottom Tank Header */}
              <rect x="14" y="88" width="432" height="14" rx="5" fill="url(#radTankGrad)" stroke="#1E293B" strokeWidth="1.5" />

              {/* Radiator Mounting Brackets & Hose Ports */}
              <circle cx="50" cy="27" r="6" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.8" />
              <circle cx="410" cy="95" r="6" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.8" />

              {/* Stamped Brass Badge: "DEVRİM OTO" */}
              <rect x="175" y="21" width="110" height="11" rx="2.5" fill="#090D16" stroke="#F59E0B" strokeWidth="1" />
              <text x="230" y="29.5" fill="#FEF08A" fontSize="8" fontWeight="900" textAnchor="middle" letterSpacing="1">
                DEVRİM • ESKİŞEHİR
              </text>
            </g>
          )}
        </svg>
      );

    // =========================================================================
    // 3. AKÜ (12V Devrim Güç Kaynağı) - viewBox: 0 0 170 140
    // =========================================================================
    case 'aku':
      return (
        <svg
          viewBox="0 0 170 140"
          width={width}
          height={height}
          style={{ ...style, filter: filterStyle }}
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="akuBodyGrad" x1="0" y1="0" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="40%" stopColor="#1E293B" />
              <stop offset="80%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#050811" />
            </linearGradient>
            <linearGradient id="akuGoldPlate" x1="0" y1="0" x2="100%" y2="0">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
          </defs>

          {isSlot ? (
            /* EXACT MATCHING SLOT OUTLINE (Includes terminal posts & body) */
            <g>
              {/* Positive Terminal Outline (Left) */}
              <rect
                x="28"
                y="8"
                width="20"
                height="18"
                rx="4"
                fill="rgba(10, 16, 28, 0.72)"
                stroke={strokeColor}
                strokeWidth={glow ? 2.5 : 1.8}
                strokeDasharray={glow ? 'none' : '4 3'}
              />
              {/* Negative Terminal Outline (Right) */}
              <rect
                x="122"
                y="8"
                width="20"
                height="18"
                rx="4"
                fill="rgba(10, 16, 28, 0.72)"
                stroke={strokeColor}
                strokeWidth={glow ? 2.5 : 1.8}
                strokeDasharray={glow ? 'none' : '4 3'}
              />
              {/* Main Battery Box Outline */}
              <rect
                x="16"
                y="26"
                width="138"
                height="104"
                rx="8"
                fill="rgba(10, 16, 28, 0.72)"
                stroke={strokeColor}
                strokeWidth={glow ? 3 : 2}
                strokeDasharray={glow ? 'none' : '6 4'}
              />
              {/* Stamped "+" and "-" Hints */}
              <text x="38" y="22" fill="#EF4444" fontSize="15" fontWeight="900" textAnchor="middle">
                +
              </text>
              <text x="132" y="22" fill="#60A5FA" fontSize="15" fontWeight="900" textAnchor="middle">
                −
              </text>
              <text
                x="85"
                y="82"
                fill={glow ? '#BAE6FD' : '#FDE68A'}
                fontSize="13"
                fontWeight="900"
                textAnchor="middle"
                letterSpacing="1"
                opacity="0.9"
              >
                12V AKÜ
              </text>
            </g>
          ) : (
            /* FULL REALISTIC 1960S HARD-RUBBER 12V BATTERY */
            <g>
              {/* Positive Terminal (Red Lead Post) */}
              <rect x="28" y="8" width="20" height="18" rx="4" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1.8" />
              <text x="38" y="22" fill="#FFFFFF" fontSize="15" fontWeight="900" textAnchor="middle">
                +
              </text>

              {/* Negative Terminal (Blue Lead Post) */}
              <rect x="122" y="8" width="20" height="18" rx="4" fill="#2563EB" stroke="#1E3A8A" strokeWidth="1.8" />
              <text x="132" y="22" fill="#FFFFFF" fontSize="15" fontWeight="900" textAnchor="middle">
                −
              </text>

              {/* Main Battery Case Structure */}
              <rect x="16" y="26" width="138" height="104" rx="8" fill="url(#akuBodyGrad)" stroke="#090D16" strokeWidth="2.5" />

              {/* Vertical Stiffening Ribs on Case */}
              {[42, 68, 96, 124].map((rx, i) => (
                <line key={i} x1={rx} y1="36" x2={rx} y2="124" stroke="#0F172A" strokeWidth="3" />
              ))}

              {/* Top Cell Caps (6 Cells for 12V) */}
              {[30, 52, 74, 96, 118, 140].map((cx, i) => (
                <circle key={i} cx={cx} cy="32" r="5" fill="#F59E0B" stroke="#78350F" strokeWidth="1.4" />
              ))}

              {/* Center Brass/Gold Vintage Emblem */}
              <rect x="34" y="64" width="102" height="42" rx="6" fill="#090D16" stroke="url(#akuGoldPlate)" strokeWidth="2" />
              <text x="85" y="82" fill="#FEF08A" fontSize="12" fontWeight="900" textAnchor="middle" letterSpacing="1.2">
                DEVRİM
              </text>
              <text x="85" y="97" fill="#E2E8F0" fontSize="9.5" fontWeight="700" textAnchor="middle" letterSpacing="0.6">
                12V • 60Ah
              </text>

              {/* Steel Hold-down Bracket Band */}
              <rect x="16" y="122" width="138" height="8" rx="2.5" fill="#1E293B" stroke="#0F172A" strokeWidth="1.2" />
              <circle cx="24" cy="126" r="2.5" fill="#94A3B8" />
              <circle cx="146" cy="126" r="2.5" fill="#94A3B8" />
            </g>
          )}
        </svg>
      );

    // =========================================================================
    // 4. HAVA FİLTRESİ (Silindirik Krom Hava Temizleyici) - viewBox: 0 0 180 130
    // =========================================================================
    case 'hava_filtresi':
      return (
        <svg
          viewBox="0 0 180 130"
          width={width}
          height={height}
          style={{ ...style, filter: filterStyle }}
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="hfDomeChrome" cx="50%" cy="35%" r="55%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="25%" stopColor="#F1F5F9" />
              <stop offset="65%" stopColor="#64748B" />
              <stop offset="100%" stopColor="#1E293B" />
            </radialGradient>
            <linearGradient id="hfMeshGrad" x1="0" y1="0" x2="100%" y2="0">
              <stop offset="0%" stopColor="#78350F" />
              <stop offset="50%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>
            <linearGradient id="hfWingNut" x1="0" y1="0" x2="100%" y2="0">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
          </defs>

          {isSlot ? (
            /* EXACT MATCHING SLOT OUTLINE (Pancake filter + wing nut) */
            <g>
              {/* Wing Nut Outline */}
              <ellipse
                cx="90"
                cy="14"
                rx="16"
                ry="7"
                fill="rgba(10, 16, 28, 0.72)"
                stroke={strokeColor}
                strokeWidth={glow ? 2.5 : 1.8}
                strokeDasharray={glow ? 'none' : '4 3'}
              />
              {/* Cylindrical Round Mesh Base */}
              <ellipse
                cx="90"
                cy="76"
                rx="76"
                ry="38"
                fill="rgba(10, 16, 28, 0.72)"
                stroke={strokeColor}
                strokeWidth={glow ? 3 : 2}
                strokeDasharray={glow ? 'none' : '6 4'}
              />
              {/* Top Chrome Lid Ellipse */}
              <ellipse
                cx="90"
                cy="48"
                rx="72"
                ry="28"
                fill="none"
                stroke={strokeColor}
                strokeWidth={glow ? 2.5 : 1.8}
                strokeDasharray={glow ? 'none' : '5 4'}
              />
              <text
                x="90"
                y="56"
                fill={glow ? '#BAE6FD' : '#FDE68A'}
                fontSize="12"
                fontWeight="900"
                textAnchor="middle"
                letterSpacing="1"
                opacity="0.9"
              >
                HAVA FİLTRESİ
              </text>
            </g>
          ) : (
            /* FULL REALISTIC 1960S CHROME PANCAKE AIR CLEANER */
            <g>
              {/* Pleated Filter Paper Mesh Drum (Base) */}
              <ellipse cx="90" cy="80" rx="76" ry="38" fill="url(#hfMeshGrad)" stroke="#1E293B" strokeWidth="2.5" />

              {/* Radial Pleated Filter Ribs */}
              {Array.from({ length: 26 }).map((_, i) => {
                const angle = (i * Math.PI) / 13;
                const x1 = 90 + Math.cos(angle) * 36;
                const y1 = 78 + Math.sin(angle) * 18;
                const x2 = 90 + Math.cos(angle) * 74;
                const y2 = 80 + Math.sin(angle) * 36;
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#451A03"
                    strokeWidth="2"
                    opacity="0.8"
                  />
                );
              })}

              {/* Gleaming Domed Chrome Lid */}
              <ellipse cx="90" cy="48" rx="72" ry="28" fill="url(#hfDomeChrome)" stroke="#0F172A" strokeWidth="2.5" />

              {/* Chrome Specular Highlights */}
              <ellipse cx="90" cy="45" rx="58" ry="20" fill="none" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.85" />
              <ellipse cx="90" cy="45" rx="42" ry="12" fill="none" stroke="#CBD5E1" strokeWidth="1.2" opacity="0.65" />

              {/* Carburetor Mounting Snorkel Spigot */}
              <path
                d="M 148 50 C 164 52 170 58 170 66 C 170 73 162 78 148 78 Z"
                fill="#475569"
                stroke="#1E293B"
                strokeWidth="1.5"
              />

              {/* Center Vintage Wing Nut Fastener */}
              <ellipse cx="90" cy="26" rx="16" ry="8" fill="url(#hfWingNut)" stroke="#78350F" strokeWidth="1.6" />
              <rect x="88" y="11" width="4" height="16" rx="1.5" fill="#FEF08A" />
              <ellipse cx="90" cy="26" rx="6" ry="6" fill="#0F172A" />
            </g>
          )}
        </svg>
      );

    default:
      return null;
  }
};

/**
 * Cinematic 1960s Devrim Car Front & Open Engine Bay Scene.
 * Framed by the white vintage car body, headlights, and front bumper.
 */
export const DevrimEngineBayScene: React.FC<{ placedPartIds: string[] }> = ({ placedPartIds }) => {
  const isBatteryPlaced = placedPartIds.includes('aku');
  const isRadiatorPlaced = placedPartIds.includes('radyator');
  return (
    <svg
      viewBox="0 0 1000 625"
      width="100%"
      height="100%"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Subtle Workshop Blueprint Grid Pattern */}
        <pattern id="chassisGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(56, 189, 248, 0.04)" strokeWidth="1" />
        </pattern>

        {/* Cinematic Workshop Spotlight */}
        <radialGradient id="engineBaySpotlight" cx="50%" cy="48%" r="55%">
          <stop offset="0%" stopColor="rgba(245, 158, 11, 0.14)" />
          <stop offset="45%" stopColor="rgba(15, 23, 42, 0.35)" />
          <stop offset="100%" stopColor="rgba(3, 7, 18, 0.85)" />
        </radialGradient>

        {/* Vintage Automotive White Fender Paint Shading */}
        <linearGradient id="leftFenderPaint" x1="0" y1="0" x2="100%" y2="0">
          <stop offset="0%" stopColor="#CBD5E1" />
          <stop offset="35%" stopColor="#F8FAFC" />
          <stop offset="85%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>

        <linearGradient id="rightFenderPaint" x1="100%" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#CBD5E1" />
          <stop offset="35%" stopColor="#F8FAFC" />
          <stop offset="85%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>

        {/* Polished Chrome Gradients */}
        <linearGradient id="chromeBumperGrad" x1="0" y1="0" x2="0" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#E2E8F0" />
          <stop offset="65%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>

        {/* Headlight Amber Glow */}
        <radialGradient id="headlightAmberGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="40%" stopColor="#F59E0B" />
          <stop offset="75%" stopColor="rgba(217, 119, 6, 0.4)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* 1. Deep Engine Bay Compartment Bed */}
      <rect width="1000" height="625" fill="#080D1A" />
      <rect width="1000" height="625" fill="url(#chassisGrid)" />
      <rect width="1000" height="625" fill="url(#engineBaySpotlight)" />

      {/* 2. Rear Firewall (Top Bulkhead) */}
      <path
        d="M 120 40 L 880 40 L 850 95 L 150 95 Z"
        fill="#0F172A"
        stroke="#334155"
        strokeWidth="2"
      />
      {[220, 340, 460, 540, 660, 780].map((x, i) => (
        <line key={i} x1={x} y1="44" x2={x - 12} y2="90" stroke="rgba(100, 116, 139, 0.4)" strokeWidth="1.8" />
      ))}

      {/* 3. Auxiliary Engine Bay Mechanics (Realistic 1960s Details) */}

      {/* Left White Fluid Reservoir (Washer / Coolant Expansion Tank) */}
      <g>
        <rect x="175" y="125" width="48" height="68" rx="8" fill="rgba(241, 245, 249, 0.85)" stroke="#64748B" strokeWidth="1.8" />
        <rect x="187" y="115" width="24" height="12" rx="3" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
        {/* Fluid Level Line */}
        <line x1="179" y1="165" x2="219" y2="165" stroke="#38BDF8" strokeWidth="2" strokeDasharray="3 2" />
        <text x="199" y="180" fill="#475569" fontSize="7" fontWeight="900" textAnchor="middle">MAX</text>
      </g>

      {/* Right White Fluid Reservoir (Brake / Clutch Master Cylinder) */}
      <g>
        <rect x="775" y="125" width="48" height="68" rx="8" fill="rgba(241, 245, 249, 0.85)" stroke="#64748B" strokeWidth="1.8" />
        <rect x="787" y="115" width="24" height="12" rx="3" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
        <line x1="779" y1="165" x2="819" y2="165" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 2" />
        <text x="799" y="180" fill="#475569" fontSize="7" fontWeight="900" textAnchor="middle">MAX</text>
      </g>

      {/* Right Brake Booster (Black Drum Behind Master Cylinder) */}
      <circle cx="735" cy="155" r="28" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
      <circle cx="735" cy="155" r="18" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />

      {/* Coolant Piping / Hoses Routing */}
      {/* Upper Radiator Hose connecting to Engine Block */}
      <path
        d="M 380 470 C 340 430 330 360 380 320"
        stroke="#1E293B"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M 380 470 C 340 430 330 360 380 320"
        stroke={isRadiatorPlaced ? '#38BDF8' : '#475569'}
        strokeWidth="4"
        strokeLinecap="round"
        opacity={isRadiatorPlaced ? 0.9 : 0.6}
      />

      {/* Lower Radiator Hose */}
      <path
        d="M 620 470 C 650 430 655 370 615 320"
        stroke="#1E293B"
        strokeWidth="12"
        strokeLinecap="round"
      />

      {/* Exhaust Manifold Piping Routing Leftward */}
      <path
        d="M 400 230 C 320 240 280 310 240 440 L 230 520"
        stroke="#475569"
        strokeWidth="10"
        strokeLinecap="round"
        opacity={0.75}
      />

      {/* Alternator & V-Belt Bracket to Right of Block */}
      <g>
        <circle cx="615" cy="275" r="24" fill="#334155" stroke="#0F172A" strokeWidth="2" />
        <circle cx="615" cy="275" r="14" fill="#0F172A" stroke="#64748B" strokeWidth="1.5" />
        <line x1="605" y1="265" x2="625" y2="285" stroke="#94A3B8" strokeWidth="1.8" />
        {/* Drive Belt */}
        <path d="M 615 251 C 585 245 540 245 500 245" stroke="#0F172A" strokeWidth="5" strokeLinecap="round" />
      </g>

      {/* Main Wiring Loom along Firewall */}
      <path
        d="M 190 90 C 320 85 680 85 810 90"
        stroke="#0F172A"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M 190 90 C 320 85 680 85 810 90"
        stroke={isBatteryPlaced ? '#38BDF8' : '#F59E0B'}
        strokeWidth="2.5"
        strokeDasharray="8 4"
        strokeLinecap="round"
        opacity={isBatteryPlaced ? 0.95 : 0.75}
      />

      {/* Front Radiator Support Crossmember Beam (Lower Front) */}
      <rect x="150" y="475" width="700" height="38" rx="6" fill="#1E293B" stroke="#334155" strokeWidth="2" />
      {[190, 290, 390, 490, 590, 690, 790, 830].map((bx, i) => (
        <circle key={i} cx={bx} cy="494" r="3.8" fill="#475569" stroke="#0F172A" strokeWidth="1.2" />
      ))}

      {/* 4. White Devrim Car Body Framing (Fenders, Cowl, Headlights, Bumper) */}

      {/* Top Cowl / Wiper Panel */}
      <path
        d="M 100 0 L 900 0 L 880 44 L 120 44 Z"
        fill="url(#leftFenderPaint)"
        stroke="#94A3B8"
        strokeWidth="2"
      />
      {/* Windshield Wiper Pivots */}
      <circle cx="340" cy="22" r="5" fill="#0F172A" stroke="#64748B" strokeWidth="1.5" />
      <circle cx="660" cy="22" r="5" fill="#0F172A" stroke="#64748B" strokeWidth="1.5" />

      {/* Left Car Fender (Vintage Wing) */}
      <path
        d="M 100 0 L 140 44 L 145 490 L 95 530 L 10 530 L 10 140 Z"
        fill="url(#leftFenderPaint)"
        stroke="#64748B"
        strokeWidth="2"
      />
      {/* Left Chrome Accent Trim */}
      <path d="M 140 44 L 145 490" stroke="#FFFFFF" strokeWidth="2" opacity="0.8" />

      {/* Right Car Fender (Vintage Wing) */}
      <path
        d="M 900 0 L 860 44 L 855 490 L 905 530 L 990 530 L 990 140 Z"
        fill="url(#rightFenderPaint)"
        stroke="#64748B"
        strokeWidth="2"
      />
      {/* Right Chrome Accent Trim */}
      <path d="M 860 44 L 855 490" stroke="#FFFFFF" strokeWidth="2" opacity="0.8" />

      {/* Headlights (Vintage Round Glass Lenses with Amber Glow) */}
      {/* Left Headlight */}
      <g>
        <circle cx="70" cy="555" r="48" fill="#0F172A" stroke="url(#chromeBumperGrad)" strokeWidth="6" />
        <circle cx="70" cy="555" r="42" fill="url(#headlightAmberGlow)" />
        <circle cx="70" cy="555" r="42" stroke="#FEF08A" strokeWidth="1.5" opacity="0.6" />
        {/* Fluted Glass Lens Lines */}
        {[-24, -12, 0, 12, 24].map((ox, i) => (
          <line key={i} x1={70 + ox} y1={525} x2={70 + ox} y2={585} stroke="#FFFFFF" strokeWidth="1.2" opacity="0.45" />
        ))}
      </g>

      {/* Right Headlight */}
      <g>
        <circle cx="930" cy="555" r="48" fill="#0F172A" stroke="url(#chromeBumperGrad)" strokeWidth="6" />
        <circle cx="930" cy="555" r="42" fill="url(#headlightAmberGlow)" />
        <circle cx="930" cy="555" r="42" stroke="#FEF08A" strokeWidth="1.5" opacity="0.6" />
        {/* Fluted Glass Lens Lines */}
        {[-24, -12, 0, 12, 24].map((ox, i) => (
          <line key={i} x1={930 + ox} y1={525} x2={930 + ox} y2={585} stroke="#FFFFFF" strokeWidth="1.2" opacity="0.45" />
        ))}
      </g>

      {/* Front Polished Chrome Bumper (Bottom Edge) */}
      <path
        d="M 5 570 C 180 585 820 585 995 570 L 1000 625 L 0 625 Z"
        fill="url(#chromeBumperGrad)"
        stroke="#475569"
        strokeWidth="2.5"
      />
      {/* Specular Highlight along Bumper Top Lip */}
      <path
        d="M 15 576 C 180 589 820 589 985 576"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Stamped Center Emblem: DEVRİM 1961 on Bumper Center */}
      <rect x="420" y="588" width="160" height="22" rx="4" fill="#090D16" stroke="#FEF08A" strokeWidth="1.2" />
      <text x="500" y="603" fill="#FEF08A" fontSize="12" fontWeight="900" textAnchor="middle" letterSpacing="2">
        DEVRİM • 1961
      </text>
    </svg>
  );
};
