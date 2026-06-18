# 05 — Auth, Profile ve Firebase Sync Mimarisi

## Mevcut Durum

### `context/AuthContext.tsx` (681 satır)
Tek context şunların hepsini taşıyor:
- Firebase Auth durumu (`onAuthStateChanged`, `signIn`, `signUp`, `signOut`).
- **Profile yönetimi:** AsyncStorage `profile_${uid}` cache + Firestore senkron.
- **Notification settings** state'i (okuma/güncelleme).
- **Cihaz kimliği** (`@vocbee_device_id`) cache-first strateji ve çoklu cihaz çakışması farkındalığı.
- **Hesap silme:** `DELETE_ACCOUNT_URL`'e (Vercel `api/deleteAccount.js`) HTTP çağrısı.
- Retry/backoff yardımcıları.

### `services/SyncService.ts` (434 satır)
Orkestratör (god-service):
- `syncToFirestore`: progress + profile + notificationSettings + streak + preferences + favorites yazar.
- `fetchAndSaveUserData`: tüm domain'leri Firestore'dan geri yükler (cihaz çakışma kontrolü dahil).
- `withRetry` (exponential backoff), `needsSync` (kaydedilmemiş yerel değişiklik koruması),
  `MUTATION_SYNC_DEBOUNCE_MS = 5 dk`.
- Domain servislerini (`progressService`, `streakService`, `favoritesService`, `notificationService`) ve
  profile'ı çağırır.

### Firestore sözleşmesi
`firestore.rules` `users/{uid}` için katı alan doğrulaması yapar (bkz. `13`). Yazılan şekil bu
kurallarla **birebir** uyumlu olmalı.

## Sorunlar

1. **AuthContext çok sorumlulu (SRP ihlali):** kimlik + profil + bildirim ayarı + cihaz + silme tek yerde.
2. **SyncService god-object:** her domain'i bildiği için domain ekledikçe büyüyor; test etmek zor.
3. **Ekrandan doğrudan Firestore yazımı** (`SetupScreens`) sync sözleşmesini baypas ediyor
   ve kurallarla uyumsuzluk riskini artırıyor. `SettingsScreen` içinde ise kullanılmayan Firestore
   import'ları var; bu da mimari niyeti bulanıklaştırıyor.
4. **HTTP endpoint URL'i context içinde**; test ve değiştirme zor.

## Önerilen Yaklaşım

Auth context'i **ince** tut; profile/sync'i ayrı servis+hook'lara böl. **Davranış ve Firestore
şekli korunur.**

```
features/auth/
  context/AuthProvider.tsx        # sadece kimlik durumu + signIn/signUp/signOut
  hooks/useAuth.ts                # context tüketici (mevcut import yolu korunur, re-export)
  hooks/useAccountDeletion.ts     # DELETE_ACCOUNT_URL akışı (URL config'ten)
  services/
    authService.ts                # firebase auth sarmalayıcı
    deviceId.ts                   # @vocbee_device_id cache-first (mevcut mantık)
features/profile/
  services/profileService.ts      # profile_${uid} cache + Firestore profil alanı
  hooks/useProfile.ts
features/auth/services/sync/
  syncOrchestrator.ts             # eski SyncService API'ı (facade, aynı imza)
  domainSyncers.ts                # her domain için {pull, push} kayıtları
  syncTypes.ts
shared/firebase/
  firebase.ts                     # config/firebase.ts taşınır
  userDoc.ts                      # users/{uid} okuma/yazma tek kapı (rules sözleşmesi burada)
```

**Sync deseni (god-object'ı dağıtmadan, sadece içeride modülerleştir):**
`syncOrchestrator` aynı dış API'ı (`syncToFirestore`, `fetchAndSaveUserData`, `needsSync`) korur; içeride
her domain bir `DomainSyncer { key, pull, push }` kaydı olur. Böylece yeni domain eklemek
`domainSyncers.ts`'e bir kayıt eklemek olur, orkestratör değişmez.

```ts
// syncTypes.ts
export interface DomainSyncer<T = unknown> {
  key: keyof UserDocPayload          // 'progress' | 'streak' | 'favorites' | ...
  push(uid: string): Promise<Partial<UserDocPayload>>
  pull(uid: string, data: UserDocPayload): Promise<void>
}
```

`shared/firebase/userDoc.ts` tek kapı olur; `firestore.rules`'taki alan listesi burada tek bir
`UserDocPayload` tipiyle sözleşmeye bağlanır (email, displayName, photoURL, createdAt, setupCompleted,
preferences, progress, streak, notificationSettings, lastActiveDeviceId, favorites, syncMeta).

## Alternatifler ve Neden Elendiler

- **SyncService'i tamamen event-driven mimariye çevir** — Elendi: aşırı soyutlama; mevcut debounce+retry
  yeterli ve test edilebilir.
- **Profile'ı AuthContext'te bırak** — Elendi: context'i şişirmeye devam eder; profile bağımsız test edilemez.
- **Her domain'i ayrı ayrı sync eden bağımsız servisler (orkestratörsüz)** — Elendi: çoklu cihaz çakışma
  kontrolü ve atomik sıralama tek noktada olmalı; orkestratör korunur.

## Migration / Implementasyon Adımları

1. **PR-1:** `config/firebase.ts -> src/shared/firebase/firebase.ts`; eski yoldan re-export shim.
2. **PR-2:** `shared/firebase/userDoc.ts` + `UserDocPayload` tipi oluştur. SyncService bu kapıyı
   kullanacak şekilde **içeriden** refactor edilir (dış API aynı). Yazılan alanlar birebir korunur.
3. **PR-3:** `deviceId` mantığını `features/auth/services/deviceId.ts`'e taşı (AuthContext import eder).
4. **PR-4:** `profileService` + `useProfile` çıkar; AuthContext profili buradan tüketir.
5. **PR-5:** `useAccountDeletion` çıkar; `DELETE_ACCOUNT_URL` `config`'e taşınır (değer değil, anahtar).
6. **PR-6:** SyncService içini `DomainSyncer` kayıtlarına böl; `syncOrchestrator` facade'ı aynı imza.
7. **PR-7:** `SetupScreens` doğrudan Firestore yazımını `userDoc`/feature service'e taşı.
   `SettingsScreen` tarafında gerçek yazım olmadığı için stale import temizliği ve settings action facade'ı yapılır.

Her PR: `npm run typecheck && npm run test:ci && npm run typecheck:rules` (rules sözleşmesi etkilenirse).

## Riskler

- **Firestore alan şeklinin kayması** -> rules reddi / veri kaybı. Azaltım: `UserDocPayload` tek kaynak;
  `tests/firestoreRules.ts` emulator testi her PR'da koşulur (`npm run test:rules`).
- **Auth state sırası değişirse** profil/sync yanlış tetiklenebilir. Azaltım: `onAuthStateChanged`
  cache-first akışı ve sırası birebir korunur.
- **Device-id çakışma davranışı** kırılırsa istenmeyen "oturum düşme". Azaltım: `deviceId` mantığı
  taşınırken testle sabitlenir.

## Test ve Kabul Kriterleri

- Mevcut `services/__tests__/SyncService.test.ts`, `socialAuthProfile.test.ts` yeşil kalır.
- `npm run test:rules` (Firestore emulator) yeşil: yazılan doküman rules'tan geçer.
- Yeni `profileService` ve `deviceId` için birim testleri.
- Cache-first auth akışı için karakterizasyon testi (çevrimdışı açılış -> cache'ten profil).

## Etkilenecek Dosyalar

```
context/AuthContext.tsx     -> src/features/auth/context/AuthProvider.tsx + hooks/useAuth.ts
                            -> src/features/auth/hooks/useAccountDeletion.ts
                            -> src/features/auth/services/deviceId.ts
                            -> src/features/profile/services/profileService.ts + hooks/useProfile.ts
services/SyncService.ts     -> src/features/auth/services/sync/{syncOrchestrator,domainSyncers,syncTypes}.ts
config/firebase.ts          -> src/shared/firebase/firebase.ts (+ shim)
(yeni)                      -> src/shared/firebase/userDoc.ts
screens/SettingsScreen.tsx (stale Firestore import) -> kaldırılır / settings action facade'a bağlanır
screens/SetupScreens.tsx   (setDoc) -> src/features/setup/services/*    -> shared/firebase/userDoc.ts
```
