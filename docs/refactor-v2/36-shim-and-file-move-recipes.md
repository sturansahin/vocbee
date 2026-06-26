# 36 — Shim & File-Move Recipes (Shim ve Dosya Taşıma Reçeteleri)

> Bu bir **implementation-spec**tir. Tüm kod blokları **örnek/skeleton**dır; gerçek implementasyon değildir.
> Kaynak kod bu görevde değiştirilmemiştir. Export biçimleri (default/named) gerçek dosyalardan doğrulanmıştır.

## 1. Shim nedir?
Shim = bir dosya yeni konumuna taşındıktan sonra **eski yolun yerinde bırakılan re-export köprüsü**. Eski yola yapılan
tüm import'lar (henüz güncellenmemiş ekranlar/testler) çalışmaya devam eder; gerçek kod tek yerde (yeni konumda) yaşar.

## 2. Ne zaman kullanılır?
- Büyük bir dosya `src/features/...`'a taşınırken, onu import eden çok sayıda dosya varken (devasa diff'i önlemek).
- Kademeli geçişte: önce hedef dosya oluşturulur, eski yol shim'e döner, import'lar PR'lar boyunca yavaşça güncellenir.

## 3. Ne zaman kaldırılır?
- O dosyaya yapılan **tüm import'lar** yeni alias yoluna (`@features/...`, `@shared/...`) çevrildikten ve
  `npm run typecheck` + `npm run test:ci` yeşil olduktan sonra.
- Toplu shim temizliği **Phase 9 / `29`**'da yapılır (eski kök `screens/`, `services/`, `context/` boşalır).

## 4. Eski import path nasıl korunur? (re-export desenleri)
*Skeleton/contract — implementasyon değil. Desen, dosyanın export biçimine göre seçilir.*

```ts
// (a) NAMED export'lu modül (ör. services/progressService.ts → çok sayıda named fn)
export * from '@features/progress/application/progressService';

// (b) DEFAULT export'lu modül (ör. screens/SettingsScreen.tsx)
export { default } from '@features/settings/presentation/screens/SettingsScreen';

// (c) DEFAULT + NAMED birlikte (ör. screens/HomeScreen.tsx: default + getTutorialSwipeNextStep)
export { default } from '@features/learning/presentation/screens/HomeScreen';
export * from '@features/learning/presentation/screens/HomeScreen';

// (d) Seçici re-export (yalnızca dış API'yi sızdır, iç sembolleri gizle)
export { AuthProvider, useAuth, getAuthErrorMessage } from '@features/auth';
```

## 5. Kademeli taşımada nasıl kullanılır? (4 adım — her dosya için)
```text
1. Hedef dosyayı yeni konumda oluştur (gerçek kod buraya).
2. Eski dosyayı re-export shim yap (yukarıdaki uygun desen).
3. Import'ları kademeli güncelle (PR'lar boyunca eski yol → @features/@shared).
4. Tüm import'lar yeni yola geçince + testler yeşilken shim'i kaldır (Phase 9).
```

## 6. Hangi eski dosyalar shim'e dönüşebilir? (gerçek export biçimleriyle)
| Eski dosya | Export biçimi (gerçek) | Shim deseni |
|---|---|---|
| `services/progressService.ts` | named (çok fonksiyon) | (a) `export *` |
| `services/vocabularyService.ts` | named + tip | (a) `export *` |
| `services/favoritesService.ts` | named | (a) `export *` |
| `services/SyncService.ts` | named | (a) `export *` |
| `services/notificationService.ts` | named | (a) `export *` |
| `services/streakService.ts` | named | (a) `export *` |
| `services/storageKeys.ts` | named `STORAGE_KEYS` | (a) `export *` → `@shared/storage` |
| `context/AuthContext.tsx` | named (`AuthProvider`,`useAuth`,`getAuthErrorMessage`) | (d) seçici |
| `context/MonetizationContext.tsx` | named (`MonetizationProvider`,`useMonetization`) | (d) seçici |
| `screens/HomeScreen.tsx` | **default** + named `getTutorialSwipeNextStep` | (c) default+named |
| `screens/SettingsScreen.tsx` | **default** | (b) default |
| `screens/ExampleSentencesScreen.tsx` | **default** | (b) default |
| `screens/OnboardingScreen.tsx` | **default** | (b) default |
| `screens/SetupScreens.tsx` | **named** (`SetupScreen`,`NativeLanguageScreen`) | (a) `export *` |
| `screens/AuthScreens.tsx` | **named** (`LoginScreen`,`SignUpScreen`) | (a) `export *` |

> Not: `screens/SetupScreens.tsx` ve `AuthScreens.tsx` **default export yok**; shim'de `export { default }` KULLANMA → `export *`.
> `screens/HomeScreen.tsx` hem default hem named (`getTutorialSwipeNextStep`, `HomeScreen.test.tsx` bunu test ediyor) → ikisini de re-export et.

## 7. Büyük dosya taşıma reçeteleri (tek tek)

### 7.1 `screens/HomeScreen.tsx` (2391) → `learning`
```text
Eski dosya:   screens/HomeScreen.tsx           (default HomeScreen + named getTutorialSwipeNextStep)
Hedef:        src/features/learning/presentation/screens/HomeScreen.tsx
Çıkan parçalar (Phase 5 / PR'lar — 39):
  - getTutorialSwipeNextStep → features/learning/domain/rules.ts (saf, zaten test'li)
  - kelime akışı/seçim/shuffle → useLesson hook + domain rules
  - progress yazımı → ProgressRepository (35 §3)
  - reklam aralığı → monetization facade (35 §9)
Geçici shim: screens/HomeScreen.tsx → desen (c) default+named
Strateji:    1) domain rule + hook + repo çıkar  2) HomeScreen'i kompozisyona indir  3) shim  4) import güncelle  5) shim sil
```
*Skeleton/contract — implementasyon değil.*
```ts
// screens/HomeScreen.tsx (shim) — SKELETON
export { default } from '@features/learning/presentation/screens/HomeScreen';
export * from '@features/learning/presentation/screens/HomeScreen';   // getTutorialSwipeNextStep
```

### 7.2 `screens/SettingsScreen.tsx` (2310) → `settings`
```text
Hedef:  src/features/settings/presentation/screens/SettingsScreen.tsx
Çıkan section'lar: ProfileSection, LanguageSection, NotificationSection, PremiumSection, AccountSection (27)
Önemli: stale/doğrudan Firestore import'ları kaldırılır → SettingsRepository / UserProfileRepository (35 §7/§2)
Geçici shim: desen (b) default
```
```ts
// screens/SettingsScreen.tsx (shim) — SKELETON
export { default } from '@features/settings/presentation/screens/SettingsScreen';
```

### 7.3 `screens/SetupScreens.tsx` (1240) → `setup`
```text
Hedef:  src/features/setup/presentation/screens/SetupScreen.tsx (+ steps/)
Gerçek export: SetupScreen (const) + NativeLanguageScreen = SetupScreen → ikisi de korunmalı
Önemli: doğrudan Firestore yazımı → UserProfileRepository.saveProfile (10/13/27)
Geçici shim: desen (a) export *  (default YOK)
```
```ts
// screens/SetupScreens.tsx (shim) — SKELETON
export * from '@features/setup/presentation/screens/SetupScreen';   // SetupScreen + NativeLanguageScreen
```

### 7.4 `screens/AuthScreens.tsx` (876) → `auth`
```text
Hedef:  src/features/auth/presentation/screens/{LoginScreen,SignUpScreen}.tsx
Gerçek export: LoginScreen, SignUpScreen (named) → default YOK
Geçici shim: desen (a) export *
```
```ts
// screens/AuthScreens.tsx (shim) — SKELETON
export * from '@features/auth/presentation/screens/AuthScreens';   // LoginScreen, SignUpScreen
```

### 7.5 `context/AuthContext.tsx` (780) → `auth`
```text
Hedef:  src/features/auth/presentation/AuthProvider.tsx (ince state) + application/AuthFacade + use-case'ler
Çıkan: AuthRepository, UserProfileRepository, SyncOrchestrator (35 §1/§2/§8), provider Factory (10/24)
Korunan davranış: cache-first profil, device-id, recent-auth 5dk, deleteDoc(users/{uid}), notificationSettings
Gerçek export: AuthProvider, useAuth, getAuthErrorMessage (named) → seçici shim (d)
```
```ts
// context/AuthContext.tsx (shim) — SKELETON
export { AuthProvider, useAuth, getAuthErrorMessage } from '@features/auth';
```

### 7.6 `services/notificationService.ts` (1355) → `notifications`
```text
Hedef:  4 arayüz (35 §6) + application/NotificationFacade + domain/rules(scheduling) + domain/constants
Korunan: 64-slot + 1 streak rezerv, NOTIFICATION_CONTENT_VERSION=4, tek-kez permission, pending word, storage key'leri
Gerçek export: named (~48 sembol) → export * shim; tüketiciler (App.tsx/lifecycle) facade'a yönlendirilir
```
```ts
// services/notificationService.ts (shim) — SKELETON
export * from '@features/notifications';   // facade + korunan public fonksiyonlar barrel'dan
```

### 7.7 `services/progressService.ts` (301) → `progress`
```text
Hedef:  application/progressService (local-first) + data/repositories(ProgressRepository) + domain/rules(percent/levelCompletion)
Korunan: @user_progress / @current_level / @last_word_id key'leri; learnedWords mantığı; level A1→C1 geçişi
Gerçek export: named → export * shim
```
```ts
// services/progressService.ts (shim) — SKELETON
export * from '@features/progress';
```

### 7.8 `services/vocabularyService.ts` (547) → `vocabulary`
```text
Hedef:  data/repositories(AssetVocabularyRepository) + data/adapters(wordAdapter) + domain(types/constants VOCABULARY_SCHEMA_VERSION=2)
Korunan: @vocabulary_* cache key'leri; .txt asset registry (105 dosya); merge + schema migration
Gerçek export: named (Level, LEVELS, VocabularyWord, getStoredVocabulary...) → export * shim
```
```ts
// services/vocabularyService.ts (shim) — SKELETON
export * from '@features/vocabulary';
```

### 7.9 `services/favoritesService.ts` (312) → `favorites`
```text
Hedef:  data/repositories(FavoritesRepository) + domain(limit 1000 kuralı, FavoriteItem)
Korunan: @favorites_${uid} key; Firestore favorites array; syncMeta; legacy number[] migration
Gerçek export: named → export * shim. Doğrudan doc/setDoc/getDoc/serverTimestamp repo'ya kapsüllenir
```
```ts
// services/favoritesService.ts (shim) — SKELETON
export * from '@features/favorites';
```

### 7.10 `services/SyncService.ts` (434) → `auth` (sync)
```text
Hedef:  application/SyncOrchestrator + data/SyncRepository (35 §8); domain CRUD feature repo'larına dağıtılır
Korunan: shouldSync debounce, getActiveDeviceIdFromFirebase, syncMeta copy-verify, son-yazan kuralı
Gerçek export: named (shouldSync, syncToFirestore, forceSync, createUserDocument, fetchAndSaveUserData,
               syncAuthProfileToFirestore, syncNotificationSettingsToFirestore) → export * shim
```
```ts
// services/SyncService.ts (shim) — SKELETON
export * from '@features/auth/application/sync';
```

## 8. Shim hijyeni kuralları (binding)
- Shim dosyası **yalnızca re-export** içerir; iş mantığı barındırmaz.
- Shim'de yeni davranış eklenmez (davranış sözleşmesi `03`).
- Her shim için PR açıklamasında "kaldırılacağı faz: Phase 9" notu.
- `import/no-cycle` ihlali yaratan shim (barrel↔shim döngüsü) eklenmez (`33`/`38`).
- Bir dosya taşındıktan sonra **import sayacı** (grep eski yolu) PR'larda azalmalı; 0'a inince shim silinir.

## 9. Kabul kriterleri
- Her büyük dosya taşımasında eski yol shim ile çalışıyor; `npm run typecheck` + `npm run test:ci` yeşil.
- Shim deseni dosyanın gerçek export biçimine uygun (default/named/karışık).
- Phase 9 sonunda kökte shim kalmadı; tüm import'lar `@features`/`@shared`/`@app`.

## İlgili dokümanlar
`05` (taşıma stratejisi), `21`–`29` (faz taşıma listeleri), `33` (import sınırı), `38` (alias), `39` (PR breakdown).
