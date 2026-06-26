# 28 — Phase 8: Monetization / Ads / Premium Refactor

1. **Amaç** — `adMobService` (604) ve RevenueCat erişimini repository/facade’a ayırmak; premium/free gating rules’ı saf hale getirmek (`14`).
2. **Kapsam** — MonetizationFacade, RevenueCatRepository, AdMobRepository (consent/banner/interstitial/appOpen), gating domain rules, usePremium/useAds hook’ları.
3. **Kapsam dışı** — Yeni ödeme ürünü/plan; review (ayrı, `review` feature).
4. **Ön koşullar** — Phase 2 (lifecycle ad init), Phase 5 (Home reklam aralıkları).
5. **Etkilenecek dosyalar** — `context/MonetizationContext.tsx`, `services/revenueCatService.ts`, `services/adMobService.ts`, `services/adMobService.web.ts`, `components/SafeBannerAd.tsx`, `app/lifecycle/useAppLifecycle.ts`.
6. **Taşınacak/bölünecek dosyalar** — adMobService → AdMobRepository (4 metot grubu); revenueCatService → RevenueCatRepository; Context → ince state + facade.
7. **Yeni hedef klasör yapısı** — `features/monetization/{presentation,application,domain,data}` (bkz. `14`).
8. **Adım adım işler** — (a) gating rules saf çıkar; (b) RevenueCatRepository; (c) AdMobRepository (consent/ATT/banner/interstitial/appOpen); (d) MonetizationFacade + use-case’ler; (e) Context’i ince state’e indir; (f) shim.
9. **Kod davranışı korunacak noktalar** — `premium` entitlement; reklam gizleme; consent+ATT sırası; app-open/interstitial kuralları; web no-op.
10. **Firestore/Storage/Auth/Notification etkileri** — Yok (Firestore/Auth/Notif dışı); yalnızca reklam/abonelik.
11. **Test gereksinimleri** — gating (saf); restore; consent sonrası reklam; interstitial aralık kuralı.
12. **Manuel QA checklist** — [ ] free’de reklam görünür [ ] satın al→reklam kaybolur [ ] restore [ ] consent akışı [ ] web no-op.
13. **Riskler** — R5 (gelir/premium regresyonu). Azaltma: gating testleri + staged rollout.
14. **Rollback planı** — Shim ile eski adMob/revenueCat/Context.
15. **Kabul kriterleri** — adMobService 4 sorumluluğa bölünmüş; gating saf+test; davranış birebir.
16. **Sonraki faza geçmeme şartları** — Premium/reklam QA regresyonu varsa Phase 9’a geçme.


## Implementation-spec bağlantıları (v2 — `32`–`39`)
- **PR kırılımı:** `39` Phase 8 → PR-8.1 gating domain rules, 8.2 RevenueCatRepository, 8.3 AdMobRepository, 8.4 MonetizationFacade+Context ince+shim.
- **Repository:** `35` §9 (RevenueCat: `hasActiveAdFreeEntitlement`/`presentAdFreePaywall`/`restore`/listener; AdMob: consent/ATT/banner/interstitial/appOpen, web no-op).
- **Korunan sabit:** `REVENUECAT_AD_FREE_ENTITLEMENT_ID='premium'`; `useMonetization` yüzeyi (`isAdFree`, `presentRemoveAdsPaywall`, `restorePurchases`...).
- **Testler:** `37` §10 (gating saf: `shouldShowAds(isAdFree)`).
- **Gate:** `adMobService` 4 sorumluluğa bölünmüş; gating saf+test; premium/reklam QA regresyonsuz.
