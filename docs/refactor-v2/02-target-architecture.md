# 02 — Hedef Mimari: Özellik Bazlı Katmanlı Mimari

## Mevcut durum
Kökte flat yapı (`screens/`, `services/`, `context/`, `components/`, `utils/`, `config/`). Domain'ler servis
seviyesinde kısmen ayrı; UI/hook/domain/data katmanları yok. `tsconfig.json` `@/*` → `./*` aliası var ama az kullanılıyor.

## Problem
- Bir domain'in parçaları 4-5 farklı üst klasöre dağılmış (ör. streak: `services/streakService.ts`,
  `components/StreakChip.tsx`, `components/StreakCelebrationOverlay.tsx`, `components/StreakAlertContent.tsx`,
  `utils/streakCelebration.ts`).
- Dış sistem (Firebase/AsyncStorage/Expo SDK) erişimi presentation'a sızıyor → test edilemezlik.
- Flat `screens/`+`services/` büyüdükçe yönetilemez.

## Hedef: `src/` altında `app` + `features` + `shared`

```
src/
  app/            # uygulama seviyesi bootstrap
    bootstrap/    # font/splash/navigation-bar yükleme
    providers/    # Theme>Alert>Auth>Monetization>ErrorBoundary zinciri
    navigation/   # RootNavigator + RootStackParamList
    lifecycle/    # AppState, notif maintenance, ad init, sync, review (App.tsx'ten çıkar)
    config/       # public client config (env sınıflandırma)
  features/
    <feature>/
      presentation/  { screens/, components/, hooks/ }
      application/   { services/, useCases/ }
      domain/        { types.ts, rules.ts, constants.ts }
      data/          { repositories/, adapters/, dto.ts }
      index.ts       # feature public API (barrel)
  shared/
    ui/        # design system (UIComponents, CustomAlert, Button, Input, Header)
    theme/     # ThemeContext + colors/spacing/typography token
    storage/   # storageKeys + tipli AsyncStorage wrapper
    firebase/  # config/firebase + firestore erişim yardımcıları
    api/       # grammar proxy / delete-account HTTP client
    i18n/      # i18n init + locales + rtl
    utils/     # profileAvatar, typography, genel yardımcılar
    errors/    # AppError tipleri + error mapping
    types/     # global tipler (RootStackParamList burada değil; navigation'da)
backend/ (kökte kalır): api/, proxy/, functions/
App.tsx (kök shim): export { default } from './src/app/App'
```

## Katman anlamları ve kurallar
| Katman | Sorumluluk | Bilmemesi gereken |
|---|---|---|
| **presentation** | UI, ekran, component, hook (state binding) | Firebase, AsyncStorage, Expo SDK, Vercel, native SDK |
| **application** | use-case orkestrasyonu (`startLesson`, `completeWord`, `syncProgress`, `enableNotifications`) | UI detayı; doğrudan SDK çağrısı (repository üzerinden) |
| **domain** | saf iş kuralları (streak normalize, level geçiş, kelime seçim) | Firebase/AsyncStorage/Expo/network |
| **data** | repository/adapter/dto; Firestore, AsyncStorage, local asset, API client | UI/use-case iş kuralı |

### Import yönü (bağlayıcı)
```
app → features → shared
presentation → application → domain
presentation → domain (sadece tip/saf kural)
data → domain (DTO→model dönüşümü)
```
- Feature'lar birbirine **yalnızca `index.ts` barrel üzerinden** erişir; derin import yasak.
- `domain` hiçbir dış pakete (firebase, expo, async-storage) bağımlı olmaz → saf unit test.

## Feature listesi (analizden türetildi, varsayımsal değil)
Kesin: `onboarding`, `auth`, `setup`, `learning` (home + word card + ExampleSentences + LevelTest),
`vocabulary`, `progress`, `favorites`, `streak`, `notifications`, `settings`, `monetization`
(ads + premium birlikte), `review` (appReview), `grammar`.

Kesşim değerlendirmesi (`04` ile netleşir):
- `vocabulary` + `progress` + `learning` ayrı kalır ama `learning` diğer ikisini tüketir.
- `ads` ve `premium` tek `monetization` feature'ı (kod ve context ortak: `MonetizationContext` her ikisini besler).
- `sync` ayrı feature **değil**, `shared/firebase` + her feature'ın `data/repository`'si + bir `application/syncOrchestrator`.
- `theme`, `i18n` → `shared/` (feature değil; çapraz kesen altyapı).
- `profile` → `auth` feature'ı içinde `profile` alt-modülü (auth state'e sıkı bağlı).

## Alternatifler ve neden elendi
- **Saf teknik katman (screens/services/hooks):** mevcut ağrı; domain dağınıklığını çözmez. Elendi.
- **Tam DDD + CQRS:** bu ölçek için over-engineering. Elendi.
- **Monorepo (nx/turbo):** tek uygulama; gereksiz operasyonel yük. Elendi.
- **Flat `src/` + ince katman (v1 önerisi):** iyi ama feature içi 4-katman netliği yok; v2 bunu yükseltir.

## Riskler
- Barrel `index.ts`'lerde döngüsel import riski → ESLint `import/no-cycle` ile sabitle.
- Aşırı katmanlama küçük feature'larda boilerplate → `domain`/`data` yalnızca ihtiyaç olan feature'da açılır.

## Kabul kriterleri
- Tüm yeni kod `src/` altında; eski yollar re-export shim ile çalışır.
- `domain` katmanı SDK import'u içermez (lint kuralı yeşil).
- `npm run typecheck` + `npm run test:ci` yeşil.


---

## Implementation-spec detayları (v2 — `32`–`39`)
Bu strateji dokümanının "nasıl?" karşılıkları:
- **Import yönü → uygulanabilir kural:** `33-layer-contracts-and-import-rules.md` (import matrisi + ESLint `import/no-restricted-paths`/`no-cycle`).
- **Katman içerikleri → somut sözleşme:** `35-repository-adapter-contracts.md` (9 repository + adapter interface skeleton'ları).
- **Barrel/composition root:** Feature dışarıya yalnızca `index.ts`'ten verir; `data` implementasyonları (Firestore repository sınıfı) **barrel'dan ihraç edilmez**, yalnızca `app/providers` veya feature `application` composition root'unda bağlanır (`33` §4).

*Skeleton/contract — implementasyon değil.*
```ts
// features/<feature>/index.ts (barrel sözleşmesi) — SKELETON
export type { /* domain tipleri */ } from './domain/types';
export { /* domain kuralları */ } from './domain/rules';
export type { /* Repository interface */ } from './data/contracts';   // interface OK, impl HAYIR
export { /* hook/screen */ } from './presentation';
```
- **Döngü riski (R10):** `import/no-cycle` (`38` §5). Domain saflığı (0 SDK import) lint + grep ile doğrulanır (`33` §6).
- **Bu mimariye geçişin PR kırılımı:** `39-phase-pr-breakdown.md` (Phase 1-2 iskelet/bootstrap; her büyük dosya için alt-PR).
