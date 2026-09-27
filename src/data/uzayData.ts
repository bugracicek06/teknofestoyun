export interface UzayStage {
  id: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  instructionText: string;
  taskBadge: string;
  kasifText: string;
}

export const UZAY_STAGES: UzayStage[] = [
  {
    id: 1,
    title: 'UZAY ARACINI TASARLA',
    subtitle: 'PARÇALARI DOĞRU YERLERE SÜRÜKLE',
    instructionText:
      'Aşağıdaki parçaları merkezdeki yuvalarına sürükleyerek uzay aracını tamamla.',
    taskBadge: 'Parçaları doğru yerlere sürükle ve uzay aracını tamamla.',
    kasifText: 'Merhaba Kaşif! Parçaları montaj yuvalarına yerleştirerek uzay aracını tamamla!',
  },
  {
    id: 2,
    title: 'YÖRÜNGEYİ BELİRLE',
    subtitle: 'GÖREVİN İÇİN EN UYGUN YÖRÜNGEYİ SEÇ',
    instructionText:
      'Uzay aracını Dünya çevresindeki uygun yörüngeye yerleştir.',
    taskBadge: 'Gözlem uydusu için en doğru yörüngeyi seç ve rota oluştur.',
    kasifText: 'Uzay aracımızın Dünya yüzeyini en net şekilde gözlemleyebileceği yörüngeyi seç!',
  },
  {
    id: 3,
    title: 'YÖRÜNGEYE YERLEŞ',
    subtitle: 'UYDUNUN YÖRÜNGEDEKİ GÖREVİ',
    instructionText:
      'Uzay aracımız seçilen yörüngeye başarıyla yerleşti ve Dünya çevresindeki görevine başladı.',
    taskBadge: 'Uydu yörüngede ilerliyor ve veri topluyor.',
    kasifText: 'Tebrikler! Uydumuz yörüngesine başarıyla ulaştı ve Dünya çevresinde dönüyor!',
  },
  {
    id: 4,
    title: 'GÖREVİ TAMAMLA',
    subtitle: 'YÖRÜNGEDE TAM BAŞARI',
    instructionText:
      'Uzay aracı yörüngeye başarıyla yerleşti ve ilk sinyalleri yer istasyonuna ulaştırdı.',
    taskBadge: 'Görev raporunu incele ve uzay kaşifi unvanını kazan.',
    kasifText: 'Tebrikler Kaşif! Türkiye Yüzyılı uzay teknolojilerine gururla imza attın!',
  },
];

export type SpacecraftPartId =
  | 'body'
  | 'solar_left'
  | 'solar_right'
  | 'antenna'
  | 'sensor'
  | 'heat_shield';

export interface SpacecraftPart {
  id: SpacecraftPartId;
  name: string;
  shortName: string;
  role: string;
  thumbImage: string;
  stepNumber: number;
  // Exact final transform in SVG viewBox="0 0 1000 700"
  targetX: number;
  targetY: number;
  targetScale: number;
  targetRotation: number;
  anchorX: number;
  anchorY: number;
  slotCoord: {
    centerX: number;
    centerY: number;
    width: number;
    height: number;
  };
  snapRadius: number;
}

export const SPACECRAFT_PARTS: SpacecraftPart[] = [
  {
    id: 'body',
    name: 'Ana Gövde',
    shortName: 'Gövde',
    role: 'Tüm sistemleri ve aviyonikleri barındıran dayanıklı merkezi şasi',
    thumbImage: '/assets/uzay/thumb_body.png',
    stepNumber: 1,
    targetX: 500,
    targetY: 350,
    targetScale: 1,
    targetRotation: 0,
    anchorX: 500,
    anchorY: 350,
    slotCoord: {
      centerX: 500,
      centerY: 350,
      width: 250,
      height: 220,
    },
    snapRadius: 180,
  },
  {
    id: 'solar_left',
    name: 'Sol Güneş Paneli',
    shortName: 'Sol Panel',
    role: 'Yüksek verimli fotovoltaik kristal hücrelerle güneş enerjisi üretir',
    thumbImage: '/assets/uzay/thumb_solar_left.png',
    stepNumber: 2,
    targetX: 250,
    targetY: 350,
    targetScale: 1,
    targetRotation: 0,
    anchorX: 380,
    anchorY: 350,
    slotCoord: {
      centerX: 250,
      centerY: 350,
      width: 230,
      height: 140,
    },
    snapRadius: 165,
  },
  {
    id: 'solar_right',
    name: 'Sağ Güneş Paneli',
    shortName: 'Sağ Panel',
    role: 'Güneş ışığını kesintisiz elektrik enerjisine dönüştüren sağ panel kanadı',
    thumbImage: '/assets/uzay/thumb_solar_right.png',
    stepNumber: 3,
    targetX: 750,
    targetY: 350,
    targetScale: 1,
    targetRotation: 0,
    anchorX: 620,
    anchorY: 350,
    slotCoord: {
      centerX: 750,
      centerY: 350,
      width: 230,
      height: 140,
    },
    snapRadius: 165,
  },
  {
    id: 'antenna',
    name: 'Haberleşme Anteni',
    shortName: 'Anten',
    role: 'Derin uzay ve yer istasyonu ile yüksek hızlı veri ve telemetri bağı',
    thumbImage: '/assets/uzay/thumb_antenna.png',
    stepNumber: 4,
    targetX: 500,
    targetY: 160,
    targetScale: 1,
    targetRotation: 0,
    anchorX: 500,
    anchorY: 250,
    slotCoord: {
      centerX: 500,
      centerY: 160,
      width: 250,
      height: 170,
    },
    snapRadius: 160,
  },
  {
    id: 'sensor',
    name: 'Bilimsel Sensör',
    shortName: 'Sensör',
    role: 'Yüksek çözünürlüklü spektral optik kamera ve bilimsel gözlem podu',
    thumbImage: '/assets/uzay/thumb_sensor.png',
    stepNumber: 5,
    targetX: 475,
    targetY: 350,
    targetScale: 1,
    targetRotation: 0,
    anchorX: 475,
    anchorY: 350,
    slotCoord: {
      centerX: 475,
      centerY: 350,
      width: 75,
      height: 75,
    },
    snapRadius: 140,
  },
  {
    id: 'heat_shield',
    name: 'Isı Kalkanı',
    shortName: 'Isı Kalkanı',
    role: 'Termal koruma katmanı ve yörünge düzeltme itki alt modülü',
    thumbImage: '/assets/uzay/thumb_heat_shield.png',
    stepNumber: 6,
    targetX: 500,
    targetY: 495,
    targetScale: 1,
    targetRotation: 0,
    anchorX: 500,
    anchorY: 440,
    slotCoord: {
      centerX: 500,
      centerY: 495,
      width: 170,
      height: 120,
    },
    snapRadius: 160,
  },
];

// =========================================================================
// STAGE 3: YÖRÜNGEYİ BELİRLE DATA DEFINITIONS
// =========================================================================

export type OrbitId = 'leo' | 'meo' | 'geo';

export interface OrbitOption {
  id: OrbitId;
  name: string;
  code: string;
  altitude: string;
  period: string;
  purpose: string;
  idealFor: string;
  color: string;
  glowColor: string;
  accentHex: string;
  features: string[];
  isCorrect: boolean;
  hint: string;
  // Ellipse coordinates in 1000 x 700 normalized SVG space (center at 500, 335)
  rx: number;
  ry: number;
  rotation: number;
  // Spacecraft park position on this orbit (x, y, scale, rotation)
  satellitePos: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
  // Orbit label callout pin coordinate
  labelPin: {
    x: number;
    y: number;
  };
}

export const ORBIT_OPTIONS: OrbitOption[] = [
  {
    id: 'leo',
    name: 'Alçak Dünya Yörüngesi (LEO)',
    code: 'LEO',
    altitude: '200 – 2.000 km',
    period: '~90 Dakika',
    purpose: 'Dünya Gözlemi ve Yüksek Çözünürlüklü Görüntüleme',
    idealFor: 'Dünya Gözlemi',
    color: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.85)',
    accentHex: '#0284C7',
    features: [
      'Yüksek çözünürlük',
      'Dünya gözlemi',
      'Daha kısa tur süresi',
    ],
    isCorrect: true,
    hint: 'Gözlem uydumuzun Dünya yüzeyini en net şekilde fotoğraflaması için en ideal yörünge!',
    rx: 180,
    ry: 150,
    rotation: -15,
    satellitePos: {
      x: 375,
      y: 205,
      scale: 0.22,
      rotation: -25,
    },
    labelPin: {
      x: 340,
      y: 415,
    },
  },
  {
    id: 'meo',
    name: 'Orta Dünya Yörüngesi (MEO)',
    code: 'MEO',
    altitude: '2.000 – 35.786 km',
    period: '~12 Saat',
    purpose: 'Navigasyon ve Konumlandırma (GPS)',
    idealFor: 'Navigasyon & GPS',
    color: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.85)',
    accentHex: '#D97706',
    features: [
      'Daha geniş kapsama alanı',
      'İletişim ve navigasyon',
      'Orta tur süresi',
    ],
    isCorrect: false,
    hint: 'MEO genellikle GPS ve navigasyon uyduları içindir. Gözlem uydumuz Dünya yüzeyine daha yakın olmalı. Tekrar dene!',
    rx: 245,
    ry: 195,
    rotation: -18,
    satellitePos: {
      x: 315,
      y: 155,
      scale: 0.19,
      rotation: -30,
    },
    labelPin: {
      x: 660,
      y: 140,
    },
  },
  {
    id: 'geo',
    name: 'Jeosenkron Yörünge (GEO)',
    code: 'GEO',
    altitude: '35.786 km',
    period: '24 Saat (Sabit Konum)',
    purpose: 'Haberleşme ve Kesintisiz TV Yayını',
    idealFor: 'Haberleşme & TV Yayını',
    color: '#C084FC',
    glowColor: 'rgba(192, 132, 252, 0.85)',
    accentHex: '#9333EA',
    features: [
      'Sürekli kapsama alanı',
      'Uzun süreli gözlem',
      'İletişim hizmetleri',
    ],
    isCorrect: false,
    hint: 'GEO yörüngesi çok uzaktadır (35.786 km) ve televizyon/haberleşme içindir. Yeryüzünü net çekmek için Dünya\'ya daha yakın bir yörünge seçmelisin!',
    rx: 310,
    ry: 240,
    rotation: -16,
    satellitePos: {
      x: 255,
      y: 105,
      scale: 0.16,
      rotation: -35,
    },
    labelPin: {
      x: 700,
      y: 530,
    },
  },
];
