import React, { useState, useEffect, useRef } from 'react';
import { WAYPOINTS, FLIGHT_TELEMETRY, type MissionSensor } from '../../data/milliData';
import { SoundFx } from '../../game/utils/audio';

interface MilliStage4FlightProps {
  selectedSensor?: MissionSensor;
  onFinishModule: () => void;
}

export const MilliStage4Flight: React.FC<MilliStage4FlightProps> = ({
  selectedSensor,
  onFinishModule,
}) => {
  // Flight phase: 'ready' -> 'taking_off' -> 'cruising' -> 'completed'
  const [flightPhase, setFlightPhase] = useState<'ready' | 'taking_off' | 'cruising' | 'completed'>('ready');
  const [altitude, setAltitude] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  const [activeWaypointIndex, setActiveWaypointIndex] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const handleStartFlight = () => {
    if (flightPhase !== 'ready') return;

    SoundFx.playTelemetryBeep();
    setFlightPhase('taking_off');

    // Engine ignition hum
    try {
      SoundFx.playCarDrive(); // engine hum
    } catch {
      // safe fallback
    }

    startTimeRef.current = Date.now();
  };

  useEffect(() => {
    if (flightPhase === 'taking_off' || flightPhase === 'cruising') {
      const durationMs = 8000; // 8 seconds flight presentation

      const tick = () => {
        if (!startTimeRef.current) return;
        const elapsed = Date.now() - startTimeRef.current;
        const progress = Math.min(1, elapsed / durationMs);

        setProgressPercent(Math.round(progress * 100));

        // Smooth altitude ramp up to 320m
        const targetAlt = 320;
        const currentAlt = Math.round(targetAlt * Math.min(1, progress * 1.2));
        setAltitude(currentAlt);

        // Smooth speed ramp up to 72 km/h
        const targetSpeed = 72;
        const currentSpeed = Math.round(targetSpeed * Math.min(1, progress * 1.4));
        setSpeed(currentSpeed);

        // Waypoints progress
        if (progress > 0.75) {
          setActiveWaypointIndex(3);
        } else if (progress > 0.45) {
          setActiveWaypointIndex(2);
        } else if (progress > 0.15) {
          setActiveWaypointIndex(1);
        } else {
          setActiveWaypointIndex(0);
        }

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(tick);
        } else {
          setFlightPhase('completed');
          SoundFx.playVictoryFanfare();
        }
      };

      animFrameRef.current = requestAnimationFrame(tick);

      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }
  }, [flightPhase]);

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
          MAIN FLIGHT CANVAS & HUD
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
        {/* Sky Viewport with Climbing UAV */}
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
          {/* Aerial Campus View */}
          <img
            src="/assets/milli/pau_aerial_bg.jpg"
            alt="Pamukkale Üniversitesi Kampüsü"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform:
                flightPhase === 'taking_off' || flightPhase === 'cruising' || flightPhase === 'completed'
                  ? 'scale(1.05) translateY(-10px)'
                  : 'scale(1)',
              transition: 'transform 8s ease-out',
            }}
          />

          {/* Flying UAV Graphic with GPU Transform */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '540px',
              maxWidth: '65%',
              aspectRatio: '16/9',
              transform:
                flightPhase === 'ready'
                  ? 'translate3d(-50%, 15%, 0) scale(0.85) rotate(-3deg)'
                  : flightPhase === 'completed'
                  ? 'translate3d(-46%, -20%, 0) scale(1.05) rotate(4deg)'
                  : `translate3d(calc(-50% + ${progressPercent * 0.4}px), calc(15% - ${
                      progressPercent * 2.2
                    }px), 0) scale(${0.85 + progressPercent * 0.002}) rotate(${
                      -3 + progressPercent * 0.07
                    }deg)`,
              transition:
                flightPhase === 'ready'
                  ? 'none'
                  : 'transform 0.1s linear',
              pointerEvents: 'none',
              zIndex: 15,
            }}
          >
            {/* Turbine / Electric Thrust Energy Trails */}
            {(flightPhase === 'taking_off' || flightPhase === 'cruising' || flightPhase === 'completed') && (
              <div
                style={{
                  position: 'absolute',
                  left: '42%',
                  top: '52%',
                  width: '80px',
                  height: '4px',
                  background: 'linear-gradient(90deg, transparent, #00F2FE)',
                  boxShadow: '0 0 16px #00F2FE, 0 0 30px #00F2FE',
                  borderRadius: '4px',
                  transform: 'rotate(18deg)',
                  animation: 'thrustPulse 0.15s infinite alternate',
                }}
              />
            )}

            <img
              src="/assets/milli/uav_flight.png"
              alt="Uçuş Yapan İHA"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.6))',
              }}
            />
          </div>

          {/* Start Flight Overlay Button if in 'ready' phase */}
          {flightPhase === 'ready' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(5, 12, 25, 0.45)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                zIndex: 25,
              }}
            >
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                }}
              >
                Pamukkale Üniversitesi Kampüsü Kalkış Hattı
              </div>
              <button
                onClick={handleStartFlight}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '18px 42px',
                  background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
                  border: '2px solid #FDE68A',
                  borderRadius: '40px',
                  color: '#050E1F',
                  fontSize: '18px',
                  fontWeight: 900,
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 30px rgba(245, 158, 11, 0.6), inset 0 1px 0 #FFF',
                  transform: 'scale(1)',
                  transition: 'all 0.2s ease',
                  animation: 'pulseGlow 2s infinite ease-in-out',
                }}
              >
                <span>🚀</span>
                <span>UÇUŞU BAŞLAT</span>
                <span>→</span>
              </button>
            </div>
          )}

          {/* Gauges & Telemetry Overlay in Flight */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              right: '16px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              zIndex: 20,
              pointerEvents: 'none',
            }}
          >
            {/* Left Gauge: Altitude */}
            <div
              style={{
                background: 'rgba(5, 15, 32, 0.85)',
                border: '1px solid rgba(0, 242, 254, 0.4)',
                borderRadius: '16px',
                padding: '12px 18px',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ fontSize: '11px', color: '#00F2FE', fontWeight: 700 }}>
                ✈️ İRTİFA
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  fontFamily: 'monospace',
                }}
              >
                {altitude} <span style={{ fontSize: '14px' }}>m</span>
              </div>
            </div>

            {/* Center Status Bar */}
            <div
              style={{
                background: 'rgba(5, 15, 32, 0.85)',
                border: '1px solid rgba(0, 242, 254, 0.4)',
                borderRadius: '24px',
                padding: '8px 24px',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                width: '380px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>✈️</span>
                <span>
                  {flightPhase === 'ready'
                    ? 'İHA kalkışa hazır.'
                    : flightPhase === 'completed'
                    ? 'Hedef kontrol noktasına ulaşıldı.'
                    : `İHA rotayı takip ediyor... (${WAYPOINTS[activeWaypointIndex]?.name})`}
                </span>
              </div>
              {/* Cyan Progress Bar */}
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #00F2FE, #10B981)',
                    boxShadow: '0 0 10px #00F2FE',
                    transition: 'width 0.2s linear',
                  }}
                />
              </div>
            </div>

            {/* Right Gauge: Speed */}
            <div
              style={{
                background: 'rgba(5, 15, 32, 0.85)',
                border: '1px solid rgba(0, 242, 254, 0.4)',
                borderRadius: '16px',
                padding: '12px 18px',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ fontSize: '11px', color: '#00F2FE', fontWeight: 700 }}>
                ⚡ HIZ
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  fontFamily: 'monospace',
                }}
              >
                {speed} <span style={{ fontSize: '14px' }}>km/h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Info & Live Mission Tracking Panel */}
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
            gap: '14px',
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          {/* Mini Route Map */}
          <div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#00F2FE',
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}
            >
              🗺️ UÇUŞ ROTASI
            </div>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '110px',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid rgba(0, 242, 254, 0.3)',
              }}
            >
              <img
                src="/assets/milli/pau_aerial_bg.jpg"
                alt="Mini Harita"
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }}
              />
              {/* Waypoints Mini Pins */}
              {WAYPOINTS.map((wp, idx) => {
                const isPassed = idx <= activeWaypointIndex;
                return (
                  <div
                    key={wp.id}
                    style={{
                      position: 'absolute',
                      left: `${wp.mapPercent.x}%`,
                      top: `${wp.mapPercent.y}%`,
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: isPassed ? '#10B981' : 'rgba(255, 255, 255, 0.4)',
                      boxShadow: isPassed ? '0 0 8px #10B981' : 'none',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Flight Telemetry Numbers */}
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
              📡 UÇUŞ BİLGİLERİ
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>İrtifa:</span>
              <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{altitude} metre</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Hız:</span>
              <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{speed} km/h</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Toplam Mesafe:</span>
              <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{FLIGHT_TELEMETRY.totalDistance}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Sensör Durumu:</span>
              <span style={{ fontWeight: 700, color: selectedSensor?.color || '#10B981' }}>
                {selectedSensor?.name || 'Termal Kamera (Aktif)'}
              </span>
            </div>
          </div>

          {/* Sequential Waypoint Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600 }}>
              MEVCUT AŞAMA
            </div>
            {WAYPOINTS.map((wp, idx) => {
              const isDone = idx < activeWaypointIndex;
              const isCurrent = idx === activeWaypointIndex;

              return (
                <div
                  key={wp.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: isCurrent
                      ? 'rgba(0, 242, 254, 0.15)'
                      : isDone
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: isCurrent
                      ? '1px solid #00F2FE'
                      : isDone
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: isDone
                        ? '#10B981'
                        : isCurrent
                        ? '#00F2FE'
                        : 'rgba(255, 255, 255, 0.1)',
                      color: isDone || isCurrent ? '#050E1F' : '#FFF',
                      fontSize: '11px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isDone ? '✓' : wp.id}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? '#00F2FE' : '#FFFFFF',
                    }}
                  >
                    {wp.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          VICTORY / COMPLETION MODAL OVERLAY
          ========================================================================= */}
      {flightPhase === 'completed' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(3, 8, 20, 0.85)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            animation: 'fadeIn 0.4s ease-out',
          }}
        >
          <div
            style={{
              width: '90%',
              maxWidth: '620px',
              background: 'linear-gradient(180deg, rgba(12, 28, 56, 0.95) 0%, rgba(6, 16, 36, 0.98) 100%)',
              border: '2px solid rgba(0, 242, 254, 0.5)',
              borderRadius: '24px',
              padding: '36px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 242, 254, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '20px',
            }}
          >
            {/* Header Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                borderRadius: '30px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10B981',
                color: '#10B981',
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '1px',
              }}
            >
              <span>🏆</span>
              <span>GÖREV TAMAMLANDI</span>
            </div>

            {/* Title & Description */}
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF' }}>
              İHA'nı tasarladın, görev modülünü seçtin ve uçuş rotasını başarıyla tamamladın.
            </div>

            {/* Kaşif Robot Mascot Speech Bubble */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                background: 'rgba(0, 242, 254, 0.1)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                borderRadius: '16px',
                padding: '14px 20px',
                textAlign: 'left',
              }}
            >
              <img
                src="/assets/kasif_3d.png"
                alt="Kaşif"
                style={{ width: '56px', height: '56px', objectFit: 'contain', flexShrink: 0 }}
              />
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  lineHeight: '1.4',
                }}
              >
                “Harika! İHA'n gökyüzünde. Millî Teknoloji yolculuğunun son durağına hazırsın!”
              </div>
            </div>

            {/* Mission Stats */}
            <div
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
              }}
            >
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)' }}>GÖREV MODÜLÜ</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#00F2FE', marginTop: '2px' }}>
                  {selectedSensor?.name || 'Termal Kamera'}
                </div>
              </div>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)' }}>TOPLAM MESAFE</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', marginTop: '2px' }}>
                  {FLIGHT_TELEMETRY.totalDistance}
                </div>
              </div>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)' }}>SEYİR İRTİFASI</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B', marginTop: '2px' }}>
                  {FLIGHT_TELEMETRY.cruisingAltitude}
                </div>
              </div>
            </div>

            {/* Big Primary CTA */}
            <button
              onClick={onFinishModule}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '14px',
                background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
                border: '1px solid #FDE68A',
                color: '#050E1F',
                fontSize: '18px',
                fontWeight: 900,
                letterSpacing: '1px',
                cursor: 'pointer',
                boxShadow: '0 8px 30px rgba(245, 158, 11, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginTop: '8px',
                transition: 'transform 0.2s ease',
              }}
            >
              <span>6. BÖLÜME GEÇ</span>
              <span style={{ fontSize: '22px' }}>→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
