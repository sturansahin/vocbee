# 24 — Phase 4: Auth / Profile / Sync Refactor

1. **Amaç** — `AuthContext` (780) ve `SyncService` (434) sorumluluklarını ayırmak; repository/application/domain katmanlarını kurmak (`10`).
2. **Kapsam** — AuthRepository, ProfileRepository, AuthFacade, use-case’ler, login provider Factory, SyncOrchestrator.
3. **Kapsam dışı** — Learning/notification/settings iç bölme; Firestore model (Phase 3’te yapıldı).
4. **Ön koşullar** — Phase 3 (v2 repository, dual-read).
5. **Etkilenecek dosyalar** — `context/AuthContext.tsx`, `services/SyncService.ts`, `services/socialAuthProfile.ts`, `services/nativeGoogleSignIn.ts`, `config/googleAuthConfig.ts`, `screens/AuthScreens.tsx`, `screens/ForgotPasswordScreen.tsx`, `api/deleteAccount.js` (referans).
6. **Taşınacak/bölünecek dosyalar** — AuthContext → ince provider + AuthFacade/use-case; SyncService → SyncOrchestrator + feature repository’leri; provider detayları → `data/providers`.
7. **Yeni hedef klasör yapısı** — `features/auth/{presentation,application,domain,data}` (bkz. `10`).
8. **Adım adım işler** — (a) AuthRepository + ProfileRepository; (b) provider Factory; (c) use-case’ler (signIn/up/out, deleteAccount, loadProfile, syncProfile); (d) AuthContext’i ince state’e indir; (e) SyncOrchestrator; (f) shim’ler.
9. **Kod davranışı korunacak noktalar** — cache-first profil; device-id çakışma; recent-auth 5dk; `deleteDoc(users/{uid})` + Vercel delete; debounce sync.
10. **Firestore/Storage/Auth/Notification etkileri** — Auth akışları aynı; Firestore erişimi repository’ye taşınır; notificationSettings okuma/yazma korunur.
11. **Test gereksinimleri** — recent-auth/profil rules (saf); ProfileRepository adapter; sync conflict (device-id); fake AuthRepository ile use-case testleri.
12. **Manuel QA checklist** — [ ] email/Google/Apple login [ ] şifre sıfırlama [ ] hesap silme [ ] iki cihaz sync çakışması [ ] profil güncelleme.
13. **Riskler** — R4 (login regresyonu). Azaltma: provider başına QA + shim.
14. **Rollback planı** — Shim ile eski AuthContext/SyncService davranışı.
15. **Kabul kriterleri** — `AuthContext` < 200 satır; Firestore import’u yok; tüm login/profil/sync davranışı birebir.
16. **Sonraki faza geçmeme şartları** — Herhangi bir login/sync QA regresyonu varsa Phase 5’e geçme.


## Implementation-spec bağlantıları (v2 — `32`–`39`)
- **PR kırılımı:** `39` Phase 4 → PR-4.1 AuthRepository, 4.2 UserProfileRepository, 4.3 provider Factory, 4.4 use-case'ler, 4.5 AuthContext ince+shim, 4.6 SyncRepository+SyncOrchestrator.
- **Repository sözleşmeleri:** `35` §1 (Auth), §2 (UserProfile, `deleteDoc(users/{uid})` kapsüllenir), §8 (Sync, device-id çakışma + `syncMeta`).
- **Shim:** `36` §7.5 (`AuthContext` seçici: `AuthProvider`,`useAuth`,`getAuthErrorMessage`), §7.10 (`SyncService` `export *`).
- **Korunan sabit:** `RECENT_LOGIN_WINDOW_MS=5dk`; cache-first `profile_${uid}`; `lastActiveDeviceId` son-yazan kuralı.
- **Testler:** `37` §3 (fake repo use-case), §8 (sync conflict).
- **Gate:** `AuthContext` < 200 satır + Firestore import yok; login/profil/sync `03` ile birebir.
