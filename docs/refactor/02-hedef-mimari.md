# 02 — Hedef Klasör ve Modül Yapısı

## Mevcut Durum

Kökte flat yapı (`screens/`, `components/`, `services/`, `context/`, `utils/`). Domain'ler servis
seviyesinde kısmen ayrışmış ama UI ve hook katmanı yok (bkz. `01-mimari-audit.md`). `tsconfig.json`
`@/*` -> `./*` aliası tanımlı ama az kullanılıyor. `package.json` → `main: expo/AppEntry.js` → `./App`.

## Sorunlar

- Bir domain'e (ör. streak) ait kod 4-5 farklı üst klasöre dağılmış (`services/streakService.ts`,
  `components/StreakChip.tsx`, `components/StreakCelebrationOverlay.tsx`, `utils/streakCelebration.ts`).
- "Nereye koymalıyım?" sorusu belirsiz: paylaşılan UI ile ekran-özel UI aynı `components/`'te.
- Büyüdükçe flat `screens/` ve `services/` yönetilemez hale gelecek.

## Önerilen Yaklaşım: Feature-based + ince katmanlı hibrit (`src/` altında)

Uygulamanın doğal sınırları **domain** etrafında (auth, learning, progress, streak, favorites,
notifications, settings, monetization). Bu yüzden **feature-based** ana bölümleme seçiyoruz; her
feature içinde ince bir katmanlama (screen / component / hook / service / types) uyguluyoruz.
Paylaşılan altyapı ve tasarım sistemi `shared/`'a taşınıyor.

### Hedef yapı

```
src/
  app/
    App.tsx                 # ince root: provider zinciri + <RootNavigator/>
    bootstrap/              # font yükleme, splash, navigation-bar (bkz. 03)
    providers/              # AppProviders (Theme>Alert>Auth>Monetization>ErrorBoundary)
    navigation/             # RootNavigator, routes, RootStackParamList
    lifecycle/              # useAppLifecycle (AppState, notif maintenance, ads, sync)
  features/
    onboarding/
    auth/                   # Login, SignUp, ForgotPassword + useLogin/useSignUp
    setup/                  # SetupScreen + adım bileşenleri (bkz. 08)
    learning/               # HomeScreen + kelime kartı + ExampleSentences + LevelTest
    progress/               # progress hesapları + hook
    favorites/              # FavoritesScreen + favorites hook'ları
    streak/                 # streak service + overlay/chip + celebration hook
    notifications/          # scheduling/permission/tracking alt-modülleri (bkz. 06)
    settings/               # SettingsScreen parçaları (bkz. 08)
    monetization/           # AdMob + RevenueCat + Monetization context (bkz. 12)
  shared/
    ui/                     # design system: Button, Input, Header, CustomAlert...
    theme/                  # ThemeContext + colors/spacing/typography token'ları
    i18n/                   # i18n init + locales
    storage/                # storageKeys + tipli async wrapper'lar (bkz. 11)
    firebase/               # config/firebase + firestore erişim yardımcıları
    hooks/                  # genel hook'lar (useResponsive, useDebouncedCallback...)
    utils/                  # rtl, typography, profileAvatar...
    types/                  # global tipler
backend/ (kökte kalır)
  api/                      # Vercel serverless (deleteAccount, grammarProxy)
  proxy/                    # Cloudflare worker
  functions/                # Firebase Functions
firestore.rules, tests/     # kökte kalır
App.tsx (kök shim)          # `export { default } from './src/app/App'`
```

### Feature içi standart şablon

```
features/<feature>/
  screens/        # ekran bileşenleri (sadece kompozisyon + layout)
  components/     # feature'a özel sunum bileşenleri
  hooks/          # ekran<->service köprüsü, state orkestrasyonu
  services/       # I/O ve iş mantığı (saf, test edilebilir)
  types.ts
  index.ts        # feature'ın public API'ı (facade) — dış import yalnızca buradan
```

**Facade kuralı:** Başka feature, bir feature'ın iç dosyasını doğrudan import etmez; sadece
`features/<feature>` (index.ts) üzerinden erişir. Böylece iç yapı güvenle değişir.

### Path alias güncellemesi

`tsconfig.json` (ve `tsconfig.app.json`) `paths`:

```jsonc
"baseUrl": ".",
"paths": {
  "@/*": ["./src/*"],
  "@app/*": ["./src/app/*"],
  "@features/*": ["./src/features/*"],
  "@shared/*": ["./src/shared/*"]
}
```

`jest.config.js` `moduleNameMapper` ve `collectCoverageFrom` glob'ları da `src/**` için güncellenir
(bkz. `14-test-stratejisi.md`). Metro (`metro.config.js`) Expo varsayılanıyla `tsconfig` path'lerini
okur; ek babel plugin gerekmez (zaten `babel-preset-expo` var). Yani **yeni paket gerekmez**.

## Alternatifler ve Neden Elendiler

| Alternatif | Neden elendi |
|-----------|--------------|
| **Flat yapıyı koru** | Büyüme hedefiyle çelişir; `screens/` ve `services/` zaten kalabalık. |
| **Saf layered** (`ui/`, `domain/`, `data/`) | Domain sınırlarını görselleştirmez; bir özelliğe dokunmak için 3 katmanda gezinmek gerekir; dev ekran sorununu çözmez. |
| **Saf domain-based** (UI'ı domain içine gömme, paylaşılan UI yok) | Tasarım sistemi tekrarı oluşur; `UIComponents` gibi gerçek paylaşılan parçalar yersiz kalır. |
| **Nx / monorepo** | Aşırı mühendislik; tek uygulama için gereksiz altyapı ve yeni bağımlılık. |
| **`src/` yerine kökte `features/`** | Mümkün; ama `src/` Expo/RN topluluğunda standart ve kök gürültüsünü azaltır. |

## Migration / Implementasyon Adımları (PR boyutunda)

> Bu yapı **kademeli** kurulur; tek PR'da tüm dosyalar taşınmaz. Sıralama `18-roadmap.md`'de.

1. **PR-A (iskelet + alias):** Boş `src/` ağacını ve `index.ts` facade dosyalarını oluştur;
   `tsconfig*.json` ve `jest.config.js` path'lerini ekle. Henüz dosya taşıma yok.
   - Komut: `npm run typecheck && npm run test:ci`
2. **PR-B (shared taban):** `constants.ts`, `utils/*`, `config/firebase.ts`, `services/storageKeys.ts`,
   `services/i18n.ts`, `locales/*`, `components/UIComponents.tsx` → `shared/`'a taşı; eski yollardan
   `re-export` shim bırak (geriye uyum).
3. **PR-C..N (feature başına):** Her feature için dosyaları taşı + import'ları güncelle + shim'i kaldır.
   Her feature ayrı PR (auth, learning, settings, ...).
4. **PR-Z (temizlik):** Re-export shim'lerini ve `@/*`'ın eski hedefini kaldır.

Her adımda **davranış değişmez** — sadece dosya yeri ve import yolları değişir.

## Riskler

- **Giriş noktası (`App.tsx`) taşıma riski.** Azaltım: kökte `App.tsx` shim olarak kalır
  (`export { default } from './src/app/App'`), `package.json main` değişmez.
- **Döngüsel bağımlılık.** Azaltım: feature'lar arası import sadece facade'tan; `shared` hiçbir
  feature'ı import etmez (tek yönlü bağımlılık).
- **Büyük git diff / merge çakışması.** Azaltım: feature başına küçük PR; `git mv` kullan (history korunur).

## Test ve Kabul Kriterleri

- Her taşıma PR'ı sonrası: `npm run typecheck`, `npm run typecheck:test`, `npm run test:ci` yeşil.
- Import grafiğinde feature->feature iç import yok (gerekirse `eslint-plugin-import/no-internal-modules`
  ile doğrulanır; opsiyonel, yeni dev-dependency).
- Coverage düşmemeli (glob'lar `src/**`'e güncellendiği için).

## Etkilenecek Dosyalar (örnek mapping; tam liste ilgili dokümanlarda)

```
App.tsx                         -> src/app/App.tsx (+ kökte shim)
constants.ts                    -> src/shared/theme/constants.ts
utils/typography.ts             -> src/shared/utils/typography.ts
utils/rtl.ts                    -> src/shared/utils/rtl.ts
config/firebase.ts              -> src/shared/firebase/firebase.ts
services/storageKeys.ts         -> src/shared/storage/storageKeys.ts
services/i18n.ts                -> src/shared/i18n/i18n.ts
locales/*                       -> src/shared/i18n/locales/*
components/UIComponents.tsx     -> src/shared/ui/* (bkz. 09)
context/ThemeContext.tsx        -> src/shared/theme/ThemeContext.tsx
context/AuthContext.tsx         -> src/features/auth/* (bkz. 05)
context/MonetizationContext.tsx -> src/features/monetization/* (bkz. 12)
screens/HomeScreen.tsx          -> src/features/learning/screens/HomeScreen.tsx (bkz. 04, 07)
screens/SettingsScreen.tsx      -> src/features/settings/* (bkz. 08)
screens/SetupScreens.tsx        -> src/features/setup/* (bkz. 08)
services/notificationService.ts -> src/features/notifications/services/* (bkz. 06)
services/SyncService.ts         -> src/features/auth/services/sync/* (bkz. 05)
services/adMobService.ts        -> src/features/monetization/services/admob/* (bkz. 12)
```
