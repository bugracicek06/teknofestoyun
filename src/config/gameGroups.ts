// Centralized Game Groups Configuration
// Pamukkale University & TEKNOFEST Medeniyetten Millî Teknolojiye
// Single Source of Truth for 3 Independent Games (2 modules each)

export type GameGroupId = 'game-1' | 'game-2' | 'game-3';

export interface GameGroupConfig {
  id: GameGroupId;
  gameNumber: number; // 1, 2, 3
  badge: string; // 'OYUN 1'
  title: string; // 'MEDENİYETİN DOĞUŞU'
  shortTitle: string; // 'Medeniyetin Doğuşu'
  subtitle: string; // 'Göbeklitepe + Demir Çağı'
  tagline: string; // '2 Bölüm'
  modules: [string, string]; // Canonical module IDs
  numericModules: [number, number]; // [1, 2], [3, 4], [5, 6]
  moduleNames: [string, string];
  moduleSubtitles: [string, string];
  completionText: string;
  accentColor: string;
  themeGradient: string;
  icon: string;
  description: string;
}

export const GAME_GROUPS: Record<GameGroupId, GameGroupConfig> = {
  'game-1': {
    id: 'game-1',
    gameNumber: 1,
    badge: 'OYUN 1',
    title: 'MEDENİYETİN DOĞUŞU',
    shortTitle: 'Medeniyetin Doğuşu',
    subtitle: 'Göbeklitepe + Demir Çağı',
    tagline: '2 Bölüm',
    modules: ['gobeklitepe', 'demir_cagi'],
    numericModules: [1, 2],
    moduleNames: ['Göbeklitepe', 'Demir Çağı'],
    moduleSubtitles: ['Taşın Hafızası', 'Ateşe Hükmet'],
    completionText: 'Medeniyetin Doğuşu yolculuğunu başarıyla tamamladın.',
    accentColor: '#E5A93C',
    themeGradient: 'linear-gradient(135deg, rgba(229, 169, 60, 0.22) 0%, rgba(14, 28, 48, 0.85) 100%)',
    icon: '🏛️',
    description: 'Tarihin sıfır noktası Göbeklitepe ve ateşe hükmeden kadim Demir Çağı demirciliği.',
  },
  'game-2': {
    id: 'game-2',
    gameNumber: 2,
    badge: 'OYUN 2',
    title: 'USTALIKTAN SANAYİYE',
    shortTitle: 'Ustalıktan Sanayiye',
    subtitle: 'Anadolu Ustalığı + Devrim Otomobili',
    tagline: '2 Bölüm',
    modules: ['anadolu_ustaligi', 'sanayilesme'],
    numericModules: [3, 4],
    moduleNames: ['Anadolu Ustalığı', 'Devrim Otomobili'],
    moduleSubtitles: ['Ustalığın İzleri', 'Geleceği Üreten Türkiye'],
    completionText: 'Ustalıktan Sanayiye yolculuğunu başarıyla tamamladın.',
    accentColor: '#00D2D3',
    themeGradient: 'linear-gradient(135deg, rgba(0, 210, 211, 0.22) 0%, rgba(14, 28, 48, 0.85) 100%)',
    icon: '⚙️',
    description: 'Geleneksel Anadolu çini ustalığı ve Türkiye’nin ilk yerli otomobili Devrim’in motor montajı.',
  },
  'game-3': {
    id: 'game-3',
    gameNumber: 3,
    badge: 'OYUN 3',
    title: 'MİLLÎ TEKNOLOJİDEN UZAYA',
    shortTitle: 'Millî Teknolojiden Uzaya',
    subtitle: 'Millî Teknoloji + Uzay Teknolojileri',
    tagline: '2 Bölüm',
    modules: ['milli_teknoloji', 'uzay_teknolojileri'],
    numericModules: [5, 6],
    moduleNames: ['Millî Teknoloji', 'Uzay Teknolojileri'],
    moduleSubtitles: ['Gökyüzüne Yüksel', 'Sıra Sende'],
    completionText: 'Millî Teknolojiden Uzaya yolculuğunu başarıyla tamamladın.',
    accentColor: '#7057FF',
    themeGradient: 'linear-gradient(135deg, rgba(112, 87, 255, 0.22) 0%, rgba(14, 28, 48, 0.85) 100%)',
    icon: '🚀',
    description: 'Sivil havacılıkta yerli İHA üretimi ve derin uzay gözlem uydularının montaj ve yörünge görevi.',
  },
};

export const GAME_GROUP_LIST: GameGroupConfig[] = Object.values(GAME_GROUPS);

/**
 * Normalizes moduleId alias (e.g. serinhisar_bicakciligi -> sanayilesme)
 */
export function normalizeModuleId(moduleId: string): string {
  if (moduleId === 'serinhisar_bicakciligi') return 'sanayilesme';
  return moduleId;
}

/**
 * Resolves which GameGroup a moduleId belongs to.
 */
export function getGameGroupByModuleId(moduleId: string): GameGroupConfig | undefined {
  const norm = normalizeModuleId(moduleId);
  return GAME_GROUP_LIST.find(group => group.modules.includes(norm as any));
}

/**
 * Resolves GameGroup by its ID ('game-1', 'game-2', 'game-3').
 */
export function getGameGroupById(gameId?: string | null): GameGroupConfig | undefined {
  if (!gameId) return undefined;
  return GAME_GROUPS[gameId as GameGroupId];
}

/**
 * Returns the step number (1 or 2) of a module within its game group.
 */
export function getModuleStepInGame(moduleId: string, gameId?: GameGroupId | null): 1 | 2 {
  const norm = normalizeModuleId(moduleId);
  const group = gameId ? GAME_GROUPS[gameId] : getGameGroupByModuleId(norm);
  if (!group) return 1;
  return group.modules[1] === norm ? 2 : 1;
}

/**
 * Checks if a module is the first module in its game group.
 */
export function isFirstModuleOfGame(moduleId: string, gameId?: GameGroupId | null): boolean {
  return getModuleStepInGame(moduleId, gameId) === 1;
}

/**
 * Checks if a module is the second (final) module in its game group.
 */
export function isSecondModuleOfGame(moduleId: string, gameId?: GameGroupId | null): boolean {
  return getModuleStepInGame(moduleId, gameId) === 2;
}

/**
 * Returns the next module ID within the game group, or null if it's the last module.
 */
export function getNextModuleInGame(moduleId: string, gameId?: GameGroupId | null): string | null {
  const norm = normalizeModuleId(moduleId);
  const group = gameId ? GAME_GROUPS[gameId] : getGameGroupByModuleId(norm);
  if (!group) return null;
  if (group.modules[0] === norm) {
    return group.modules[1];
  }
  return null;
}

/**
 * Checks if both modules in a game group are completed.
 */
export function areGameModulesCompleted(gameId: GameGroupId, completedModuleIds: string[]): boolean {
  const group = GAME_GROUPS[gameId];
  if (!group || !Array.isArray(completedModuleIds)) return false;
  return group.modules.every(id => completedModuleIds.includes(id));
}
