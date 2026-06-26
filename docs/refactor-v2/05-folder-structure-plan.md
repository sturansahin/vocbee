# 05 — Klasör Yapısı Planı

## Mevcut durum
Flat kök: `App.tsx`, `screens/`, `services/`, `components/`, `context/`, `utils/`, `config/`, `locales/`,
`assets/`, `api/`, `proxy/`, `functions/`, `tests/`, `scripts/`. `tsconfig.json` `@/*` → `./*` var (az kullanılıyor).

## Hedef `src/` yerleşimi
```
src/
  app/
    App.tsx
    bootstrap/      # font load, splash gate, navigation bar, ilk init
    providers/      # AppProviders (Theme>Alert>Auth>Monetization>ErrorBoundary)
    navigation/     # RootNavigator.tsx, types.ts (RootStackParamList)
    lifecycle/      # useAppLifecycle (AppState, notif maintenance, ads, sync, review)
    config/         # client env sınıflandırma (public)
  shared/
    ui/ theme/ storage/ firebase/ api/ i18n/ utils/ errors/ types/
  features/
    onboarding/ setup/ auth/ learning/ vocabulary/ progress/
    favorites/ streak/ notifications/ settings/ monetization/ review/
```
Kökte kalan: `assets/`, `locales/` (→ shared/i18n re-export), `api/`, `proxy/`, `functions/`, `scripts/`,
`tests/`, tüm konfig dosyaları.

## Feature içi standart iskelet
```
features/<feature>/
  presentation/ { screens/ components/ hooks/ }
  application/  { services/ useCases/ }
  domain/       { types.ts rules.ts constants.ts }
  data/         { repositories/ adapters/ dto.ts }
  index.ts      # public barrel
```
Ku̧çük feature'larda `domain/` ve `data/` yalnızca ihtiyaç olunca açılır (gereksiz boilerplate önlenir).

## Path alias planı (`tsconfig.json` + `babel.config.js`)
```jsonc
"paths": {
  "@/*": ["./src/*"],
  "@app/*": ["./src/app/*"],
  "@shared/*": ["./src/shared/*"],
  "@features/*": ["./src/features/*"]
}
```
- `babel-plugin-module-resolver` ile aynı alias'lar; metro `babel.config.js`'i kullandığı için ek ayar gerekmez.
- Mevcut `@/*` → `./*` geçiş döneminde korunur, sonra `./src/*`'a çevrilir.

## Taşıma stratejisi: shim (re-export)
Bir dosya taşınınca eski yol silinmez, shim'e dönüşür:
```ts
// services/streakService.ts (eski yol — shim)
export * from '@features/streak/application/services/streakService'
```
Böylece import'lar kademeli güncellenir, tek seferde devasa diff oluşmaz. Shim'ler `29` cleanup fazında silinir.

## Taşıma sırası (özet, detay faz dokümanlarında)
1. `shared/*` (en az bağımlı, en çok tüketilen) — Phase 1.
2. `app/*` bootstrap — Phase 2.
3. Feature'lar bağımlılık sırasıyla: auth → learning → notifications → settings/onboarding → monetization.

## Kabul kriterleri
- Tüm yeni yollar alias ile import edilir; relative `../../..` derinliği kalmaz.
- Eski yollar shim olduğu için her adımda `npm run typecheck` yeşil.
- ESLint `import/no-cycle` ve `import/no-restricted-paths` (katman yönü) yeşil.


---

## Implementation-spec detayları (v2 — `32`–`39`)
- **Alias'ın 3 katmanda kurulumu (tsconfig + babel + jest):** `38-ci-eslint-alias-config-spec.md` §2-4. Geçişte `@/*` → `./*` KORUNUR; `@app/@shared/@features` → `./src/*` eklenir. Runtime alias için `babel-plugin-module-resolver` gerekir (tsconfig paths yalnızca tip çözümü).
- **Shim ile taşıma reçeteleri (dosya bazlı):** `36-shim-and-file-move-recipes.md` (gerçek export biçimleriyle: default/named/karışık).

Doldurulmuş feature iskeleti örneği (`learning`):
*Skeleton/contract — implementasyon değil.*
```text
src/features/learning/
  presentation/
    screens/HomeScreen.tsx            # eski screens/HomeScreen.tsx (default export)
    components/{WordCard,HomeHeader,HomeTutorialOverlay}.tsx
    hooks/useLesson.ts
  application/
    useCases/{startLesson,completeWord,nextWord,loadGrammarExamples}.ts
    LearningFacade.ts
  domain/
    rules.ts                          # getTutorialSwipeNextStep + kelime seçim/shuffle/level geçiş (saf)
    constants.ts                      # CEFR eşikleri
    types.ts
  data/
    repositories/{VocabularyRepository,GrammarApiClient}.ts
    adapters/wordAdapter.ts           # .txt (JSON) → VocabularyWord
    contracts.ts                      # interface'ler
  index.ts                            # barrel
```
- **Taşıma sırası PR'ları:** `39` Phase 1 (shared) → Phase 2 (app) → Phase 4+ (feature'lar bağımlılık sırasıyla).
