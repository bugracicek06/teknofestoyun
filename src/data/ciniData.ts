export interface CiniObject {
  id: 'tabak' | 'vazo' | 'karo';
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
    id: 'vazo',
    name: 'Vazo',
    subTitle: 'Kandil & Çiçeklik Formu',
    description: 'Kıvrımlı gövdesi ve asil duruşuyla saray atölyelerinin başyapıtı.',
    icon: '🏺',
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
    name: 'Geometrik',
    meaning: 'Düzen & Adalet',
    description: 'Selçuklu sekiz köşeli yıldızı ve ilahi nizam.',
    iconColor: '#0891B2',
  },
  {
    id: 'yaprak',
    name: 'Yaprak',
    meaning: 'Canlılık & Yaşam',
    description: 'Kıvrımlı saz yaprakları ve bahar dalları.',
    iconColor: '#15803D',
  },
];

export const CINI_COLORS: CiniColor[] = [
  {
    id: 'kobalt',
    name: 'Kobalt Mavisi',
    meaning: 'Huzur',
    hex: '#0C3875',
    lightHex: '#1D5299',
    borderHex: '#06214A',
  },
  {
    id: 'turkuaz',
    name: 'Turkuaz',
    meaning: 'Bereket',
    hex: '#0D7C8A',
    lightHex: '#17A2B4',
    borderHex: '#08545E',
  },
  {
    id: 'mercan',
    name: 'Mercan Kırmızısı',
    meaning: 'Yaşam',
    hex: '#B3261E',
    lightHex: '#D1362D',
    borderHex: '#7C1711',
  },
  {
    id: 'zumrut',
    name: 'Zümrüt Yeşili',
    meaning: 'Doğa',
    hex: '#1B5E38',
    lightHex: '#288150',
    borderHex: '#0F3D23',
  },
  {
    id: 'toprak',
    name: 'Toprak Rengi',
    meaning: 'Güç',
    hex: '#9E471A',
    lightHex: '#BD5B26',
    borderHex: '#6D2E0E',
  },
  {
    id: 'krem',
    name: 'Krem Beyaz',
    meaning: 'Saflık',
    hex: '#F7F3E8',
    lightHex: '#FFFDF7',
    borderHex: '#DCD0B7',
  },
];

export interface DecorationArea {
  clipPathId: string;
  center: { x: number; y: number };
  safeScale: number;
  transform: string;
}

export const DECORATION_AREAS: Record<'tabak' | 'vazo' | 'karo', DecorationArea> = {
  tabak: {
    clipPathId: 'plate-decoration-area',
    center: { x: 300, y: 300 },
    safeScale: 0.92,
    transform: 'translate(300, 300) scale(0.92) translate(-300, -300)',
  },
  vazo: {
    clipPathId: 'vase-decoration-area',
    center: { x: 300, y: 385 },
    safeScale: 0.68,
    transform: 'translate(300, 385) scale(0.66, 0.72) translate(-300, -300)',
  },
  karo: {
    clipPathId: 'tile-decoration-area',
    center: { x: 300, y: 300 },
    safeScale: 0.82,
    transform: 'translate(300, 300) scale(0.82) translate(-300, -300)',
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

