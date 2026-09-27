import React, { useState } from 'react';
import { MISSION_SENSORS, type MissionSensor } from '../../data/milliData';
import { SoundFx } from '../../game/utils/audio';

interface MilliStage2PayloadProps {
  onComplete: (sensorId: 'termal' | 'lidar' | 'multispektral') => void;
}

export const MilliStage2Payload: React.FC<MilliStage2PayloadProps> = ({ onComplete }) => {
  const [selectedSensor, setSelectedSensor] = useState<MissionSensor>(MISSION_SENSORS[0]);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isMountingAnim, setIsMountingAnim] = useState<boolean>(false);

  const handleSelectSensor = (sensor: MissionSensor) => {
    SoundFx.playClickTone();
    setSelectedSensor(sensor);
    setIsMounted(false);
  };

  const handleMountSensor = () => {
    if (isMounted || isMountingAnim) return;

    SoundFx.playGearSnap();
    setIsMountingAnim(true);

    setTimeout(() => {
      setIsMountingAnim(false);
      setIsMounted(true);
      SoundFx.playSuccessTone();
    }, 600);
  };

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
          MAIN CENTER STAGE: UAV ON HELIPAD + NOSE GIMBAL MOUNT + RIGHT SENSOR HUD
          ========================================================================= */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 30px',
          gap: '24px',
          minHeight: 0,
        }}
      >
        {/* Assembled UAV on Helipad */}
        <div
          style={{
            position: 'relative',
            flex: 1,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '90%',
              maxWidth: '850px',
              aspectRatio: '16/9',
            }}
          >
            {/* Fully Assembled UAV */}
            <img
              src="/assets/milli/uav_assembled.png"
              alt="Montajı Tamamlanmış İHA"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 15px 35px rgba(0, 0, 0, 0.6))',
              }}
            />

            {/* Nose Camera Gimbal Target Mount Box */}
            <div
              onClick={handleMountSensor}
              title="Sensör Yuvası"
              style={{
                position: 'absolute',
                left: '15.5%',
                top: '64%',
                width: '100px',
                height: '100px',
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                border: isMounted
                  ? '3px solid #10B981'
                  : '3px dashed #F59E0B',
                background: isMounted
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(245, 158, 11, 0.15)',
                boxShadow: isMounted
                  ? '0 0 30px rgba(16, 185, 129, 0.6)'
                  : '0 0 25px rgba(245, 158, 11, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isMounted ? 'default' : 'pointer',
                animation: isMounted ? 'none' : 'pulseGlow 2s infinite ease-in-out',
                transition: 'all 0.4s ease',
                zIndex: 15,
              }}
            >
              {isMounted ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  <span style={{ fontSize: '24px' }}>✓</span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      letterSpacing: '0.5px',
                    }}
                  >
                    TAKILDI
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>🎯</span>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      color: '#FDE68A',
                      lineHeight: '1.1',
                    }}
                  >
                    GÖREV YUVASI
                  </span>
                </div>
              )}
            </div>

            {/* Flying Sensor Animation when mounting */}
            {isMountingAnim && (
              <div
                style={{
                  position: 'absolute',
                  left: '15.5%',
                  top: '64%',
                  transform: 'translate(-50%, -50%) scale(0.6)',
                  width: '80px',
                  height: '80px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '2px solid #00F2FE',
                  boxShadow: '0 0 30px #00F2FE',
                  animation: 'snapToGimbal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  zIndex: 25,
                }}
              >
                <img
                  src={selectedSensor.image}
                  alt={selectedSensor.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Sensor Preview & Specifications */}
        <div
          style={{
            width: '380px',
            background: 'linear-gradient(180deg, rgba(8, 20, 42, 0.88) 0%, rgba(4, 12, 26, 0.96) 100%)',
            border: '1px solid rgba(0, 242, 254, 0.35)',
            borderRadius: '18px',
            padding: '20px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${selectedSensor.color}33, ${selectedSensor.color}11)`,
                border: `1px solid ${selectedSensor.color}88`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              {selectedSensor.id === 'termal' ? '🔥' : selectedSensor.id === 'lidar' ? '📡' : '🌱'}
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
                {selectedSensor.name}
              </div>
              <div style={{ fontSize: '11px', color: selectedSensor.color, fontWeight: 600 }}>
                {selectedSensor.role}
              </div>
            </div>
          </div>

          <p
            style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: '1.45',
              margin: 0,
            }}
          >
            {selectedSensor.shortDesc}
          </p>

          {/* Live Sensor Simulation Screen */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '140px',
              borderRadius: '12px',
              overflow: 'hidden',
              border: `1px solid ${selectedSensor.color}66`,
              background: '#040814',
            }}
          >
            {/* Simulation Canvas / Background according to sensor type */}
            {selectedSensor.id === 'termal' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background:
                    'radial-gradient(ellipse at 60% 40%, #ff3b00 0%, #aa0077 40%, #200050 75%, #050518 100%)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Crosshairs & Heat Spot */}
                <div
                  style={{
                    position: 'absolute',
                    top: '40%',
                    left: '60%',
                    transform: 'translate(-50%, -50%)',
                    width: '32px',
                    height: '32px',
                    border: '1px solid #FFDD00',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      background: '#FFFFFF',
                      borderRadius: '50%',
                    }}
                  />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '10px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#FFDD00',
                    background: 'rgba(0, 0, 0, 0.6)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  🔥 TESPİT: +42.6°C (Yüksek Sıcaklık Odaklı)
                </div>
              </div>
            )}

            {selectedSensor.id === 'lidar' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background:
                    'linear-gradient(180deg, #051428 0%, #020815 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* 3D Laser Grid Lines */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                      'linear-gradient(rgba(0, 242, 254, 0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 242, 254, 0.25) 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                    transform: 'perspective(200px) rotateX(45deg) translateY(20px)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '10px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#00F2FE',
                    background: 'rgba(0, 0, 0, 0.6)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  📡 3D NOKTA BULUTU: 120.000 pts/s
                </div>
              </div>
            )}

            {selectedSensor.id === 'multispektral' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background:
                    'radial-gradient(circle at 40% 50%, #10B981 0%, #047857 35%, #064E3B 70%, #022c22 100%)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '10px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#6EE7B7',
                    background: 'rgba(0, 0, 0, 0.6)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  🌱 NDVI BİTKİ SAĞLIĞI: 0.88 (Yüksek Canlılık)
                </div>
              </div>
            )}

            {/* Top Scanning Line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: selectedSensor.color,
                boxShadow: `0 0 10px ${selectedSensor.color}`,
                animation: 'scanline 2.5s infinite linear',
              }}
            />
          </div>

          {/* Feature Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {selectedSensor.features.map((feature, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.9)',
                }}
              >
                <span style={{ color: selectedSensor.color, fontSize: '13px' }}>●</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Mount Action Button */}
          {!isMounted ? (
            <button
              onClick={handleMountSensor}
              disabled={isMountingAnim}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
                border: '1px solid #FDE68A',
                color: '#050E1F',
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '0.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
                marginTop: '4px',
              }}
            >
              <span>✓ Bu Modülü Seç ve Tak</span>
            </button>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid #10B981',
                borderRadius: '10px',
                color: '#10B981',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              <span>✓</span>
              <span>Modül Başarıyla Entegre Edildi</span>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          BOTTOM DOCK: 3 CIVIL SENSORS + NEXT STEP CTA
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
        {/* Sensor Options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
          {MISSION_SENSORS.map(sensor => {
            const isSelected = selectedSensor.id === sensor.id;

            return (
              <button
                key={sensor.id}
                onClick={() => handleSelectSensor(sensor)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 16px',
                  background: isSelected
                    ? `linear-gradient(135deg, ${sensor.color}28, rgba(5, 25, 50, 0.8))`
                    : 'linear-gradient(135deg, rgba(20, 35, 60, 0.6), rgba(10, 20, 40, 0.8))',
                  border: isSelected
                    ? `2px solid ${sensor.color}`
                    : '1px solid rgba(0, 242, 254, 0.2)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                  boxShadow: isSelected
                    ? `0 0 20px ${sensor.color}44`
                    : 'none',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  minWidth: '220px',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#040914',
                    border: `1px solid ${sensor.color}66`,
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={sensor.image}
                    alt={sensor.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                    {sensor.name}
                  </div>
                  <div style={{ fontSize: '11px', color: sensor.color, fontWeight: 600 }}>
                    {sensor.role}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => onComplete(selectedSensor.id)}
          disabled={!isMounted}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 28px',
            background: isMounted
              ? 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)'
              : 'rgba(40, 50, 70, 0.5)',
            border: isMounted ? '1px solid #FDE68A' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: isMounted ? '#050E1F' : 'rgba(255, 255, 255, 0.4)',
            fontSize: '15px',
            fontWeight: 800,
            letterSpacing: '0.5px',
            cursor: isMounted ? 'pointer' : 'not-allowed',
            boxShadow: isMounted
              ? '0 6px 20px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
              : 'none',
            transform: isMounted ? 'scale(1)' : 'scale(0.98)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <span>Rotanı Belirlemeye Geç</span>
          <span style={{ fontSize: '18px' }}>→</span>
        </button>
      </div>
    </div>
  );
};
