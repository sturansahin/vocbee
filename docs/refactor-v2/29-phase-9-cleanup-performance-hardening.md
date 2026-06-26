# 29 — Phase 9: Cleanup / Performance / Hardening

1. **Amaç** — Shim’leri kaldırmak, dead code temizlemek, eski Firestore alanlarını (doğrulanmış migration sonrası) silmek, performans ve CI sertleştirmesi.
2. **Kapsam** — Shim silme, kullanılmayan import/dosya temizliği, eski `progress.learnedWords`/`favorites` alan temizlik planı, perf iyileştirme, coverage eşiklerini yükseltme.
3. **Kapsam dışı** — Yeni özellik; mimari değişimi.
4. **Ön koşullar** — Tüm önceki fazlar tamam; migration %100 doğrulanmış; uyumluluk penceresi kapanmış.
5. **Etkilenecek dosyalar** — Tüm shim dosyaları (eski yollar), `jest.config.js` (exclude daralt), `firestore.rules` (eski alan `hasOnly`’dan çıkarma planı), CI config.
6. **Taşınacak/bölünecek dosyalar** — Shim’ler silinir; kalan import’lar yeni yola çevrilir.
7. **Yeni hedef klasör yapısı** — Yalnızca `src/*`; kökteki eski `screens/`, `services/`, `context/`, `components/`, `utils/`, `config/` (shim sonrası) boşalır.
8. **Adım adım işler** — (a) shim’leri kaldır, import’ları yeni yola çevir; (b) dead code/dosya sil; (c) eski Firestore alan temizliği (ayrı onaylı script, backup sonrası); (d) perf (memo, list virtualization, lazy); (e) coverage eşiğini yükselt; (f) dual-write’ı kapat.
9. **Kod davranışı korunacak noktalar** — Eski alan silme yalnızca dual-read’e ihtiyacı olan app sürümü kalmadıysa; kullanıcıya görünen davranış değişmez.
10. **Firestore/Storage/Auth/Notification etkileri** — Firestore: eski alanlar silinir (geri alınamaz, backup zorunlu); diğerleri etkilenmez.
11. **Test gereksinimleri** — Tüm test paketi yeşil; coverage eşikleri yükseltilmiş; rules v2 emulator testleri.
12. **Manuel QA checklist** — [ ] eski yol importı kalmadı [ ] uygulama tam regresyon QA [ ] eski sürüm kullanıcısı kalmadı (analytics) [ ] silme sonrası progress sağlam.
13. **Riskler** — R1 (silme veri kaybı), R12 (eski app). Azaltma: backup + analytics ile sürüm dağılımı + aşamalı silme.
14. **Rollback planı** — Silme öncesi backup’tan restore; shim silme commit’i geri al.
15. **Kabul kriterleri** — Shim yok; dead code yok; eski Firestore alanı (güvenli) temizlenmiş; coverage hedefleri tutuyor; CI sert.
16. **Sonraki faza geçmeme şartları** — Bu son faz; ürün refactor’ı tamamlanmış sayılır. Eski alan silme onayı alınmadan silme yapılmaz.


## Implementation-spec bağlantıları (v2 — `32`–`39`)
- **PR kırılımı:** `39` Phase 9 → PR-9.1 import güncelleme, 9.2 shim silme, 9.3 dead code, 9.4 eski Firestore alan cleanup (AYRI ONAY), 9.5 dual-write kapatma, 9.6 coverage/lint sertleştirme.
- **Shim silme:** `36` §3,§8 (import sayacı 0 olunca; kökteki `screens/services/context/...` boşalır).
- **Eski alan cleanup:** `34` §1 + `08` — yalnızca migration %100 doğrulanmış + uyumluluk penceresi kapanmış + backup'lı; geri alınamaz.
- **Sertleştirme:** `38` §9 (ESLint `warn`→`error`, `@/*`→`./src/*`, coverage eşiği yükselt, exclude daralt).
- **Korunan davranış:** kullanıcıya görünen hiçbir şey değişmez; silme öncesi backup zorunlu (R1).
- **Gate:** shim yok; dead code yok; eski alan güvenli temizlenmiş; CI sert; coverage hedefleri tutuyor.
