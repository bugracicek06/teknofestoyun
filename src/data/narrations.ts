import { SceneKeys } from '../types/game.ts';

export interface NarrationItem {
  id: string;
  moduleId: string;
  sceneKey: string;
  title: string;
  audioPath: string;
  displayInstruction: string;
  narrationText: string;
}

export const MODULE_NARRATIONS: Record<string, NarrationItem> = {
  gobeklitepe: {
    id: 'gobeklitepe',
    moduleId: 'gobeklitepe',
    sceneKey: SceneKeys.GOBEKLITEPE,
    title: 'Göbeklitepe – Taşın Hafızası',
    audioPath: '/audio/narration/gobeklitepe.mp3',
    displayInstruction: 'Hayvanı seç, sonra taş üzerindeki yerine dokun veya sürükle.',
    narrationText:
      "Merhaba genç kâşif! Göbeklitepe'nin gizemli taşlarını keşfetmeye hazır mısın? Bir hayvan figürünü seç ve T biçimli dikilitaş üzerindeki doğru yerine yerleştir.",
  },
  demir_cagi: {
    id: 'demir_cagi',
    moduleId: 'demir_cagi',
    sceneKey: SceneKeys.DEMIR_CAGI,
    title: 'Demir Çağı – Ateşe Hükmet',
    audioPath: '/audio/narration/demir-cagi.mp3',
    displayInstruction: 'Malzemeleri ocağa taşı, sıcaklığı koru ve metali işle.',
    narrationText:
      "Demir Çağı'na hoş geldin! Demir cevheri ve kömürü ocağa taşı. Körügü kullanarak ocağın ateşini canlandır ve çekicinle akkor demire şekil ver.",
  },
  anadolu_ustaligi: {
    id: 'anadolu_ustaligi',
    moduleId: 'anadolu_ustaligi',
    sceneKey: SceneKeys.ANADOLU_USTALIGI,
    title: 'Anadolu Ustalığı – Ustalığın İzleri',
    audioPath: '/audio/narration/anadolu-ustaligi.mp3',
    displayInstruction: 'Malzeme, biçim, renk ve motif seç; kendi eserini süsle.',
    narrationText:
      "Anadolu'nun kadim zanaatkârları arasına katıl! Malzemeni, biçimini ve rengini belirle, ardından geleneksel motiflerle kendi eşsiz eserini tasarla.",
  },
  sanayilesme: {
    id: 'sanayilesme',
    moduleId: 'sanayilesme',
    sceneKey: SceneKeys.SANAYILESME,
    title: 'Mühendislik – Mekanizmayı Kur',
    audioPath: '/audio/narration/muhendislik.mp3',
    displayInstruction: 'Dişlileri ve mili birleştir; hareketin nasıl aktarıldığını izle.',
    narrationText:
      'Şimdi mühendislik zamanı! Çarkları ve hareket milini mekanizmaya bağla, kolu çevirerek hareketin güce nasıl dönüştüğünü keşfet.',
  },
  milli_teknoloji: {
    id: 'milli_teknoloji',
    moduleId: 'milli_teknoloji',
    sceneKey: SceneKeys.MILLI_TEKNOLOJI,
    title: 'Millî Teknoloji – Gökyüzüne Yüksel',
    audioPath: '/audio/narration/milli-teknoloji.mp3',
    displayInstruction: 'Sivil görev için sensörü seç ve güvenli rotayı belirle.',
    narrationText:
      'Millî Teknoloji Hamlesi ile gökyüzüne yükseliyoruz! Sivil görevine en uygun sensörü seç, rotanı çiz ve insansız hava aracını güvenle yönlendir.',
  },
  uzay_teknolojileri: {
    id: 'uzay_teknolojileri',
    moduleId: 'uzay_teknolojileri',
    sceneKey: SceneKeys.UZAY_TEKNOLOJILERI,
    title: 'Uzay Teknolojileri – Sıra Sende',
    audioPath: '/audio/narration/uzay-teknolojileri.mp3',
    displayInstruction: 'Gövde, enerji ve sensör seçerek kendi uzay aracını tasarla.',
    narrationText:
      'Geleceğin uzay mühendisi sensin! Gövde, güneş paneli ve bilimsel sensörleri bir araya getirerek millî uzay aracını tasarla ve fırlatmaya hazırla.',
  },
};

const ID_ALIASES: Record<string, string> = {
  'gobeklitepe': 'gobeklitepe',
  'demir_cagi': 'demir_cagi',
  'demir-cagi': 'demir_cagi',
  'anadolu_ustaligi': 'anadolu_ustaligi',
  'anadolu-ustaligi': 'anadolu_ustaligi',
  'sanayilesme': 'sanayilesme',
  'muhendislik': 'sanayilesme',
  'mühendislik': 'sanayilesme',
  'milli_teknoloji': 'milli_teknoloji',
  'milli-teknoloji': 'milli_teknoloji',
  'millî_teknoloji': 'milli_teknoloji',
  'millî-teknoloji': 'milli_teknoloji',
  'uzay_teknolojileri': 'uzay_teknolojileri',
  'uzay-teknolojileri': 'uzay_teknolojileri',
};

export function getNarrationByModuleId(moduleId?: string): NarrationItem | undefined {
  if (!moduleId) return undefined;
  const normalizedKey = ID_ALIASES[moduleId] || moduleId.toLowerCase().replace(/-/g, '_');
  const item = MODULE_NARRATIONS[normalizedKey] || MODULE_NARRATIONS[moduleId];
  if (!item || !item.narrationText) {
    console.error(`[Narration] Missing narration text for module: ${moduleId}`);
  }
  return item;
}

export function getNarrationBySceneKey(sceneKey?: string): NarrationItem | undefined {
  if (!sceneKey) return undefined;
  return Object.values(MODULE_NARRATIONS).find((item) => item.sceneKey === sceneKey);
}
