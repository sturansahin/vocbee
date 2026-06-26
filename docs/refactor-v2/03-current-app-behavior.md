# 03 — Mevcut Uygulama Davranışı (Değişmez Sözleşme)

Bu doküman, refactor sırasında "davranış değişti mi?" sorusunun referansıdır. Her madde, ilgili kaynak
dosyaya dayanmaktadır. Refactor sonrası bu davranışlar **birebir** korunmalıdır.

## 1. İlk açılış / bootstrap (`App.tsx`)
- Splash görünür; fontlar ve init işleri yüklenir.
- `@VocBee:hasSeenOnboarding` okunur → yoksa Onboarding akışı, varsa Auth/Home yönlendirmesi.
- Provider zinciri: Theme → (Alert) → Auth → Monetization → ErrorBoundary → Navigation.
- Lifecycle görevleri App.tsx içinde: AdMob init, app-open ad kontrolü, notification maintenance/refill,
  review app-launch kaydı, AppState (foreground/background zaman damgaları), sync tetikleme.

## 2. Onboarding / Setup
- Onboarding (`screens/OnboardingScreen.tsx`, 361) tanıtım slaytları; bitişte `hasSeenOnboarding=true`.
- Setup (`screens/SetupScreens.tsx`, 1240): ana dil + hedef dil + seviye seçimi; `setupCompleted` işaretlenir.
  Tercihler hem local (`@native_language`, `@target_language`, `@user_level`) hem profil/Firestore'a yazılır.
- LevelTest (`screens/LevelTestScreen.tsx`, 485) opsiyonel seviye belirleme.

## 3. Auth / Login (`context/AuthContext.tsx`, `screens/AuthScreens.tsx`, `screens/ForgotPasswordScreen.tsx`)
- Email/parola + Google (native, `services/nativeGoogleSignIn.ts`) + Apple (`expo-apple-authentication`).
- **Cache-first**: profil önce local cache'ten (`profile_${uid}`) okunur, sonra Firestore'dan tazelenir.
- Device-id (`@vocbee_device_id`) kontrolü: başka cihazdan giriş sync çakışmasını yönetir (`lastActiveDeviceId`).
- Şifre sıfırlama email'i `ForgotPasswordScreen` üzerinden.

## 4. Home / kelime öğrenme akışı (`screens/HomeScreen.tsx`, 2391)
- Aktif seviye için local vocabulary yüklenir (`vocabularyService`).
- Kelime kartı gösterilir; shuffle sırası `@shuffle_order_${level}` ile saklanır.
- Kullanıcı "öğrendim" işaretleyince `progressService` üzerinden `learnedWords[level]`'e eklenir,
  `lastWordIndex` güncellenir, sync gerekli işaretlenir (`@vocbee_needs_sync`).
- Streak (`streakService`) günlük nitelikli aktiviteye göre güncellenir; kutlama overlay tetiklenebilir.
- Öğrenme aralıklarında interstitial/banner reklam (free kullanıcı).
- Home tutorial (`HomeTutorialOverlay`) ilk kez (`@VocBee:hasSeenHomeTutorial`).

## 5. Progress hesabı (`services/progressService.ts`, 301)
- Seviye bazlı öğrenilen kelime sayısı / toplam kelime; yüzde ve "learnedCount" üretir.
- `lastWordIndex` ile kaldığı yerden devam.

## 6. Level geçişi
- Bir seviyedeki kelimeler tamamlanınca / eşik aşılınca bir sonraki CEFR seviyesi (A1→A2→B1→B2→C1) açılır;
  `progress.currentLevel` güncellenir.

## 7. Favorites (`services/favoritesService.ts`, 312)
- Kelime favorilenir; local `@favorites_${uid}` + Firestore `favorites` dizisi (maks 1000).
- `syncFavoritesToFirebaseForUser` ve `clearFavoritesOnFirebase` doğrudan Firestore'a yazar.

## 8. Streak (`services/streakService.ts`, 349)
- `currentStreak`, `longestStreak`, `brokenStreak`, `lastQualifiedDay/At`.
- Günlük nitelikli aktivite streak'i artırır; kaçırılan gün sıfırlar.

## 9. Bildirimler (`services/notificationService.ts`, 1355)
- Permission istemi (kullanıcı başına bir kez, `@notification_permission_prompted_${uid}`).
- Zamanlama: gün içi pencere (start/end saat) + `frequencyMinutes` (60/120/180/360/1440).
- En fazla 64 zamanlanmış bildirim; 1 slot streak hatırlatıcı için rezerve.
- İçerik versiyonu (`@notification_content_version` = 4) değişirse yeniden planlama.
- Bildirime tıklayınca pending word (`@pending_notification_word`) ile ilgili kelime/ekrana gider.
- Foreground/background zaman damgaları (`@last_foreground_time`, `@last_background_time`) ile bakım.

## 10. Offline / online
- Local-first: vocabulary ve progress local'de çalışır; çevrimiçi olunca sync.
- `@vocbee_needs_sync` bayrağı + günlük/5-dk debounce ile Firestore sync (`SyncService`).

## 11. Local vocabulary okuma (`services/vocabularyService.ts`)
- `assets/vocabulary/{lang}_{level}.txt` (JSON içerik) map'ten okunur; merge + `VOCABULARY_SCHEMA_VERSION=2`
  ile cache'lenir (`@vocabulary_`, `@vocabulary_schema_version`).

## 12. Firestore sync (`services/SyncService.ts`, 434)
- Cache-first oku; device-id kontrolü; `syncMeta` ile copy-verify; progress/profile/favorites/notif/streak
  birlikte senkronize.

## 13. Premium / ads / revenue (`context/MonetizationContext.tsx`, `services/revenueCatService.ts`, `adMobService.ts`)
- RevenueCat `premium` entitlement aktifse reklamlar gizlenir; paywall satın alma sonrası güncellenir.
- AdMob: consent (UMP) + ATT + banner/interstitial/app-open. Free kullanıcıya gösterilir.

## 14. Settings (`screens/SettingsScreen.tsx`, 2310)
- Profil düzenleme, dil/seviye değiştirme, bildirim ayarları, premium/paywall, dil değiştirme,
  hesap silme, çıkış, (varsa) ilerleme sıfırlama.

## 15. Hesap silme / logout / reset
- Logout: auth oturumu kapatılır, cache temizlenir.
- Hesap silme: recent-auth (5 dk) gerektiren Vercel `api/deleteAccount.js` (firebase-admin) çağrısı;
  `AuthContext` ayrıca `deleteDoc(users/{uid})` yapar.

## 16. App review prompt (`services/reviewPromptService.ts`, 375, `components/AppRatingPrompt.tsx`)
- Uygulama açılış sayısı/olumlu sinyal eşiğine göre native review istemi; durum `@VocBee:appReviewPromptState`.

## 17. Grammar (ExampleSentences) (`screens/ExampleSentencesScreen.tsx`, `services/groqService.ts`)
- Örnek cümleler Vercel `api/grammarProxy.js` (Groq) üzerinden; token doğrulama + rate limit; cache `@grammar_cache`.

## Korunması zorunlu değişmezler
- Tüm storage key string'leri (`storageKeys.ts`).
- Firestore payload şeklinin `firestore.rules` ile uyumu.
- 64-bildirim limiti ve streak rezervasyonu.
- RevenueCat `premium` entitlement adı.
- Device-id tabanlı sync çakışma çözümü.
