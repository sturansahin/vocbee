# 12 — AdMob, RevenueCat ve Monetization Akışı

## Mevcut Durum

- **`context/MonetizationContext.tsx` (191):** RevenueCat `customerInfo` listener; entitlement `premium`
  = reklamsız. `useAuth`'a bağlı (provider sırası; bkz. `03`).
- **`services/revenueCatService.ts` (237):** entitlement id `premium`; platform API anahtarları
  `EXPO_PUBLIC_*` env'den; locale override haritası; test anahtarı prod'da bloklanır.
  (react-native-purchases ^10.0.1)
- **`services/adMobService.ts` (509):** lazy native modul yükleme (Expo Go güvenli); UMP consent + ATT;
  interstitial / app-open / banner; **app-open her 3. açılışta** (`@app_launch_count`); test/prod ad
  id'leri `__DEV__`'e göre. (react-native-google-mobile-ads ^16.0.1)
- **`components/SafeBannerAd.tsx`** banner sarmalayıcısı (coverage hariç).
- `App.tsx` lifecycle'ı AdMob init + foreground refresh + app-open gösterimini orkestre eder (bkz. `03`).

## Sorunlar

1. Reklam ve abonelik ayrı servisler ama **monetization politikası** (premium -> reklam kapat) iki yere
   dağılmış (context + adMobService); "reklam gösterilsin mi?" kararı net tek yerde değil.
2. `adMobService` 509 satır, çok ilgi alanı (consent, ATT, 3 reklam tipi, launch-count, native load).
3. `@app_launch_count` merkezi anahtar listesinde değil (bkz. `11`).
4. App lifecycle ile sıkı bağ (init/gösterim zamanlaması; bkz. `03`).

## Önerilen Yaklaşım: `monetization` feature'ı + tek "reklam gösterilebilir mi" politikası

```
features/monetization/
  context/MonetizationProvider.tsx   # customerInfo listener; premium state
  hooks/useMonetization.ts           # eski useMonetization API (re-export; aynı)
  hooks/useAdGate.ts                  # premium + consent + launch-count -> gösterilebilir mi?
  services/
    revenueCat/
      revenueCatService.ts           # mevcut; entitlement 'premium', env anahtar erişimi
      localeMap.ts                    # locale override haritası
    admob/
      adMobService.ts                # facade (eski API aynı)
      consent.ts                     # UMP consent + ATT
      interstitial.ts, appOpen.ts, banner.ts
      nativeModule.ts                # lazy require (Expo Go güvenli)
      launchCounter.ts               # @app_launch_count (storageKeys'ten; bkz. 11)
      adUnitIds.ts                   # test/prod id seçimi (__DEV__) — GERÇEK ID'LER ENV/CONFIG'TE
  components/SafeBannerAd.tsx
  index.ts                           # facade
```

**Tek politika kapısı:** `useAdGate` (veya saf `canShowAd(state)`), "premium mi? consent var mı?
3. açılış mı?" sorularını tek yerde yanıtlar. AdMob servisleri ve ekranlar bu kapıyı kullanır;
davranış (her 3. açılışta app-open, premium'da reklam yok) **birebir** korunur.

**Güvenlik:** Gerçek ad unit id'leri ve RevenueCat anahtarları **dokümana yazılmaz**; env/config'ten
okunur (bkz. `13`). `eas.json`'daki anahtarlar dokümanda tekrar edilmez.

## Alternatifler ve Neden Elendiler

- **Reklam/abonelik kütüphanelerini değiştir** — Elendi: çalışan entegrasyon; değiştirmek yüksek risk + gelir etkisi.
- **Monetization'ı context'siz, sadece servis yap** — Elendi: `customerInfo` listener reaktif state ister; context uygun.
- **`adMobService`'i bölmeden bırak** — Elendi: 509 satır, çok sorumluluk; alt modüller test edilebilirlik sağlar.
- **`adMobService.web.ts`'i yok saymak** — Elendi: web shim'i platform davranışını korur; monetization
  feature mapping'inde native facade ile birlikte taşınmalıdır.
- **App-open frekansını (3) değiştir/parametreleştir** — Şimdilik elendi: davranış korunmalı; sabit kalır.

## Migration / Implementasyon Adımları

1. **PR-1:** `MonetizationContext`, `revenueCatService`, `adMobService`, `SafeBannerAd`'i feature'a `git mv`;
   eski yollardan re-export shim. Davranış aynı.
   - Komut: `npm run typecheck && npm run test:ci`
2. **PR-2:** `@app_launch_count`'ı merkezi `storageKeys`'e taşı (bkz. `11` PR-2); `launchCounter.ts`'e çıkar.
3. **PR-3:** `adMobService`'i alt modüllere böl (`consent`, `interstitial`, `appOpen`, `banner`,
   `nativeModule`, `adUnitIds`); `index`/facade eski API'ı korur. Her PR'da bir-iki modül.
4. **PR-4:** `useAdGate`/`canShowAd` politikasını çıkar; AdMob gösterim noktaları ve ekranlar bunu kullanır.
5. **PR-5:** App lifecycle (bkz. `03`) AdMob çağrılarını facade'tan tüketir.

Her PR sonunda: `npm run typecheck && npm run test:ci`.

## Riskler

- **Reklam gösterim sıklığı/zamanlaması kayarsa** gelir düşer veya kullanıcı deneyimi bozulur (ör. premium
  kullanıcıya reklam). Azaltım: `canShowAd` saf fonksiyon + birim testleri; app-open "her 3." davranışı sabit.
- **Native modul lazy load** kırılırsa Expo Go'da çöker. Azaltım: `nativeModule.ts` mevcut guard'ı birebir taşır.
- **RevenueCat entitlement id (`premium`)** değişmemeli. Azaltım: sabit; test anahtarı prod bloklaması korunur.
- **Consent/ATT sırası** değişirse store reddi riski. Azaltım: `consent.ts` akış sırası korunur.

## Test ve Kabul Kriterleri

- `canShowAd`/`useAdGate` birim testleri: premium=true -> false; 3. açılış -> app-open true; consent yok -> false.
- `launchCounter` testi: 3. açılışta tetik (mevcut davranış).
- `SafeBannerAd` ve adMob modülleri coverage'a kademeli dahil edilir.
- `npm run typecheck`, `npm run test:ci` yeşil.

## Etkilenecek Dosyalar

```
context/MonetizationContext.tsx -> src/features/monetization/context/MonetizationProvider.tsx (+ hooks/useMonetization.ts)
services/revenueCatService.ts   -> src/features/monetization/services/revenueCat/revenueCatService.ts (+ localeMap.ts)
services/adMobService.ts        -> src/features/monetization/services/admob/{adMobService(facade),consent,interstitial,appOpen,banner,nativeModule,launchCounter,adUnitIds}.ts
services/adMobService.web.ts    -> src/features/monetization/services/admob/adMobService.web.ts
components/SafeBannerAd.tsx     -> src/features/monetization/components/SafeBannerAd.tsx
(yeni)                          -> src/features/monetization/hooks/useAdGate.ts
App.tsx (ad çağrıları)           -> src/app/lifecycle/useStartupAds.ts (bkz. 03)
```
