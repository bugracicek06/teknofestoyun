export interface CiniObject {
  id: 'tabak' | 'pano' | 'karo';
  name: string;
  subTitle: string;
  description: string;
  icon: string;
}

export interface CiniMotif {
  id: 'lale' | 'karanfil' | 'rumi' | 'hatayi' | 'geometrik' | 'yaprak';
  name: string;
  meaning: string;
  description: string;
  iconColor: string;
}

export interface CiniColor {
  id: string;
  name: string;
  meaning: string;
  hex: string;
  lightHex: string;
  borderHex: string;
}

export const CINI_OBJECTS: CiniObject[] = [
  {
    id: 'tabak',
    name: 'Tabak',
    subTitle: 'Geleneksel Duvar & Sofra Tabağı',
    description: 'Osmanlı saray ziyafetlerini ve duvarlarını süsleyen en zarif çini formu.',
    icon: '🍽️',
  },
  {
    id: 'pano',
    name: 'Oval Pano',
    subTitle: 'Geleneksel Duvar Panosu',
    description: 'Osmanlı mimarisini ve saray duvarlarını süsleyen simetrik oval seramik pano.',
    icon: '🖼️',
  },
  {
    id: 'karo',
    name: 'Karo',
    subTitle: 'Mimari Duvar Karosu',
    description: 'Camileri, medreseleri ve köşkleri sonsuzluk hissiyle bezeyen kare çini.',
    icon: '🧱',
  },
];

export const CINI_MOTIFS: CiniMotif[] = [
  {
    id: 'lale',
    name: 'Lale',
    meaning: 'Zarafet & Tevazu',
    description: 'Osmanlı sanatının zarafet ve tevazu simgesi.',
    iconColor: '#DC2626',
  },
  {
    id: 'karanfil',
    name: 'Karanfil',
    meaning: 'Bolluk & Bahar',
    description: 'Bolluk, bereket ve baharın habercisi taraklı karanfil.',
    iconColor: '#EF4444',
  },
  {
    id: 'rumi',
    name: 'Rumi',
    meaning: 'Sonsuzluk & Akış',
    description: 'Kanat ve kuş figürlerinden doğan kadim Türk motifi.',
    iconColor: '#0047AB',
  },
  {
    id: 'hatayi',
    name: 'Hatayi',
    meaning: 'Doğanın Zarafeti',
    description: 'Doğadaki çiçeklerin stilize edilmiş dairesel formu.',
    iconColor: '#1E40AF',
  },
  {
    id: 'geometrik',
    name: 'Saray Karosu',
    meaning: 'Hatayi, Lale & Rumi',
    description: 'Merkezinde büyük Hatayi, tepesinde zarif lale ve yanlarında karanfilleriyle klasik Osmanlı karo kompozisyonu.',
    iconColor: '#1554A4',
  },
  {
    id: 'yaprak',
    name: 'Yaprak',
    meaning: 'Canlılık & Yaşam',
    description: 'Kıvrımlı saz yaprakları ve bahar dalları.',
    iconColor: '#15803D',
  },
];

/**
 * 6 Authentic Anatolian Ceramic Pigments (Simplified High-Clarity Palette)
 * Kırmızı, Sarı, Yeşil, Mavi, Turkuaz, Mor
 */
export const CINI_COLORS: CiniColor[] = [
  {
    id: 'kirmizi',
    name: 'Kırmızı',
    meaning: 'Kuvvet & Hayat',
    hex: '#E53935',
    lightHex: '#EF5350',
    borderHex: '#B71C1C',
  },
  {
    id: 'sari',
    name: 'Sarı',
    meaning: 'Işık & Neşe',
    hex: '#F5B700',
    lightHex: '#FDD835',
    borderHex: '#F57F17',
  },
  {
    id: 'yesil',
    name: 'Yeşil',
    meaning: 'Doğa & Bereket',
    hex: '#1E9B50',
    lightHex: '#4CAF50',
    borderHex: '#1B5E20',
  },
  {
    id: 'mavi',
    name: 'Mavi',
    meaning: 'Huzur & Derinlik',
    hex: '#245DB5',
    lightHex: '#42A5F5',
    borderHex: '#0D47A1',
  },
  {
    id: 'turkuaz',
    name: 'Turkuaz',
    meaning: 'Dinginlik & Umut',
    hex: '#16B6C8',
    lightHex: '#26C6DA',
    borderHex: '#00838F',
  },
  {
    id: 'mor',
    name: 'Mor',
    meaning: 'Görkem & Asalet',
    hex: '#8434C6',
    lightHex: '#AB47BC',
    borderHex: '#4A148C',
  },
];

export const CINI_EXPANDED_PALETTE: CiniColor[] = CINI_COLORS;

export const getCiniColorByHex = (hex: string): CiniColor => {
  const normalized = (hex || '').trim().toLowerCase();
  const found = CINI_COLORS.find((c) => c.hex.toLowerCase() === normalized);
  if (found) return found;

  // Legacy hex mappings for backward compatibility
  if (normalized === '#1554a4' || normalized === '#183c82' || normalized === '#0047ab') return CINI_COLORS[3]; // Mavi
  if (normalized === '#d92f2f' || normalized === '#dc2626' || normalized === '#ff6b5c') return CINI_COLORS[0]; // Kırmızı
  if (normalized === '#f2b705' || normalized === '#f4efe3') return CINI_COLORS[1]; // Sarı
  if (normalized === '#159447' || normalized === '#15803d' || normalized === '#1b5e38') return CINI_COLORS[2]; // Yeşil
  if (normalized === '#35c8f0' || normalized === '#16b6c9') return CINI_COLORS[4]; // Turkuaz
  if (normalized === '#8025c7' || normalized === '#e64291') return CINI_COLORS[5]; // Mor

  return {
    id: 'custom',
    name: 'Özel Renk',
    meaning: 'Sanat',
    hex: hex,
    lightHex: hex,
    borderHex: hex,
  };
};

export const getCiniColor = (idOrHex: string): CiniColor => {
  const normalized = (idOrHex || '').trim().toLowerCase();
  const foundById = CINI_COLORS.find((c) => c.id === normalized);
  if (foundById) return foundById;

  // Backward compatibility aliases
  if (normalized === 'kobalt' || normalized === 'lacivert') return CINI_COLORS[3]; // Mavi
  if (normalized === 'iznik_kirmizi' || normalized === 'mercan') return CINI_COLORS[0]; // Kırmızı
  if (normalized === 'altin_sari') return CINI_COLORS[1]; // Sarı
  if (normalized === 'zumrut') return CINI_COLORS[2]; // Yeşil
  if (normalized === 'acik_turkuaz') return CINI_COLORS[4]; // Turkuaz
  if (normalized === 'pembe') return CINI_COLORS[5]; // Mor
  if (normalized === 'toprak' || normalized === 'kahverengi') return CINI_COLORS[0]; // Kırmızı
  if (normalized === 'krem') return CINI_COLORS[1]; // Sarı

  return getCiniColorByHex(idOrHex);
};

export interface CiniBrush {
  id: 'ince' | 'orta' | 'genis' | 'sunger';
  name: string;
  subTitle: string;
  icon: string;
}

export const CINI_BRUSHES: CiniBrush[] = [
  {
    id: 'ince',
    name: 'İnce',
    subTitle: 'Detay & Tahrir',
    icon: 'fine',
  },
  {
    id: 'orta',
    name: 'Orta',
    subTitle: 'Klasik Fırça',
    icon: 'round',
  },
  {
    id: 'genis',
    name: 'Geniş',
    subTitle: 'Doldurma',
    icon: 'flat',
  },
  {
    id: 'sunger',
    name: 'Sünger',
    subTitle: 'Doku & Gözenek',
    icon: 'sponge',
  },
];

export type PaletteRole = 'primary' | 'secondary' | 'accent';

export interface PaintedRegion {
  regionId: string;
  colorId: string;
  colorHex: string;
}

export interface MotifRegionDef {
  id: string;
  name: string;
  order: number;
  center: { x: number; y: number };
  defaultColor: string;
  paletteRole: PaletteRole;
  labelPosition?: { x: number; y: number };
}

export const MOTIF_REGION_DEFINITIONS: Record<string, MotifRegionDef[]> = {
  lale: [
    { id: 'motif-lale-top-flower', name: 'Üst Lale Rozeti', order: 1, center: { x: 300, y: 110 }, defaultColor: '#245DB5', paletteRole: 'primary' },
    { id: 'motif-lale-center', name: 'Merkez Lale Gövdesi', order: 2, center: { x: 300, y: 220 }, defaultColor: '#E53935', paletteRole: 'secondary' },
    { id: 'motif-lale-left-wing', name: 'Sol Lale Kanadı', order: 3, center: { x: 255, y: 190 }, defaultColor: '#E53935', paletteRole: 'accent' },
    { id: 'motif-lale-right-wing', name: 'Sağ Lale Kanadı', order: 4, center: { x: 345, y: 190 }, defaultColor: '#E53935', paletteRole: 'accent' },
    { id: 'motif-lale-left-flower', name: 'Sol Çiçek', order: 5, center: { x: 185, y: 250 }, defaultColor: '#E53935', paletteRole: 'primary' },
    { id: 'motif-lale-right-flower', name: 'Sağ Çiçek', order: 6, center: { x: 415, y: 250 }, defaultColor: '#E53935', paletteRole: 'primary' },
    { id: 'motif-lale-left-leaf', name: 'Sol Saz Yaprağı', order: 7, center: { x: 215, y: 350 }, defaultColor: '#245DB5', paletteRole: 'secondary' },
    { id: 'motif-lale-right-leaf', name: 'Sağ Saz Yaprağı', order: 8, center: { x: 385, y: 350 }, defaultColor: '#245DB5', paletteRole: 'secondary' },
    { id: 'motif-lale-stem', name: 'Merkezi Çini Dalı', order: 9, center: { x: 300, y: 325 }, defaultColor: '#1E9B50', paletteRole: 'accent' },
    { id: 'motif-lale-center-inner', name: 'Lale İç Alev', order: 10, center: { x: 300, y: 255 }, defaultColor: '#E53935', paletteRole: 'accent' },
    { id: 'motif-lale-lower-blossom', name: 'Kaide Çiçek Rozeti', order: 11, center: { x: 300, y: 440 }, defaultColor: '#E53935', paletteRole: 'primary' },
    { id: 'motif-lale-neck-band', name: 'Kenar Bordür Çelengi', order: 12, center: { x: 300, y: 65 }, defaultColor: '#245DB5', paletteRole: 'secondary' },
  ],
  karanfil: [
    { id: 'motif-karanfil-center', name: 'Ana Karanfil Tacı', order: 1, center: { x: 300, y: 195 }, defaultColor: '#E53935', paletteRole: 'primary' },
    { id: 'motif-karanfil-center-mid', name: 'Karanfil Katmeri', order: 2, center: { x: 300, y: 250 }, defaultColor: '#245DB5', paletteRole: 'secondary' },
    { id: 'motif-karanfil-left-buds', name: 'Sol Gonca Tomurcuklar', order: 3, center: { x: 230, y: 195 }, defaultColor: '#F5B700', paletteRole: 'accent' },
    { id: 'motif-karanfil-right-buds', name: 'Sağ Gonca Tomurcuklar', order: 4, center: { x: 370, y: 195 }, defaultColor: '#F5B700', paletteRole: 'accent' },
    { id: 'motif-karanfil-left-flower', name: 'Sol Karanfil Çiçeği', order: 5, center: { x: 205, y: 295 }, defaultColor: '#E53935', paletteRole: 'primary' },
    { id: 'motif-karanfil-right-flower', name: 'Sağ Karanfil Çiçeği', order: 6, center: { x: 395, y: 295 }, defaultColor: '#E53935', paletteRole: 'primary' },
    { id: 'motif-karanfil-leaves', name: 'Kıvrımlı Yapraklar', order: 7, center: { x: 240, y: 370 }, defaultColor: '#16B6C8', paletteRole: 'secondary' },
    { id: 'motif-karanfil-stem', name: 'Kök ve Çanak Sapı', order: 8, center: { x: 300, y: 420 }, defaultColor: '#1E9B50', paletteRole: 'accent' },
    { id: 'motif-karanfil-neck-band', name: 'Boyun / Bordür Çiçekleri', order: 9, center: { x: 300, y: 120 }, defaultColor: '#245DB5', paletteRole: 'secondary' },
  ],
  rumi: [
    { id: 'motif-rumi-top-finial', name: 'Tepe Rumi Başlığı', order: 1, center: { x: 300, y: 155 }, defaultColor: '#E53935', paletteRole: 'primary' },
    { id: 'motif-rumi-center-knot', name: 'Merkezi Rumi Düğümü', order: 2, center: { x: 300, y: 260 }, defaultColor: '#245DB5', paletteRole: 'secondary' },
    { id: 'motif-rumi-center-eye', name: 'Rumi Göbek Rozeti', order: 3, center: { x: 300, y: 310 }, defaultColor: '#F5B700', paletteRole: 'accent' },
    { id: 'motif-rumi-left-wing', name: 'Sol Rumi Kanadı', order: 4, center: { x: 215, y: 260 }, defaultColor: '#16B6C8', paletteRole: 'secondary' },
    { id: 'motif-rumi-right-wing', name: 'Sağ Rumi Kanadı', order: 5, center: { x: 385, y: 260 }, defaultColor: '#16B6C8', paletteRole: 'secondary' },
    { id: 'motif-rumi-left-scroll', name: 'Sol Helezon Kıvrımı', order: 6, center: { x: 230, y: 370 }, defaultColor: '#1E9B50', paletteRole: 'primary' },
    { id: 'motif-rumi-right-scroll', name: 'Sağ Helezon Kıvrımı', order: 7, center: { x: 370, y: 370 }, defaultColor: '#1E9B50', paletteRole: 'primary' },
    { id: 'motif-rumi-stem', name: 'Bağlantı Dalları', order: 8, center: { x: 300, y: 420 }, defaultColor: '#245DB5', paletteRole: 'accent' },
    { id: 'motif-rumi-neck-band', name: 'Boyun / Bordür Rumi', order: 9, center: { x: 300, y: 110 }, defaultColor: '#E53935', paletteRole: 'primary' },
  ],
  hatayi: [
    { id: 'motif-hatayi-top-bloom', name: 'Tepe Çiçek Rozeti', order: 1, center: { x: 300, y: 155 }, defaultColor: '#E53935', paletteRole: 'primary' },
    { id: 'motif-hatayi-outer-petals', name: 'Dış Hatayi Taç Yaprakları', order: 2, center: { x: 300, y: 335 }, defaultColor: '#245DB5', paletteRole: 'secondary' },
    { id: 'motif-hatayi-center-eye', name: 'Merkezi Hatayi Tohumu', order: 3, center: { x: 300, y: 280 }, defaultColor: '#F5B700', paletteRole: 'accent' },
    { id: 'motif-hatayi-inner-ring', name: 'İç Taç Yaprak Halkası', order: 4, center: { x: 300, y: 235 }, defaultColor: '#E53935', paletteRole: 'primary' },
    { id: 'motif-hatayi-left-flower', name: 'Sol Hatayi Çiçeği', order: 5, center: { x: 215, y: 275 }, defaultColor: '#16B6C8', paletteRole: 'secondary' },
    { id: 'motif-hatayi-right-flower', name: 'Sağ Hatayi Çiçeği', order: 6, center: { x: 385, y: 275 }, defaultColor: '#16B6C8', paletteRole: 'secondary' },
    { id: 'motif-hatayi-leaves', name: 'Taşıyıcı Saz Yaprakları', order: 7, center: { x: 235, y: 385 }, defaultColor: '#1E9B50', paletteRole: 'accent' },
    { id: 'motif-hatayi-stem', name: 'Ana Helezonik Dal', order: 8, center: { x: 300, y: 435 }, defaultColor: '#1E9B50', paletteRole: 'accent' },
    { id: 'motif-hatayi-neck-band', name: 'Boyun / Bordür Rozetleri', order: 9, center: { x: 300, y: 110 }, defaultColor: '#245DB5', paletteRole: 'primary' },
  ],
  geometrik: [
    { id: 'motif-geo-top-points', name: 'Üst Zarif Büyük Lale', order: 1, center: { x: 300, y: 185 }, defaultColor: '#E53935', paletteRole: 'primary' },
    { id: 'motif-geo-center-star', name: 'Merkez Hatayi Taç Yaprakları', order: 2, center: { x: 300, y: 245 }, defaultColor: '#245DB5', paletteRole: 'secondary' },
    { id: 'motif-geo-center-core', name: 'Merkez Hatayi Tohum Göbeği', order: 3, center: { x: 300, y: 300 }, defaultColor: '#F5B700', paletteRole: 'accent' },
    { id: 'motif-geo-left-points', name: 'Sol Simetrik Karanfil', order: 4, center: { x: 195, y: 300 }, defaultColor: '#E53935', paletteRole: 'primary' },
    { id: 'motif-geo-right-points', name: 'Sağ Simetrik Karanfil', order: 5, center: { x: 405, y: 300 }, defaultColor: '#E53935', paletteRole: 'primary' },
    { id: 'motif-geo-interlock-square', name: '4 Yöne Yayılan Kıvrık Dallar', order: 6, center: { x: 255, y: 245 }, defaultColor: '#16B6C8', paletteRole: 'secondary' },
    { id: 'motif-geo-saz-leaves', name: 'Sol Saz Yaprakları', order: 7, center: { x: 220, y: 395 }, defaultColor: '#1E9B50', paletteRole: 'secondary' },
    { id: 'motif-geo-corner-blossoms', name: 'Sağ Saz & Bahar Çiçeği', order: 8, center: { x: 380, y: 395 }, defaultColor: '#8434C6', paletteRole: 'accent' },
    { id: 'motif-geo-bottom-points', name: 'Alt Rumi & Yaprak Kompozisyonu', order: 9, center: { x: 300, y: 420 }, defaultColor: '#1E9B50', paletteRole: 'primary' },
    { id: 'motif-geo-outer-ring', name: 'Dört Köşe Çini Rozetleri', order: 10, center: { x: 175, y: 175 }, defaultColor: '#16B6C8', paletteRole: 'accent' },
    { id: 'motif-geo-inner-border', name: 'İç Çerçeve Bordürü', order: 11, center: { x: 425, y: 175 }, defaultColor: '#8434C6', paletteRole: 'secondary' },
    { id: 'motif-geo-neck-band', name: 'Kenar Kobalt Çini Bordürü', order: 12, center: { x: 300, y: 125 }, defaultColor: '#245DB5', paletteRole: 'primary' },
  ],
  yaprak: [
    { id: 'motif-yaprak-main-saz', name: 'Büyük Hançer Saz Yaprağı', order: 1, center: { x: 300, y: 260 }, defaultColor: '#245DB5', paletteRole: 'primary' },
    { id: 'motif-yaprak-left-saz', name: 'Sol Tırtıklı Yaprak', order: 2, center: { x: 220, y: 330 }, defaultColor: '#1E9B50', paletteRole: 'secondary' },
    { id: 'motif-yaprak-saz-vein', name: 'Saz Yaprağı Damarı', order: 3, center: { x: 310, y: 190 }, defaultColor: '#16B6C8', paletteRole: 'accent' },
    { id: 'motif-yaprak-left-blossom', name: 'Sol Bahar Çiçeği', order: 4, center: { x: 205, y: 215 }, defaultColor: '#E53935', paletteRole: 'primary' },
    { id: 'motif-yaprak-right-blossom', name: 'Sağ Bahar Çiçeği', order: 4, center: { x: 395, y: 205 }, defaultColor: '#E53935', paletteRole: 'primary' },
    { id: 'motif-yaprak-right-saz', name: 'Sağ Tırtıklı Yaprak', order: 6, center: { x: 380, y: 305 }, defaultColor: '#1E9B50', paletteRole: 'secondary' },
    { id: 'motif-yaprak-blossom-cores', name: 'Çiçek Tohumlukları', order: 7, center: { x: 205, y: 260 }, defaultColor: '#F5B700', paletteRole: 'accent' },
    { id: 'motif-yaprak-stem', name: 'Kıvrımlı Saz Dalı', order: 8, center: { x: 300, y: 420 }, defaultColor: '#1E9B50', paletteRole: 'secondary' },
    { id: 'motif-yaprak-neck-band', name: 'Boyun / Bordür Bahar Dalı', order: 9, center: { x: 300, y: 125 }, defaultColor: '#245DB5', paletteRole: 'accent' },
  ],
};

export interface DecorationArea {
  clipPathId: string;
  center: { x: number; y: number };
  safeScale: number;
  transform: string;
}

export const DECORATION_AREAS: Record<'tabak' | 'pano' | 'karo', DecorationArea> = {
  tabak: {
    clipPathId: 'plate-decoration-area',
    center: { x: 300, y: 300 },
    safeScale: 0.94,
    transform: 'translate(300, 300) scale(0.94) translate(-300, -300)',
  },
  pano: {
    clipPathId: 'pano-decoration-area',
    center: { x: 300, y: 300 },
    safeScale: 0.88,
    transform: 'translate(300, 300) scale(0.88) translate(-300, -300)',
  },
  karo: {
    clipPathId: 'tile-decoration-area',
    center: { x: 300, y: 300 },
    safeScale: 0.94,
    transform: 'translate(300, 300) scale(0.94) translate(-300, -300)',
  },
};

export const STEP_QUOTES = [
  '“Küçük dokunuşlarla büyük eserler doğar.”',
  '“Desen, toprağın dilidir.”',
  '“Renk, Anadolu\'nun ruhudur.”',
  '“İyi bir eser, sabrın ve sevginin sonucudur.”',
  '“Geçmişin izleri, geleceğin ilhamıdır.”',
];

export interface PaintingTarget {
  zone: number;
  x: number;
  y: number;
  label: string;
}

export const getPaintingTargetsForMotif = (motifId: string): PaintingTarget[] => {
  switch (motifId) {
    case 'karanfil':
      return [
        { zone: 0, x: 300, y: 410, label: 'Kök & Çanak Dalı' },
        { zone: 1, x: 300, y: 240, label: 'Katmerli Karanfil Çiçeği' },
        { zone: 2, x: 215, y: 290, label: 'Sol Karanfil Çiçeği' },
        { zone: 3, x: 385, y: 290, label: 'Sağ Karanfil Çiçeği' },
        { zone: 4, x: 300, y: 145, label: 'Üst Tomurcuklar' },
        { zone: 5, x: 300, y: 65, label: 'Kenar Çiçek Bordürü' },
      ];
    case 'rumi':
      return [
        { zone: 0, x: 300, y: 400, label: 'Helezon Dal Gövdesi' },
        { zone: 1, x: 300, y: 285, label: 'Merkezi Rumi Düğümü' },
        { zone: 2, x: 210, y: 260, label: 'Sol Rumi Kanadı' },
        { zone: 3, x: 390, y: 260, label: 'Sağ Rumi Kanadı' },
        { zone: 4, x: 300, y: 155, label: 'Tepe Rumi Motifi' },
        { zone: 5, x: 300, y: 65, label: 'Helezonik Bordür' },
      ];
    case 'hatayi':
      return [
        { zone: 0, x: 300, y: 415, label: 'Kıvrık Taşıyıcı Dal' },
        { zone: 1, x: 300, y: 280, label: 'Merkezi Hatayi Rozeti' },
        { zone: 2, x: 215, y: 280, label: 'Sol Hatayi Taç Yaprakları' },
        { zone: 3, x: 385, y: 280, label: 'Sağ Hatayi Taç Yaprakları' },
        { zone: 4, x: 300, y: 150, label: 'Tepe Çiçekleri' },
        { zone: 5, x: 300, y: 65, label: 'Rozet Bordür' },
      ];
    case 'geometrik':
      return [
        { zone: 0, x: 300, y: 410, label: 'Geometrik Bağlantı Hatları' },
        { zone: 1, x: 300, y: 300, label: 'Selçuklu Sekiz Köşeli Yıldızı' },
        { zone: 2, x: 215, y: 300, label: 'Sol Yıldız Kollar' },
        { zone: 3, x: 385, y: 300, label: 'Sağ Yıldız Kollar' },
        { zone: 4, x: 300, y: 175, label: 'Üst Geometrik Düğüm' },
        { zone: 5, x: 300, y: 65, label: 'Selçuklu Kenar Bordürü' },
      ];
    case 'yaprak':
      return [
        { zone: 0, x: 300, y: 420, label: 'Kıvrımlı Saz Dalı' },
        { zone: 1, x: 300, y: 265, label: 'Büyük Hançer Saz Yaprağı' },
        { zone: 2, x: 215, y: 315, label: 'Sol Tırtıklı Yaprak' },
        { zone: 3, x: 385, y: 315, label: 'Sağ Tırtıklı Yaprak' },
        { zone: 4, x: 300, y: 155, label: 'Bahar Çiçekleri & Goncalar' },
        { zone: 5, x: 300, y: 65, label: 'Sarmaşık Bordür' },
      ];
    case 'lale':
    default:
      return [
        { zone: 0, x: 300, y: 410, label: 'Kök & Saz Yaprakları' },
        { zone: 1, x: 300, y: 220, label: 'Ana Lale Gövdesi' },
        { zone: 2, x: 230, y: 300, label: 'Sol Lale Goncası' },
        { zone: 3, x: 370, y: 300, label: 'Sağ Lale Goncası' },
        { zone: 4, x: 300, y: 150, label: 'Taç Yapraklar' },
        { zone: 5, x: 300, y: 65, label: 'Dış Kenar Bordürü' },
      ];
  }
};

