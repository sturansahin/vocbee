# 15 — Performans Stratejisi

## Mevcut Durum

- **Dev ekranlar:** HomeScreen (2391), SettingsScreen (2310) — büyük render ağacı; HomeScreen 18 state,
  21 useCallback (memoization var ama dev bileşen tek parça).
- **Vocabulary asset'leri** `require` ile bundle'a gömülü (`.txt`/JSON), 21 dil x seviyeler.
- **AdMob native modul** lazy yükleniyor (iyi). AppState foreground'da sync + notif + ad refresh zinciri.
- **AsyncStorage** sık okuma (HomeScreen'de 13 çağrı); senkron olmayan ama çoklu round-trip.
- Liste render'ları (favorites, level test) için `FlatList` kullanımı doğrulanmalı.

## Sorunlar

1. **Büyük ekran = büyük render maliyeti:** tek state değişimi geniş ağacı yeniden çizebilir.
2. **Bundle boyutu:** tüm dil asset'leri bundle'da; başlangıç yükü ve indirme boyutu artar.
3. **Çoklu AsyncStorage round-trip** açılışta gecikme yaratabilir.
4. **Foreground zinciri** (sync+notif+ads) aynı anda çalışırsa jank.

## Önerilen Yaklaşım (refactor'ın doğal yan kazanımları + ölçüm-önce)

- **Önce ölç, sonra optimize et:** Profiling olmadan optimizasyon yapma. React DevTools Profiler +
  `performance.now()` işaretleri ile temel çıkar.
- **Render bölme (refactor'dan gelir):** Ekranlar hook+saf bileşenlere bölününce (bkz. `04`/`08`) doğal
  olarak `React.memo` sınırları oluşur; gereksiz render azalır.
- **Liste sanallaştırma:** Büyük listelerde `FlatList`/`FlashList` doğrula; `keyExtractor`,
  `getItemLayout`, `windowSize` ayarları. (FlashList yeni paket olur — sadece ölçüm ihtiyaç gösterirse.)
- **Asset yükleme:** `assetLoader` (bkz. `07`) tek kapı olduğu için, ileride **lazy/dynamic import**
  veya dil-başı OTA'ya geçiş tek noktadan yapılabilir (şimdilik davranış aynı).
- **Storage round-trip azalt:** `typedStorage` (bkz. `11`) ile açılışta batch okuma (`multiGet`) fırsatı.
- **Foreground zinciri sıralama:** lifecycle hook'ları (bkz. `03`) ile ağır işler `InteractionManager`/
  idle'a ertelenebilir (davranış sırası korunarak).

## Alternatifler ve Neden Elendiler

- **Hermes/engine değişikliği** — Elendi: Expo SDK 54 zaten Hermes; ek iş yok.
- **Erken FlashList'e geç** — Elendi (şimdilik): ölçüm olmadan yeni paket; sadece kanıt varsa.
- **Tüm asset'leri uzaktan yükle** — Elendi (şimdilik): offline davranışı etkiler; ayrı ürün kararı.
- **Agresif memoization (her yere memo/useMemo)** — Elendi: ölçümsüz memoization kendi maliyetini getirir.

## Migration / Implementasyon Adımları

1. **PR-1 (ölçüm tabanı):** Profiling notları + temel metrikler (cold start, Home ilk render, liste scroll FPS).
   Kod değişikliği yok; `15`'e bulgular eklenir.
2. **PR-2:** Liste ekranlarında `FlatList` ayarlarını (keyExtractor/getItemLayout) doğrula/iyileştir.
3. **PR-3:** Açılış storage okumalarını `multiGet` batch'e dönüştür (typedStorage üzerinden).
4. **PR-4:** Ağır foreground işlerini `InteractionManager.runAfterInteractions` ile ertele (sıra korunur).
5. **PR-5 (kanıt varsa):** asset lazy-loading veya FlashList.

Her PR sonunda: `npm run typecheck && npm run test:ci` + ilgili profiling tekrarı.

## Riskler

- **Erteleme (defer) davranış sırasını değiştirirse** notif/ad zamanlaması kayabilir. Azaltım: sıra ve
  koşullar korunur; karakterizasyon testi (bkz. `14`).
- **Memoization regresyonu** (stale closure). Azaltım: hook çıkışlarında dependency'ler korunur.
- **Ölçümsüz optimizasyon** zaman kaybı. Azaltım: PR-1 ölçüm kapısı zorunlu.

## Test ve Kabul Kriterleri

- Cold start ve Home ilk render süresi taban metriğe göre gerilememe (ideal: iyileşme).
- Liste scroll'da düşen frame azalması (profiler).
- Davranış testleri yeşil (notif/ad zamanlaması değişmedi).

## Etkilenecek Dosyalar

```
features/learning/screens/* , features/favorites/screens/*   -> FlatList ayarları
src/shared/storage/typedStorage.ts                            -> multiGet batch okuma
src/app/lifecycle/*                                           -> InteractionManager erteleme
features/learning/vocabulary/assetLoader.ts                   -> (ileride) lazy import noktası
```
