# 14 — Monetization / Ads / Premium Planı

## Mevcut durum
- `context/MonetizationContext.tsx` (191): RevenueCat listener + premium state + paywall; makul boyut.
- `services/revenueCatService.ts` (237): purchase/restore, `premium` entitlement.
- `services/adMobService.ts` (604) + `adMobService.web.ts`: consent (UMP) + ATT + banner/interstitial/app-open.
- `components/SafeBannerAd.tsx` (252): banner UI. `App.tsx` ad init + app-open kontrolü.

## Problem
- adMobService god-service (consent+3 reklam tipi+lifecycle). Premium/free gating UI’a dağılmış.

## Hedef yapı (`features/monetization/`)
```
monetization/
  presentation/ components/(SafeBannerAd), hooks/(usePremium, useAds)
  application/  MonetizationFacade, useCases/(purchasePremium, restorePurchases, maybeShowInterstitial,
                maybeShowAppOpenAd, initConsent)
  domain/       rules(premiumGating: free/premium davranışı — SAF), constants(entitlement="premium")
  data/         RevenueCatRepository, AdMobRepository(consent/banner/interstitial/appOpen ayrı metotlar)
```
- `MonetizationContext` ince state provider; iş mantığı facade’a.
- Premium/free davranışı **Strategy**; reklam tipi **Factory**. Consent UMP adımı ayrı use-case.

## Davranış korunacak noktalar
- `premium` entitlement aktifse reklam yok; paywall satın alma sonrası güncelleme.
- AdMob consent + ATT sırası; app-open/interstitial gösterim kuralları; web no-op.

## Test / QA
- premium/free gating (saf) testleri; restore akışı; consent sonrası reklam.
- QA: free’de reklam görünür, satın al → reklam kaybolur, restore çalışır.

## Riskler / rollback
- Risk: gelir regresyonu (reklam gösterilmemesi) veya premium tanınmaması → dikkatli QA + staged rollout. Rollback: shim.

## Kabul kriterleri
- `adMobService` 4 sorumluluğa bölünmüş; gating rules saf+test; davranış birebir.


---

## Implementation-spec detayları (v2 — `32`–`39`)
- **Repository sözleşmeleri:** `35-repository-adapter-contracts.md` §9 — `RevenueCatRepository` (`hasActiveAdFreeEntitlement`/`presentAdFreePaywall`/`restore`/listener) + `AdMobRepository` (consent/ATT/banner/interstitial/appOpen; web no-op).
- **Korunacak sabit:** `REVENUECAT_AD_FREE_ENTITLEMENT_ID = 'premium'`. `MonetizationContext` ince state kalır (`useMonetization`: `isAdFree`, `customerInfo`, `presentRemoveAdsPaywall`, `restorePurchases`...).
- **Saf gating kuralı:** `shouldShowAds(isAdFree)` → `domain/rules`; test `37` §10.
- **PR kırılımı:** `39` Phase 8 (PR-8.1 gating → 8.2 RevenueCatRepository → 8.3 AdMobRepository → 8.4 facade+Context ince+shim).
