import React, { useState } from 'react';
import { WAYPOINTS, type WaypointPoint, FLIGHT_TELEMETRY } from '../../data/milliData';
import { SoundFx } from '../../game/utils/audio';

interface MilliStage3RouteProps {
  onComplete: (waypoints: WaypointPoint[]) => void;
}

export const MilliStage3Route: React.FC<MilliStage3RouteProps> = ({ onComplete }) => {
  // Ordered sequence of confirmed waypoint IDs
  const [selectedWaypointIds, setSelectedWaypointIds] = useState<number[]>([1]);

  const nextWaypointId = selectedWaypointIds.length < 4 ? selectedWaypointIds.length + 1 : null;
  const isRouteReady = selectedWaypointIds.length === 4;

  const handleWaypointClick = (point: WaypointPoint) => {
    // If it's the exact next waypoint in sequence:
    if (point.id === nextWaypointId) {
      SoundFx.playClickTone();
      const updated = [...selectedWaypointIds, point.id];
      setSelectedWaypointIds(updated);

      if (updated.length === 4) {
        setTimeout(() => {
          SoundFx.playSuccessTone();
        }, 200);
      }
    } else if (selectedWaypointIds.includes(point.id)) {
      // Already selected, ignore or feedback
      SoundFx.playClickTone();
    }
  };

  const handleResetRoute = () => {
    SoundFx.playClickTone();
    setSelectedWaypointIds([1]);
  };

  // Convert points to SVG path coordinates for the glowing route line
  const confirmedPoints = selectedWaypointIds
    .map(id => WAYPOINTS.find(w => w.id === id))
    .filter(Boolean) as WaypointPoint[];

  const pathD = confirmedPoints.reduce((acc, pt, index) => {
    if (index === 0) return `M ${pt.mapPercent.x} ${pt.mapPercent.y}`;
    // Curved smooth path
    const prev = confirmedPoints[index - 1];
    const midX = (prev.mapPercent.x + pt.mapPercent.x) / 2;
    const midY = (prev.mapPercent.y + pt.mapPercent.y) / 2;
    return `${acc} Q ${midX} ${midY - 4} ${pt.mapPercent.x} ${pt.mapPercent.y}`;
  }, '');

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
    >
      {/* =========================================================================
          CAMPUS AERIAL MAP & WAYPOINT INTERACTION
          ========================================================================= */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 24px',
          gap: '24px',
          minHeight: 0,
        }}
      >
        {/* Interactive Aerial Map Viewport */}
        <div
          style={{
            position: 'relative',
            flex: 1,
            height: '100%',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(0, 242, 254, 0.4)',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Aerial Map Background */}
          <img
            src="/assets/milli/pau_aerial_bg.jpg"
            alt="Pamukkale Üniversitesi Hava Görüntüsü"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* Compass Rose Indicator */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(5, 15, 30, 0.8)',
              border: '1px solid rgba(0, 242, 254, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 800,
              color: '#00F2FE',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              zIndex: 15,
            }}
          >
            <span>▲</span>
            <span>N</span>
          </div>

          {/* SVG Flight Path Overlay */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <defs>
              <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00F2FE" />
                <stop offset="50%" stopColor="#10B981" />
                <stop offset="75%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="0.8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Glowing background shadow path */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="#00F2FE"
                strokeWidth="1.2"
                strokeOpacity="0.4"
                strokeLinecap="round"
                filter="url(#neonGlow)"
              />
            )}

            {/* Main animated dashed route path */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="url(#routeGrad)"
                strokeWidth="0.8"
                strokeDasharray="2 1.2"
                strokeLinecap="round"
                style={{
                  animation: 'routeDashFlow 1.5s linear infinite',
                }}
              />
            )}
          </svg>

          {/* Waypoint Interactive Markers on Map */}
          {WAYPOINTS.map(point => {
            const isConfirmed = selectedWaypointIds.includes(point.id);
            const isNext = point.id === nextWaypointId;

            return (
              <div
                key={point.id}
                onClick={() => handleWaypointClick(point)}
                style={{
                  position: 'absolute',
                  left: `${point.mapPercent.x}%`,
                  top: `${point.mapPercent.y}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: isNext || isConfirmed ? 'pointer' : 'not-allowed',
                  zIndex: isNext ? 25 : 20,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* Radar Ripple for Next Waypoint */}
                {isNext && (
                  <div
                    style={{
                      position: 'absolute',
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      border: `2px solid ${point.color}`,
                      animation: 'radarPulse 1.8s infinite ease-out',
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Waypoint Pin Badge */}
                <div
                  style={{
                    width: isNext ? '48px' : '40px',
                    height: isNext ? '48px' : '40px',
                    borderRadius: '50%',
                    background: isConfirmed
                      ? `linear-gradient(135deg, ${point.color} 0%, rgba(5, 20, 40, 0.9) 100%)`
                      : isNext
                      ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                      : 'rgba(15, 25, 45, 0.85)',
                    border: isConfirmed
                      ? `2px solid ${point.color}`
                      : isNext
                      ? '2px solid #FDE68A'
                      : '2px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: isConfirmed || isNext
                      ? `0 0 20px ${isNext ? '#F59E0B' : point.color}`
                      : '0 4px 10px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    color: '#FFFFFF',
                    transform: isNext ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {isConfirmed ? (
                    <span style={{ fontWeight: 800, fontSize: '15px' }}>{point.id}</span>
                  ) : (
                    <span>{point.icon}</span>
                  )}
                </div>

                {/* Label Tooltip */}
                <div
                  style={{
                    marginTop: '6px',
                    background: 'rgba(5, 15, 30, 0.9)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: `1px solid ${isConfirmed ? point.color : 'rgba(255, 255, 255, 0.3)'}`,
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                    pointerEvents: 'none',
                  }}
                >
                  {point.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Waypoint Checklist & Telemetry Panel */}
        <div
          style={{
            width: '360px',
            background: 'linear-gradient(180deg, rgba(8, 20, 42, 0.88) 0%, rgba(4, 12, 26, 0.96) 100%)',
            border: '1px solid rgba(0, 242, 254, 0.35)',
            borderRadius: '18px',
            padding: '20px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>
                📍 KONTROL NOKTALARI
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: isRouteReady ? '#10B981' : '#F59E0B',
                }}
              >
                {selectedWaypointIds.length} / 4 Tamamlandı
              </div>
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.7)',
                marginTop: '3px',
                marginBottom: '12px',
              }}
            >
              Haritaya dokunarak kontrol noktalarını sırayla bağla.
            </div>

            {/* Waypoint List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {WAYPOINTS.map(point => {
                const isConfirmed = selectedWaypointIds.includes(point.id);
                const isNext = point.id === nextWaypointId;

                return (
                  <div
                    key={point.id}
                    onClick={() => handleWaypointClick(point)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      background: isConfirmed
                        ? 'rgba(16, 185, 129, 0.12)'
                        : isNext
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(255, 255, 255, 0.04)',
                      border: isConfirmed
                        ? `1px solid ${point.color}88`
                        : isNext
                        ? '1px solid #F59E0B'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      cursor: isNext ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: isConfirmed ? point.color : isNext ? '#F59E0B' : 'rgba(255, 255, 255, 0.1)',
                        color: isConfirmed || isNext ? '#050E1F' : '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {point.id}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {point.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)' }}>
                        {point.coords}
                      </div>
                    </div>
                    <div>
                      {isConfirmed ? (
                        <span style={{ color: '#10B981', fontSize: '14px', fontWeight: 800 }}>✓</span>
                      ) : isNext ? (
                        <span style={{ color: '#F59E0B', fontSize: '11px', fontWeight: 700 }}>Seç</span>
                      ) : (
                        <span style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '12px' }}>○</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Telemetry Summary Card */}
          <div
            style={{
              background: 'rgba(0, 10, 25, 0.6)',
              border: '1px solid rgba(0, 242, 254, 0.2)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#00F2FE',
                letterSpacing: '0.5px',
              }}
            >
              📊 UÇUŞ PARAMETRELERİ
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Toplam Mesafe:</span>
              <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{FLIGHT_TELEMETRY.totalDistance}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Tahmini Süre:</span>
              <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{FLIGHT_TELEMETRY.estimatedTime}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Maksimum İrtifa:</span>
              <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{FLIGHT_TELEMETRY.maxAltitude}</span>
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleResetRoute}
              style={{
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              🔄 Sıfırla
            </button>
            <div
              style={{
                flex: 1,
                fontSize: '11px',
                fontWeight: 700,
                color: isRouteReady ? '#10B981' : '#F59E0B',
                textAlign: 'right',
              }}
            >
              {isRouteReady ? '✓ ROTA HAZIR' : 'Noktaları Bağla'}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM DOCK & PRIMARY CTA
          ========================================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          padding: '12px 24px',
          background: 'linear-gradient(180deg, rgba(10, 25, 45, 0.75) 0%, rgba(5, 15, 30, 0.95) 100%)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(0, 242, 254, 0.25)',
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.5)',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: isRouteReady ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              border: `1px solid ${isRouteReady ? '#10B981' : '#F59E0B'}`,
              color: isRouteReady ? '#10B981' : '#FDE68A',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            {isRouteReady ? '✓ ROTA PLANLAMASI TAMAMLANDI' : '4 Kontrol Noktasını Sırayla Seç'}
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => onComplete(confirmedPoints)}
          disabled={!isRouteReady}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 28px',
            background: isRouteReady
              ? 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)'
              : 'rgba(40, 50, 70, 0.5)',
            border: isRouteReady ? '1px solid #FDE68A' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: isRouteReady ? '#050E1F' : 'rgba(255, 255, 255, 0.4)',
            fontSize: '15px',
            fontWeight: 800,
            letterSpacing: '0.5px',
            cursor: isRouteReady ? 'pointer' : 'not-allowed',
            boxShadow: isRouteReady
              ? '0 6px 20px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
              : 'none',
            transform: isRouteReady ? 'scale(1)' : 'scale(0.98)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <span>Rotayı Onayla ve Uçuşa Geç</span>
          <span style={{ fontSize: '18px' }}>→</span>
        </button>
      </div>
    </div>
  );
};
