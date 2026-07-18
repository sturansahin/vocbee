# Prompt 7 — Root Module Inventory

Bu envanter Prompt 7 sonunda source-of-truth kod taramasından yeniden üretilmiştir. Test dosyaları kapsam
dışıdır. `components`, `config`, `context`, `screens`, `services` ve `utils` altındaki 47 production dosyasının
tamamı ile root entry/support dosyaları (`App.tsx`, `constants.ts`, `types.ts`) sınıflandırılmıştır.

## Sonuç

- Toplam: **50 production dosyası / 160 satır**
- `shim`: **50**
- `logic`, `wrapper`, `unused`: **0**
- Altı legacy dizin: **47 dosya / 140 satır**; Prompt 7 başındaki aynı dosyalar **3.391 satırdı**
- Owner veya hedef path'i olmayan dosya: **0**

## Dosya bazlı envanter

| Root dosya | Sınıf | Owner | Aktif implementation / kontrat hedefi |
|---|---|---|---|
| `App.tsx` | shim | app bootstrap | `src/app/App.tsx` |
| `constants.ts` | shim | shared theme/i18n | `src/shared/theme/colors.ts`, `src/shared/i18n/appOptions.ts` |
| `types.ts` | shim | app navigation | `src/app/navigation/types.ts` |
| `components/AnimatedCountUp.tsx` | shim | streak | `src/features/streak/presentation/components/AnimatedCountUp.tsx` |
| `components/AppRatingPrompt.tsx` | shim | review | `src/features/review/presentation/AppRatingPrompt.tsx` |
| `components/ConnectionErrorScreen.tsx` | shim | app presentation | `src/app/presentation/ConnectionErrorScreen.tsx` |
| `components/CustomAlert.tsx` | shim | shared UI | `src/shared/ui/CustomAlert.tsx` |
| `components/ErrorBoundary.tsx` | shim | shared UI | `src/shared/ui/ErrorBoundary.tsx` |
| `components/HomeHeader.tsx` | shim | home | `src/features/home/presentation/components/HomeHeader.tsx` |
| `components/HomeTutorialOverlay.tsx` | shim | home | `src/features/home/presentation/components/HomeTutorialOverlay.tsx` |
| `components/OfflineNotice.tsx` | shim | shared UI | `src/shared/ui/OfflineNotice.tsx` |
| `components/SafeBannerAd.tsx` | shim | monetization | `src/features/monetization/presentation/SafeBannerAd.tsx` |
| `components/StreakAlertContent.tsx` | shim | streak | `src/features/streak/presentation/components/StreakAlertContent.tsx` |
| `components/StreakCelebrationOverlay.tsx` | shim | streak | `src/features/streak/presentation/components/StreakCelebrationOverlay.tsx` |
| `components/StreakChip.tsx` | shim | streak | `src/features/streak/presentation/components/StreakChip.tsx` |
| `components/SwarmLogo.tsx` | shim | shared UI | `src/shared/ui/SwarmLogo.tsx` |
| `components/UIComponents.tsx` | shim | shared UI | `src/shared/ui/UIComponents.tsx` |
| `components/VocabularyCardHeader.tsx` | shim | home | `src/features/home/presentation/components/VocabularyCardHeader.tsx` |
| `config/firebase.ts` | shim | shared Firebase | `src/shared/firebase/firebase.ts` |
| `context/AuthContext.tsx` | shim | auth | `src/features/auth/composition/AuthProvider.tsx`, `src/features/auth/presentation/AuthProvider.tsx` |
| `context/ThemeContext.tsx` | shim | shared theme | `src/shared/theme/ThemeContext.tsx` |
| `screens/AuthScreens.tsx` | shim | auth | `src/features/auth/composition/AuthScreens.tsx` |
| `screens/ExampleSentencesScreen.tsx` | shim | learning | `src/features/learning/composition/LearningExampleSentencesScreen.tsx` |
| `screens/FavoritesScreen.tsx` | shim | favorites | `src/features/favorites/composition/FavoritesScreen.tsx` |
| `screens/ForgotPasswordScreen.tsx` | shim | auth | `src/features/auth/presentation/screens/ForgotPasswordScreen.tsx` |
| `screens/HomeScreen.tsx` | shim | learning | `src/features/learning/composition/LearningHomeScreen.tsx` |
| `screens/LevelTestScreen.tsx` | shim | setup | `src/features/setup/composition/SetupLevelTestScreen.tsx` |
| `screens/OnboardingScreen.tsx` | shim | onboarding | `src/features/onboarding/composition/OnboardingScreen.tsx` |
| `screens/SettingsScreen.tsx` | shim | settings | `src/features/settings/composition/SettingsScreen.tsx` |
| `screens/SetupScreens.tsx` | shim | setup | `src/features/setup/composition/SetupScreen.tsx` |
| `screens/SplashScreen.tsx` | shim | app presentation | `src/app/presentation/SplashScreen.tsx` |
| `services/SyncService.ts` | shim | sync | `src/features/sync/composition/syncService.ts` |
| `services/adMobService.ts` | shim | monetization | `src/features/monetization/composition/adMobService.ts` |
| `services/adMobService.web.ts` | shim | monetization | `src/features/monetization/composition/adMobService.ts` + platform repository |
| `services/favoritesService.ts` | shim | favorites | `src/features/favorites/composition/favoritesService.ts` |
| `services/googleAuthConfig.ts` | shim | auth | `src/features/auth/data/providers/googleAuthConfig.ts` |
| `services/groqService.ts` | shim | learning | `src/features/learning/composition/grammarService.ts` |
| `services/i18n.ts` | shim | shared i18n | `src/shared/i18n/i18n.ts` |
| `services/nativeGoogleSignIn.ts` | shim | auth | `src/features/auth/data/providers/nativeGoogleSignIn.ts` |
| `services/notificationFrequency.ts` | shim | notifications | `src/features/notifications/domain/constants.ts`, `rules.ts`, `types.ts` |
| `services/notificationService.ts` | shim | notifications | `src/features/notifications/composition/notificationService.ts` |
| `services/progressService.ts` | shim | progress | `src/features/progress/composition/progressService.ts` |
| `services/reviewPromptService.ts` | shim | review | `src/features/review/composition/reviewPromptService.ts` |
| `services/socialAuthProfile.ts` | shim | profile | `src/features/profile/domain/profileRules.ts` |
| `services/streakService.ts` | shim | streak | `src/features/streak/composition/streakService.ts` |
| `services/vocabularyService.ts` | shim | vocabulary | `src/features/vocabulary/composition/vocabularyService.ts` |
| `utils/profileAvatar.ts` | shim | shared utils | `src/shared/utils/profileAvatar.ts` |
| `utils/rtl.ts` | shim | shared i18n | `src/shared/i18n/rtl.ts` |
| `utils/streakCelebration.ts` | shim | learning | `src/features/learning/domain/rules.ts` |
| `utils/typography.ts` | shim | shared theme | `src/shared/theme/typography.ts` |

## Shared ve feature yerleşimi

| Alan | Ana hedefler |
|---|---|
| Shared UI | `src/shared/ui/{CustomAlert,ErrorBoundary,OfflineNotice,SwarmLogo,UIComponents}.tsx` |
| Shared theme | `src/shared/theme/{ThemeContext,colors,typography}` |
| Shared i18n | `src/shared/i18n/{i18n,rtl,appOptions}` |
| Shared platform helpers | `src/shared/firebase/firebase.ts`, `src/shared/utils/profileAvatar.ts` |
| App presentation/contracts | `src/app/presentation/*`, `src/app/navigation/types.ts` |
| Feature presentation | `src/features/{home,streak,review,monetization}/presentation/**` |

## Public barrel durumu

`src/features` altındaki 15 feature'ın tamamında `index.ts` vardır:
`auth`, `favorites`, `home`, `learning`, `monetization`, `notifications`, `onboarding`, `profile`,
`progress`, `review`, `settings`, `setup`, `streak`, `sync`, `vocabulary`.

Barrel'lar stable domain/application/presentation/composition API'lerini ve gerekli repository
**interface**'lerini export eder. Firebase/Firestore/AdMob/RevenueCat repository implementasyonları, DTO'lar ve
adapter implementasyonları public barrel'lardan export edilmez.
