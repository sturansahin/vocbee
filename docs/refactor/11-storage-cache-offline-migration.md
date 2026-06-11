# 11 — Storage, Cache, Offline ve Migration Stratejisi

## Mevcut Durum

- **`services/storageKeys.ts`:** AsyncStorage anahtarlarının **TEK KAYNAĞI**. Dosya başlığı değerlerin
  değiştirilmemesi gerektiğini belirtir. Bilinen anahtarlar (değerler dokümana **kopyalanmaz**, sadece referans):
  onboarding, kullanıcı verisi, device-id, progress, current-level, last-word-id, streak, vocabulary
  (prefix), native/target language, notification settings, tracked notifications, favorites (prefix),
  profile (prefix), shuffle-order (prefix), grammar-cache, user-language, app-review-prompt-state.
- **`services/storage.ts`:** AsyncStorage sarmalayıcısı (test edilmiş: `services/__tests__/storage.test.ts`).
- **Tutarsızlık:** `services/adMobService.ts` `@app_launch_count` anahtarını `storageKeys`'e koymadan
  doğrudan kullanıyor.
- **Offline:** `components/OfflineNotice.tsx` + `SyncService.needsSync` ile yerel-önce davranış.
- **Cache:** `@grammar_cache` (grammar proxy yanıtları), `@shuffle_order_` (kelime karıştırma sırası).

## Sorunlar

1. AsyncStorage çağrıları string anahtarla, **tipsiz**; yanlış JSON şekli derleme zamanında yakalanmaz.
2. Bir anahtar (`@app_launch_count`) merkezi listede değil → tek-kaynak ilkesi delinmiş.
3. Migration mantığı her serviste ayrı (vocabulary v2, favorites legacy) — ortak desen yok.
4. Offline/sync sözleşmesi `SyncService`'e gömülü; tek yerde görünmüyor.

## Önerilen Yaklaşım: Tipli storage erişimi + merkezi anahtar + migration kaydı

Anahtar **değerleri asla değişmez**; sadece erişim tiplenir ve tek kapıdan geçer.

```
shared/storage/
  storageKeys.ts          # mevcut; TEK KAYNAK (değerler aynı). @app_launch_count buraya eklenir.
  storage.ts              # mevcut sarmalayıcı taşınır
  typedStorage.ts         # get<T>/set<T>/remove tipli wrapper (anahtar -> tip eşleşmesi)
  migrations/
    index.ts              # registerMigration + runMigrations (uygulama açılışında)
    schemaVersion.ts      # global "storage schema version" takibi
```

**Tipli erişim:** `typedStorage` her anahtar için beklenen tipi bilir (ör. streak -> `StreakState`).
JSON parse/serialize tek yerde; hatalı şekil erken yakalanır. Servisler `typedStorage`'ı kullanır,
ham `AsyncStorage`'ı değil.

**Migration kaydı:** Her domain (vocabulary v2, favorites legacy, ...) migration'ını `migrations/`'a
kaydeder; açılışta sırayla çalışır ve idempotent'tir. Mevcut migration davranışları **birebir** korunur,
sadece tek bir orkestrasyona bağlanır.

## Alternatifler ve Neden Elendiler

- **MMKV'ye geç (react-native-mmkv)** — Elendi (şimdilik): performans kazanımı var ama tüm storage'ı
  taşımak yüksek riskli migrasyon; mevcut veri korunmalı. İleride ayrı değerlendirme (perf; bkz. `15`).
- **Redux-persist / zustand-persist** — Elendi: global store gerektirir (bkz. `04`); gereksiz.
- **Her serviste ayrı storage** — Elendi: tip güvenliği ve migration tutarlılığı sağlanamaz.
- **Anahtar değerlerini "düzeltmek"** — Kesinlikle elendi: mevcut kullanıcı verisini bozar.

## Migration / Implementasyon Adımları

1. **PR-1:** `storage.ts` + `storageKeys.ts` -> `shared/storage/`; eski yollardan re-export shim.
   - Komut: `npm run typecheck && npm run test:ci`
2. **PR-2:** `@app_launch_count`'ı `storageKeys`'e ekle (aynı string değer); `adMobService` merkezi anahtarı kullanır.
3. **PR-3:** `typedStorage.ts` ekle; en riskli domain'lerden başlayarak (streak/progress/favorites) servisleri
   tipli erişime geçir (her PR'da bir domain). JSON şekli aynı.
4. **PR-4:** `migrations/` orkestrasyonunu ekle; mevcut vocabulary v2 ve favorites legacy migration'larını
   kayıt olarak bağla (davranış aynı). Açılışta `runMigrations` çağrılır (bootstrap; bkz. `03`).

Her PR sonunda: `npm run typecheck && npm run test:ci`.

## Riskler

- **Anahtar değeri/JSON şekli kazara değişirse** kalıcı kullanıcı verisi kaybı. Azaltım: değerler shim'le
  korunur; `typedStorage` tipleri mevcut şekle göre yazılır; round-trip testleri.
- **Migration sırası/idempotensi** yanlışsa veri çift işlenir. Azaltım: her migration idempotent + versiyon
  guard; eski-veri fixture testleri.
- **Açılışta migration gecikmesi** UI'ı bloklayabilir. Azaltım: migration hızlı/asenkron; splash ardında çalışır.

## Test ve Kabul Kriterleri

- Mevcut `services/__tests__/storage.test.ts` (yeni yolla) yeşil.
- `typedStorage` round-trip testleri (get/set/remove) her domın tipi için.
- Migration testleri: eski-format fixture -> beklenen yeni format (vocabulary v2, favorites legacy).
- `npm run typecheck`, `npm run test:ci` yeşil.

## Etkilenecek Dosyalar

```
services/storage.ts       -> src/shared/storage/storage.ts (+ shim)
services/storageKeys.ts   -> src/shared/storage/storageKeys.ts (+ shim; @app_launch_count eklenir)
(yeni)                    -> src/shared/storage/typedStorage.ts
(yeni)                    -> src/shared/storage/migrations/{index,schemaVersion}.ts
services/adMobService.ts  -> @app_launch_count için merkezi anahtar kullanır
services/__tests__/storage.test.ts -> import yolu güncellenir
```
