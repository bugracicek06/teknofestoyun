import React, { useState, useEffect } from 'react';

export const KioskOverlay: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen request rejected or not supported:', err);
    }
  };

  return (
    <div className="kiosk-controls">
      <button
        onClick={toggleFullscreen}
        className="kiosk-btn"
        title="Tam Ekran Kiosk Modu"
        aria-label="Tam Ekran Kiosk Modu"
      >
        {isFullscreen ? '↙ Tam Ekrandan Çık' : '⤢ Tam Ekran (Kiosk)'}
      </button>
    </div>
  );
};
