import Phaser from 'phaser';
import { StartScene } from './scenes/StartScene';
import { WorldMapScene } from './scenes/WorldMapScene';
import { GobeklitepeScene } from './scenes/modules/GobeklitepeScene';
import { DemirCagiScene } from './scenes/modules/DemirCagiScene';
import { AnadoluUstaligiScene } from './scenes/modules/AnadoluUstaligiScene';
import { SanayilesmeScene } from './scenes/modules/SanayilesmeScene';
import { MilliTeknolojiScene } from './scenes/modules/MilliTeknolojiScene';
import { UzayTeknolojileriScene } from './scenes/modules/UzayTeknolojileriScene';

export const createGameConfig = (parentContainerId: string): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent: parentContainerId,
  width: 1920,
  height: 1080,
  backgroundColor: '#070B19',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1920,
    height: 1080,
  },
  input: {
    activePointers: 4, // Multi-touch kiosk support
    touch: {
      capture: true,
    },
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
  },
  scene: [
    StartScene,
    WorldMapScene,
    GobeklitepeScene,
    DemirCagiScene,
    AnadoluUstaligiScene,
    SanayilesmeScene,
    MilliTeknolojiScene,
    UzayTeknolojileriScene,
  ],
});
