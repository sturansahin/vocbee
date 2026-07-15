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

## 13. Prompt Execution Ledger

Bu bolum Prompt 0-10 arasindaki kalici handoff ve kanit defteridir. Ilk audit snapshot'i ile tamamlanmis prompt
kayitlari **append-only** korunur. Bir kayit hatali veya stale ise eski kayit silinmez; tarih, neden ve onceki kayda
referans iceren bir superseding kayit eklenir. Mevcut Git/kod durumu raporla celistiginde Git/kod esas alinir.

Her yeni prompt kaydi en az su alanlari icerir:

- prompt numarasi, `complete`/`blocked` durumu ve Europe/Istanbul audit zamani
- baslangic/bitis branch, HEAD ve worktree ozeti
- kapsam, degisen dosyalar ve repository-relative artifact path'leri
- cozumlenen/kalan gap'ler ile yeniden olculmus sayisal tarama sonuclari
- exact komut, exit code, `PASS`/`FAIL` ve test suite/test sayilari
- manual QA sonucu veya calistirilamama nedeni
- sonraki prompt icin `acik`/`kapali` gate ve somut kanit

Komut calistirilmadiysa veya sonuc tahmin edildiyse `PASS` yazilmaz. Zorunlu kontrol calistirilamiyorsa kayit
`blocked` olur. Prompt 9 opsiyoneldir; Prompt 10'dan once owner onayli `complete` veya gerekceli `not-applicable`
kaydi zorunludur.

### Prompt 0 — 2026-07-13

| Alan | Kayit |
|---|---|
| Durum | **complete** |
| Audit zamani | 2026-07-13 22:38 +03 (Europe/Istanbul); handoff formati 2026-07-13 23:06 +03'te dogrulandi |
| Branch / baslangic HEAD | `refactor` / `08c91e57` |
| Kanit commit'i | `c1def165` (`43` raporu, dedicated rules Jest config'i ve `test:rules` scripti) |
| Kapsam | Preflight/runtime/import/size/script audit'i; JDK ve gercek Firestore emulator rules-test remediation'i |
| Degisen dosyalar | `docs/refactor-v2/43-current-refactor-gap-report.md`, `jest.rules.config.js`, `package.json` |
| Repo disi ortam | Homebrew OpenJDK 21.0.11; `~/.zprofile` ve `~/.zshrc` icinde idempotent `JAVA_HOME`/PATH |
| Artifact'ler | `docs/refactor-v2/43-current-refactor-gap-report.md`, `jest.rules.config.js` |
| Cozumlenen gap | Rules testi gercek emulatorla ve explicit `vocbee-rules-test` project ID ile calisiyor; no-test false green kaldirildi |
| Kalan gap/risk | Bolum 10 ve 12; 45 root logic modulu, 70 root import occurrence'i, 2 deep import, 52 lint warning |
| Otomatik kanit | `npm run typecheck` exit 0; hedefli Jest 3/3 suite ve 8/8 test; `npm run test:ci` 67/67 suite ve 395/395 test; `npm run lint` exit 0 (52 warning); `npm run typecheck:rules` exit 0; `npm run test:rules` exit 0, 1/1 suite ve 8/8 test |
| Manual QA | Uygulama davranisi degistirilmedigi icin feature smoke N/A; Firestore emulatorun gercek baslama/kapanma akisi terminalde dogrulandi |
| Sonraki gate | **Prompt 1: acik.** Zorunlu ve mevcut ek kalite komutlari PASS; oncelik/kapsam Bolum 10'da |

Bu kayit, Prompt 0 sonrasi prompt-zinciri dokumani bakimini bir feature/refactor promptu olarak saymaz.
`docs/refactor-v2/42-refactor-completion-prompts.md` uzerindeki handoff/reference duzeltmeleri ayri dokumantasyon
bakimidir; Prompt 1 calisirken mevcut worktree korunarak yeniden kaydedilmelidir.

### Prompt 1 — 2026-07-13

| Alan | Kayit |
|---|---|
| Durum | **blocked** — implementation ve otomatik gate'ler tamamlandi; faz DoD'sinin zorunlu fiziksel cihaz/provider manual QA'si calistirilamadi |
| Audit zamani | 2026-07-13 23:41 +03 (Europe/Istanbul) |
| Branch / baslangic HEAD | `refactor` / `30d5a938`; worktree Prompt 1 baslangicinda temizdi |
| Branch / bitis HEAD | `refactor` / `30d5a938`; commit olusturulmadi, worktree yalnizca asagidaki Prompt 1 kod/test/dokuman degisikliklerini iceriyor |
| Handoff revalidation | Son Prompt 0 kaydi `complete`, zorunlu komutlari PASS ve Prompt 1 gate'i `acik`; `c1def165..30d5a938` araligi yalnizca `42`/`43` prompt-handoff dokumantasyon bakimiydi; Auth/Profile/Sync koduyla celiski yoktu |
| Kapsam | Auth state/session/profile bootstrap/setup/error/loading akisini ince provider + `AuthFacade` olarak ayirma; provider factory/adapters; profile persistence; sync orchestration/repository/local-store; root compatibility shim'leri |
| Degisen dosyalar | `context/AuthContext.tsx`, `context/__tests__/AuthContext.test.tsx`; `services/{SyncService,googleAuthConfig,nativeGoogleSignIn,socialAuthProfile}.ts`; `src/features/auth/**`; `src/features/profile/**`; `src/features/sync/**`; `src/app/{lifecycle,providers}/**`; ilgili `src/devtools/**` ve `src/features/monetization/**` import/test dosyalari; `docs/refactor-v2/{17-risk-register,43-current-refactor-gap-report}.md` |
| Artifact'ler | `src/features/auth/application/AuthFacade.ts`, `src/features/auth/presentation/AuthProvider.tsx`, `src/features/auth/data/{clients,gateways,providers,repositories}/`, `src/features/profile/domain/profileRules.ts`, `src/features/profile/data/repositories/FirestoreUserProfileRepository.ts`, `src/features/sync/application/DefaultSyncOrchestrator.ts`, `src/features/sync/data/`, `src/features/sync/composition/` |
| Cozumlenen gap | Root `AuthContext` 784 -> 3 satir ve salt public re-export shim'i; root `SyncService` 434 -> 2 satir ve salt re-export shim'i; social profile/native Google/config servisleri logic tasimayan shim oldu; uygulama Auth/Sync public feature barrel'lerini kullaniyor; schema, profil field'lari, storage key'leri ve public Auth API korunuyor |
| Katman kaniti | Auth/Profile presentation/context SDK ve concrete repository import taramasi: 0; Auth/Profile/Sync domain SDK/React import taramasi: 0; bu uc feature arasinda deep import: 0; production `src` icinde eski `context/AuthContext` veya `services/SyncService` importu: 0 |
| Yeniden olcum | Root production envanteri 47 dosya / 15.054 satir; 7 re-export shim / 40 aktif logic modulu. Production `src` root-relative importlari 71 occurrence / 31 dosya; artis yeni data-layer compatibility gateway'lerinin Prompt 2/5 sahibi root servislere gecici bagimliligindan kaynaklaniyor. Feature deep import borcu degismedi: 2 mevcut `settings -> setup/domain/types` ihlali |
| Test degisimi | Baseline 67 suite / 395 test -> 70 suite / 410 test. Initial loading, signed-out, signed-in profile/setup, bootstrap error, sign-out cleanup; email/Google/Apple factory; profile cache/Firestore mapping; sync/device conflict ve lifecycle setup routing senaryolari kapsandi |
| Otomatik kanit | `npm run typecheck` exit 0; `npm run typecheck:all` exit 0; `npm test -- --runInBand` exit 0, 70/70 suite ve 410/410 test; `npm run test:ci` exit 0, 70/70 suite ve 410/410 test; `npm run lint` exit 0, 0 error ve baseline ile ayni 52 warning; `npm run test:rules` exit 0, gercek emulator ile 1/1 suite ve 8/8 test; `git diff --check` exit 0 |
| Ek statik kanit | Import-boundary `rg` taramalari beklenen bos sonuc; root envanter/root-relative import/deep-import taramalari yukaridaki sayilari yeniden uretti. Projede `prettier:check` scripti yok; calistirilmadi ve PASS sayilmadi |
| Manual QA | **CALISTIRILAMADI:** provision edilmis iOS/Android cihaz/simulator, Google/Apple test hesabi ve iki cihazli interaktif oturum yoktu. Email/Google/Apple login, sifre sifirlama, hesap silme, iki cihaz sync cakismasi ve profil guncelleme checklist'i acik. Otomatik testler manual QA yerine PASS sayilmadi |
| Kalan gap/risk | R4 acik/Yuksek: provider ve iki cihaz smoke QA. Prompt 2/5 sahibi root servisler nedeniyle compatibility gateway'leri; 40 root logic modulu, 71 root import occurrence'i, 2 eski deep import ve 52 lint warning sonraki sahip promptlarda kaldi. `ios/`, package/lock ve Firebase schema/rules degistirilmedi |
| Sonraki gate | **Prompt 2: kapali.** `18` faz DoD ve `24` manual QA checklist'i tamamlanmadan Prompt 1 `complete` olamaz. Cihaz QA'si tamamlanirsa sonuc/ortam kanitiyla bu kaydi silmeden superseding `Prompt 1 complete` kaydi eklenmelidir |

### Prompt 2 — 2026-07-14

| Alan | Kayit |
|---|---|
| Durum | **blocked** — Prompt 2 handoff on kosulu saglanmadi; servis koduna baslanmadi |
| Audit zamani | 2026-07-14 21:33 +03 (Europe/Istanbul) |
| Branch / HEAD | `refactor` / `30d5a938` |
| Worktree | Prompt 1'in commitlenmemis Auth/Profile/Sync kod, test, risk-register ve ledger degisiklikleri korunuyor; Prompt 2 sahibi bes root serviste mevcut diff yok |
| Handoff revalidation | Son Prompt 1 kaydi `blocked`, zorunlu fiziksel cihaz/provider QA checklist'i acik ve kaydin sonraki gate'i `Prompt 2: kapali`. Prompt 2'nin `Prompt 1 complete + PASS + acik gate` kosulu saglanmiyor |
| Kapsam | Yalnizca fail-closed handoff, mevcut checkout ve Prompt 2 servis envanteri audit'i; Vocabulary/Progress/Favorites/Streak/Review implementasyonu yapilmadi |
| Degisen dosyalar | Yalnizca bu append-only kayit: `docs/refactor-v2/43-current-refactor-gap-report.md` |
| Artifact'ler | Yeni kod artifact'i yok; audit kaniti `docs/refactor-v2/43-current-refactor-gap-report.md` |
| Mevcut sayisal durum | `services/{vocabularyService,progressService,favoritesService,streakService,reviewPromptService}.ts`: sirasiyla 547/300/312/348/375 satir, toplam 1.882 satir aktif logic. Bes servisin besinde direct AsyncStorage importu; `favoritesService` ayrica `firebase/firestore` ve `config/firebase` kullaniyor. Ilgili mevcut Vocabulary/Progress/Favorites/Streak feature agaclarinda 23 dosya, Review feature agacinda 0 dosya var |
| Cozumlenen gap | Yok; gate basarisiz oldugu icin Prompt 2 kod degisikligi yetkilendirilmedi |
| Kalan gap/risk | Prompt 1 R4 acik/Yuksek ve cihaz QA'si eksik. Prompt 2 sahibi bes root servis shim/<50 satir kriterini saglamiyor; business/storage/Firestore logic'i root'ta duruyor |
| Calistirilan kanit | `git branch --show-current` exit 0 -> `refactor`; `git rev-parse --short HEAD` exit 0 -> `30d5a938`; `git status --short` exit 0; bes hedef serviste `wc -l` exit 0 -> toplam 1.882; direct SDK/storage `rg` taramasi exit 0 ve yukaridaki importlari buldu; `git diff --name-only -- <bes hedef servis>` exit 0 ve bos sonuc |
| Zorunlu kalite komutlari | **CALISTIRILMADI / PASS DEGIL:** `npm run typecheck`, `npm test -- --runInBand`, `npm run test:ci`, `npm run lint`. Handoff gate kod baslamadan kapandigi icin Prompt 2 kalite sonucu uretilmedi |
| Manual QA | Prompt 2 QA'sina gecilmedi. Once Prompt 1'in email/Google/Apple login, sifre sifirlama, hesap silme, iki cihaz sync cakismasi ve profil guncelleme checklist'i tamamlanmali |
| Sonraki gate | **Prompt 3: kapali.** Once kanitli superseding `Prompt 1 complete` kaydi ile Prompt 2 gate'i acilmali; ardindan Prompt 2 bastan uygulanip zorunlu komutlari PASS ve Prompt 3 gate'i acik olan yeni bir superseding Prompt 2 kaydi eklenmeli |

### Prompt 1 — 2026-07-14 superseding completion

| Alan | Kayit |
|---|---|
| Durum | **complete** — 2026-07-13 tarihli Prompt 1 `blocked` kaydini manual QA sonucu ile supersede eder |
| Audit zamani | 2026-07-14 21:40 +03 (Europe/Istanbul) |
| Branch / HEAD | `refactor` / `30d5a938`; Prompt 1 production kodu ve onceki otomatik kanitlardan sonra kod degisikligi yapilmadi |
| Ortam | iPhone 17 Pro Simulator, iOS 26.5; Expo development build `com.vocbee.app`; Metro bu checkout'tan bundle uretti |
| Gozlenen runtime kaniti | Stored session bootstrap -> `setupCompleted=true` -> `MainTabs`; logout -> local cleanup -> signed-out state -> `Login`; email login -> remote profile/progress/favorites restore -> `setupCompleted=true` -> `MainTabs`. Crash/red screen veya AuthFacade bootstrap exception'i yok |
| Manual QA | **PASS — kullanici/owner onayi:** email/Google/Apple login, sifre sifirlama, hesap silme, iki cihaz sync cakismasi ve profil guncelleme dahil checklist icin "hepsi calisiyor" sonucu bildirildi. Google/Apple icin ilk basarisiz deneme loglari sonrasinda nihai sonucu owner retest onayi supersede eder |
| Otomatik kanit | Ayni Prompt 1 checkout'i icin onceki kayittaki `npm run typecheck`, `npm run typecheck:all`, full Jest 70/70 suite ve 410/410 test, `test:ci`, lint, rules emulator ve `git diff --check` PASS sonuclari gecerlidir; simulator QA sirasinda production kaynak degismedi |
| Worktree hijyeni | Expo'nun simulator acilisinda degistirdigi tracked `.expo/devices.json` Prompt 1 oncesi icerigine geri alindi; `ios/`, package/lock, Firebase schema/rules degismedi |
| Risk | R4 Prompt 1 kapsami icin kapatildi; production provider credential/config izlemesi release surecinde devam eder |
| Sonraki gate | **Prompt 2: acik.** Prompt 1 implementation, otomatik gate'ler ve manual QA artik complete/PASS |

### Prompt 2 — 2026-07-14 superseding completion

Bu kayit, 2026-07-14 21:33 +03 tarihli Prompt 2 `blocked` kaydini; son Prompt 1 kaydinin `complete` olmasi,
Prompt 2 implementasyonu ve yeni kanitlarla supersede eder.

| Alan | Kayit |
|---|---|
| Durum | **complete** |
| Audit zamani | 2026-07-14 22:08 +03 (Europe/Istanbul) |
| Branch / baslangic HEAD | `refactor` / `30d5a938`; onceki blocked kayit ve Prompt 1 QA sirasinda Prompt 2 sahibi servislere implementation uygulanmamisti |
| Branch / bitis HEAD | `refactor` / `4cde4fb8` (`refactor: decompose auth and services into layered feature modules`); kullanici calisma devam ederken Prompt 1 ile Prompt 2'nin vocabulary/progress/favorites/streak kismini commitledi. Review, public-boundary, ek test ve bu ledger degisiklikleri worktree'de korunuyor; agent yeni commit olusturmadi |
| Handoff revalidation | Son Prompt 1 kaydi `complete`, otomatik komutlari PASS ve Prompt 2 gate'i `acik`; iPhone simulator owner QA'si Prompt 1 R4'u kapatti. `4cde4fb8` commit'i mevcut Prompt 2 degisikliklerinin bir kismini kapsiyor ve worktree ile celismiyor |
| Servis -> feature mapping | `services/vocabularyService.ts` -> `src/features/vocabulary`; `progressService.ts` -> `src/features/progress`; `favoritesService.ts` -> `src/features/favorites`; `streakService.ts` -> `src/features/streak`; `reviewPromptService.ts` -> `src/features/review` |
| Kapsam | Bes servisin domain/application/data/composition katmanlarina ayrilmasi; root compatibility shim'leri; Sync/Auth/lifecycle/Home alt component/notification tuketicilerinin public barrel kullanmasi; kritik servis ve sync retry/integration testleri |
| Degisen artifact'ler | `services/{vocabularyService,progressService,favoritesService,streakService,reviewPromptService}.ts`; `src/features/{vocabulary,progress,favorites,streak,review}/**`; `src/features/sync/data/gateways/LegacySyncDomainGateway.ts`; `src/features/auth/data/gateways/LegacyAuthSideEffectsGateway.ts`; `src/app/lifecycle/**`; `src/features/home/presentation/components/{HomeWordCardSection,HomeTutorialSection}.tsx`; `services/notificationService.ts`; ilgili testler; `docs/refactor-v2/{17-risk-register,43-current-refactor-gap-report}.md` |
| Cozumlenen gap | Bes root servis 547/300/312/348/375 satir, toplam 1.882 aktif logic'ten ikiser satirlik re-export shim'lerine, toplam 10 satira indi. Business kurallari domain/application'a; AsyncStorage, Firestore, Expo Asset/FileSystem/StoreReview/Linking erisimleri data repository/gateway'lerine alindi. SyncOrchestrator vocabulary/progress/favorites/streak public feature API'lerini kullaniyor; root `SyncService`e logic geri tasinmadi |
| Korunan storage key'leri | Vocabulary: `@vocabulary`, `@vocabulary_A1..C1`, `@vocabulary_schema_version`, `@native_language`, `@target_language`; progress: `@user_progress`, `@current_level`, `@last_word_id`; favorites: `@favorites` ve `@favorites_{uid}`; streak: `@streak`; review: `@VocBee:appReviewPromptState`; sync: `@vocbee_needs_sync`, `@vocbee_last_sync`, `@vocbee_device_id` |
| Korunan Firestore path/payload | `users/{uid}` ana dokumani; `progress.{learnedWords,currentLevel,lastWordIndex,lastSync}`, `favorites`, `streak`, `lastActiveDeviceId`, `syncMeta.{version,updatedAt,updatedByDeviceId}` ve merge-write davranisi korundu. `users/{uid}/progressByLevel/{level}` hazirlik path'i degismedi ve production read/write'a aktive edilmedi. Vocabulary/review icin yeni Firestore path'i eklenmedi |
| Shim listesi | `services/vocabularyService.ts`, `services/progressService.ts`, `services/favoritesService.ts`, `services/streakService.ts`, `services/reviewPromptService.ts`; her biri 2 satir, default export gereksinimi yok ve public named API aynen re-export ediliyor |
| Katman/boundary kaniti | Hedef bes feature'da `data/**` disinda AsyncStorage/Firebase importu: 0; bes root shim'de AsyncStorage/Firebase/`config/firebase`: 0; target feature'lara yeni cross-feature deep import: 0; production `src` icinde bes eski root servise aktif import: 0. `LegacySyncDomainGateway` progress/favorites/streak/vocabulary icin `@features/*` public barrel'lerini kullaniyor |
| Yeniden olcum | Root production envanteri 47 dosya / 13.182 satir; 12 re-export shim / 35 aktif logic modulu. Bes hedef root servisin satir azalimi 1.872. Eski iki `settings -> setup/domain/types` deep-import borcu Prompt 7 sahibi olarak degismedi. Lint 52 -> 51 warning; yeni error/warning yok |
| Test degisimi | Prompt 1 baseline'i 70 suite / 410 test -> 74 suite / 425 test. Yeni 4 suite/15 test vocabulary cache/schema fallback, progress mutation/advance/restore, favorites add-remove-check/merge ve review eligibility'yi kapsiyor. Mevcut streak ve SyncService suite'leriyle hedefli kosu 6/6 suite, 43/43 test |
| Otomatik kanit | `npm run typecheck` exit 0; `npm run typecheck:all` exit 0; hedefli Jest exit 0, 6/6 suite ve 43/43 test; `npm test -- --runInBand --silent` exit 0, 74/74 suite ve 425/425 test; `npm run test:ci -- --silent` exit 0, 74/74 suite ve 425/425 test; `npm run lint` exit 0, 0 error/51 warning; `npm run test:rules` exit 0, gercek Firestore emulator ile 1/1 suite ve 8/8 test; `git diff --check` exit 0 |
| Simulator/manual smoke | **PASS — Prompt 2 servis kapsami:** iPhone 17 Pro Simulator / iOS 26.5 / Expo development build. Yeni bundle crash/red screen olmadan Login ve MainTabs'e ulasti. Vocabulary tum seviyelerde uretildi; B1 progress 413/805'ten uc ogrenme sonrasi 416/805'e cikti; iki favori eklendi; streak 1 oldu. Metro reload sonrasi 416/805 korundu, kayitli shuffle/last-word resume edildi ve favorites 5 -> 7 item olarak Firebase'e sync edildi. Owner etkileşimi ve runtime loglari birlikte kanittir |
| Kalan gap/risk | Prompt 2 sahibi acik Kritik/Yuksek risk yok. HomeScreen/Phase 5 sunum refactoru, seviye tamamlama ve offline->online ekran QA'si Prompt 3'e; notification root servisi Prompt 5'e; iki eski deep import ve lint borcu Prompt 7'ye aittir. RevenueCat/AdMob simulator uyarilari Prompt 2 servislerinden kaynaklanmiyor |
| Worktree hijyeni | Expo'nun acilista degistirdigi tracked `.expo/devices.json` HEAD icerigine geri alindi. `ios/`, package/lock, Firebase schema/rules ve storage key stringleri degistirilmedi |
| Sonraki gate | **Prompt 3: acik.** Prompt 2 implementation, zorunlu/ek otomatik kontroller ve servis-kapsamli simulator smoke PASS |

### Prompt 3 — 2026-07-14

| Alan | Kayit |
|---|---|
| Durum | **blocked** — production implementation ve otomatik kalite gate'leri tamamlandi; `18` ve `25` tarafindan zorunlu tutulan tum etkileşimli manual QA senaryolari bu oturumda tamamlanamadi |
| Audit zamani | 2026-07-14 22:36 +03 (Europe/Istanbul) |
| Branch / baslangic HEAD | `refactor` / `53f90562`; Prompt 3 baslangicinda worktree temizdi |
| Branch / bitis HEAD | `refactor` / `53f90562`; agent commit olusturmadi, worktree yalnizca bu kayitta listelenen Prompt 3 kod/test/dokuman degisikliklerini iceriyor |
| Handoff revalidation | Son Prompt 2 kaydi `complete`, zorunlu komutlari PASS ve Prompt 3 gate'i `acik`. Kayittaki `4cde4fb8` sonrasinda HEAD'e gelen `53f90562`, Prompt 2'nin kalan review/public-boundary/test/ledger calismasini commitliyor; Home/Learning runtime graph'iyle celiski veya kirli baslangic yoktu |
| Parcalama haritasi | Composition: `src/features/learning/composition/LearningHomeScreen.tsx` ve `homeFacade.ts`; application: `application/{HomeFacade,contracts}.ts`; platform adapter: `data/ExpoHomePlatformGateway.ts`; presentation screen: `presentation/screens/HomeScreen.tsx`; state/action hook'lari: `useLearningSession`, `useWordActions`, `useTutorialOverlay`, `useSwipeGesture`, `useBeeAnimation`; loading/empty/error UI: `presentation/components/HomeScreenStates.tsx`; mevcut word-card/action/progress/tutorial UI'lari `src/features/home/presentation/components` public barrel'i uzerinden yeniden kullaniliyor |
| Degisen dosyalar | `screens/{HomeScreen.tsx,__tests__/HomeScreen.test.tsx}`; `src/features/learning/{application,composition,data,presentation,domain,index.ts}`; `src/features/home/{index.ts,presentation/components/HomeWordCardSection.tsx,presentation/components/homeWordCardStyles.ts}`; `src/app/navigation/{RootNavigator.tsx,__tests__/RootNavigator.test.tsx}`; `src/devtools/{screenRegistry.ts,__tests__/DevToolsRoot.test.tsx,__tests__/screenRegistry.test.ts}`; bu ledger |
| Artifact'ler | `src/features/learning/application/HomeFacade.ts`, `src/features/learning/application/contracts.ts`, `src/features/learning/composition/LearningHomeScreen.tsx`, `src/features/learning/composition/homeFacade.ts`, `src/features/learning/data/ExpoHomePlatformGateway.ts`, `src/features/learning/presentation/screens/HomeScreen.tsx`, `src/features/learning/presentation/hooks/`, `src/features/learning/presentation/components/HomeScreenStates.tsx`, `src/features/home/presentation/components/homeWordCardStyles.ts` |
| Shim ve aktif runtime | Root `screens/HomeScreen.tsx` 2010 satirlik implementasyondan 1 satirlik public feature re-export shim'ine indi: default `HomeScreen` ve named `getTutorialSwipeNextStep`. `RootNavigator` ve devtools registry artik `@features/learning` public barrel'ini import ediyor; production `src/app`/`src/devtools` icinde eski `screens/HomeScreen` aktif importu 0 |
| Boyut/boundary kaniti | Aktif `src/features/learning/presentation/screens/HomeScreen.tsx` 291 satir; `HomeWordCardSection.tsx` 521 -> 379 satir. Learning/Home presentation import satirlarinda Firebase, AsyncStorage, Expo side-effect/native SDK ve root `services/` direct importu 0; learning domain import satirlarinda SDK/React/React Native/root service importu 0. Speech ve storage yalnizca application contract'i arkasindaki `ExpoHomePlatformGateway` tarafindan kullaniliyor |
| Korunan davranis ve persistence | Vocabulary load/generation, learned filtreleme, current/last-word resume, progress/level, favorites, streak/celebration, tutorial, speech, her 10 kelimede ad, pending notification ve review trigger akislari facade/hook'lara tasindi. Shuffle key `@shuffle_order_${native}_${target}_${level}` ve Prompt 2 vocabulary/progress/favorites/streak/review storage key/Firestore kontratlari degismedi; yeni schema/path eklenmedi |
| Test degisimi | Prompt 2 baseline'i 74 suite / 425 test -> 75 suite / 430 test. Home presentation state/action testleri loading, ready word/favorite/speech, empty, error/retry ve tutorial swipe kuralini; facade testleri session/shuffle, progress+streak completion, favorite ve speech adapter delegasyonunu kapsiyor |
| Otomatik kanit | `npm run typecheck:all` exit 0 (app/test/rules/worker); hedefli Jest exit 0, 5/5 suite ve 19/19 test; `npm test -- --runInBand` exit 0, 75/75 suite ve 430/430 test; `npm run test:ci -- --silent` exit 0, 75/75 suite ve 430/430 test; `npm run test:rules` exit 0, gercek Firestore emulator ile 1/1 suite ve 8/8 test; `npm run lint` exit 0, 0 error/44 warning; `git diff --check` exit 0 |
| Coverage kaniti | `npx jest src/features/learning/domain/__tests__/rules.test.ts --runInBand --coverage --collectCoverageFrom='src/features/learning/domain/rules.ts' --coverageReporters=text-summary` exit 0, 1/1 suite ve 4/4 test; statements/branches/functions/lines %100. Projede `prettier:check` scripti yok; calistirilmadi ve PASS sayilmadi |
| Simulator smoke | **KISMI PASS:** iPhone 17 Pro Simulator / iOS 26.5 / Expo development build `com.vocbee.app`; Metro bu checkout'tan 1939 modullu bundle uretti. App crash/red screen olmadan `MainTabs`e ulasti ve yeni aktif Home; dark mode header, streak 1, B1, 416/805 progress, word card/favorite/speech/more-examples alanlari ve test banner'i ile render oldu. Prompt 2'den kalan 416 progress'in yeni facade uzerinden okunmasi persistence/resume icin smoke kanitidir |
| Manual QA | **TAMAMLANMADI / PASS DEGIL:** simulatora programatik dokunma erisimi yoktu. Bu checkout'ta skip/learn swipe ve sayac artisi, favorite/speech butonlari, reload/last-word resume, level completion -> next level, offline -> online sync, grammar examples, tutorial first-run, ad/review ve streak celebration senaryolarinin tamamini etkileşimli olarak yeniden kanitlamak acik. Otomatik test ve render smoke'u manual QA yerine PASS sayilmadi |
| Worktree hijyeni | Simulator acilisinda degisen tracked `.expo/devices.json` HEAD icerigine geri alindi. Metro durduruldu; `ios/`, package/lock, Firebase schema/rules ve storage key stringleri degistirilmedi |
| Kalan risk/remediation | Kod ve otomatik gate tarafinda acik Prompt 3 blocker'i yok. Owner ayni checkout'ta yukaridaki manual checklist'i calistirip ortam/sonuc kaniti vermeli; production kodu degisirse zorunlu komutlar yeniden kosulmali. Basarili sonuc eski kaydi silmeden superseding `Prompt 3 complete` kaydiyla kaydedilmeli |
| Sonraki gate | **Prompt 4: kapali.** Son Prompt 3 kaydi `complete` ve manual QA PASS olmadan Prompt 4 handoff on kosulu saglanmaz |

### Prompt 4 — 2026-07-15

| Alan | Kayit |
|---|---|
| Durum | **blocked** — Prompt 4 fail-closed handoff on kosulu saglanmadi; feature/screen implementasyonuna baslanmadi |
| Audit zamani | 2026-07-15 21:37 +03 (Europe/Istanbul) |
| Branch / HEAD | `refactor` / `c0682221`; audit baslangicinda worktree temizdi |
| Handoff revalidation | En son Prompt 3 ledger kaydi `blocked`, zorunlu etkileşimli manual QA `PASS DEGIL` ve kaydin sonraki gate'i `Prompt 4: kapali`. `53f90562` sonrasindaki `0c367387` HomeScreen tasima commit'i ve `c0682221` merge commit'i superseding `Prompt 3 complete`/manual-QA kaniti icermiyor. Prompt 4'un `Prompt 3 complete + PASS + acik gate` kosulu bu nedenle saglanmiyor |
| Kapsam | Yalnizca handoff, mevcut checkout, hedef root dosyalar ve aktif runtime importlari audit edildi. Example Sentences/grammar, Level Test ve Favorites kodu degistirilmedi |
| Degisen dosyalar | Yalnizca bu append-only kayit: `docs/refactor-v2/43-current-refactor-gap-report.md` |
| Artifact'ler | Yeni production/test artifact'i yok; audit kaniti `docs/refactor-v2/43-current-refactor-gap-report.md` |
| Aktif runtime kaniti | `src/app/navigation/RootNavigator.tsx` ve `src/devtools/screenRegistry.ts` halen `screens/{ExampleSentencesScreen,LevelTestScreen,FavoritesScreen}` modullerini dogrudan import ediyor. Uc root screen aktif implementasyon; public feature barrel'lerine gecis yapilmamis |
| Mevcut sayisal durum | `screens/ExampleSentencesScreen.tsx` 854, `screens/LevelTestScreen.tsx` 485, `screens/FavoritesScreen.tsx` 220 ve `services/groqService.ts` 292 satir; toplam 1.851 satir aktif logic. `ExampleSentencesScreen` direct `expo-speech`, AsyncStorage ve root `groqService`; `LevelTestScreen` direct AsyncStorage; `FavoritesScreen` root favorites/vocabulary servislerini kullaniyor. `services/groqService.ts` AsyncStorage, Firebase Auth ve network/cache logic'i tasiyor |
| Cozumlenen gap | Yok; gate kapali oldugu icin Prompt 4 production kodu, shim, import veya test degisikligi yetkilendirilmedi |
| Kalan gap/risk | Prompt 3 manual checklist'i acik: skip/learn swipe ve sayac, favorite/speech, reload/last-word resume, level completion, offline-online sync, grammar examples, tutorial first-run, ad/review ve streak celebration. Prompt 4 kabul kriterlerinin tamami ayrica acik: uc screen shim degil, Groq servisi shim/wrapper degil, side-effect SDK importlari presentation'da ve hedef testler eklenmedi |
| Calistirilan kanit | `git branch --show-current` exit 0 -> `refactor`; `git rev-parse --short HEAD` exit 0 -> `c0682221`; baslangic `git status --short` exit 0 ve bos; hedef dosyalarda `wc -l` exit 0 -> toplam 1.851; runtime import ve SDK/service `rg` taramalari exit 0 ve yukaridaki bulgulari uretti; hedef dosyalarda baslangic `git diff --name-only` exit 0 ve bos; ledger eklenince `git diff --check` exit 0 |
| Zorunlu kalite komutlari | **CALISTIRILMADI / PASS DEGIL:** `npm run typecheck`, `npm test -- --runInBand`, `npm run test:ci`, `npm run lint`, `npm run test:rules`. Handoff gate kod baslamadan kapandigi icin Prompt 4 kalite sonucu uretilmedi; yalnizca `git diff --check` PASS |
| Manual QA | Prompt 4 QA'sina gecilmedi. Once Prompt 3 kaydinda listelenen etkileşimli checklist ayni guncel checkout'ta tamamlanmali ve owner/ortam/sonuc kanitiyla superseding `Prompt 3 complete` kaydi eklenmeli |
| Sonraki gate | **Prompt 5: kapali.** Once Prompt 3 superseding completion ile Prompt 4 gate'i acilmali; ardindan Prompt 4 bastan uygulanip zorunlu komutlari PASS ve Prompt 5 gate'i acik olan yeni bir superseding Prompt 4 kaydi eklenmeli |

### Prompt 3 — 2026-07-15 superseding completion

Bu kayit, 2026-07-14 tarihli Prompt 3 `blocked` kaydini owner manual-QA onayi ile supersede eder. Aradaki
2026-07-15 tarihli Prompt 4 `blocked` kaydi tarihsel handoff kaniti olarak korunur; Prompt 4 implementation'i
bu kayittan sonra yeni bir calisma olarak bastan ele alinmalidir.

| Alan | Kayit |
|---|---|
| Durum | **complete** — Prompt 3 production implementasyonu, otomatik gate'leri ve zorunlu manual QA artik tamamlandi |
| Audit zamani | 2026-07-15 21:56 +03 (Europe/Istanbul) |
| Branch / HEAD | `refactor` / `c0682221`; bu superseding kayit eklenmeden once worktree'deki tek degisiklik Prompt 4 blocked ledger kaydiydi |
| Checkout revalidation | Prompt 3 implementasyonu `0c367387` (`Move HomeScreen to learning feature`) ile commitli. `0c367387..c0682221` taramasinda production `src/`, root `screens/`, `services/`, `components/`, `context/`, `config/`, `utils/` veya `App.tsx` altinda degisen TS/TSX/JS/JSX dosyasi yok; yalnizca coverage raporu JS artifact'leri bulundu. `package.json` degisikligi sadece `ios`/`android` start scriptlerini native run komutlarina ceviriyor; Prompt 3 test scriptleri degismedi |
| Owner manual QA | **PASS — kullanici/owner onayi:** mevcut `c0682221` checkout'i icin skip/learn swipe ve sayac artisi, favorite/speech, reload/last-word resume, level completion -> next level, offline -> online sync, grammar examples, tutorial first-run, ad/review ve streak celebration senaryolarinin tamami icin "hepsi calisiyor" sonucu bildirildi |
| Runtime ortami | Onceki Prompt 3 kaydinda belgelenen iPhone 17 Pro Simulator / iOS 26.5 / Expo development build `com.vocbee.app` smoke ortami esas alindi; owner nihai retest onayi acik etkileşimli checklist'i supersede eder |
| Otomatik kanit | 2026-07-14 Prompt 3 kaydindaki ayni production kodu icin `npm run typecheck:all` exit 0; hedefli Jest 5/5 suite ve 19/19 test; full Jest 75/75 suite ve 430/430 test; `npm run test:ci -- --silent` 75/75 suite ve 430/430 test; `npm run test:rules` 1/1 suite ve 8/8 test; `npm run lint` exit 0, 0 error/44 warning; learning domain coverage %100; `git diff --check` exit 0. Production kodu degismedigi ve test scriptleri ayni kaldigi icin bu kanitlar gecerlidir |
| Kapanan risk | Prompt 3 kaydindaki etkileşimli davranis/persistence QA blocker'i owner onayiyla kapandi. Home/Learning refactoru icin acik Kritik/Yuksek blocker kalmadi |
| Worktree hijyeni | Bu kayit production, native, package/lock, Firebase schema/rules veya storage key degisikligi yapmadi; yalnizca append-only ledger guncellendi |
| Sonraki gate | **Prompt 4: acik.** Onceki Prompt 4 `blocked` kaydi implementation icermedigi icin Prompt 4, guncel checkout revalidation'i ile bastan uygulanabilir |

### Prompt 4 — 2026-07-15 superseding completion

Bu kayit, 2026-07-15 21:37 +03 tarihli Prompt 4 `blocked` kaydini; superseding Prompt 3 completion,
Prompt 4 production implementasyonu ve yeni otomatik/runtime kanitlariyla supersede eder. Eski kayit tarihsel
fail-closed handoff kaniti olarak korunur.

| Alan | Kayit |
|---|---|
| Durum | **complete** — Example Sentences/Grammar, Level Test ve Favorites hedef mimariye tasindi; zorunlu kalite gate'leri ve simulator smoke PASS |
| Audit zamani | 2026-07-15 22:26 +03 (Europe/Istanbul) |
| Branch / baslangic HEAD | `refactor` / `c0682221`; baslangic worktree'sinde yalnizca onceki Prompt 4 blocked ve Prompt 3 superseding completion ledger ekleri vardi, production kodunda diff yoktu |
| Branch / bitis HEAD | `refactor` / `c0682221`; agent commit olusturmadi, worktree bu kayitta listelenen Prompt 4 kod/test/dokuman degisikliklerini iceriyor |
| Handoff revalidation | Son Prompt 3 kaydi `complete`, zorunlu otomatik kanitlari PASS, owner manual QA'si PASS ve Prompt 4 gate'i `acik`. `RootNavigator`/`screenRegistry` baslangicta uc root screen'i aktif import ediyor; hedef dosyalar 1.851 satir aktif logic tasiyordu |
| Ekran -> feature mapping | `screens/ExampleSentencesScreen.tsx` -> `src/features/learning/presentation/screens/ExampleSentencesScreen.tsx`; `screens/LevelTestScreen.tsx` -> `src/features/setup/presentation/screens/LevelTestScreen.tsx`; `screens/FavoritesScreen.tsx` -> `src/features/favorites/presentation/screens/FavoritesScreen.tsx` |
| Katman haritasi | Example: `learning/{domain/grammarRules,application/DefaultExampleSentencesFacade,data/{GroqGrammarApiClient,ExpoExampleSentencesPlatformGateway},composition}`; Level Test: `setup/{domain/levelTestRules,application/DefaultLevelTestFacade,data/AsyncStorageLevelTestPreferencesRepository,composition}`; Favorites: `favorites/{application/FavoritesScreenFacade,composition,presentation}` |
| Degisen artifact'ler | Uc root screen ve `services/groqService.ts`; `src/features/learning/{domain,application,data,composition,presentation,index.ts}`; `src/features/setup/{domain,application,data,composition,presentation,index.ts}`; `src/features/favorites/{application,composition,presentation,index.ts}`; `src/app/navigation/RootNavigator.tsx`; `src/devtools/screenRegistry.ts`; ilgili navigation/devtools ve feature testleri; `jest.config.js`; bu ledger |
| Grammar/network facade ozeti | Presentation yalnizca `ExampleSentencesFacade` contract'ini kullanir. Grammar proxy/direct-dev fetch, Firebase ID token header'i, timeout, rate-limit, kalici `@grammar_cache`, parse ve cache logic'i `GroqGrammarApiClient` data adapter'ina; AsyncStorage dil okuma ve `expo-speech` ise `ExpoExampleSentencesPlatformGateway`e alindi. AI prompt metni, proxy payload'i, response parse/error/fallback ve TTS rate/pitch davranisi degistirilmedi |
| Level/Favorites davranisi | Level test 7-soru plani ve yuzde esikleri (`>=80` advanced, `>=50` intermediate, aksi beginner) saf domain kurallarinda; mevcut route-param -> persisted `@native_language`/`@target_language` fallback'i repository arkasinda; sonuc yine `NativeLanguage` route'una `detectedLevel` ile gider. Favorites ekrani list/remove icin public favorites facade'ini kullanir; storage formati ve Prompt 2 Favorites servisi degismedi; toggle akisi mevcut Learning/Home facade public API'sinde kaldi |
| Shim listesi | `screens/{ExampleSentencesScreen,FavoritesScreen,LevelTestScreen}.tsx` birer satirlik public feature re-export shim'i; `services/groqService.ts` 5 satirlik logic-free selective re-export compatibility shim'i. Selective re-export legacy servis testlerinde tum learning barrel'ini eager yuklememek icindir |
| Boyut/boundary kaniti | Root screen'ler 1/1/1, root Groq shim 5 satir. Aktif Example screen 198 (<400), Level Test 377, Favorites 224 satir. Uc presentation screen'de Firebase, AsyncStorage, `expo-speech`, fetch veya root service direct importu 0; production `src/app`/`src/devtools` icinde eski uc root screen importu 0; yeni target feature cross-feature deep importu 0 |
| Runtime importlari | `RootNavigator` ve `screenRegistry`, Favorites'i `@features/favorites`, Example/Home'u `@features/learning`, Level Test'i `@features/setup` public barrel'lerinden aliyor. Ilgili test mocklari ayni public boundary'lere tasindi |
| Coverage/hijyen | `jest.config.js` coverage exclude listesinden uc eski aktif root screen kaldirildi; root shim'ler statement tasimiyor. Full run global coverage: statements %54.95, branches %49.30, functions %50.64, lines %57.37. Jest'in degistirdigi tracked `coverage/**` ve Expo'nun degistirdigi `.expo/devices.json` baslangic icerigine geri alindi; gecici smoke yönlendirmesi geri alindi; Metro durduruldu |
| Test degisimi | Prompt 3 baseline'i 75 suite / 430 test -> 80 suite / 441 test. Yeni facade/domain testleri Example success/error/speech, grammar validation, Level score/question plan/persisted-language fallback/error ve Favorites list/remove'u kapsiyor. Mevcut Groq suite'i proxy success/cache/error/parse/network/auth/payload/fallback'i; Home facade toggle'i; Favorites service add/check/remove/migration/sync'i kapsiyor |
| Hedefli test kaniti | `npm test -- --runInBand --runTestsByPath services/__tests__/groqService.test.ts src/features/learning/application/__tests__/DefaultExampleSentencesFacade.test.ts src/features/learning/domain/__tests__/grammarRules.test.ts src/features/setup/domain/__tests__/levelTestRules.test.ts src/features/setup/application/__tests__/DefaultLevelTestFacade.test.ts src/features/favorites/application/__tests__/FavoritesScreenFacade.test.ts src/features/favorites/application/__tests__/DefaultFavoritesService.test.ts src/features/learning/application/__tests__/HomeFacade.test.ts src/app/navigation/__tests__/RootNavigator.test.tsx src/devtools/__tests__/screenRegistry.test.ts src/devtools/__tests__/DevToolsRoot.test.tsx --silent` exit 0, 11/11 suite ve 37/37 test |
| Otomatik kanit | `npm run typecheck` exit 0; `npm run typecheck:all` exit 0 (app/test/rules/worker); `npm test -- --runInBand --silent` exit 0, 80/80 suite ve 441/441 test; `npm run test:ci -- --silent` exit 0, 80/80 suite ve 441/441 test; `npm run lint` exit 0, 0 error/39 warning; `npm run test:rules` exit 0, gercek Firestore emulator ile 1/1 suite ve 8/8 test; final `git diff --check` exit 0. Projede `prettier:check` scripti yok; calistirilmadi ve PASS sayilmadi |
| Simulator/manual smoke | **PASS — Prompt 4 ekran kapsami:** iPhone 17 Pro Simulator / iOS 26.5 / Expo development build `com.vocbee.app`; bu checkout'tan 1956 modullu bundle crash/red screen olmadan MainTabs ve DevTools'a ulasti. Gercek provider/navigation zincirinde Level Test soru/cevap UI'i, Favorites empty state ve `hello`/`merhaba` ornek parametreleriyle Example Sentences/TTS/grammar CTA ekrani ayri ayri render edildi. Veri silen favorites/level aksiyonu calistirilmadi; list/remove/toggle, scoring/persistence, speech ve grammar success/error etkileşimleri yukaridaki testlerle kanitlandi. Prompt 3 owner QA'sindaki grammar-examples davranis onayi ayni checkout tabani icin korunuyor |
| Kalan risk | Prompt 4 sahibi acik Kritik/Yuksek risk yok. Development bundle, tasarim geregi app.json production proxy fallback'ini kullanmaz; canli grammar round-trip'i icin dev env gerekir. Production `extra.grammarProxyUrl` aynen korunuyor ve proxy/auth/error kontrati testlerde kapsaniyor. RevenueCat/AdMob simulator uyarilari bu refactordan bagimsiz operasyonel konfigürasyon izlemesidir |
| Worktree hijyeni | `ios/`, package/lock, Firebase schema/rules, AI prompt, storage key ve favorite payload formati degistirilmedi. User/owner degisiklikleri korunuyor; coverage/Expo test artifact'i veya gecici simulator yonlendirmesi teslim edilmiyor |
| Sonraki gate | **Prompt 5: acik.** Prompt 4 implementation, zorunlu/ek otomatik kontroller ve hedef ekran simulator smoke'u complete/PASS |
