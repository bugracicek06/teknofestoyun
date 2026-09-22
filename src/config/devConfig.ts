/**
 * =========================================================================
 * MERKEZİ GELİŞTİRME VE TEST AYARLARI (CENTRAL DEV CONFIG)
 * =========================================================================
 *
 * DEV_UNLOCK_ALL_LEVELS = true:
 * - Ana bölüm seçim ekranındaki 6 bölümün tamamı (Göbeklitepe, Demir Çağı,
 *   Anadolu Ustalığı, Mühendislik, Millî Teknoloji, Uzay Teknolojileri)
 *   doğrudan seçilebilir ve oynanabilir olur.
 * - Önceki bölümü tamamlama şartı aranmaz.
 * - Kilit ikonları gösterilmez, kartların tümü tıklanabilir olur.
 *
 * DEV_UNLOCK_ALL_LEVELS = false:
 * - Standart kiosk kilit ve aşamalı ilerleme sistemine anında geri döner.
 */
export const DEV_CONFIG = {
  DEV_UNLOCK_ALL_LEVELS: true,
};

export const DEV_UNLOCK_ALL_LEVELS = DEV_CONFIG.DEV_UNLOCK_ALL_LEVELS;
