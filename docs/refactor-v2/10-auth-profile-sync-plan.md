# 10 — Auth / Profile / Sync Planı

## Mevcut durum
- `context/AuthContext.tsx` (780): Firebase Auth dinleme + profil cache-first fetch + notificationSettings +
  device-id kontrolü + `deleteDoc(users/{uid})` + sync tetikleme. Çok sorumluluk (SRP/DIP ihlali).
- `services/SyncService.ts` (434): tüm domain’lerin Firestore sync orkestrasyonu tek fonksiyonda.
- `services/socialAuthProfile.ts`, `nativeGoogleSignIn.ts`, `config/googleAuthConfig.ts`: provider detayları.
- Hesap silme: Vercel `api/deleteAccount.js` (recent-auth 5dk, firebase-admin) + client `deleteDoc`.

## Problem
- Auth + profile + sync birbirine karışmış; test edilemez; Firestore detayı context’te.
- Yeni login provider eklemek çekirdeği değiştiriyor (OCP ihlali).

## Hedef yapı (`features/auth/`)
```
auth/
  presentation/ screens/(Auth, ForgotPassword), components/(profil), hooks/(useAuth, useProfile)
  application/  AuthFacade, useCases/(signIn, signUp, signOut, deleteAccount, loadProfile, syncProfile)
  domain/       types(AuthUser, Profile), rules(recentAuth, profileValidation)
  data/         AuthRepository(Firebase Auth), ProfileRepository(Firestore+cache),
                providers/(EmailProvider, GoogleProvider, AppleProvider — Factory)
```
- `AuthContext` → ince state provider; iş mantığı `AuthFacade`/use-case’lere.
- Provider’lar **Factory** ile seçilir (OCP). `AuthRepository` interface → fake ile test.
- Sync: `application/SyncOrchestrator` her feature’ın repository’sini çağırır (`SyncService` parçalanır).

## Sync stratejisi (davranış korunur)
- Cache-first oku; device-id çakışma kontrolü (`lastActiveDeviceId`); `syncMeta` copy-verify; debounce (günlük/5dk) + `@vocbee_needs_sync`.
- v2: progress sync `progressByLevel` repository’sini kullanır (dual-read/write `07`/`08`).

## Etkilenecek dosyalar
`context/AuthContext.tsx`, `services/SyncService.ts`, `services/socialAuthProfile.ts`, `services/nativeGoogleSignIn.ts`,
`config/googleAuthConfig.ts`, `screens/AuthScreens.tsx`, `screens/ForgotPasswordScreen.tsx`, `api/deleteAccount.js` (referans).

## Test gereksinimleri
- `domain/rules`: recent-auth, profil doğrulama (saf unit).
- `ProfileRepository` adapter: Firestore DTO ↔ Profile.
- auth/profile sync conflict (device-id çakışması) testi.

## Riskler / rollback
- Risk: oturum/akiş regresyonu → her provider için manuel QA + shim ile kademeli geçiş.
- Rollback: shim’ler sayesinde eski `AuthContext` davranışına geri dönüş mümkün.

## Kabul kriterleri
- `AuthContext` < 200 satır; Firestore import’u yok.
- Email/Google/Apple login + şifre sıfırlama + hesap silme davranışı birebir.


---

## Implementation-spec detayları (v2 — `32`–`39`)
- **Repository sözleşmeleri:** `35-repository-adapter-contracts.md` §1 `AuthRepository` (email/Google/Apple/reset/delete + `getLastSignInTimeMs` recent-auth için), §2 `UserProfileRepository` (cache-first `profile_${uid}` + `deleteDoc(users/{uid})` + `createUserDocument`/`fetchAndSaveUserData`), §8 `SyncRepository`/`SyncOrchestrator` (device-id çakışma + `syncMeta`).
- **AuthContext ince shim:** `36` §7.5 — gerçek named export'lar (`AuthProvider`, `useAuth`, `getAuthErrorMessage`) seçici re-export ile korunur.
- **Korunacak sabit:** `RECENT_LOGIN_WINDOW_MS = 5*60*1000` (recent-auth domain kuralı); `lastActiveDeviceId` tabanlı son-yazan kuralı.
- **PR kırılımı:** `39` Phase 4 (PR-4.1 AuthRepository → 4.2 ProfileRepository → 4.3 provider Factory → 4.4 use-case → 4.5 Context ince+shim → 4.6 SyncOrchestrator).
- **Testler:** `37` §3 (fake repo use-case), §8 (sync conflict / device-id).
