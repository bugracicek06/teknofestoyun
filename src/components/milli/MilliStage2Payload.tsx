import React from 'react';
import { MISSION_SENSORS, type MilliSensorId } from '../../data/milliData';
import { SoundFx } from '../../game/utils/audio';
import {
  DroneSvgDefs,
  DroneFuselageGeometry,
  DroneWingGeometry,
  DroneMotorGeometry,
  DroneTailGeometry,
  DroneLandingGearGeometry,
} from './MilliDroneModel';

interface MilliStage2PayloadProps {
  selectedSensorId: MilliSensorId | null;
  onSelectSensor: (sensorId: MilliSensorId) => void;
  onComplete?: () => void;
}

export const MilliStage2Payload: React.FC<MilliStage2PayloadProps> = ({
  selectedSensorId,
  onSelectSensor,
}) => {
  const selectedSensor = MISSION_SENSORS.find(s => s.id === selectedSensorId) || null;

  const handleSelect = (sensorId: MilliSensorId) => {
    SoundFx.playClickTone();
    onSelectSensor(sensorId);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* =========================================================================
          1. LEFT HUD PANEL: TASK INSTRUCTIONS & SELECTION PROGRESS
          Comfortably spaced below top bar on 1920x1080 kiosk
          ========================================================================= */}
      <aside
        style={{
          position: 'absolute',
          top: 'clamp(28px, 4.5vh, 48px)',
          left: 'clamp(24px, 2.5vw, 40px)',
          width: 'clamp(290px, 20vw, 340px)',
          background: 'linear-gradient(135deg, rgba(6, 18, 38, 0.90) 0%, rgba(4, 12, 26, 0.80) 100%)',
          borderRadius: '16px',
          padding: '16px 20px',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 242, 254, 0.28)',
          boxShadow: '0 10px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          zIndex: 25,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none',
        }}
      >
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(0, 242, 254, 0.15)',
              border: '1px solid rgba(0, 242, 254, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#00F2FE',
              flexShrink: 0,
            }}
          >
            ⚙️
          </div>
          <div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '0.8px',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)',
              }}
            >
              GÖREV MODÜLÜNÜ SEÇ
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#00F2FE',
                letterSpacing: '0.6px',
                marginTop: '1px',
                textShadow: '0 0 10px rgba(0, 242, 254, 0.6)',
              }}
            >
              MİLLÎ TEKNOLOJİ, GÜVENLİ YARINLAR
            </div>
          </div>
        </div>

        {/* Instruction text */}
        <p
          style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.92)',
            lineHeight: '1.45',
            margin: 0,
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)',
          }}
        >
          İHA'nın görevine uygun sensörü seçerek görev modülünü tamamla.
        </p>

        {/* Görev Info Box */}
        <div
          style={{
            background: 'rgba(0, 242, 254, 0.08)',
            borderLeft: '3px solid #00F2FE',
            borderRadius: '6px',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              letterSpacing: '0.5px',
            }}
          >
            <span>🎯</span>
            <span>GÖREV</span>
          </div>
          <div
            style={{
              fontSize: '11px',
              color: '#FFFFFF',
              fontWeight: 600,
              lineHeight: '1.35',
            }}
          >
            Aşağıdaki sensör seçeneklerini incele ve görev için en uygun olanı seç.
          </div>
        </div>

        {/* Progress Tracker (0 / 1 -> 1 / 1) */}
        <div style={{ marginTop: '2px' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: selectedSensor ? '#10B981' : '#00F2FE',
              marginBottom: '6px',
              letterSpacing: '0.4px',
              textShadow: selectedSensor
                ? '0 0 10px rgba(16, 185, 129, 0.6)'
                : '0 0 10px rgba(0, 242, 254, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{selectedSensor ? '1 / 1 Sensör Seçildi' : '0 / 1 Sensör Seçildi'}</span>
            {selectedSensor && (
              <span style={{ fontSize: '11px', color: '#34D399', fontWeight: 700 }}>
                ✓ Hazır
              </span>
            )}
          </div>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.18)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: selectedSensor ? '100%' : '0%',
                background: 'linear-gradient(90deg, #00F2FE, #10B981)',
                borderRadius: '2px',
                transition: 'width 0.35s ease',
              }}
            />
          </div>
        </div>
      </aside>

      {/* =========================================================================
          2. CENTER STAGE: EXACT CIVILIAN UAV REUSED FROM STAGE 1
          No new aircraft design. Same component geometry & helipad shadows.
          ========================================================================= */}
      <div
        style={{
          position: 'relative',
          width: 'clamp(740px, 52vw, 980px)',
          aspectRatio: '1000 / 500',
          maxHeight: 'clamp(300px, 42vh, 440px)',
          transform: 'translateY(clamp(-16px, -2vh, 6px))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          viewBox="0 0 1000 500"
          width="100%"
          height="100%"
          style={{
            overflow: 'visible',
            filter: 'drop-shadow(0 16px 36px rgba(0, 0, 0, 0.85))',
          }}
        >
          <DroneSvgDefs />

          {/* Contact Shadows on Helipad */}
          <ellipse cx="480" cy="425" rx="350" ry="20" fill="rgba(1, 4, 10, 0.70)" filter="blur(10px)" />
          <ellipse cx="460" cy="423" rx="230" ry="12" fill="rgba(1, 3, 8, 0.85)" filter="blur(4px)" />
          <ellipse cx="275" cy="425" rx="16" ry="4" fill="rgba(0, 1, 4, 0.95)" filter="blur(1px)" />
          <ellipse cx="468" cy="425" rx="18" ry="4.5" fill="rgba(0, 1, 4, 0.95)" filter="blur(1px)" />
          <ellipse cx="618" cy="423" rx="18" ry="4.5" fill="rgba(0, 1, 4, 0.95)" filter="blur(1px)" />

          {/* Full Completed UAV Geometry */}
          <DroneWingGeometry section="right" />
          <DroneTailGeometry />
          <DroneFuselageGeometry />
          <DroneLandingGearGeometry />
          <DroneWingGeometry section="left" />
          <DroneMotorGeometry />

          {/* Subtle Nose Gimbal Sensor Mount Indicator */}
          {selectedSensor ? (
            <g id="mounted-sensor-indicator" style={{ animation: 'fadeIn 0.3s ease' }}>
              {/* Subtle cyan ring around nose gimbal */}
              <circle
                cx="204"
                cy="305"
                r="22"
                fill="none"
                stroke="#00F2FE"
                strokeWidth="2"
                opacity={0.9}
                filter="drop-shadow(0 0 6px rgba(0, 242, 254, 0.8))"
              />
              <circle
                cx="204"
                cy="305"
                r="27"
                fill="none"
                stroke="rgba(0, 242, 254, 0.4)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {/* Clean small badge */}
              <g transform="translate(142, 335)">
                <rect
                  width="124"
                  height="24"
                  rx="12"
                  fill="rgba(6, 18, 38, 0.88)"
                  stroke="#00F2FE"
                  strokeWidth="1.2"
                />
                <circle cx="14" cy="12" r="4.5" fill="#10B981" />
                <text
                  x="26"
                  y="16"
                  fill="#FFFFFF"
                  fontSize="9"
                  fontWeight="800"
                  letterSpacing="0.4"
                >
                  {selectedSensor.cardTitle} MODÜLÜ
                </text>
              </g>
              {/* Subtle dashed tether */}
              <line
                x1="204"
                y1="327"
                x2="204"
                y2="335"
                stroke="#00F2FE"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
            </g>
          ) : (
            <g id="idle-sensor-indicator">
              <circle
                cx="204"
                cy="305"
                r="22"
                fill="none"
                stroke="rgba(0, 242, 254, 0.45)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <g transform="translate(152, 336)">
                <rect
                  width="104"
                  height="22"
                  rx="11"
                  fill="rgba(6, 18, 38, 0.80)"
                  stroke="rgba(0, 242, 254, 0.35)"
                  strokeWidth="1"
                />
                <text
                  x="52"
                  y="15"
                  fill="#00F2FE"
                  fontSize="8.5"
                  fontWeight="700"
                  textAnchor="middle"
                  letterSpacing="0.4"
                >
                  GÖREV YUVASI
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* =========================================================================
          3. RIGHT SENSOR SPECIFICATIONS PANEL
          Comfortably spaced below top bar, does not overlap UAV or sensor cards
          ========================================================================= */}
      <aside
        style={{
          position: 'absolute',
          top: 'clamp(28px, 4.5vh, 48px)',
          right: 'clamp(24px, 2.5vw, 40px)',
          width: 'clamp(280px, 19vw, 330px)',
          background: 'linear-gradient(135deg, rgba(6, 18, 38, 0.90) 0%, rgba(4, 12, 26, 0.82) 100%)',
          borderRadius: '16px',
          padding: '16px 18px',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 242, 254, 0.28)',
          boxShadow: '0 10px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          zIndex: 25,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          transition: 'all 0.3s ease',
        }}
      >
        {selectedSensor ? (
          <>
            {/* Sensor Title Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: `linear-gradient(135deg, ${selectedSensor.color}33, ${selectedSensor.color}11)`,
                  border: `1px solid ${selectedSensor.color}88`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  flexShrink: 0,
                }}
              >
                {selectedSensor.id === 'elektro_optik'
                  ? '📷'
                  : selectedSensor.id === 'termal'
                  ? '🔥'
                  : '🌱'}
              </div>
              <div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 900,
                    color: '#FFFFFF',
                    letterSpacing: '0.5px',
                  }}
                >
                  {selectedSensor.cardTitle} SENSÖR
                </div>
                <div
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: selectedSensor.color,
                    letterSpacing: '0.4px',
                  }}
                >
                  {selectedSensor.role}
                </div>
              </div>
            </div>

            <div style={{ height: '1px', background: 'rgba(0, 242, 254, 0.18)' }} />

            {/* Feature Bullet Points */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#94A3B8',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                Sensör Özellikleri
              </div>
              {selectedSensor.features.map((feature, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.95)',
                    lineHeight: '1.4',
                  }}
                >
                  <span
                    style={{
                      color: selectedSensor.color,
                      fontSize: '14px',
                      lineHeight: '1.2',
                    }}
                  >
                    •
                  </span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* Active Integration Status */}
            <div
              style={{
                marginTop: '4px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ color: '#34D399', fontSize: '13px' }}>✓</span>
              <span style={{ fontSize: '11px', color: '#E2E8F0', fontWeight: 700 }}>
                İHA Gövdesine Entegre Edildi
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Unselected Default State */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(0, 242, 254, 0.12)',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: '#00F2FE',
                  flexShrink: 0,
                }}
              >
                📡
              </div>
              <div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 900,
                    color: '#FFFFFF',
                    letterSpacing: '0.5px',
                  }}
                >
                  SENSÖR BİLGİSİ
                </div>
                <div
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: '#00F2FE',
                    letterSpacing: '0.4px',
                  }}
                >
                  GÖREV MODÜLÜ DETAYI
                </div>
              </div>
            </div>

            <div style={{ height: '1px', background: 'rgba(0, 242, 254, 0.18)' }} />

            <p
              style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.85)',
                lineHeight: '1.5',
                margin: 0,
              }}
            >
              Görev modüllerinden birini seçerek özelliklerini incele.
            </p>

            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(0, 242, 254, 0.06)',
                border: '1px dashed rgba(0, 242, 254, 0.25)',
                fontSize: '11px',
                color: '#94A3B8',
                lineHeight: '1.4',
              }}
            >
              💡 Aşağıdaki 3 sensörden birine dokunarak teknik kabiliyetleri ve görev uyumluluğunu görüntüleyebilirsin.
            </div>
          </>
        )}
      </aside>

      {/* =========================================================================
          4. BOTTOM-CENTER SENSOR CARDS DOCK
          Uses ~65-72% screen width. Clean, compact cards with image, title, and button.
          ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          bottom: 'clamp(14px, 2.5vh, 28px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'clamp(620px, 68vw, 920px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'clamp(12px, 1.8vw, 24px)',
          zIndex: 25,
        }}
      >
        {MISSION_SENSORS.map(sensor => {
          const isSelected = selectedSensorId === sensor.id;
          return (
            <div
              key={sensor.id}
              id={`sensor-card-${sensor.id}`}
              onClick={() => handleSelect(sensor.id)}
              style={{
                cursor: 'pointer',
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(8, 28, 56, 0.95) 0%, rgba(4, 16, 36, 0.95) 100%)'
                  : 'linear-gradient(135deg, rgba(6, 18, 38, 0.88) 0%, rgba(3, 10, 24, 0.88) 100%)',
                border: isSelected
                  ? '2px solid #00F2FE'
                  : '1px solid rgba(0, 242, 254, 0.22)',
                borderRadius: '14px',
                padding: 'clamp(10px, 1.4vh, 14px)',
                boxShadow: isSelected
                  ? '0 0 24px rgba(0, 242, 254, 0.35), inset 0 0 16px rgba(0, 242, 254, 0.12)'
                  : '0 8px 24px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Sensor Image Box */}
              <div
                style={{
                  width: '100%',
                  height: 'clamp(82px, 11vh, 112px)',
                  borderRadius: '10px',
                  background: 'rgba(2, 6, 16, 0.88)',
                  border: isSelected
                    ? '1px solid rgba(0, 242, 254, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '6px',
                }}
              >
                <img
                  src={sensor.image}
                  alt={sensor.name}
                  style={{
                    maxHeight: '100%',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.7))',
                  }}
                />
              </div>

              {/* Title & Subtitle */}
              <div style={{ textAlign: 'center', margin: '2px 0' }}>
                <div
                  style={{
                    fontSize: 'clamp(13px, 1.1vw, 15px)',
                    fontWeight: 900,
                    color: '#FFFFFF',
                    letterSpacing: '0.8px',
                  }}
                >
                  {sensor.cardTitle}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(11px, 0.9vw, 12px)',
                    color: isSelected ? '#00F2FE' : 'rgba(255, 255, 255, 0.65)',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                  }}
                >
                  Sensör
                </div>
              </div>

              {/* Select Button Indicator */}
              <div
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  background: isSelected
                    ? 'linear-gradient(135deg, #00F2FE 0%, #0284C7 100%)'
                    : 'rgba(255, 255, 255, 0.06)',
                  border: isSelected
                    ? '1px solid #7DD3FC'
                    : '1px solid rgba(255, 255, 255, 0.15)',
                  color: isSelected ? '#031525' : 'rgba(255, 255, 255, 0.85)',
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                {isSelected ? (
                  <>
                    <span>✓</span>
                    <span>Seçildi</span>
                  </>
                ) : (
                  <>
                    <span>Seç</span>
                    <span>→</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
