/**
 * Merkeze alınmış Rehber Asistan (Kaşif) stage/etap tüyo ve ipucu veri kaynağı.
 * Tüm 6 bölüm için tek canonical kaynaktır; duplicate metinleri engeller.
 */

export interface ModuleStageHints {
  [stageKey: string]: string;
}

export const ASSISTANT_HINTS: Record<string, ModuleStageHints> = {
  gobeklitepe: {
    '1': 'Alttan bir hayvan seç veya sürükle; dikilitaş üzerindeki parlayan yuvasına dokunarak yerleştir.',
    default: 'Hayvan kabartmalarını T-biçimli dikilitaştaki doğru yerlerine yerleştir.',
  },
  demir_cagi: {
    '1': 'Kızıl demir cevheri ve meşe kömürünü ocağa sürükle.',
    '2': 'Körüğü pompalayarak ocağın ısısını artır ve demiri tavla.',
    '3': 'Örs üzerinde çekiç darbesini sarı hedef bölgesine denk getir.',
    '4': 'Yatağan parçalarını (namlu, balçak, kabza, kabza başı) yuvalarına yerleştir.',
    default: 'Demir cevheri ve kömürü ocağa sürükleyerek işe başla.',
  },
  anadolu_ustaligi: {
    '1': 'Geleneksel motiflerden birini seçerek ustalığa ilk adımını at!',
    '2': 'Kömür tozu kesesini al ve delikli desen kağıdının üzerinde gezdir.',
    '3': 'Tahrir fırçasını seç ve kömür tozunun bıraktığı izlerin üzerinden geç.',
    '4': 'Motiflerin üzerindeki numaralara dokun ve seçtiğin rengi uygula.',
    '5': 'Sırlama banyosunu tamamla ve fırında pişirerek parlaklığı yakala!',
    default: 'Geleneksel çini sanatının inceliklerini adım adım uygula.',
  },
  sanayilesme: {
    '1': "Devrim'in motor bölümünü keşfetmek için kaput mandalına dokun.",
    '2': 'Motor parçalarını doğru montaj sırasına göre hazırla.',
    '3': 'Motor parçalarını doğru yuvalarına sürükleyerek montajı tamamla.',
    '4': "Montaj tamamlandı! Kontağa bas ve Devrim'in motorunu çalıştır.",
    '5': 'Geleceği üreten mühendislerimizin mirası seninle yaşıyor!',
    default: 'Motor parçalarını doğru yuvalarına yerleştirerek montajı tamamla.',
  },
  milli_teknoloji: {
    '1': "Gövde, kanat ve kuyruk parçalarını montaj yuvalarına yerleştir.",
    '2': 'Görev tanımına en uygun sensör modülünü seç ve monte et.',
    '3': 'Rüzgâr ve batarya analizine göre en optimum uçuş rotasını onayla.',
    '4': 'Görevi başlatarak İHA\'nın hedef bölgeyi taramasını sağla.',
    default: "Parçaları doğru noktalara yerleştirerek İHA'nı hazırla.",
  },
  uzay_teknolojileri: {
    '1': 'Önce ana gövdeyi yerleştir, ardından diğer alt sistemleri ekle.',
    '2': 'Güneş panelleri, anten ve itki sistemlerini kontrol et.',
    '3': 'Yeryüzü gözlemi için en ideal yörüngeyi (LEO) seçerek uyduyu yerleştir.',
    '4': 'Telemetri bağlantısını kur ve görevi başarıyla tamamla.',
    default: 'Önce ana gövdeyi yerleştir, ardından diğer sistemleri ekle.',
  },
};

/**
 * Verilen modül ve stage için kısa ve net tüyo metnini döner.
 */
export function getAssistantHint(moduleKey: string, stageId: string | number = '1'): string {
  const moduleConfig = ASSISTANT_HINTS[moduleKey];
  if (!moduleConfig) {
    return 'Görev adımlarını sırayla tamamlayarak ilerle.';
  }
  return moduleConfig[String(stageId)] || moduleConfig.default || 'Görev adımlarını dikkatle takip et.';
}
