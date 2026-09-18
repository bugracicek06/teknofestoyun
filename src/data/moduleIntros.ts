import { SceneKeys } from '../types/game.ts';

export interface ModuleIntroConfig {
  moduleId: string;
  sceneKey: string;
  stopNumber: number;
  stopLabel: string;
  title: string;
  subtitle: string;
  subtitleColorClass: string;
  accentColor: string;
  instruction: string;
  miniInstruction: string;
  backgroundImage: string;
  audioId: string;
}

export const MODULE_INTROS: Record<string, ModuleIntroConfig> = {
  gobeklitepe: {
    moduleId: 'gobeklitepe',
    sceneKey: SceneKeys.GOBEKLITEPE,
    stopNumber: 1,
    stopLabel: '1. DURAK',
    title: 'Göbeklitepe –',
    subtitle: 'Taşın Hafızası',
    subtitleColorClass: 'title-gold',
    accentColor: '#D4AF37',
    instruction: 'Hayvanı seç, sonra taş üzerindeki yerine dokun veya sürükle.',
    miniInstruction: 'Hayvanı seç, sonra taş üzerindeki yerine dokun veya sürükle.',
    backgroundImage: '/assets/module_intros/intro_gobeklitepe.webp',
    audioId: 'gobeklitepe',
  },
  demir_cagi: {
    moduleId: 'demir_cagi',
    sceneKey: SceneKeys.DEMIR_CAGI,
    stopNumber: 2,
    stopLabel: '2. DURAK',
    title: 'Demir Çağı –',
    subtitle: 'Ateşe Hükmet',
    subtitleColorClass: 'title-fire',
    accentColor: '#FF7A29',
    instruction: 'Malzemeleri ocağa taşı, sıcaklığı koru ve metali işle.',
    miniInstruction: 'Malzemeyi seç, ocağa taşı ve doğru aşamada işle.',
    backgroundImage: '/assets/module_intros/intro_demir_cagi.webp',
    audioId: 'demir_cagi',
  },
  anadolu_ustaligi: {
    moduleId: 'anadolu_ustaligi',
    sceneKey: SceneKeys.ANADOLU_USTALIGI,
    stopNumber: 3,
    stopLabel: '3. DURAK',
    title: 'Anadolu Ustalığı –',
    subtitle: 'Ustalığın İzleri',
    subtitleColorClass: 'title-amber',
    accentColor: '#F59E0B',
    instruction: 'Parçaları doğru sırayla yerleştir ve eseri tamamla.',
    miniInstruction: 'Parçayı seç, doğru konuma yerleştir.',
    backgroundImage: '/assets/module_intros/intro_anadolu_ustaligi.webp',
    audioId: 'anadolu_ustaligi',
  },
  sanayilesme: {
    moduleId: 'sanayilesme',
    sceneKey: SceneKeys.SANAYILESME,
    stopNumber: 4,
    stopLabel: '4. DURAK',
    title: 'Mühendislik –',
    subtitle: 'Mekanizmayı Kur',
    subtitleColorClass: 'title-cyan',
    accentColor: '#38BDF8',
    instruction: 'Parçaları topla, doğru yere yerleştir ve sistemi çalıştır.',
    miniInstruction: 'Parçayı seç, doğru konuma yerleştir ve sistemi tamamla.',
    backgroundImage: '/assets/module_intros/intro_muhendislik.webp',
    audioId: 'sanayilesme',
  },
  milli_teknoloji: {
    moduleId: 'milli_teknoloji',
    sceneKey: SceneKeys.MILLI_TEKNOLOJI,
    stopNumber: 5,
    stopLabel: '5. DURAK',
    title: 'Millî Teknoloji –',
    subtitle: 'Gökyüzüne Yüksel',
    subtitleColorClass: 'title-coral',
    accentColor: '#EF4444',
    instruction: 'Sensörünü seç, güvenli rotanı oluştur ve görevi tamamla.',
    miniInstruction: 'Sensörünü seç, güvenli rotanı oluştur ve görevi tamamla.',
    backgroundImage: '/assets/module_intros/intro_milli_teknoloji.webp',
    audioId: 'milli_teknoloji',
  },
  uzay_teknolojileri: {
    moduleId: 'uzay_teknolojileri',
    sceneKey: SceneKeys.UZAY_TEKNOLOJILERI,
    stopNumber: 6,
    stopLabel: '6. DURAK',
    title: 'Uzay Teknolojileri –',
    subtitle: 'Sıra Sende',
    subtitleColorClass: 'title-violet',
    accentColor: '#C084FC',
    instruction: 'Görevleri tamamla, uydunu yörüngeye yerleştir ve geleceği tasarla.',
    miniInstruction: 'Adımları tamamla ve uydunu yörüngeye yerleştir.',
    backgroundImage: '/assets/module_intros/intro_uzay_teknolojileri.webp',
    audioId: 'uzay_teknolojileri',
  },
};

const MODULE_ALIASES: Record<string, string> = {
  gobeklitepe: 'gobeklitepe',
  demir_cagi: 'demir_cagi',
  'demir-cagi': 'demir_cagi',
  anadolu_ustaligi: 'anadolu_ustaligi',
  'anadolu-ustaligi': 'anadolu_ustaligi',
  sanayilesme: 'sanayilesme',
  muhendislik: 'sanayilesme',
  'mühendislik': 'sanayilesme',
  milli_teknoloji: 'milli_teknoloji',
  'milli-teknoloji': 'milli_teknoloji',
  'millî_teknoloji': 'milli_teknoloji',
  'millî-teknoloji': 'milli_teknoloji',
  uzay_teknolojileri: 'uzay_teknolojileri',
  'uzay-teknolojileri': 'uzay_teknolojileri',
};

export function getModuleIntroConfig(moduleId?: string): ModuleIntroConfig | undefined {
  if (!moduleId) return undefined;
  const key = MODULE_ALIASES[moduleId] || moduleId.toLowerCase().replace(/-/g, '_');
  return MODULE_INTROS[key] || MODULE_INTROS[moduleId];
}

export function getModuleIntroBySceneKey(sceneKey?: string): ModuleIntroConfig | undefined {
  if (!sceneKey) return undefined;
  return Object.values(MODULE_INTROS).find((item) => item.sceneKey === sceneKey);
}
