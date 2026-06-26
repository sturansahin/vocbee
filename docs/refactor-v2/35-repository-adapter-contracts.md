# 35 — Repository & Adapter Contracts

> Bu bir **implementation-spec**tir. Tüm kod blokları **örnek/contract/skeleton**dır; gerçek implementasyon değildir.
> Kaynak kod bu görevde değiştirilmemiştir. Interface'ler gerçek servis fonksiyonlarına (`services/*`) dayanır.

## 0. Genel sözleşme kuralları (binding)
- **Interface domain veya `data/contracts.ts`'te** tanımlanır (saf tip). **Implementasyon `data/repositories/`'te**.
- `application`/`presentation` yalnızca **interface**'e bağımlıdır (DIP, `06`/`33`).
- **Adapter `data/`'dadır**; domain modeli Firestore DTO'ya bağımlı olmaz; **screen DTO bilmez**.
- Repository **>1 tüketici / gerçek SDK sınırı** olduğunda açılır; trivial wrapper yazılmaz (`06`/`18` over-engineering).
- Tarih/`Timestamp` yalnızca DTO+adapter'da; domain `string|number` taşır (`34`).

## 1. AuthRepository
1. **Sorumluluk:** Firebase Auth oturum işlemleri (email/Google/Apple), parola sıfırlama, hesap silme (auth tarafı).
2. **Veri kaynağı:** `config/firebase.ts → auth`, `services/nativeGoogleSignIn.ts`, `expo-apple-authentication`.
3. **Kullanılmaması gereken yer:** presentation/domain. Firestore profil **yazmaz** (o `UserProfileRepository`).
4. **Interface skeleton** — *Skeleton/contract — implementasyon değil.*
```ts
// features/auth/data/contracts.ts — SKELETON
export interface AuthRepository {
  getCurrentUser(): AuthUser | null;
  onAuthStateChanged(cb: (user: AuthUser | null) => void): () => void;   // unsubscribe döner
  signUpWithEmail(email: string, password: string, displayName?: string): Promise<AuthUser>;
  signInWithEmail(email: string, password: string): Promise<AuthUser>;
  signInWithGoogle(): Promise<AuthUser>;          // nativeGoogleSignIn.signInWithNativeGoogle sarmalar
  signInWithApple(): Promise<AuthUser>;
  signOut(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  deleteAuthUser(): Promise<void>;                // deleteUser; recent-auth kuralı domain'de (recentAuth)
  getLastSignInTimeMs(): number | null;           // RECENT_LOGIN_WINDOW_MS=5dk kontrolü için
}
export type AuthUser = { uid: string; email: string | null; displayName: string | null; photoURL: string | null };
```
5. **Implementasyon nerede:** `features/auth/data/repositories/FirebaseAuthRepository.ts`.
6. **Test:** `FakeAuthRepository` ile `signIn` use-case'i Firebase'siz test edilir (`37` §3).

## 2. UserProfileRepository
1. **Sorumluluk:** Profil + tercih + `users/{uid}` ana doc okuma/yazma; cache-first (`profile_${uid}`).
2. **Veri kaynağı:** Firestore `users/{uid}` (`config/firebase.ts → db`), AsyncStorage `profile_${uid}` (`STORAGE_KEYS.PROFILE_PREFIX`), `services/socialAuthProfile.ts` (StoredProfile).
3. **Kullanılmaması gereken yer:** domain/presentation. `progressByLevel` yazmaz (o `ProgressRepository`).
4. **Interface skeleton** — *Skeleton/contract — implementasyon değil.*
```ts
// features/auth/data/contracts.ts — SKELETON
export interface UserProfileRepository {
  getCachedProfile(uid: string): Promise<StoredProfile | null>;           // profile_${uid}
  cacheProfile(uid: string, profile: StoredProfile): Promise<void>;
  fetchProfileFromRemote(uid: string): Promise<StoredProfile | null>;     // users/{uid} getDoc
  saveProfile(uid: string, patch: Partial<StoredProfile>): Promise<void>; // setDoc merge
  createUserDocument(uid: string, seed: UserDocSeed): Promise<void>;      // SyncService.createUserDocument
  deleteUserDocument(uid: string): Promise<void>;                         // AuthContext'teki deleteDoc(users/{uid})
}
```
5. **Implementasyon nerede:** `features/auth/data/repositories/FirestoreUserProfileRepository.ts` (mevcut `AuthContext` içindeki `deleteDoc`, `SyncService.fetchAndSaveUserData`/`createUserDocument`/`syncAuthProfileToFirestore` buraya taşınır).
6. **Test:** Fake ile cache-first sırası (önce cache, sonra remote) doğrulanır.

## 3. ProgressRepository
1. **Sorumluluk:** Öğrenme ilerlemesi okuma/yazma; v2 `progressByLevel` + legacy dual-read (`34`).
2. **Veri kaynağı:** Firestore `users/{uid}/progressByLevel/{level}` + ana doc legacy `progress`; AsyncStorage (`@user_progress`, `@current_level`, `@last_word_id`) (`progressService.ts`).
3. **Kullanılmaması gereken yer:** UI doğrudan; yüzde/level-completion hesabı **domain**'de (`calcLevelPercent`).
4. **Interface skeleton** — *Skeleton/contract — implementasyon değil.*
```ts
// features/progress/data/contracts.ts — SKELETON (dök. 34 örneğiyle uyumlu)
export interface ProgressRepository {
  getProgressSummary(userId: string): Promise<ProgressSummary>;
  getProgressByLevel(userId: string, level: Level): Promise<LevelProgress | null>;  // dual-read
  saveProgressByLevel(userId: string, progress: LevelProgress): Promise<void>;       // dual-write penceresi
  getLegacyProgressFallback(userId: string): Promise<LegacyProgressDoc | null>;      // fallback kaynağı
  // local-first ayna (AsyncStorage) — mevcut progressService davranışı korunur:
  getLocalLearnedWords(level: Level): Promise<number[]>;
  markWordLearnedLocal(level: Level, wordId: number): Promise<void>;
  setLastWordId(wordId: number): Promise<void>;
}
```
5. **Implementasyon nerede:** `features/progress/data/repositories/{FirestoreProgressRepository,LocalProgressRepository}.ts`. Mevcut `progressService` fonksiyonları (`markWordAsLearned`, `getLearnedWords`, `getLevelProgress`, `saveLastWordId`...) local repo + domain rule'a bölünür.
6. **Test:** Fake repo + dual-read fallback testi (`37` §4); domain percent saf testi (`37` §1).

## 4. VocabularyRepository
1. **Sorumluluk:** Local sözlük yükleme/cache; `.txt` (JSON) → `VocabularyWord` adaptasyonu; schema-version (`VOCABULARY_SCHEMA_VERSION=2`).
2. **Veri kaynağı:** `assets/vocabulary/{lang}_{level}.txt` (105 dosya), `expo-asset`/`expo-file-system`, AsyncStorage cache (`@vocabulary_*`). **Firestore YOK** (binding, `07`/`34`).
3. **Kullanılmaması gereken yer:** Firestore'a kelime yazma; presentation'da `require()` asset.
4. **Interface skeleton** — *Skeleton/contract — implementasyon değil.*
```ts
// features/vocabulary/data/contracts.ts — SKELETON
export interface VocabularyRepository {
  getWords(level: Level): Promise<VocabularyWord[]>;            // getStoredVocabulary sarmalar
  getTotalCount(level: Level): Promise<number>;                 // progress.totalCount kaynağı
  isGenerated(): Promise<boolean>;                              // isVocabularyGenerated
  generate(nativeLanguage: string, targetLanguage: string): Promise<void>;  // generateVocabulary
  clear(): Promise<void>;                                       // clearVocabulary
}
// VocabularyWord (gerçek): { id, word, pronunciation?, translation, sentence1, sentence2, nativeSentence1, nativeSentence2 }
```
5. **Implementasyon nerede:** `features/vocabulary/data/repositories/AssetVocabularyRepository.ts` + `data/adapters/wordAdapter.ts` (`.txt` parse). Mevcut `vocabularyService` buraya taşınır.
6. **Test:** `wordAdapter` parse testi (gerçek `.txt` örneğiyle); shuffle determinizmi domain'de (`shuffleArray` seed'li).

## 5. FavoritesRepository
1. **Sorumluluk:** Favori ekle/çıkar/listele; local + Firestore senkron; legacy `number[]` → `{id,level}` migration.
2. **Veri kaynağı:** AsyncStorage `@favorites_${uid}` (`STORAGE_KEYS.FAVORITES_PREFIX`), Firestore `users/{uid}.favorites` (max 1000) (`favoritesService.ts` — şu an `doc/setDoc/getDoc/serverTimestamp`'i doğrudan kullanıyor).
3. **Kullanılmaması gereken yer:** presentation doğrudan Firestore; favori limiti kuralı (1000) **domain**'de.
4. **Interface skeleton** — *Skeleton/contract — implementasyon değil.*
```ts
// features/favorites/data/contracts.ts — SKELETON
export interface FavoritesRepository {
  getFavoriteItems(userId?: string): Promise<FavoriteItem[]>;           // getFavoriteItems (legacy migration dahil)
  add(word: VocabularyWord, level: Level): Promise<void>;               // addToFavorites
  remove(wordId: number, level?: Level): Promise<void>;                 // removeFromFavorites
  isFavorite(wordId: number, level: Level): Promise<boolean>;
  syncToRemote(userId: string, deviceId?: string): Promise<void>;       // syncFavoritesToFirebaseForUser
  restoreFromRemote(userId: string): Promise<void>;                     // restoreFavoritesFromFirebase
  clearRemote(userId: string): Promise<void>;                           // clearFavoritesOnFirebase
}
export type FavoriteItem = { id: number; level: Level };                // gerçek tip
```
5. **Implementasyon nerede:** `features/favorites/data/repositories/FavoritesRepository.ts`. Firestore erişimi (mevcut doğrudan `setDoc`) buraya kapsüllenir; `syncMeta` yazımı korunur.
6. **Test:** legacy `number[]` migration testi; `mergeFavoriteItems` dedupe (level:id) testi (`37`).

## 6. NotificationRepository (4 alt-arayüz — `12`)
1. **Sorumluluk:** İzin, zamanlama, tracking, response. `notificationService` (1355) ISP'ye göre 4'e bölünür.
2. **Veri kaynağı:** `expo-notifications`, AsyncStorage (`@notification_settings`, `@tracked_notifications`, `@pending_notification_word`, foreground/background time, content-version).
3. **Kullanılmaması gereken yer:** scheduling **hesabı** (pencere+frequency+64-slot+streak rezervi) → **domain** (saf). Repo yalnızca I/O.
4. **Interface skeleton** — *Skeleton/contract — implementasyon değil.*
```ts
// features/notifications/data/contracts.ts — SKELETON
export interface NotificationPermissionRepository {
  getPermissionState(): Promise<NotificationPermissionState>;      // getNotificationPermissionState
  requestPermission(): Promise<NotificationPermissionState>;       // requestNotificationPermissions
  hasSeenPrompt(userId: string): Promise<boolean>;                 // @notification_permission_prompted_${uid}
  markPromptSeen(userId: string): Promise<void>;
}
export interface NotificationScheduler {
  scheduleVocabulary(plan: ScheduledSlot[]): Promise<void>;        // scheduleVocabularyNotifications
  scheduleStreakReminder(at: { hour: number; minute: number }): Promise<void>;  // 21:00
  cancelVocabulary(): Promise<void>;
  cancelAll(): Promise<void>;
  getScheduledCount(): Promise<number>;                            // getScheduledNotificationCount (≤64)
}
export interface NotificationTrackingRepository {
  getTracked(): Promise<TrackedNotification[]>;                    // @tracked_notifications
  processDelivered(): Promise<void>;                               // processDeliveredNotifications
  getSettings(): Promise<NotificationSettings>;                    // getNotificationSettings
  saveSettings(s: Partial<NotificationSettings>): Promise<void>;
}
export interface NotificationResponseHandler {
  setPendingWord(w: PendingNotificationWord): Promise<void>;       // @pending_notification_word
  consumePendingWord(): Promise<PendingNotificationWord | null>;
}
```
5. **Implementasyon nerede:** `features/notifications/data/repositories/*`; orkestrasyon `application/NotificationFacade.ts`. Sabitler (`MAX_SCHEDULED_NOTIFICATIONS=64`, `STREAK_NOTIFICATION_RESERVED_SLOTS=1`, `NOTIFICATION_CONTENT_VERSION=4`) `domain/constants.ts`.
6. **Test:** scheduling **domain** saf testi (pencere/frequency→slot listesi, 64 taşma, streak rezervi) (`37` §7).

## 7. SettingsRepository
1. **Sorumluluk:** Kullanıcı tercihleri (ana dil/hedef dil/seviye), uygulama dili; local + Firestore (profil üzerinden).
2. **Veri kaynağı:** AsyncStorage (`@native_language`, `@target_language`, `@user_level`, `@user_language`), Firestore `users/{uid}.preferences` (**`UserProfileRepository` üzerinden**, doğrudan değil).
3. **Kullanılmaması gereken yer:** `SettingsScreen`/`SetupScreens`'ten **doğrudan Firestore** (mevcut stale import sorunu — `13`/`27`).
4. **Interface skeleton** — *Skeleton/contract — implementasyon değil.*
```ts
// features/settings/data/contracts.ts — SKELETON
export interface SettingsRepository {
  getPreferences(): Promise<UserPreferences | null>;                       // local-first
  savePreferences(userId: string, prefs: UserPreferences): Promise<void>;  // local + profileRepo.saveProfile
  getAppLanguage(): Promise<string>;                                       // @user_language
  setAppLanguage(lang: string): Promise<void>;                             // i18n + RTL (utils/rtl.ts)
}
export type UserPreferences = { nativeLanguage: string; targetLanguage: string; level: string };
```
5. **Implementasyon nerede:** `features/settings/data/repositories/SettingsRepository.ts`. Firestore yazımı `UserProfileRepository.saveProfile`'a delege eder (kendi `setDoc`'u yok).
6. **Test:** persistence (local+remote) testi; dil değişimi → i18n/RTL etkisi (`37` §9).

## 8. SyncRepository (SyncOrchestrator)
1. **Sorumluluk:** Sync tetikleme/debounce, device-id çakışma, `syncMeta` copy-verify; her feature repo'sunu çağırır.
2. **Veri kaynağı:** `services/SyncService.ts` (shouldSync, syncToFirestore, forceSync, getActiveDeviceIdFromFirebase), AsyncStorage (`@vocbee_needs_sync`, `@vocbee_last_sync`, `@vocbee_device_id`).
3. **Kullanılmaması gereken yer:** Tek dosyada tüm domain CRUD'u (mevcut god-`syncToFirestore`). Orchestrator feature repo'larını çağırır, kendi domain mantığını barındırmaz.
4. **Interface skeleton** — *Skeleton/contract — implementasyon değil.*
```ts
// features/auth/data/contracts.ts (veya app/lifecycle) — SKELETON
export interface SyncRepository {
  shouldSync(): Promise<boolean>;                                  // shouldSync (debounce + needs_sync)
  getActiveDeviceId(userId: string): Promise<string | null>;       // getActiveDeviceIdFromFirebase
  getLocalDeviceId(): Promise<string>;                             // storage.getDeviceId
}
export interface SyncOrchestrator {
  syncAll(userId: string): Promise<boolean>;     // progress+profile+favorites+notif+streak repo'larını çağırır
  forceSync(userId: string): Promise<boolean>;   // forceSync
}
```
5. **Implementasyon nerede:** `features/auth/application/SyncOrchestrator.ts` + `data/SyncRepository.ts`. Mevcut `SyncService` parçalanır; device-id/son-yazan kuralı korunur (`03`/`10`).
6. **Test:** device-id çakışma (başka cihaz aktif) testi; sync conflict çözümü (`37` §8).

## 9. MonetizationRepository (Premium + Ads)
1. **Sorumluluk:** RevenueCat entitlement (`premium`) + AdMob (consent/ATT/banner/interstitial/appOpen) erişimi.
2. **Veri kaynağı:** `services/revenueCatService.ts`, `services/adMobService.ts`(+`.web.ts`), `react-native-purchases`, `react-native-google-mobile-ads`.
3. **Kullanılmaması gereken yer:** premium/free **gating kuralı** → **domain** (`isAdFree`'e göre davranış). UI doğrudan SDK çağırmaz.
4. **Interface skeleton** — *Skeleton/contract — implementasyon değil.*
```ts
// features/monetization/data/contracts.ts — SKELETON
export interface RevenueCatRepository {
  getCustomerInfo(userId: string): Promise<CustomerInfoLike | null>;   // getRevenueCatCustomerInfo
  isAdFree(info: CustomerInfoLike | null): boolean;                    // hasActiveAdFreeEntitlement ('premium')
  presentPaywall(userId: string): Promise<PaywallOutcome>;             // presentAdFreePaywall
  restore(userId: string): Promise<CustomerInfoLike | null>;           // restoreRevenueCatPurchases
  onCustomerInfoChanged(cb: (info: CustomerInfoLike) => void): () => void;  // addRevenueCatCustomerInfoListener
}
export interface AdMobRepository {
  requestConsent(): Promise<void>;          // requestAdConsent (UMP)
  initialize(): Promise<boolean>;           // initializeAdMob (ATT dahil)
  maybeShowInterstitial(): Promise<void>;
  maybeShowAppOpen(): Promise<void>;
  getAdIds(): AdIds;                         // AD_IDS (test/prod)
}
```
5. **Implementasyon nerede:** `features/monetization/data/repositories/{RevenueCatRepository,AdMobRepository}.ts`. `MonetizationContext` ince state provider kalır; iş mantığı `application/MonetizationFacade.ts`.
6. **Test:** gating saf testi (`isAdFree → reklam gizle`), restore akışı (fake repo) (`37` §10).

## 10. Adapter contract'ları (özet)
Her feature `data/adapters/`'ında DTO↔model dönüşümü yapar. Kural: **tek yön bilgi** — adapter DTO'yu bilir, domain bilmez.
*Skeleton/contract — implementasyon değil.*

```ts
// features/progress/data/adapters/progressAdapters.ts — SKELETON
export function toProgressByLevelDoc(progress: LevelProgress, deviceId?: string): ProgressByLevelDoc {
  // model → DTO (Timestamp serverTimestamp burada eklenir)
  return {} as ProgressByLevelDoc;
}
export function fromProgressByLevelDoc(doc: ProgressByLevelDoc): LevelProgress {
  // DTO → model (Timestamp düşürülür; learnedCount = learnedWordIds.length doğrulanır)
  return {} as LevelProgress;
}

// features/vocabulary/data/adapters/wordAdapter.ts — SKELETON
export function parseVocabularyTxt(raw: string): VocabularyWord[] {
  // .txt (JSON içerik) → VocabularyWord[]; bozuk satır filtrelenir, pronunciation normalize edilir
  return [];
}
```

Adapter yerleşim kuralı (binding):
```text
Adapter data katmanında olmalı.
Domain modeli Firestore DTO'ya bağımlı olmamalı.
Screen DTO bilmemeli (yalnızca domain modeli / hook çıktısı).
```

## 11. Mock/fake repository testte nasıl kullanılır
*Skeleton/contract — implementasyon değil.*
```ts
// __tests__ — SKELETON
const fakeProgress: ProgressRepository = {
  getProgressSummary: jest.fn(async () => ({ byLevel: {}, overallPercent: 0 })),
  getProgressByLevel: jest.fn(async () => null),
  saveProgressByLevel: jest.fn(async () => undefined),
  getLegacyProgressFallback: jest.fn(async () => ({ learnedWords: { A1: [1, 2] } })),
  getLocalLearnedWords: jest.fn(async () => [1, 2]),
  markWordLearnedLocal: jest.fn(async () => undefined),
  setLastWordId: jest.fn(async () => undefined),
};
// use-case'i fake ile çağır → Firebase olmadan davranışı doğrula (37 §3/§4)
```

## Kabul kriterleri
- Her feature'ın `data/` katmanı bir interface implemente eder; `application` yalnızca interface'e bağımlı.
- Adapter'lar saf ve test edilebilir; domain DTO bilmiyor.
- `favoritesService`/`AuthContext`/`SettingsScreen` içindeki doğrudan Firestore erişimleri repository'ye kapsüllenmiş.

## İlgili dokümanlar
`06` (Repository/Adapter/DIP), `10` (auth/sync), `11` (learning/progress/vocab), `12` (notifications), `14` (monetization), `34` (DTO/adapter tipleri), `37` (mock test).
