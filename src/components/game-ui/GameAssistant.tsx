import React, { useState, useEffect, useCallback } from 'react';
import robotAsset from '../../assets/assistant/guide-robot.png';
import { EventBus } from '../../game/state/EventBus';
import './gameUi.css';

export interface GameAssistantProps {
  message: string;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onToggle?: (open: boolean) => void;
  visible?: boolean;
  placement?: 'bottom-left' | 'bottom-right';
  accentKey?: 'gobeklitepe' | 'demir_cagi' | 'anadolu_ustaligi' | 'sanayilesme' | 'milli_teknoloji' | 'uzay_teknolojileri';
  onDismiss?: () => void;
  isNarrating?: boolean;
  onListenNarration?: () => void;
}

export const GameAssistant: React.FC<GameAssistantProps> = ({
  message,
  isOpen,
  defaultOpen = false,
  onToggle,
  visible = true,
  placement = 'bottom-left',
  accentKey,
  onDismiss,
  isNarrating = false,
  onListenNarration,
}) => {
  // Varsayılan olarak tüyo balonu KAPALIDIR (assistantOpen = false)
  const [internalOpen, setInternalOpen] = useState<boolean>(defaultOpen);
  const bubbleOpen = isOpen !== undefined ? isOpen : internalOpen;

  const setOpenState = useCallback((nextState: boolean) => {
    if (isOpen === undefined) {
      setInternalOpen(nextState);
    }
    onToggle?.(nextState);
    if (!nextState) {
      onDismiss?.();
    }
  }, [isOpen, onToggle, onDismiss]);

  // EventBus üzerinden üst bar veya dış olaylarla tetiklenebilme
  useEffect(() => {
    const handleToggle = () => {
      setOpenState(!bubbleOpen);
    };
    const handleOpen = () => {
      setOpenState(true);
    };
    const handleClose = () => {
      setOpenState(false);
    };

    EventBus.on('toggle-assistant', handleToggle);
    EventBus.on('open-assistant', handleOpen);
    EventBus.on('close-assistant', handleClose);

    return () => {
      EventBus.off('toggle-assistant', handleToggle);
      EventBus.off('open-assistant', handleOpen);
      EventBus.off('close-assistant', handleClose);
    };
  }, [bubbleOpen, setOpenState]);

  if (!visible) {
    return null;
  }

  const handleAvatarClick = () => {
    setOpenState(!bubbleOpen);
  };

  const handleCloseBubble = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenState(false);
  };

  return (
    <div
      className={`game-assistant-wrapper placement-${placement}`}
      data-module-accent={accentKey}
      role="region"
      aria-label="Rehber Robot Asistan"
    >
      {/* Speech Bubble (Yalnızca tıklandığında açılır, oyunu engellemez) */}
      {bubbleOpen && (
        <div
          id="assistant-speech-bubble"
          className="assistant-speech-bubble"
          role="status"
          aria-live="polite"
        >
          <div className="assistant-bubble-header">
            <span className="assistant-bubble-name">Kaşif • Rehber Asistan</span>
            <button
              type="button"
              className="assistant-bubble-close-btn"
              onClick={handleCloseBubble}
              aria-label="Balonu Kapat"
              title="Kapat"
            >
              ×
            </button>
          </div>

          <p className="assistant-bubble-message">{message}</p>

          {onListenNarration && (
            <div className="assistant-bubble-actions">
              <button
                type="button"
                className="assistant-btn-listen"
                onClick={onListenNarration}
                aria-label="Sesli Yönergeyi Dinle"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
                <span>{isNarrating ? 'Durdur' : 'Yönergeyi Dinle'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Robot Mascot Button (Rehber Asistan) */}
      <button
        type="button"
        className="assistant-avatar-btn"
        onClick={handleAvatarClick}
        aria-expanded={bubbleOpen}
        aria-controls="assistant-speech-bubble"
        aria-label={bubbleOpen ? 'Asistan İpucunu Gizle' : 'Kaşif Rehber Asistandan İpucu Al'}
        title="Kaşif'e dokunarak ipucunu aç/kapat"
      >
        <img
          src={robotAsset}
          alt="Kaşif Rehber Robot"
          className="assistant-robot-img"
          draggable={false}
        />
        <div className="assistant-pulse-glow" aria-hidden="true" />
        
        {/* Subtle TÜYO pill indicator */}
        <span className="assistant-hint-badge" aria-hidden="true">
          {bubbleOpen ? 'KAPAT' : '💡 TÜYO'}
        </span>
      </button>
    </div>
  );
};
