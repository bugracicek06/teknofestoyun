export interface DevrimEnginePart {
  id: 'motor_blogu' | 'radyator' | 'aku' | 'hava_filtresi';
  name: string;
  subName: string;
  order: number;
  description: string;
  // Normalized target slot percentages on the 100% x 100% engine stage
  slot: {
    leftPercent: number; // Center X %
    topPercent: number;  // Center Y %
    widthPercent: number;
    heightPercent: number;
  };
}

export const DEVRIM_ENGINE_PARTS: DevrimEnginePart[] = [
  {
    id: 'motor_blogu',
    name: 'Motor Bloğu',
    subName: '4 Silindirli Ana Gövde',
    order: 1,
    description: 'Pistonların ve silindirlerin yer aldığı, motorun ana mekanik gövdesidir.',
    slot: {
      leftPercent: 50.0,
      topPercent: 44.5,
      widthPercent: 20.0,
      heightPercent: 47.0,
    },
  },
  {
    id: 'radyator',
    name: 'Radyatör',
    subName: 'Motor Soğutma Ünitesi',
    order: 2,
    description: 'Motorun aşırı ısınmasını önleyerek ideal çalışma sıcaklığını korur.',
    slot: {
      leftPercent: 50.0,
      topPercent: 82.0,
      widthPercent: 52.0,
      heightPercent: 17.5,
    },
  },
  {
    id: 'aku',
    name: 'Akü',
    subName: '12V Elektrik Güç Kaynağı',
    order: 3,
    description: 'İlk marş ve elektrik sistemleri için gerekli akımı depolar.',
    slot: {
      leftPercent: 73.5,
      topPercent: 51.0,
      widthPercent: 19.0,
      heightPercent: 26.5,
    },
  },
  {
    id: 'hava_filtresi',
    name: 'Hava Filtresi',
    subName: 'Temiz Hava Girişi',
    order: 4,
    description: 'Karbüratöre giren havayı süzerek yakıtın verimli yanmasını sağlar.',
    slot: {
      leftPercent: 28.5,
      topPercent: 27.5,
      widthPercent: 19.0,
      heightPercent: 21.0,
    },
  },
];

export interface DevrimStepConfig {
  step: 1 | 2 | 3 | 4 | 5;
  badge: string;
  title: string;
  subTitle: string;
  parchment: {
    title: string;
    subTitle: string;
    body1: string;
    body2?: string;
    callout: string;
  };
  kasifMessage: string;
}

export const DEVRIM_STEPS: Record<1 | 2 | 3 | 4 | 5, DevrimStepConfig> = {
  1: {
    step: 1,
    badge: '1. ADIM',
    title: 'DEVRİM İLE TANIŞ',
    subTitle: 'Bir mühendislik hikâyesini keşfet.',
    parchment: {
      title: 'DEVRİM',
      subTitle: '1961 - Türkiye\'nin İlk Yerli Otomobili',
      body1: "Devrim, 1961 yılında Türk mühendis ve işçilerinin emeğiyle geliştirilen Türkiye'nin ilk yerli otomobilidir.",
      body2: "Bu araç, bağımsızlık, azim ve inançla geleceği üreten Türkiye'nin simgelerinden biridir.",
      callout: "Devrim'in motorunu keşfetmeye hazır mısın?",
    },
    kasifMessage: "Devrim'in motorunu keşfedelim! Kaputa dokun.",
  },
  2: {
    step: 2,
    badge: '2. ADIM',
    title: 'KAPUTU AÇ',
    subTitle: "Devrim'in motorunu yakından incele.",
    parchment: {
      title: 'DEVRİM',
      subTitle: '1961 - Türkiye\'nin İlk Yerli Otomobili',
      body1: "Devrim, 1961 yılında Türk mühendis ve işçilerinin emeğiyle geliştirilen Türkiye'nin ilk yerli otomobilidir.",
      body2: "Bu araç, bağımsızlık, azim ve inançla geleceği üreten Türkiye'nin simgelerinden biridir.",
      callout: 'Harika! Şimdi motoru birlikte tamamlayalım.',
    },
    kasifMessage: 'Harika! Şimdi motoru birlikte tamamlayalım.',
  },
  3: {
    step: 3,
    badge: '3. ADIM',
    title: 'MOTORU İNŞA ET',
    subTitle: 'Parçaları sürükleyerek doğru yuvalara yerleştir.',
    parchment: {
      title: "DEVRİM'İN MOTORU",
      subTitle: 'Yerli Emek, Büyük Başlangıç',
      body1: "Devrim otomobilinin motoru, Türk mühendis ve işçilerinin emeğiyle tasarlanıp üretilmiştir. Bu motor, Türkiye'nin kendi imkânlarıyla büyük hedeflere ulaşabileceğinin en güçlü göstergelerinden biridir.",
      callout: 'Şimdi sen de bu tarihi motoru doğru parçaları yerleştirerek tamamla!',
    },
    kasifMessage: 'Parçaları doğru yuvalara yerleştir! Tamamlandığında motor çalışmaya hazır olacak.',
  },
  4: {
    step: 4,
    badge: '4. ADIM',
    title: 'MOTORU ÇALIŞTIR',
    subTitle: 'Tüm parçalar yerleşti. Kontağa bas ve motoru çalıştır!',
    parchment: {
      title: "DEVRİM'İN MOTORU",
      subTitle: 'Yerli Emek, Büyük Başlangıç',
      body1: "Bu motor, Türk mühendis ve işçilerinin emeğiyle üretilen Devrim otomobilinin kalbidir. Devrim, Türkiye'nin kendi imkânlarıyla büyük hedeflere ulaşabileceğini gösteren tarihi bir adımdır.",
      callout: "Şimdi kontağa basarak bu tarihi motoru çalıştır ve Devrim'i yeniden hayata geçir!",
    },
    kasifMessage: "Her şey hazır! Kontağa bas ve Devrim'in motorunun sesini dinle!",
  },
  5: {
    step: 5,
    badge: '5. ADIM',
    title: 'DEVRİM YOLLARDA!',
    subTitle: 'Motor başarıyla çalıştırıldı.',
    parchment: {
      title: "DEVRİM'İN MOTORU",
      subTitle: 'Yerli Emek, Büyük Başlangıç',
      body1: "1961 yılında üretilen Devrim, Türk mühendis ve işçilerinin emeğiyle ortaya çıkan Türkiye'nin ilk yerli ve millî otomobilidir. Devrim, bağımsızlık, azim ve inançla geleceği üreten bir Türkiye'nin sembolüdür.",
      callout: 'Sen de bu bölümde motoru tamamlayarak tarihe yön veren bu büyük adımın bir parçası oldun!',
    },
    kasifMessage: 'Harika iş çıkardın! Devrim artık yollara hazır. Sen de geleceği üreten Türkiye\'nin bir parçasısın!',
  },
};

export const ATATURK_QUOTE_DEVRIM = {
  quote: '“Hayal eden değil, üreten bir Türkiye...”',
  author: 'K. Atatürk',
};
