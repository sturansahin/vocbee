# VocBee — Refactor v2 Dokümantasyonu

Bu klasör, VocBee mobil uygulamasının (Expo SDK 54 / React Native 0.81.5 / React 19.1 / TypeScript strict)
**Özellik Bazlı Katmanlı Mimari** (Feature-Based Layered Architecture) hedefine, mevcut ürün mantığını ve
kullanıcı verisini bozmadan, fazlı ve production-ready şekilde geçirilmesi için hazırlanmış planları içerir.

> ⚠️ Bu dokümanlar **yalnızca plandır**. Bu aşamada hiçbir kaynak kod taşınmamış, değiştirilmemiş; hiçbir
> Firestore verisi, `firestore.rules` veya migration script'i çalıştırılmamıştır. Kod refactor'una yalnızca
> bu planlar onaylandıktan sonra başlanmalıdır.

## Bu doküman seti `docs/refactor/` (v1) yerine ne sunar?

Repoda zaten olgun bir `docs/refactor/` (v1, 21 doküman) seti var. v2:
- v1'in **flat `src/` + ince katman** önerisini, istenen **`features/<feature>/{presentation,application,domain,data}`**
  4-katmanlı modeline yükseltir.
- Firestore için **subcollection tabanlı v2 veri modeli** + dual-read/dual-write migration ekler (v1'de bu zayıftı).
- v1 ile uyumu `existing-docs-alignment.md` içinde madde madde değerlendirir.

## Okuma sırası

| # | Doküman |
|---|---------|
| 00 | `00-analysis-methodology.md` |
| 01 | `01-current-state-audit.md` |
| 02 | `02-target-architecture.md` |
| 03 | `03-current-app-behavior.md` |
| 04 | `04-feature-boundaries.md` |
| 05 | `05-folder-structure-plan.md` |
| 06 | `06-clean-code-solid-patterns.md` |
| 07 | `07-firestore-data-model-v2.md` |
| 08 | `08-firestore-migration-strategy.md` |
| 09 | `09-security-rules-and-env-hygiene.md` |
| 10 | `10-auth-profile-sync-plan.md` |
| 11 | `11-learning-progress-vocabulary-plan.md` |
| 12 | `12-notification-architecture-plan.md` |
| 13 | `13-settings-onboarding-plan.md` |
| 14 | `14-monetization-ads-premium-plan.md` |
| 15 | `15-testing-strategy.md` |
| 16 | `16-ci-cd-quality-gates.md` |
| 17 | `17-risk-register.md` |
| 18 | `18-definition-of-done.md` |
| 19 | `19-refactor-roadmap-overview.md` |
| 20 | `20-phase-0-safety-baseline.md` |
| 21 | `21-phase-1-src-skeleton-shared-layer.md` |
| 22 | `22-phase-2-app-bootstrap-navigation-providers.md` |
| 23 | `23-phase-3-firestore-model-and-migration-prep.md` |
| 24 | `24-phase-4-auth-profile-sync-refactor.md` |
| 25 | `25-phase-5-learning-home-refactor.md` |
| 26 | `26-phase-6-notifications-refactor.md` |
| 27 | `27-phase-7-settings-onboarding-refactor.md` |
| 28 | `28-phase-8-monetization-refactor.md` |
| 29 | `29-phase-9-cleanup-performance-hardening.md` |
| 30 | `30-acceptance-checklist.md` |
| 31 | `31-implementation-order.md` |
| 32 | `32-implementation-spec-index.md` *(implementation-spec — başla buradan)* |
| 33 | `33-layer-contracts-and-import-rules.md` |
| 34 | `34-firestore-types-rules-migration-spec.md` |
| 35 | `35-repository-adapter-contracts.md` |
| 36 | `36-shim-and-file-move-recipes.md` |
| 37 | `37-testing-code-templates.md` |
| 38 | `38-ci-eslint-alias-config-spec.md` |
| 39 | `39-phase-pr-breakdown.md` |
| 40 | `40-phase-9e-ci-lint-docs-audit.md` *(Phase 9E audit — CI trigger fix + ESLint/secret-scan plan)* |
| + | `phase-9-firestore-cleanup-plan.md` (Phase 9E — Firestore legacy field cleanup plan, uygulanmadı) |
| + | `existing-docs-alignment.md` (v1 uyum analizi) |

## Implementation-spec katmanı (`32`–`39`)

`00`–`31` "ne yapılacak?" (strateji + faz) sorusunu yanıtlar; `32`–`39` "nasıl yapılacak?" sorusunu yanıtlar:
somut TypeScript tipleri, repository/adapter sözleşmeleri, Firestore DTO + legacy→v2 adapter iskeletleri, migration
dry-run iskeleti, security rules skeleton, shim/dosya-taşıma reçeteleri, import sınırları, ESLint/alias/CI konfig
önerileri, test skeleton'ları ve faz→PR kırılımı. Refactor'a başlayacak kişi/model **önce `32`'yi** okur (karar sırası
+ zorunlu okuma listesi oradadır).

> Bu dokümanlardaki tüm kod blokları **örnek/contract/skeleton**dır; gerçek implementasyon değildir. Bu görevde hiçbir
> kaynak kod, `firestore.rules`, Firestore verisi veya konfig dosyası değiştirilmemiş; hiçbir migration script'i çalıştırılmamıştır.

## Değişmez kabuller (tüm dokümanlar için bağlayıcı)

1. **AsyncStorage key string değerleri** — `services/storageKeys.ts` içindeki tüm string'ler birebir korunur.
2. **Local-first vocabulary** — 105 adet `assets/vocabulary/*.txt` (21 dil × 5 seviye) local'de kalır;
   Firestore'a taşınmaz.
3. **Firestore davranış sözleşmesi** — client'ın yazdığı her payload `firestore.rules` ile uyumlu kalır;
   v2 modeline geçiş yalnızca kurallar genişletildikten ve dual-read kanıtlandıktan sonra devreye alınır.
4. **Auth cache-first + device-id stratejisi** korunur (`context/AuthContext.tsx`).
5. **Notification 64-slot / streak rezervasyon / content-version** mantığı korunur.
6. **RevenueCat `premium` entitlement + AdMob consent/ATT** davranışı korunur.

## Güvenlik notu

Bu dokümanlara hiçbir gerçek secret, API key, token, `.env` / `plist` / `json` değeri kopyalanmamıştır.
Sızıntı riski taşıyan dosyalar yalnızca **varlık ve risk** olarak `09-security-rules-and-env-hygiene.md`
içinde raporlanmıştır.
