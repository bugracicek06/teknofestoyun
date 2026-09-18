# Narration Audio Files (Müze & TEKNOFEST Yönerge Seslendirmeleri)

Bu dizin, profesyonel olarak stüdyoda veya nöral TTS (ElevenLabs, Azure Speech, Google Cloud TTS vb.) servisleriyle üretilmiş `.mp3` ses dosyaları için ayrılmıştır.

Sistem dosya öncelikli çalışır (`AudioFileNarrationProvider`):
1. İlgili `.mp3` dosyası bu dizinde mevcutsa doğrudan bu dosya çalınır.
2. Dosya bulunamaz veya yüklenemezse sistem otomatik ve kesintisiz olarak optimize edilmiş `WebSpeechNarrationProvider` motoruna geçer.

### Dosya İsimlendirmesi:
- `gobeklitepe.mp3` : Göbeklitepe – Taşın Hafızası
- `demir-cagi.mp3` : Demir Çağı – Ateşe Hükmet
- `anadolu-ustaligi.mp3` : Anadolu Ustalığı – Ustalığın İzleri
- `muhendislik.mp3` : Mühendislik – Mekanizmayı Kur
- `milli-teknoloji.mp3` : Millî Teknoloji – Gökyüzüne Yüksel
- `uzay-teknolojileri.mp3` : Uzay Teknolojileri – Sıra Sende
