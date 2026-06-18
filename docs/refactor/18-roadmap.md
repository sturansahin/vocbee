# 18 — Phase-Based Implementation Roadmap

Amaç: riski düşük, faydası yüksek adımlardan başlayarak, davranışı koruyarak kademeli geçiş.
Her faz birden çok küçük PR'dan oluşur. Hiçbir faz "big-bang rewrite" değildir.

## Faz 0 — Emniyet ağı ve iskelet (DAVRANIŞ DEĞİŞMEZ)
Hedef: refactor'ı güvenli yapacak altyapı.
- Mevcut durum snapshot'ını yeniden üret: satır sayıları, hook sayıları, direct Firestore access,
  storage key inventory, test suite sayısı.
- `notificationSettings` disabled payload kararını ver ve rules/setup testleriyle sabitle.
- CI gate + path-filtre (bkz. 16); coverage threshold düşük başlangıç (bkz. 14).
- `src/` iskeleti + path alias'lar (bkz. 02 PR-A).
- Secret-scan + `.gitignore` denetimi (bkz. 13).
- Komut: `npm run typecheck && npm run typecheck:test && npm run test:ci`
- Çıkış: boş `src/` ağacı, yeşil CI, hiç dosya taşınmadı.

## Faz 1 — Paylaşılan taban (DÜŞÜK risk / YÜKSEK fayda) ← ÖNERİLEN İLK FAZ
Hedef: tekrarı bitir, herkesin ihtiyacı olan tabani taşı.
- `useResponsive` ortak hook; 4 ekrandaki `scale/moderateScale` kopyalarını birleştir (bkz. 04).
- `storageKeys` + `storage` -> `shared/storage`; `@app_launch_count` merkezileştir (bkz. 11).
- `constants` renkleri -> `shared/theme/colors`; `i18n` + `locales` + `rtl` -> `shared/i18n` (bkz. 09/10).
- `config/firebase` -> `shared/firebase`; `UIComponents` -> `shared/ui` (bkz. 02/09).
- Hepsinde eski yollardan re-export shim (geriye uyum).
- Komut: her PR `npm run typecheck && npm run test:ci`.
- Çıkış: kod tekrarı azalır; risk minimum (saf taşıma + shim).

## Faz 2 — App bootstrap / lifecycle ayrımı (ORTA risk)
Hedef: `App.tsx` god-component'ini çöz (bkz. 03).
- `AppProviders`, `bootstrap/*`, `navigation/*`, `lifecycle/*` ayır.
- Lifecycle effect'leri tek tek hook'lara taşı (her PR 1-2 effect); sıra/bağımlılık birebir.
- Ön koşul: notif/ad/sync karakterizasyon testleri (bkz. 14).
- Komut: `npm run typecheck && npm run typecheck:test && npm run test:ci`.

## Faz 3 — Notification modülerleştirme (ORTA-YÜKSEK risk)
Hedef: 1176 satırlık servisi saf/IO ayır (bkz. 06).
- Golden testler önce; sonra `constants/types`, saf `slotPlanner`/`contentBuilder`, `expoAdapter`, kalan modüller.
- Facade eski API'ı korur.
- Komut: `npm run typecheck && npm run test:ci`.

## Faz 4 — Auth / profile / sync (YÜKSEK risk, kritik veri)
Hedef: AuthContext'i incelt; SyncService'i `DomainSyncer`'lara böl; `userDoc` tek kapı (bkz. 05).
- Ön koşul: `test:rules` + auth/sync karakterizasyon testleri.
- Komut: `npm run typecheck && npm run test:ci && npm run typecheck:rules && npm run test:rules`.

## Faz 5 — Learning domainleri + Home parçalama (ORTA risk)
Hedef: vocabulary/progress/streak/favorites feature'lara; Home hook'lara bölünür (bkz. 04/07).
- `assetLoader` ayrımı + schema-v2 / favorites-legacy migrasyon testleri.
- Komut: `npm run typecheck && npm run test:ci`.

## Faz 6 — Settings / Setup parçalama (ORTA risk)
Hedef: 2196 + 1179 satırlık ekranları bölümlere; Setup doğrudan Firestore yazımını kapat,
Settings stale Firestore import'larını temizle (bkz. 08).
- Ön koşul: `test:rules`.
- Komut: `npm run typecheck && npm run test:ci && npm run test:rules`.

## Faz 7 — Monetization modülerleştirme (YÜKSEK risk: gelir)
Hedef: adMobService'i alt modüllere; `useAdGate` politikası (bkz. 12).
- Ön koşul: `canShowAd`/launch-counter testleri.
- Komut: `npm run typecheck && npm run test:ci`.

## Faz 8 — Backend birleştirme + güvenlik (ORTA risk)
Hedef: grammar-proxy ortak core; env kapısı; rules-parite testi (bkz. 13).
- Komut: `npm run typecheck:worker && npm --prefix functions run build && npm --prefix functions run lint && npm run test:rules`.

## Faz 9 — Performans + temizlik (DÜŞÜK risk)
Hedef: ölçüm tabanlı iyileştirmeler (bkz. 15); re-export shim'leri kaldır; coverage threshold hedefe.
- Komut: tüm matris.

## Bağımlılık sırası (özet)
```
Faz 0 -> Faz 1 -> (Faz 2, Faz 3, Faz 5, Faz 6, Faz 7 parçalı paralel olabilir) 
      Faz 4 (Faz 1 shared/firebase'e bağlı) 
      Faz 8 (Faz 4 userDoc'a bağlı) 
      Faz 9 en son
```

## Neden bu sıra?
- **Faz 1 ilk:** en düşük risk (saf taşıma + shim), anında tekrar azaltır, sonraki tüm fazların
  ihtiyaç duyduğu `shared` tabanını kurar.
- **Veri-kritik fazlar (4)** ancak emniyet ağı (Faz 0) ve taban (Faz 1) hazırken yapılır.
- **Gelir-kritik (7)** izole edilip iyi test edilene kadar ertelenir.
