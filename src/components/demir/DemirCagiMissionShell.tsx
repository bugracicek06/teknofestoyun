import React, { useState, useEffect } from 'react';
import { GameTopBar, GameAssistant } from '../game-ui';
import './demirCagiShell.css';

export interface DemirCagiMissionShellProps {
  missionTitle: string;
  progressText: string;
  timeText: string;
  assistantMessage: string;
  isAudioMuted: boolean;
  fullscreen: boolean;
  onBack: () => void;
  onToggleAudio: () => void;
  onHelp?: () => void;
  onPause: () => void;
  onToggleFullscreen: () => void;
}

export const DemirCagiMissionShell: React.FC<DemirCagiMissionShellProps> = ({
  missionTitle,
  progressText,
  timeText,
  assistantMessage,
  isAudioMuted,
  fullscreen,
  onBack,
  onToggleAudio,
  onHelp,
  onPause,
  onToggleFullscreen,
}) => {
  const [assistantOpen, setAssistantOpen] = useState<boolean>(false);

  // Stage veya görev başlığı değiştiğinde tüyoyu otomatik kapat
  useEffect(() => {
    setAssistantOpen(false);
  }, [missionTitle]);

  const handleHelpToggle = () => {
    setAssistantOpen((prev) => !prev);
    onHelp?.();
  };

  return (
    <div className="demir-cagi-mission-shell" role="region" aria-label="Demir Çağı Görev Ekranı">
      {/* 1. STANDARDIZED TOP BAR */}
      <GameTopBar
        moduleNumber={2}
        moduleTitle="Demir Çağı"
        moduleSubtitle="Ateşe Hükmet"
        missionTitle={missionTitle || 'Demir Cevheri ve Kömürü Ocağa Sürükle'}
        progressText={progressText || '0 / 2'}
        timeText={timeText || '00:00'}
        accentKey="demir_cagi"
        isAudioMuted={isAudioMuted}
        isFullscreen={fullscreen}
        onBack={onBack}
        onToggleAudio={onToggleAudio}
        onHelp={handleHelpToggle}
        onPause={onPause}
        onToggleFullscreen={onToggleFullscreen}
      />

      {/* 2. GAMEPLAY VIEWPORT (Zero-blocking pass-through layer over the Phaser forge canvas) */}
      <div className="demir-cagi-gameplay-viewport" aria-hidden="true" />

      {/* 3. STANDARDIZED GUIDE ROBOT ASSISTANT (Far-left non-blocking compact placement) */}
      <GameAssistant
        message={assistantMessage || 'Kızıl demir cevheri ve meşe kömürünü ocağa sürükle.'}
        isOpen={assistantOpen}
        onToggle={setAssistantOpen}
        placement="bottom-left"
        accentKey="demir_cagi"
      />
    </div>
  );
};
