export const SceneKeys = {
  BOOT: 'BootScene',
  START: 'StartScene',
  WORLD_MAP: 'WorldMapScene',

  // 6 Main Game Modules
  GOBEKLITEPE: 'GobeklitepeScene',
  DEMIR_CAGI: 'DemirCagiScene',
  ANADOLU_USTALIGI: 'AnadoluUstaligiScene',
  SANAYILESME: 'SanayilesmeScene',
  SERINHISAR_BICAKCILIGI: 'SanayilesmeScene',
  MILLI_TEKNOLOJI: 'MilliTeknolojiScene',
  UZAY_TEKNOLOJILERI: 'UzayTeknolojileriScene',
} as const;

export type SceneKeys = (typeof SceneKeys)[keyof typeof SceneKeys];

export interface GameModuleInfo {
  id: string;
  sceneKey: SceneKeys;
  title: string;
  era: string;
  description: string;
  icon: string;
  accentColor: number; // Hex number for Phaser graphics
  hexColor: string; // CSS hex color
}

export interface GameState {
  currentScene: SceneKeys;
  selectedModule?: string;
  isAudioMuted: boolean;
  score: number;
}
