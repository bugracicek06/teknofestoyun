export interface MilliStage {
  id: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  parchmentText: string;
  taskBadge: string;
  kasifText: string;
}

export const MILLI_STAGES: MilliStage[] = [
  {
    id: 1,
    title: "İHA'NI TASARLA",
    subtitle: 'MİLLÎ TEKNOLOJİ, GÜVENLİ YARINLAR',
    parchmentText:
      "Görev için uygun bir insansız hava aracı oluştur. Parçaları seçip yerine takarak İHA'nı hazırla. Daha sonra üzerine görev modülünü ekleyeceksin.",
    taskBadge: "Şekildeki parçaları seçip İHA'yı tamamla.",
    kasifText: "Parçaları seç ve İHA'nı tamamla! Sonra görev modülünü ekleyeceğiz.",
  },
  {
    id: 2,
    title: 'GÖREV MODÜLÜNÜ SEÇ',
    subtitle: 'DOĞRU TEKNOLOJİ, DOĞRU ÇÖZÜM',
    parchmentText:
      "Gözlem ve erken uyarı için İHA'na uygun görev modülünü seç. Seçtiğin modül, uçuş sırasında görüntü ve veri toplayarak çevreyi izlemene yardımcı olacak.",
    taskBadge: "Bu görev için en uygun modülü seç ve İHA'na tak!",
    kasifText: 'Her sensör farklı bir yetenek kazandırır. Görevine en uygun modülü seç!',
  },
  {
    id: 3,
    title: 'ROTANI BELİRLE VE GÖKYÜZÜNE YÜKSEL',
    subtitle: 'GÜVENLİ ROTA, KESİNTİSİZ UÇUŞ',
    parchmentText:
      "İHA'nı kalkış noktasından görev bölgesine ulaştırmak için kontrol noktalarını sırayla seçerek rotanı oluştur, ardından uçağının gökyüzünde süzülüşünü izle.",
    taskBadge: '4 kontrol noktasını bağla ve İHA’nı görev sahasına uçur.',
    kasifText:
      "Harika! Rotanı belirle ve gökyüzüne yüksel. İHA'nın görev bölgesine ulaşmasını canlı takip et!",
  },
  {
    id: 4,
    title: 'GÖREVİ TAMAMLA',
    subtitle: 'BAŞARILI GÖREV, GÜVENLİ YARINLAR',
    parchmentText:
      "Pamukkale Üniversitesi sivil gözlem İHA'sı belirlenen rotayı başarıyla tamamladı ve erken uyarı verilerini aktardı. Görevi tamamlayarak başarı sertifikanı alabilirsin.",
    taskBadge: 'Tüm aşamalar tamamlandı. Görev raporunu ve sertifikanı incele.',
    kasifText:
      'Tebrikler Kaşif! İHA görevini eksiksiz tamamladı. Millî teknoloji hamlesine katkın için teşekkürler!',
  },
];

export interface IhaPart {
  id: 'kanat' | 'motor' | 'kuyruk' | 'inis_takimi';
  stableKey: 'wing' | 'engine' | 'tail' | 'landingGear';
  name: string;
  role: string;
  image: string;
  thumbImage: string;
  layerImage: string;
  holoImage: string;
  fittedImage: string;
  trayImage: string;
  slotCoordinates: { x: number; y: number; width: number; height: number };
  targetBox1376: { minX: number; maxX: number; minY: number; maxY: number };
  targetBox740: { minX: number; maxX: number; minY: number; maxY: number };
  targetBox770: { minX: number; maxX: number; minY: number; maxY: number };
  mountPointPercent: { x: number; y: number };
}

export const IHA_PARTS: IhaPart[] = [
  {
    id: 'kanat',
    stableKey: 'wing',
    name: 'KANAT',
    role: 'Aerodinamik taşıma ve süzülme performansı',
    image: '/assets/milli/part_wing.jpg',
    thumbImage: '/assets/milli/clean_card_wing.png',
    layerImage: '/assets/milli/fitted_wing.png',
    holoImage: '/assets/milli/ghost_wing.png',
    fittedImage: '/assets/milli/fitted_wing.png',
    trayImage: '/assets/milli/clean_card_wing.png',
    slotCoordinates: { x: 50, y: 38, width: 44, height: 18 },
    targetBox1376: { minX: 50, maxX: 1345, minY: 150, maxY: 510 },
    targetBox740: { minX: 0, maxX: 740, minY: 30, maxY: 220 },
    targetBox770: { minX: 10, maxX: 765, minY: 20, maxY: 200 },
    mountPointPercent: { x: 50.0, y: 48.0 },
  },
  {
    id: 'motor',
    stableKey: 'engine',
    name: 'MOTOR',
    role: 'Yüksek verimli pervaneli itki ünitesi',
    image: '/assets/milli/part_engine.jpg',
    thumbImage: '/assets/milli/clean_card_motor.png',
    layerImage: '/assets/milli/fitted_motor.png',
    holoImage: '/assets/milli/ghost_motor.png',
    fittedImage: '/assets/milli/fitted_motor.png',
    trayImage: '/assets/milli/clean_card_motor.png',
    slotCoordinates: { x: 57, y: 32, width: 18, height: 18 },
    targetBox1376: { minX: 430, maxX: 630, minY: 100, maxY: 300 },
    targetBox740: { minX: 300, maxX: 480, minY: 0, maxY: 130 },
    targetBox770: { minX: 320, maxX: 460, minY: 40, maxY: 150 },
    mountPointPercent: { x: 53.0, y: 40.0 },
  },
  {
    id: 'kuyruk',
    stableKey: 'tail',
    name: 'KUYRUK',
    role: 'Çift V-kuyruk ile aerodinamik yön dengesi',
    image: '/assets/milli/part_tail.jpg',
    thumbImage: '/assets/milli/clean_card_tail.png',
    layerImage: '/assets/milli/fitted_tail.png',
    holoImage: '/assets/milli/ghost_tail.png',
    fittedImage: '/assets/milli/fitted_tail.png',
    trayImage: '/assets/milli/clean_card_tail.png',
    slotCoordinates: { x: 80, y: 32, width: 20, height: 24 },
    targetBox1376: { minX: 570, maxX: 920, minY: 100, maxY: 340 },
    targetBox740: { minX: 470, maxX: 730, minY: 0, maxY: 160 },
    targetBox770: { minX: 500, maxX: 700, minY: 10, maxY: 140 },
    mountPointPercent: { x: 73.0, y: 40.0 },
  },
  {
    id: 'inis_takimi',
    stableKey: 'landingGear',
    name: 'İNİŞ TAKIMI',
    role: 'Güvenli kalkış ve sarsıntısız iniş sistemi',
    image: '/assets/milli/part_gear.jpg',
    thumbImage: '/assets/milli/clean_card_gear.png',
    layerImage: '/assets/milli/fitted_gear.png',
    holoImage: '/assets/milli/ghost_gear.png',
    fittedImage: '/assets/milli/fitted_gear.png',
    trayImage: '/assets/milli/clean_card_gear.png',
    slotCoordinates: { x: 44, y: 68, width: 28, height: 26 },
    targetBox1376: { minX: 250, maxX: 710, minY: 320, maxY: 460 },
    targetBox740: { minX: 180, maxX: 680, minY: 130, maxY: 290 },
    targetBox770: { minX: 150, maxX: 530, minY: 150, maxY: 270 },
    mountPointPercent: { x: 48.0, y: 76.0 },
  },
];

export type MilliSensorId = 'elektro_optik' | 'termal' | 'multispektral';

export interface MissionSensor {
  id: MilliSensorId;
  name: string;
  cardTitle: string;
  code: string;
  role: string;
  shortDesc: string;
  badge: string;
  features: string[];
  color: string;
  image: string;
}

export const MISSION_SENSORS: MissionSensor[] = [
  {
    id: 'elektro_optik',
    name: 'Elektro-Optik Sensör',
    cardTitle: 'ELEKTRO-OPTİK',
    code: 'EO-CAM4K',
    role: 'Gündüz Keşif ve Yüksek Çözünürlüklü Optik',
    shortDesc: 'Yüksek çözünürlüklü görüntüleme, keşif, gözlem ve haritalama görevleri için kullanılır.',
    badge: 'Yüksek Çözünürlüklü Optik',
    features: [
      'Yüksek çözünürlüklü görüntüleme',
      'Keşif ve gözlem',
      'Haritalama ve analiz',
    ],
    color: '#00F2FE',
    image: '/assets/milli/sensor_lidar.jpg',
  },
  {
    id: 'termal',
    name: 'Termal Sensör',
    cardTitle: 'TERMAL',
    code: 'FLIR-T600',
    role: 'Kızılötesi & Isı Tabanlı Algılama',
    shortDesc: 'Düşük görüş koşullarında ısı farklarını tespit ederek gece ve zorlu şartlarda gözetleme sağlar.',
    badge: 'Kızılötesi Isı Algılama',
    features: [
      'Düşük görüş koşullarında algılama',
      'Isı tabanlı görüntüleme',
      'Arama ve tespit',
    ],
    color: '#FF6B00',
    image: '/assets/milli/sensor_thermal.jpg',
  },
  {
    id: 'multispektral',
    name: 'Multispektral Sensör',
    cardTitle: 'MULTİSPEKTRAL',
    code: 'SPEC-NDVI',
    role: 'Bitki Örtüsü ve Çevre Analizi',
    shortDesc: 'Farklı spektral bantların incelenmesiyle tarımsal analiz, bitki sağlığı ve çevresel gözlem yapar.',
    badge: 'Çok Bantlı Spektral Analiz',
    features: [
      'Bitki ve çevre analizi',
      'Farklı spektral bantların incelenmesi',
      'Çevresel gözlem',
    ],
    color: '#10B981',
    image: '/assets/milli/sensor_multispectral.jpg',
  },
];

export interface WaypointPoint {
  id: 1 | 2 | 3 | 4;
  title: string;
  name: string;
  coords: string;
  mapPercent: { x: number; y: number };
  color: string;
  icon: string;
}

export const WAYPOINTS: WaypointPoint[] = [
  {
    id: 1,
    title: '1. KALKIŞ NOKTASI',
    name: 'Pamukkale Üniversitesi',
    coords: '37.7521° N, 29.0854° E',
    mapPercent: { x: 51.5, y: 56.5 },
    color: '#00F2FE',
    icon: '🎓',
  },
  {
    id: 2,
    title: '2. KONTROL NOKTASI',
    name: 'Ormanlık Alan',
    coords: '37.7683° N, 29.1021° E',
    mapPercent: { x: 37.0, y: 46.0 },
    color: '#10B981',
    icon: '🌲',
  },
  {
    id: 3,
    title: '3. KONTROL NOKTASI',
    name: 'Dağ Eteği',
    coords: '37.7816° N, 29.1187° E',
    mapPercent: { x: 63.5, y: 38.0 },
    color: '#F59E0B',
    icon: '⛰️',
  },
  {
    id: 4,
    title: '4. KONTROL NOKTASI',
    name: 'Gözlem & Risk Sahası',
    coords: '37.7924° N, 29.1296° E',
    mapPercent: { x: 75.0, y: 25.0 },
    color: '#EF4444',
    icon: '👁️',
  },
];

export const FLIGHT_TELEMETRY = {
  totalDistance: '18.6 km',
  estimatedTime: '12 dakika',
  maxAltitude: '600 metre',
  cruisingAltitude: '320 metre',
  cruisingSpeed: '72 km/h',
};

export const FOOTER_QUOTE_MILLI = '“DOĞAYI KORUYAN TEKNOLOJİ DAHA GÜVENLİ YARINLAR İNŞA EDER.”';
