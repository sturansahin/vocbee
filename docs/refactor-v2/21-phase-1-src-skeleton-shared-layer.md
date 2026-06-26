# 21 — Phase 1: `src/` İskeleti + Shared Katmanı

1. **Amaç** — `src/{app,shared,features}` iskeletini kurmak, path alias’ları açmak, `shared/*`’ı (en çok tüketilen, en az bağımlı) taşımak.
2. **Kapsam** — Klasör iskeleti; alias (`@app/@shared/@features`); `shared/ui|theme|storage|firebase|i18n|utils|errors|types` taşıma (shim ile).
3. **Kapsam dışı** — Feature içi mantık bölme; bootstrap (Phase 2); Firestore model (Phase 3).
4. **Ön koşullar** — Phase 0 tamam (CI yeşil).
5. **Etkilenecek dosyalar** — `tsconfig.json`, `babel.config.js`, `services/storageKeys.ts`, `services/storage.ts`, `config/firebase.ts`, `context/ThemeContext.tsx`, `services/i18n.ts`, `locales/*`, `utils/rtl.ts`, `utils/typography.ts`, `utils/profileAvatar.ts`, `components/UIComponents.tsx`, `CustomAlert.tsx`, `ErrorBoundary.tsx`, `OfflineNotice.tsx`, vb.
6. **Taşınacak/bölünecek dosyalar** — yukarıdaki ortak/altyapı dosyaları → `shared/*`. Her eski yol shim’e dönüşür.
7. **Yeni hedef klasör yapısı** — `src/shared/{ui,theme,storage,firebase,api,i18n,utils,errors,types}` + boş `features/*` ve `app/*` iskeleti.
8. **Adım adım işler** — (a) alias ekle; (b) `shared/` klasörlerini oluştur; (c) altyapı dosyalarını taşı; (d) eski yollara shim koy; (e) `shared/errors/AppError` ekle (yeni, davranış değiştirmeden); (f) import’ları kademeli alias’a çevir.
9. **Kod davranışı korunacak noktalar** — `storageKeys` string değerleri AYNEN; firebase config aynı; i18n dilleri aynı; theme davranışı aynı.
10. **Firestore/Storage/Auth/Notification etkileri** — Yok (yalnızca yol değişimi).
11. **Test gereksinimleri** — Mevcut testler shim’ler sayesinde yeşil kalır; storage/i18n testleri yeni yola taşınır.
12. **Manuel QA checklist** — [ ] uygulama açılıyor [ ] tema/dil çalışıyor [ ] storage okumaları sağlam.
13. **Riskler** — R10 (döngüsel import), R13 (büyük diff). Azaltma: `import/no-cycle`, küçük PR’lar.
14. **Rollback planı** — Shim’ler nedeniyle import’lar eski yoldan da çalışır; taşıma geri alınabilir.
15. **Kabul kriterleri** — typecheck/test yeşil; alias’lar çalışıyor; `shared/*` dolu; lint cycle yok.
16. **Sonraki faza geçmeme şartları** — Alias/shim sağlam değilse veya testler kırmızıysa Phase 2’ye geçme.


## Implementation-spec bağlantıları (v2 — `32`–`39`)
- **PR kırılımı:** `39` Phase 1 → PR-1.1 alias, 1.2 boş iskelet, 1.3 `shared/storage`, 1.4 `shared/firebase`, 1.5 `shared/i18n`, 1.6 `shared/theme`, 1.7 `shared/ui`, 1.8 `shared/errors`+`utils`.
- **Alias kurulumu (3 katman):** `38` §2-4 (tsconfig paths + `babel-plugin-module-resolver` + jest moduleNameMapper; `@/*` KORUNUR).
- **Shim deseni:** `36` §4-6 (storageKeys/firebase/i18n/theme/ui → `export *`; gerçek export biçimine göre).
- **Import sınırı:** `33` (taşınan shared SDK'yı sarmalar; `domain` saf kalır).
- **Bu fazda DOKUNULMAYAN:** feature içi mantık, `App.tsx` bölme (Phase 2), Firestore model (Phase 3).
- **Gate:** alias çözülüyor + tüm shim'li testler yeşil + `import/no-cycle` temiz.
