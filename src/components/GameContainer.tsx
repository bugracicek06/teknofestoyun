import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from '../game/config';

interface GameContainerProps {
  onGameReady?: (game: Phaser.Game) => void;
}

export const GameContainer: React.FC<GameContainerProps> = ({ onGameReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Ensure container ID is unique
    const containerId = 'phaser-kiosk-canvas';
    containerRef.current.id = containerId;

    // Prevent default touch gestures on the container level (pinch, zoom, scroll)
    const preventTouchDefault = (e: TouchEvent) => {
      const touchEv = e as TouchEvent & { scale?: number };
      if (touchEv.touches.length > 1 || (touchEv.scale !== undefined && touchEv.scale !== 1)) {
        e.preventDefault();
      }
    };

    const element = containerRef.current;
    element.addEventListener('touchstart', preventTouchDefault, { passive: false });
    element.addEventListener('touchmove', preventTouchDefault, { passive: false });

    // Instantiate Phaser Game
    const config = createGameConfig(containerId);
    const phaserGame = new Phaser.Game(config);
    gameRef.current = phaserGame;

    if (onGameReady) {
      onGameReady(phaserGame);
    }

    // Cleanup on unmount
    return () => {
      element.removeEventListener('touchstart', preventTouchDefault);
      element.removeEventListener('touchmove', preventTouchDefault);

      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [onGameReady]);

  return (
    <div
      ref={containerRef}
      className="game-canvas-container"
      style={{
        width: '100%',
        height: '100%',
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    />
  );
};
