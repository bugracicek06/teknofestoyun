import type { GameModuleInfo } from '../types/game';
import { SceneKeys } from '../types/game';

export const GAME_MODULES: GameModuleInfo[] = [
  {
    id: 'gobeklitepe',
    sceneKey: SceneKeys.GOBEKLITEPE,
    title: 'Göbeklitepe',
    era: 'Tarihin Sıfır Noktası (M.Ö. 9600)',
    description: 'İlk tapınak yapıları, taş işçiliği ve insanlığın mimari ile ilk büyük buluşması.',
    icon: '🏛️',
    accentColor: 0xd4af37, // Altın sarısı
    hexColor: '#D4AF37',
  },
  {
    id: 'demir_cagi',
    sceneKey: SceneKeys.DEMIR_CAGI,
    title: 'Demir Çağı',
    era: 'Madencilik ve Metalurji Devrimi',
    description: 'Anadolu topraklarında demirin ergitilmesi, örs ve çekiçle form kazanması.',
    icon: '⚒️',
    accentColor: 0xe67e22, // Yanık turuncu / kor demir
    hexColor: '#E67E22',
  },
  {
    id: 'anadolu_ustaligi',
    sceneKey: SceneKeys.ANADOLU_USTALIGI,
    title: 'Anadolu Ustalığı',
    era: 'Selçuklu ve Osmanlı Zanaat Kültürü',
    description: 'Ahilik gelenekleri, çini, bakırcılık ve mekanik saatler.',
    icon: '🕌',
    accentColor: 0x00f2fe, // Turkuaz
    hexColor: '#00F2FE',
  },
  {
    id: 'sanayilesme',
    sceneKey: SceneKeys.SANAYILESME,
    title: 'Bilim ve Sanayileşme',
    era: 'Mekanik Güç & Dişli Aktarımı',
    description: 'Büyükten küçüğe dişli aktarımı, tork dönüşümü ve modern sanayileşme.',
    icon: '⚙️',
    accentColor: 0x00f2fe, // Turkuaz / Mühendislik Mavisi
    hexColor: '#00F2FE',
  },
  {
    id: 'milli_teknoloji',
    sceneKey: SceneKeys.MILLI_TEKNOLOJI,
    title: 'Millî Teknoloji',
    era: 'Yerli Mühendislik & İHA/SİHA Çağı',
    description: 'Yüksek teknoloji, havacılık, savunma ve yerli mühendislik hamlesi.',
    icon: '✈️',
    accentColor: 0x3498db, // Gökyüzü mavisi
    hexColor: '#3498DB',
  },
  {
    id: 'uzay_teknolojileri',
    sceneKey: SceneKeys.UZAY_TEKNOLOJILERI,
    title: 'Uzay Teknolojileri',
    era: 'Geleceğin Ufukları & Derin Uzay',
    description: 'Milli uydu sistemleri, uzay gözlem ve geleceğin teknoloji vizyonu.',
    icon: '🚀',
    accentColor: 0x9b59b6, // Derin uzay moru
    hexColor: '#9B59B6',
  },
];
