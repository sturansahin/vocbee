# 04 — Feature Sınırları

## Amaç
Varsayım yerine gerçek koddan türetilmiş feature listesini ve her feature'ın hangi mevcut dosyalardan
oluşacağını netleştirmek.

## Feature haritası (mevcut dosya → hedef feature)

### `onboarding`
- presentation: `screens/OnboardingScreen.tsx`
- data: `@VocBee:hasSeenOnboarding` (shared/storage üzerinden)

### `setup`
- presentation: `screens/SetupScreens.tsx` (step'lere bölünecek), `screens/LevelTestScreen.tsx`
- application: setup tamamlama use-case'i (`completeSetup`)
- domain: seviye/dil doğrulama kuralları (CEFR, 21 dil listesi)
- data: preferences repository (local + Firestore)

### `auth` (profile dahil)
- presentation: `screens/AuthScreens.tsx`, `screens/ForgotPasswordScreen.tsx`, profil düzenleme parçası
- application: `signIn`, `signUp`, `signOut`, `deleteAccount`, `loadProfile`, `syncProfile`
- domain: profil/auth tipleri, recent-auth kuralı
- data: `services/socialAuthProfile.ts`, `services/nativeGoogleSignIn.ts`, `config/googleAuthConfig.ts`,
  auth repository (Firebase Auth), profile repository (Firestore + `profile_${uid}` cache)
- **Not:** `profile` ayrı feature değil; auth state'e sıkı bağlı olduğu için `auth/` içinde alt modül.

### `learning` (home + word card + example sentences)
- presentation: `screens/HomeScreen.tsx`, `screens/ExampleSentencesScreen.tsx`,
  `components/VocabularyCardHeader.tsx`, `components/HomeHeader.tsx`, `components/HomeTutorialOverlay.tsx`
- application: `startLesson`, `completeWord`, `nextWord`, `loadGrammarExamples`
- domain: kelime seçim/shuffle kuralları, level geçiş kuralı
- data: vocabulary repository, grammar API client (`groqService`), shuffle cache

### `vocabulary`
- application/data: `services/vocabularyService.ts` (asset registry, merge, schema migration)
- domain: vocabulary tipleri (`types.ts`'ten), schema-version sabiti
- **Not:** `learning` tarafından tüketilir; adımı ile birleşmez çünkü 105 asset yönetimi bağımsız.

### `progress`
- application/data: `services/progressService.ts`
- domain: yüzde/learnedCount/level-completion saf hesapları

### `favorites`
- application/data: `services/favoritesService.ts`
- domain: favori limiti (1000) kuralı

### `streak`
- presentation: `components/StreakChip.tsx`, `StreakCelebrationOverlay.tsx`, `StreakAlertContent.tsx`
- application/data: `services/streakService.ts`
- domain: streak normalize/qualify kuralları; `utils/streakCelebration.ts`

### `notifications`
- application/data: `services/notificationService.ts` (bölünecek), `services/notificationFrequency.ts`
- domain: frequency/scheduling saf hesapları (64-slot, pencere)

### `settings`
- presentation: `screens/SettingsScreen.tsx` (section'lara bölünecek)
- application: ayar güncelleme use-case'leri (diğer feature application'larını çağırır)

### `monetization` (ads + premium)
- presentation: `components/SafeBannerAd.tsx`, `components/AppRatingPrompt.tsx`(review ile sınır)
- application/data: `context/MonetizationContext.tsx`, `services/revenueCatService.ts`, `services/adMobService.ts`,
  `services/adMobService.web.ts`
- domain: premium/free gating kuralları

### `review` (appReview)
- application/data: `services/reviewPromptService.ts`
- presentation: `components/AppRatingPrompt.tsx`
- domain: review eşik kuralı

## `shared` (feature değil)
- `shared/ui`: `components/UIComponents.tsx`, `CustomAlert.tsx`, `OfflineNotice.tsx`,
  `ConnectionErrorScreen.tsx`, `AnimatedCountUp.tsx`, `SwarmLogo.tsx`, `ErrorBoundary.tsx`
- `shared/theme`: `context/ThemeContext.tsx`, `utils/typography.ts`
- `shared/storage`: `services/storageKeys.ts`, `services/storage.ts`
- `shared/firebase`: `config/firebase.ts`
- `shared/i18n`: `services/i18n.ts`, `locales/*`, `utils/rtl.ts`
- `shared/utils`: `utils/profileAvatar.ts`, diğer saf yardımcılar
- `shared/errors`: yeni `AppError` tipleri (Clean Code error standardı, `06`)
- `shared/types`: `types.ts` içindeki çapraz tipler

## `app` (bootstrap)
- `App.tsx` → `app/bootstrap`, `app/providers`, `app/navigation`, `app/lifecycle`, `app/config`

## Sınır kuralları
- Feature'lar birbirine yalnızca `index.ts` barrel'dan erişir.
- `settings` ve `learning` diğer feature application'larını tüketebilir; ters bağımlılık yasak.
- Ortak UI → `shared/ui`; bir component yalnızca tek feature'da kullanılıyorsa o feature'da kalır.

## Tartışmalı sınırlar (karar)
- **ads vs premium:** ortak `MonetizationContext` nedeniyle tek feature.
- **sync:** feature değil; her feature'ın repository'si + `app/lifecycle` + bir `syncOrchestrator`.
- **profile:** `auth` içinde.
- **grammar:** `learning` içinde alt modül (tek ekran tüketiyor).
