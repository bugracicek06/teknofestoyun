import React, { useEffect } from 'react';
import { type MissionSensor, FLIGHT_TELEMETRY, WAYPOINTS } from '../../data/milliData';
import { SoundFx } from '../../game/utils/audio';

interface MilliStage4FlightProps {
  selectedSensor?: MissionSensor;
  onFinishModule: () => void;
}

export const MilliStage4Flight: React.FC<MilliStage4FlightProps> = ({
  selectedSensor,
  onFinishModule,
}) => {
  // Auto-transition to Chapter 6 after 2 seconds
  useEffect(() => {
    SoundFx.playVictoryFanfare();
    const timer = setTimeout(() => {
      onFinishModule();
    }, 2200);
    return () => clearTimeout(timer);
  }, [onFinishModule]);

  const handleManualProceed = () => {
    onFinishModule();
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
        padding: 'clamp(16px, 2.5vh, 32px) clamp(24px, 3vw, 48px)',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Central Glassmorphic Mission 5 Completion Modal */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1080px',
          background: 'linear-gradient(135deg, rgba(6, 18, 40, 0.94) 0%, rgba(3, 10, 24, 0.90) 100%)',
          borderRadius: '24px',
          border: '1.5px solid rgba(0, 242, 254, 0.35)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(16px)',
          padding: 'clamp(20px, 3vh, 32px) clamp(24px, 3.5vw, 40px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(14px, 2vh, 20px)',
          zIndex: 10,
        }}
      >
        {/* Header Ribbon */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 14px',
                borderRadius: '20px',
                background: 'rgba(0, 242, 254, 0.12)',
                border: '1px solid rgba(0, 242, 254, 0.4)',
                fontSize: '11px',
                fontWeight: 800,
                color: '#00F2FE',
                letterSpacing: '0.8px',
                marginBottom: '8px',
              }}
            >
              <span>✈️</span>
              <span>5. BÖLÜM: MİLLÎ TEKNOLOJİ TAMAMLANDI</span>
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(22px, 2.2vw, 28px)',
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '0.5px',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)',
              }}
            >
              GÖREV BAŞARIYLA TAMAMLANDI
            </h1>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: 'clamp(12px, 1.1vw, 13.5px)',
                color: 'rgba(255, 255, 255, 0.85)',
              }}
            >
              Pamukkale Üniversitesi Sivil İHA görevi tamamlandı. Sıradaki İstasyon: 6. Bölüm Uzay Teknolojileri
            </p>
          </div>

          {/* Success Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 18px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1.5px solid #10B981',
              borderRadius: '16px',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
            }}
          >
            <span style={{ fontSize: '28px' }}>✓</span>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#34D399', letterSpacing: '0.6px' }}>
                5. BÖLÜM
              </div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#FFFFFF' }}>
                BAŞARILI
              </div>
            </div>
          </div>
        </div>

        {/* 3 Summary Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
          }}
        >
          {/* Card 1: Assembled UAV */}
          <div
            style={{
              background: 'rgba(10, 25, 50, 0.75)',
              borderRadius: '16px',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#00F2FE',
                  letterSpacing: '0.6px',
                  marginBottom: '2px',
                }}
              >
                1. ETAP: HAVA ARACI
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                PAÜ Sivil İHA
              </div>
            </div>

            {/* Jet UAV Asset Preview */}
            <div
              style={{
                width: '100%',
                height: '90px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(ellipse at center, rgba(0, 242, 254, 0.08) 0%, transparent 70%)',
              }}
            >
              <img
                src="/assets/milli/uav_flight_stage3.png"
                alt="Pamukkale Üniversitesi Sivil İHA"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.6))',
                }}
              />
            </div>

            <div
              style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: '1.35',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                paddingTop: '6px',
              }}
            >
              ✓ Gövde, Kanat, Motor, Kuyruk ve İniş Takımı tamamlandı.
            </div>
          </div>

          {/* Card 2: Mission Sensor */}
          <div
            style={{
              background: 'rgba(10, 25, 50, 0.75)',
              borderRadius: '16px',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#F59E0B',
                  letterSpacing: '0.6px',
                  marginBottom: '2px',
                }}
              >
                2. ETAP: GÖREV MODÜLÜ
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                {selectedSensor?.name || 'Elektro-Optik Kamera'}
              </div>
            </div>

            {/* Sensor Thumbnail & Role */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {selectedSensor?.image && (
                <img
                  src={selectedSensor.image}
                  alt={selectedSensor.name}
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '10px',
                    objectFit: 'cover',
                    border: '1px solid rgba(0, 242, 254, 0.35)',
                    flexShrink: 0,
                  }}
                />
              )}
              <div>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '2px 6px',
                    borderRadius: '5px',
                    background: 'rgba(245, 158, 11, 0.18)',
                    color: '#FDE68A',
                    fontSize: '10px',
                    fontWeight: 700,
                    marginBottom: '3px',
                  }}
                >
                  {selectedSensor?.code || 'EO/IR'}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.3' }}>
                  {selectedSensor?.role || 'Gündüz / Gece Gözlemi'}
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: '1.35',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                paddingTop: '6px',
              }}
            >
              ✓ Gimbal yuvasına kilitlendi, veri akışı sağlandı.
            </div>
          </div>

          {/* Card 3: Route & Flight */}
          <div
            style={{
              background: 'rgba(10, 25, 50, 0.75)',
              borderRadius: '16px',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#10B981',
                  letterSpacing: '0.6px',
                  marginBottom: '2px',
                }}
              >
                3. ETAP: UÇUŞ ROTASI
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                4 / 4 Kontrol Noktası
              </div>
            </div>

            {/* Flight Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Kalkış:</span>
                <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{WAYPOINTS[0].name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Hedef Alan:</span>
                <span style={{ fontWeight: 700, color: '#FDE68A' }}>{WAYPOINTS[3].name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Mesafe:</span>
                <span style={{ fontWeight: 700, color: '#00F2FE' }}>{FLIGHT_TELEMETRY.totalDistance}</span>
              </div>
            </div>

            <div
              style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: '1.35',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                paddingTop: '6px',
              }}
            >
              ✓ Gözlem & Risk Sahasına güvenle ulaşıldı.
            </div>
          </div>
        </div>

        {/* Footer Area: Kaşif Mascot & Advance to Chapter 6 CTA Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            borderTop: '1px solid rgba(0, 242, 254, 0.2)',
            paddingTop: '14px',
          }}
        >
          {/* Kaşif Speech Bubble */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(0, 242, 254, 0.08)',
              borderRadius: '14px',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              padding: '10px 16px',
              flex: 1,
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(0, 242, 254, 0.15)',
                border: '1.5px solid #00F2FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00F2FE',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#FFFFFF',
                lineHeight: '1.4',
                fontWeight: 500,
              }}
            >
              <strong style={{ color: '#00F2FE' }}>Tebrikler Kaşif!</strong> Pamukkale Üniversitesi İHA görevini eksiksiz tamamladın. Şimdi maceranın son etabı olan 6. Bölüm: Uzay Teknolojileri'ne geçiyoruz!
            </div>
          </div>

          {/* Advance to Chapter 6 Button */}
          <button
            id="finish-mission-btn"
            onClick={handleManualProceed}
            style={{
              padding: '12px 28px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              border: '1.5px solid #6EE7B7',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 900,
              letterSpacing: '0.6px',
              cursor: 'pointer',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.5), 0 8px 20px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
              transition: 'all 0.3s ease',
            }}
          >
            <span>6. Bölüme Başla</span>
            <span style={{ fontSize: '16px' }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
