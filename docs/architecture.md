# VocBee Production Architecture

Durum: Aktif  
Son güncelleme: 2026-07-20

Bu belge production kaynak kodu için güncel mimari sözleşmedir. Tamamlanmış refactor fazlarına ait
plan, prompt, audit ve taşıma tarifleri kaynak gerçekliği değildir; gerektiğinde Git geçmişinden
incelenir.

## 1. Kaynak ağacı

```text
src/
  app/       uygulama composition root, bootstrap, lifecycle, navigation ve provider'lar
  shared/    feature bağımsız tema, UI, storage, i18n, Firebase adaptörü, hata ve utility'ler
  features/  ürün yetenekleri ve bunların katmanları
```

Her feature gerektiği kadar aşağıdaki katmanları kullanır:

```text
features/<feature>/
  presentation/  ekranlar, UI bileşenleri ve presentation hook'ları
  application/   use-case, facade, orchestration ve port sözleşmeleri
  domain/        saf TypeScript kuralları, value/type ve sabitler
  data/          repository, SDK/platform adapter ve DTO'lar
  composition/   concrete dependency wiring
  index.ts       feature'ın tek public API yüzeyi
```

## 2. Bağımlılık kuralları

- Feature dışından erişim yalnız `@features/<feature>` public barrel üzerinden yapılır.
- Feature `domain` katmanı React, React Native, navigation, Firebase, Expo SDK veya storage SDK
  import etmez.
- `presentation`, doğrudan `data` implementasyonuna veya side-effect SDK'larına bağlanmaz.
- `application`, davranışı interface/port üzerinden orkestre eder.
- `data`, platform ve SDK ayrıntılarını kapsüller.
- `shared`, `app` veya herhangi bir feature'a bağımlı olamaz.
- Composition modülleri concrete implementasyonları facade/provider/screen wrapper'larına bağlar.
- Path alias sahipliği:
  - `@app/*` → `src/app/*`
  - `@shared/*` → `src/shared/*`
  - `@features/*` → `src/features/*`

Bu kurallar hem ESLint hem
`src/architecture/__tests__/importBoundaries.test.ts` tarafından doğrulanır.

## 3. Uygulama composition sözleşmesi

Root `App.tsx`, Expo entry adapter'ıdır; iş mantığı içermez. Provider sırası davranış sözleşmesidir:

```text
SafeAreaProvider
  ThemeProvider
    AlertProvider
      AuthProvider
        MonetizationProvider
          ErrorBoundary
            GestureHandlerRootView
```

Navigation route contract'ı `src/app/navigation/types.ts`, route wiring'i
`src/app/navigation/RootNavigator.tsx` tarafından sahiplenilir.

## 4. Korunan ürün davranışları

- AsyncStorage key string değerleri migration olmadan değiştirilmez.
- Vocabulary asset'leri local-first çalışır; Firestore'a taşınmaz.
- Auth başlangıcı cache-first davranışı ve bağlantı hatası fallback'i korunur.
- Notification zamanlama, slot rezervasyonu, streak ve content-version kuralları domain testleri
  geçmeden değiştirilmez.
- RevenueCat entitlement ve AdMob/ATT akışları yalnız monetization facade/repository katmanlarından
  yönetilir.
- Kullanıcı verisi migration'ları dry-run, doğrulama, backup/restore ve açık owner onayı olmadan
  destructive write yapamaz.
- Progress v2 production aktivasyonu ayrı rollout sürecidir:
  `docs/progress-v2-rollout.md`.
- Legacy progress cleanup varsayılan olarak yasaktır:
  `docs/firestore-legacy-cleanup-runbook.md`.

## 5. UI/UX mimari yönü

Mevcut UI feature presentation katmanlarına ayrılmıştır; ancak ortak design-system dönüşümü ayrı
production programı olarak yürütülür. Hedef yapı ve geçiş sırası:
`docs/ui-ux-production-refactor-plan.md`.

Feature UI'ları:

- side-effect çağrılarını facade/controller üzerinden alır;
- shared primitive kullanır;
- tema, responsive, i18n, accessibility ve reduced-motion sözleşmelerine uyar;
- loading, empty, error, offline ve success durumlarını açıkça modeller;
- başka feature'ın presentation iç detayını import etmez.

## 6. Zorunlu doğrulamalar

Production değişiklikleri en az aşağıdaki kontrolleri geçer:

```bash
npm run typecheck
npm run lint
npm run prettier:check
npm run test:boundaries
npm test -- --runInBand
git diff --check
```

Firestore rules, cleanup, server veya worker kapsamı değiştiğinde ilgili özel scriptler de ayrıca
çalıştırılır.

## 7. Dokümantasyon yaşam döngüsü

- Güncel sözleşmeler `docs/` kökünde, konu bazlı ve refactor fazından bağımsız tutulur.
- Geçici prompt, audit ledger, faz planı ve tamamlanmış taşıma tarifleri merge sonrasında silinir.
- Tarihsel karar kanıtı gerekiyorsa Git commit/PR geçmişi kullanılır.
- Operasyonel runbook ve approval belgeleri ilgili işlem production'da mümkün olduğu sürece tutulur.
