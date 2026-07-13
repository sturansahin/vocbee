# Current Refactor Gap Report

Audit tarihi: **2026-07-13 22:38 +03 (Europe/Istanbul)**  
Audit kapsami: **Prompt 0 — Preflight, Baseline ve Calisma Alani Temizligi**  
Root: `/Users/turan/Desktop/vocbee`

Bu rapor salt audit sonucudur. Uygulama davranisi, importlar, shim'ler, native dosyalar, storage key'leri ve Firestore payload'lari degistirilmedi.

## 1. Yonetici Ozeti

- Branch `refactor`, audit HEAD'i `08c91e57`; baslangicta ve audit komutlarindan sonra tracked/untracked calisma alani temizdi.
- Aktif runtime **hibrit** durumda: root `App.tsx` `src/app/App.tsx` composition root'una re-export ediyor, fakat `src/app/navigation/RootNavigator.tsx` ve `src/devtools/screenRegistry.ts` dokuz aktif route screen'ini root `screens/` altindan import ediyor.
- `src/app/App.tsx`, `src/app/providers` ve `src/app/lifecycle` da root `services`, `context` ve `components` implementasyonlarina bagimli.
- Root `screens`, `services`, `context`, `components`, `config`, `utils` altinda 47 non-test production modulu ve 16.526 satir bulunuyor. Yalnizca `services/adMobService.ts` ve `services/adMobService.web.ts` acik re-export shim'i; kalan 45 dosya implementation/compatibility logic tasiyor.
- Production `src` kodunda root'a cikan **70 import occurrence'i / 29 kaynak dosya** tespit edildi.
- Iki feature-to-feature deep import ihlali var; ikisi de `settings -> setup/domain/types`.
- `src/features/**/domain` altinda yasak SDK importu bulunmadi.
- Presentation auditinde root presentation/context tarafinda 18, hedef `src/features/*/presentation` tarafinda 12, devtools tarafinda 2 dosyada direct SDK importu bulundu. Hedef presentation bulgularinin 12'si de `@expo/vector-icons`; UI SDK importlari veri/side-effect SDK ihlallerinden ayri siniflandirildi.
- `npm run typecheck`, zorunlu uc smoke suite, full `test:ci`, `lint`, `typecheck:rules` ve gercek Firestore emulator `test:rules` suite'i tamamlandi.
- Follow-up remediation ile OpenJDK 21.0.11 kuruldu ve login/interactive zsh oturumlarinda kalici etkinlestirildi. Rules testinin ana Jest discovery desenine girmemesi ayri `jest.rules.config.js` ile duzeltildi.
- Sonuc: Prompt 0 quality gate'leri yesil; Prompt 1'e gecis **acik**.

## 2. Baslangic Git ve Calisma Alani Durumu

| Kontrol | Sonuc |
|---|---|
| `git branch --show-current` | `refactor` |
| `git rev-parse --short HEAD` | `08c91e57` |
| `git status --short` | Bos; baslangic worktree temiz |
| Audit/testlerden sonra `git status --short` | Rapor eklenmeden once bos; testler tracked artifact degistirmedi |

### Native/prebuild ayrimi

| Alan | Audit sonucu | Prompt 0 karari |
|---|---|---|
| `ios/` | Klasor mevcut; 50.047 tracked path; staged/unstaged diff yok | Dokunulmadi ve refactor teslimatina karistirilmadi |
| `ios.backup-20260709-180719/` | Klasor mevcut; yalnizca ignore edilen `.DS_Store` ve `.xcode.env.local` goruldu | Dokunulmadi |
| `.expo/devices.json` | Tracked dosya; `.expo/` artik `.gitignore` altinda; diff yok | Dokunulmadi; takip edilmesi repo hijyeni riski olarak kaydedildi |
| `package.json` | Audit baslangicinda tracked ve temizdi | Follow-up JDK/rules remediation sirasinda yalnizca `test:rules` scripti guncellendi |

## 3. Aktif Runtime Graph

```text
expo/AppEntry.js
  -> root App.tsx (shim)
     -> src/app/App.tsx (aktif composition root)
        -> src/app/providers/AppProviders.tsx
        -> src/app/lifecycle/useAppLifecycle.ts
        -> src/app/navigation/RootNavigator.tsx
           -> root screens/* (aktif route implementasyonlari)

src/app/App.tsx
  -> root services/notificationService
  -> root screens/SplashScreen
  -> root components/ConnectionErrorScreen

src/devtools/screenRegistry.ts
  -> root screens/* (ayni production screen implementasyonlari)
```

Dosya bazli dogrulama:

- Root `App.tsx`, default export'u `./src/app/App`'tan; `FONT_FAMILY` uyumluluk export'unu root `utils/typography`'den veriyor.
- `src/app/App.tsx`, bootstrap/provider/navigation/lifecycle composition'ini calistiriyor; notification configuration module-load aninda root servisten geliyor.
- `src/app/navigation/RootNavigator.tsx`, `Onboarding`, `Login`, `SignUp`, `ForgotPassword`, `NativeLanguage`, `LevelTest`, `MainTabs`, `Settings`, `Favorites`, `ExampleSentences` route'larini tanimliyor. Route component'lerinin tamami root `screens/` importlarindan geliyor.
- `src/devtools/screenRegistry.ts`, Splash disindaki ayni dokuz root screen modulunu dogrudan import ediyor.

Sonuc: bootstrap ve composition `src/app` altina alinmis, fakat route presentation implementasyonlari root `screens` altinda calismaya devam ediyor. Runtime bu nedenle acikca **`src/app` + root `screens` hibritidir**.

## 4. Root Production Dosya Envanteri

Asagidaki envanter test dosyalarini dislar. Satir sayilari `wc -l` ile audit aninda olculdu.

### `screens/` — 10 dosya, 8.280 satir

| Dosya | Satir | Durum |
|---|---:|---|
| `screens/SettingsScreen.tsx` | 2.131 | Aktif logic |
| `screens/HomeScreen.tsx` | 2.010 | Aktif logic |
| `screens/SetupScreens.tsx` | 1.025 | Aktif logic |
| `screens/AuthScreens.tsx` | 876 | Aktif logic |
| `screens/ExampleSentencesScreen.tsx` | 854 | Aktif logic |
| `screens/LevelTestScreen.tsx` | 485 | Aktif logic |
| `screens/OnboardingScreen.tsx` | 361 | Aktif logic |
| `screens/ForgotPasswordScreen.tsx` | 220 | Aktif logic |
| `screens/FavoritesScreen.tsx` | 220 | Aktif logic |
| `screens/SplashScreen.tsx` | 98 | Aktif logic |

### `services/` — 15 dosya, 4.338 satir

| Dosya | Satir | Durum |
|---|---:|---|
| `services/notificationService.ts` | 1.310 | Aktif logic |
| `services/vocabularyService.ts` | 547 | Aktif logic |
| `services/SyncService.ts` | 434 | Aktif logic |
| `services/reviewPromptService.ts` | 375 | Aktif logic |
| `services/streakService.ts` | 348 | Aktif logic |
| `services/favoritesService.ts` | 312 | Aktif logic |
| `services/progressService.ts` | 300 | Aktif logic |
| `services/groqService.ts` | 292 | Aktif logic |
| `services/socialAuthProfile.ts` | 137 | Aktif logic |
| `services/nativeGoogleSignIn.ts` | 128 | Aktif logic |
| `services/i18n.ts` | 103 | Aktif logic |
| `services/notificationFrequency.ts` | 33 | Aktif logic |
| `services/googleAuthConfig.ts` | 9 | Aktif compatibility/config logic |
| `services/adMobService.ts` | 5 | Re-export shim |
| `services/adMobService.web.ts` | 5 | Re-export shim |

### `context/` — 2 dosya, 816 satir

| Dosya | Satir | Durum |
|---|---:|---|
| `context/AuthContext.tsx` | 784 | Aktif logic |
| `context/ThemeContext.tsx` | 32 | Aktif logic |

### `components/` — 15 dosya, 2.879 satir

| Dosya | Satir | Durum |
|---|---:|---|
| `components/StreakCelebrationOverlay.tsx` | 465 | Aktif logic |
| `components/AppRatingPrompt.tsx` | 306 | Aktif logic |
| `components/UIComponents.tsx` | 298 | Aktif logic |
| `components/HomeTutorialOverlay.tsx` | 292 | Aktif logic |
| `components/SafeBannerAd.tsx` | 252 | Aktif logic |
| `components/CustomAlert.tsx` | 233 | Aktif logic |
| `components/VocabularyCardHeader.tsx` | 228 | Aktif logic |
| `components/ErrorBoundary.tsx` | 149 | Aktif logic |
| `components/HomeHeader.tsx` | 127 | Aktif logic |
| `components/StreakAlertContent.tsx` | 126 | Aktif logic |
| `components/StreakChip.tsx` | 100 | Aktif logic |
| `components/ConnectionErrorScreen.tsx` | 100 | Aktif logic |
| `components/OfflineNotice.tsx` | 94 | Aktif logic |
| `components/AnimatedCountUp.tsx` | 69 | Aktif logic |
| `components/SwarmLogo.tsx` | 40 | Aktif logic |

### `config/` ve `utils/`

| Dosya | Satir | Durum |
|---|---:|---|
| `config/firebase.ts` | 40 | Aktif Firebase initialization/config logic |
| `utils/rtl.ts` | 67 | Aktif logic |
| `utils/profileAvatar.ts` | 64 | Aktif logic |
| `utils/streakCelebration.ts` | 26 | Aktif logic |
| `utils/typography.ts` | 16 | Aktif logic |

## 5. Presentation Yasak Import Audit'i

Tarama kapsami:

- Legacy presentation/context: `screens/`, `components/`, `context/`
- Hedef presentation: `src/features/*/presentation/**`
- Dev-only UI: `src/devtools/**` ayri sinif
- Core `react-native` UI importlari presentation'in dogal bagimliligi oldugu icin taramaya dahil edilmedi.
- `@expo/vector-icons`, `expo-linear-gradient` ve `expo-blur`, dokumanlardaki "presentation Expo SDK import etmez" kurali geregi raporlandi; bunlar veri/side-effect SDK ihlallerinden ayri degerlendirilmelidir.

### Legacy root presentation/context — 18 dosya

| Dosya | Direct yasak/SDK importlari |
|---|---|
| `context/AuthContext.tsx` | `firebase/auth`, `../config/firebase`, `expo-apple-authentication` |
| `screens/AuthScreens.tsx` | `@expo/vector-icons` |
| `screens/ExampleSentencesScreen.tsx` | `@react-native-async-storage/async-storage`, `expo-speech`, `@expo/vector-icons` |
| `screens/FavoritesScreen.tsx` | `@expo/vector-icons` |
| `screens/ForgotPasswordScreen.tsx` | `@expo/vector-icons` |
| `screens/HomeScreen.tsx` | `@react-native-async-storage/async-storage`, `expo-speech`, `expo-network`, `expo-linear-gradient`, `expo-blur` |
| `screens/LevelTestScreen.tsx` | `@react-native-async-storage/async-storage`, `@expo/vector-icons` |
| `screens/OnboardingScreen.tsx` | `@react-native-async-storage/async-storage` |
| `screens/SettingsScreen.tsx` | `@react-native-async-storage/async-storage`, `expo-constants`, `expo-image-picker`, `firebase/firestore`, `firebase/auth`, `../config/firebase`, `@expo/vector-icons` |
| `screens/SetupScreens.tsx` | `@react-native-async-storage/async-storage`, `firebase/firestore`, `../config/firebase`, `expo-notifications`, `@expo/vector-icons` |
| `components/AppRatingPrompt.tsx` | `@expo/vector-icons` |
| `components/ConnectionErrorScreen.tsx` | `@expo/vector-icons` |
| `components/ErrorBoundary.tsx` | `expo-updates`, `@expo/vector-icons` |
| `components/HomeHeader.tsx` | `@expo/vector-icons` |
| `components/OfflineNotice.tsx` | `expo-network`, `@expo/vector-icons` |
| `components/StreakCelebrationOverlay.tsx` | `expo-linear-gradient` |
| `components/UIComponents.tsx` | `@expo/vector-icons` |
| `components/VocabularyCardHeader.tsx` | `@expo/vector-icons` |

Yuksek oncelikli side-effect/data ihlalleri `AuthContext`, `SetupScreens`, `SettingsScreen`, `HomeScreen`, `ExampleSentencesScreen`, `LevelTestScreen`, `OnboardingScreen`, `OfflineNotice` ve `ErrorBoundary` icindedir. Salt ikon/visual SDK kullanimlari shared UI adapter/component stratejisiyle ele alinabilir.

### Hedef `src/features/*/presentation` — 12 dosya

Asagidaki dosyalarin her biri direct `@expo/vector-icons` import ediyor; bu hedef dokumanin blanket Expo SDK yasagiyla uyusmuyor, ancak Firebase/Firestore/AsyncStorage/Notifications importu tespit edilmedi:

- `src/features/settings/presentation/sections/DangerZoneSection.tsx`
- `src/features/settings/presentation/sections/LanguageSettingsSection.tsx`
- `src/features/settings/presentation/sections/NotificationSettingsSection.tsx`
- `src/features/settings/presentation/sections/PremiumSettingsSection.tsx`
- `src/features/settings/presentation/sections/ProfileSettingsSection.tsx`
- `src/features/setup/presentation/steps/LevelStep.tsx`
- `src/features/setup/presentation/steps/NativeLanguageStep.tsx`
- `src/features/setup/presentation/steps/NotificationPermissionStep.tsx`
- `src/features/setup/presentation/steps/NotificationScheduleEndStep.tsx`
- `src/features/setup/presentation/steps/NotificationScheduleStartStep.tsx`
- `src/features/setup/presentation/steps/SetupCompleteStep.tsx`
- `src/features/setup/presentation/steps/TargetLanguageStep.tsx`

Mevcut ESLint presentation override'i yalnizca `firebase/firestore`, AsyncStorage ve `expo-notifications` desenlerini uyariyor. Dokumandaki tum Firebase/Expo/native SDK yasagini otomatik olarak kapsamadigi icin static rule ile dokuman arasinda gap var.

### Devtools — 2 dosya

| Dosya | Direct import | Risk sinifi |
|---|---|---|
| `src/devtools/panels/StorageDebugPanel.tsx` | AsyncStorage | Dev-only diagnostic; production guard var, fakat direct boundary istisnasi dokumante edilmeli |
| `src/devtools/panels/NotificationDebugPanel.tsx` | `expo-notifications` | Dev-only diagnostic; production guard var, fakat direct boundary istisnasi dokumante edilmeli |

## 6. `src` Icinden Root Path Importlari

Production `src` taramasi relative import hedeflerini gercek path'e resolve ederek yapildi. Sonuc: **70 occurrence, 29 kaynak dosya**.

Hedef klasor dagilimi: `screens` 19, `utils` 15, `services` 14, `components` 8, `context` 6, `config` 3, root `constants` 3, root `types` 2.

### App ve devtools

| Kaynak | Root hedefleri |
|---|---|
| `src/app/App.tsx` | `services/notificationService`, `screens/SplashScreen`, `components/ConnectionErrorScreen` |
| `src/app/navigation/RootNavigator.tsx` | `types`, `context/ThemeContext`, dokuz `screens/*` route modulu |
| `src/app/lifecycle/useAppLifecycle.ts` | `types`, `context/AuthContext`, `services/SyncService`, `notificationService`, `adMobService`, `reviewPromptService` |
| `src/app/providers/AppProviders.tsx` | `context/ThemeContext`, `context/AuthContext`, `components/CustomAlert`, `ErrorBoundary`, `OfflineNotice` |
| `src/devtools/screenRegistry.ts` | Dokuz root `screens/*` modulu |
| `src/devtools/panels/AuthStatePanel.tsx` | `context/AuthContext` |
| `src/devtools/panels/NotificationDebugPanel.tsx` | `services/notificationService` |

### Feature production kodu

| Kaynak | Root hedefleri |
|---|---|
| `src/features/auth/data/repositories/FirebaseAuthRepository.ts` | `config/firebase`, `services/nativeGoogleSignIn` |
| `src/features/profile/data/repositories/FirestoreUserProfileRepository.ts` | `config/firebase`, `services/SyncService` |
| `src/features/progress/data/repositories/FirestoreProgressRepository.ts` | `config/firebase` |
| `src/features/vocabulary/data/repositories/AssetVocabularyRepository.ts` | `services/vocabularyService` |
| `src/features/monetization/presentation/MonetizationProvider.tsx` | `context/AuthContext`, `services/i18n` |
| `src/features/monetization/data/repositories/RevenueCatRepository.ts` | `services/i18n` |
| `src/features/home/presentation/components/HomeWordCardSection.tsx` | `utils/typography`, `components/VocabularyCardHeader`, `services/vocabularyService` |
| `src/features/home/presentation/components/HomeProgressSection.tsx` | `utils/typography` |
| `src/features/home/presentation/components/HomeTutorialSection.tsx` | `components/HomeTutorialOverlay`, `services/vocabularyService`, `utils/typography` |
| `src/features/home/presentation/components/HomeModals.tsx` | `components/StreakCelebrationOverlay`, `components/AppRatingPrompt` |
| `src/features/setup/presentation/steps/NativeLanguageStep.tsx` | `utils/typography`, `constants` |
| `src/features/setup/presentation/steps/LevelStep.tsx` | `utils/typography`, `constants` |
| `src/features/setup/presentation/steps/TargetLanguageStep.tsx` | `utils/typography`, `constants` |
| `src/features/setup/presentation/steps/NotificationPermissionStep.tsx` | `utils/typography` |
| `src/features/setup/presentation/steps/NotificationScheduleStartStep.tsx` | `utils/typography` |
| `src/features/setup/presentation/steps/NotificationScheduleEndStep.tsx` | `utils/typography` |
| `src/features/setup/presentation/steps/SetupCompleteStep.tsx` | `utils/typography`, `services/notificationFrequency` |
| `src/features/settings/presentation/sections/DangerZoneSection.tsx` | `utils/typography` |
| `src/features/settings/presentation/sections/LanguageSettingsSection.tsx` | `utils/typography` |
| `src/features/settings/presentation/sections/NotificationSettingsSection.tsx` | `utils/typography` |
| `src/features/settings/presentation/sections/PremiumSettingsSection.tsx` | `utils/typography` |
| `src/features/settings/presentation/sections/ProfileSettingsSection.tsx` | `utils/typography` |

Test-only ek bulgu: `src/features/home/presentation/components/__tests__/HomeTutorialSection.test.tsx`, root `context/ThemeContext` import ediyor. Bu occurrence production toplamlarina dahil edilmedi.

## 7. Feature Deep Import Ihlalleri

| Kaynak | Ihlalli import | Neden ihlal |
|---|---|---|
| `src/features/settings/data/contracts.ts:5` | `../../setup/domain/types` | `settings`, `setup` feature'inin `domain` deep path'ine gidiyor; `setup/index.ts` public barrel kullanilmali |
| `src/features/settings/data/repositories/SettingsRepository.ts:12` | `../../../setup/domain/types` | Ayni feature-to-feature deep import ihlali |

Dogru bulunan cross-feature ornekleri:

- `src/features/favorites/domain/types.ts -> ../../vocabulary`
- `src/features/favorites/data/contracts.ts -> ../../vocabulary`

Bu iki import target feature root/public barrel'ine gittigi icin ihlal sayilmadi.

## 8. Buyuk Dosya Riski

Esik: non-test application kaynaklarinda **400 satir ve uzeri**.

| Sira | Dosya | Satir | Katman/konum |
|---:|---|---:|---|
| 1 | `screens/SettingsScreen.tsx` | 2.131 | Legacy presentation |
| 2 | `screens/HomeScreen.tsx` | 2.010 | Legacy presentation |
| 3 | `services/notificationService.ts` | 1.310 | Legacy service |
| 4 | `screens/SetupScreens.tsx` | 1.025 | Legacy presentation |
| 5 | `screens/AuthScreens.tsx` | 876 | Legacy presentation |
| 6 | `screens/ExampleSentencesScreen.tsx` | 854 | Legacy presentation |
| 7 | `context/AuthContext.tsx` | 784 | Legacy context/application/data karisimi |
| 8 | `src/features/monetization/data/repositories/AdMobRepository.ts` | 644 | Target data, halen buyuk |
| 9 | `services/vocabularyService.ts` | 547 | Legacy service |
| 10 | `src/features/home/presentation/components/HomeWordCardSection.tsx` | 515 | Target presentation, 400 esigini asiyor |
| 11 | `screens/LevelTestScreen.tsx` | 485 | Legacy presentation |
| 12 | `components/StreakCelebrationOverlay.tsx` | 465 | Legacy presentation component |
| 13 | `services/SyncService.ts` | 434 | Legacy service/application/data karisimi |

## 9. Package Script ve Test Baseline'i

### Tespit edilen scriptler

| Script | Komut |
|---|---|
| `test` | `jest` |
| `test:watch` | `jest --watch` |
| `test:ci` | `jest --runInBand` |
| `test:rules` | Izole `vocbee-rules-test` Firestore emulator projesi ve `jest.rules.config.js` ile `tests/firestoreRules.ts` |
| `typecheck` | App TypeScript kontrolu |
| `typecheck:test` | Test TypeScript kontrolu |
| `typecheck:rules` | Rules test TypeScript kontrolu |
| `typecheck:worker` | Grammar worker TypeScript kontrolu |
| `typecheck:all` | Dort typecheck komutunun zinciri |
| `lint` | ESLint; warning limiti kapali (`--max-warnings=-1`) |
| `audit:prod` | Production dependency audit |

`prettier:check` scripti mevcut degil.

### Calistirilan komutlar

| Komut | Sonuc |
|---|---|
| `npm run typecheck` | **PASS**, exit 0 |
| `npm test -- --runInBand --runTestsByPath src/app/navigation/__tests__/RootNavigator.test.tsx src/app/providers/__tests__/AppProviders.test.tsx src/devtools/__tests__/screenRegistry.test.ts` | **PASS**, 3/3 suite, 8/8 test |
| `npm run test:ci` | **PASS**, 67/67 suite, 395/395 test |
| `npm run lint` | **PASS with debt**, exit 0; 0 error, 52 warning. Script warninglari fail etmiyor. |
| `npm run typecheck:rules` | **PASS**, exit 0 |
| `npm run test:rules` | **PASS**, exit 0; gercek Firestore emulator basladi, 1/1 suite ve 8/8 rules testi gecti, emulator kontrollu kapandi |

Full Jest sirasinda hata/retry path'lerinin beklenen `console.error`/`console.warn` loglari ve `useAppLifecycle` testinde React `act(...)` uyarisi goruldu; suite sonucu yine yesil. Bu console noise test basarisizligi degil, kalite borcu olarak izlenmelidir.

Follow-up remediation sonucu:

- Homebrew `openjdk@21` 21.0.11 kuruldu.
- `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home` ve JDK `bin` PATH'i hem `~/.zprofile` hem `~/.zshrc` icinde idempotent olarak etkinlestirildi.
- Firebase CLI 15.16.0 Java major version 21'i parse etti.
- Ilk gercek calistirma emulatoru acti ve rules test dosyasinin Jest default `testMatch` desenine girmedigini ortaya cikardi. `passWithNoTests` kullanilmadi; bunun yerine rules suite'i icin coverage'siz, Node environment'li, explicit testMatch kullanan `jest.rules.config.js` eklendi.
- Test emulatoru `--project vocbee-rules-test` ile production Firebase project'inden izole edildi.
- Firebase CLI yerel oturum acilmadigi uyarisi veriyor; offline emulatorun baslamasini ve 8 testin gecmesini engellemiyor. Deploy/remote Firebase islemleri icin ayri login gerekir.

## 10. Gap'ler ve Net Oncelik Sirasi

1. **Prompt 1 — Auth/Profile/Sync:** 784 satirlik aktif `AuthContext`, root Firebase/Auth SDK bagimliliklari, `src/features/auth/profile` repository'lerinin root `config/firebase` ve `SyncService` bagimliliklari ayrilmali; public Auth API korunmali.
2. **Prompt 2 — Vocabulary/Progress/Favorites/Streak/Review/Sync servisleri:** root servis logic'i feature domain/application/data katmanlarina alinmali; storage key ve Firestore payload invariants korunmali.
3. **Prompt 3 — Home/Learning:** aktif 2.010 satirlik Home screen ve 515 satirlik target Home component parcalanmali; AsyncStorage/Speech/Network direct presentation bagimliliklari facade/adapter arkasina alinmali.
4. **Prompt 4 — Example Sentences/Grammar/Level Test/Favorites:** speech/storage/network ve scoring/persistence sinirlari tamamlanmali.
5. **Prompt 5 — Notifications:** 1.310 satirlik root notification service; permission/scheduling/tracking/pending-word/platform sorumluluklarina ayrilmali.
6. **Prompt 6 — Settings/Setup/Onboarding/Auth screens:** root god-screens, Firestore/Auth/AsyncStorage/ImagePicker/Notifications direct presentation importlari kaldirilmali.
7. **Prompt 7 — Shared ve boundary hardening:** 70 root import occurrence'i sifirlanmali; iki `settings -> setup` deep import public barrel'e alinmali; ESLint dokumandaki tum Expo/native/Firebase sinirlarini kapsayacak hale getirilmeli.
8. **Prompt 8 — Shim/dead-code cleanup:** yalnizca Prompt 1-7 tamamen yesil olduktan sonra uygulanmali. Mevcut iki AdMob shim'i ve daha sonra olusacak migration shim'leri bundan once silinmemeli.
9. **Prompt 9/10:** Firestore legacy cleanup yalnizca ayrik onay/backup/rollback ile; final release gate en son.

## 11. Kabul Kriterleri

| Kriter | Durum | Kanit |
|---|---|---|
| Gap raporu guncel branch ve commit bilgisini icerir | PASS | `refactor` / `08c91e57` |
| Aktif runtime'in `src/app` + root `screens` hibrit oldugu acik | PASS | Bolum 3 |
| Her yasak import dosya bazinda listelenir | PASS | Bolum 5; root/target/devtools ayrimi |
| `src` root importlari tespit edilir | PASS | 70 occurrence / 29 production dosyasi, Bolum 6 |
| Feature deep importlari tespit edilir | PASS | 2 ihlal, Bolum 7 |
| Buyuk dosyalar listelenir | PASS | 13 dosya, Bolum 8 |
| Test scriptleri tespit edilir | PASS | Bolum 9 |
| Zorunlu Prompt 0 typecheck ve hedefli testler yesil | PASS | Typecheck + 3 suite/8 test |
| Mevcut ek kalite komutlari yesil | PASS | `test:ci`, lint, `typecheck:rules` ve gercek emulator `test:rules` tamamlandi |
| Sonraki promptlar icin net oncelik vardir | PASS | Bolum 10 |

## 12. Standart Cikis

### Degisen dosyalar

- `docs/refactor-v2/43-current-refactor-gap-report.md` eklendi.
- `jest.rules.config.js` eklendi; emulator-only rules suite'i ana Jest/coverage akimindan izole edildi.
- `package.json` icindeki `test:rules` scripti dedicated config ve izole test project ID kullanacak sekilde guncellendi.

Repo disi kullanici ortami:

- Homebrew OpenJDK 21.0.11 kuruldu.
- `~/.zprofile` ve `~/.zshrc` icinde `JAVA_HOME`/PATH etkinlestirildi.

### Yeni/degisen mimari sinirlar

- Yok. Bu prompt salt audit ve raporlama kapsaminda tutuldu.

### Eski root shim'lerinin durumu

- Root `App.tsx`: app entry shim'i; `FONT_FAMILY` icin root utils compatibility export'u da tasiyor.
- `services/adMobService.ts`: re-export shim.
- `services/adMobService.web.ts`: re-export shim.
- Bu promptta yeni shim olusturulmadi, mevcut shim silinmedi veya degistirilmedi.
- Diger 45 root production modulu aktif logic/compatibility implementation tasiyor.

### Kalan riskler

- Lint 52 uyariyi fail etmiyor; boundary kurallari warn/eksik kapsamda.
- Runtime hala root screen/service/context/component implementasyonlarina bagli.
- Presentation'da direct storage/Firebase/Expo/native erisimleri devam ediyor.
- Iki feature deep import ihlali var.
- 13 production dosyasi 400+ satir; en buyuk iki screen 2.000+ satir.
- Tracked `ios/` ve `.expo/devices.json` refactor diff'lerine yanlislikla karisma riski tasiyor.
- Firebase CLI offline emulator testini basariyla calistiriyor; remote/deploy islemleri icin kullanici login'i halen gerekir.

### Bir sonraki prompta gecilebilir mi?

**Evet.** Zorunlu typecheck/hedefli testler, full `test:ci`, lint, `typecheck:rules` ve gercek Firestore emulator `test:rules` suite'i tamamlandi. Prompt 1'e gecis aciktir.
