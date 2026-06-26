# 27 — Phase 7: Settings / Onboarding Refactor

1. **Amaç** — `SettingsScreen` (2310) ve `SetupScreens` (1240) god-screen’lerini section/step + hook’lara bölmek; stale/doğrudan Firestore erişimini kaldırmak (`13`).
2. **Kapsam** — Settings section component’leri, Setup step’leri, useSettings/useSetup hook’ları, preferences repository (auth/profile repo üzerinden).
3. **Kapsam dışı** — Monetization iç bölme (Phase 8).
4. **Ön koşullar** — Phase 4 (auth/profile), Phase 6 (notification facade — bildirim ayarı section’ı).
5. **Etkilenecek dosyalar** — `screens/SettingsScreen.tsx`, `screens/SetupScreens.tsx`, `screens/OnboardingScreen.tsx`, `screens/LevelTestScreen.tsx`, `utils/rtl.ts`.
6. **Taşınacak/bölünecek dosyalar** — Settings → ProfileSection/LanguageSection/NotificationSection/PremiumSection/AccountSection; Setup → LanguageStep/LevelStep + useSetup; stale Firestore import’ları silinir.
7. **Yeni hedef klasör yapısı** — `features/settings/*`, `features/setup/*`, `features/onboarding/*` (bkz. `13`).
8. **Adım adım işler** — (a) Settings’i section’lara böl, her section ilgili feature use-case’ini kullansın; (b) Setup’ı step’lere böl, Firestore yazımı ProfileRepository’ye; (c) stale import temizliği; (d) hook’lar; (e) shim.
9. **Kod davranışı korunacak noktalar** — `setupCompleted`, `@native_language`/`@target_language`/`@user_level`, `hasSeenOnboarding`; dil değişimi + RTL; hesap silme/logout.
10. **Firestore/Storage/Auth/Notification etkileri** — Setup artık doğrudan Firestore yazmaz (repo üzerinden); bildirim ayarı NotificationFacade’ı çağırır; storage key’leri aynı.
11. **Test gereksinimleri** — setup persistence (local+remote); dil değişimi; settings’ten bildirim ayarı→scheduler; account section.
12. **Manuel QA checklist** — [ ] ilk kurulum akışı [ ] dil/seviye değiştirme [ ] RTL dil [ ] bildirim ayarı [ ] hesap silme [ ] çıkış.
13. **Riskler** — R2, R14 (i18n/RTL). Azaltma: öncelikli yeni-kullanıcı QA + dil QA.
14. **Rollback planı** — Shim ile eski Settings/Setup.
15. **Kabul kriterleri** — Settings/Setup < 400 satır/dosya; doğrudan Firestore import’u yok; davranış birebir.
16. **Sonraki faza geçmeme şartları** — Setup/dil QA regresyonu varsa Phase 8’e geçme.


## Implementation-spec bağlantıları (v2 — `32`–`39`)
- **PR kırılımı:** `39` Phase 7 → PR-7.1 SettingsRepository+Setup preferences, 7.2 Settings section'ları, 7.3 SettingsScreen ince+shim, 7.4 Setup step'leri+useSetup, 7.5 SetupScreens/Onboarding/LevelTest shim.
- **Repository:** `35` §7 (SettingsRepository; doğrudan Firestore YOK → ProfileRepository delegasyonu).
- **Shim:** `36` §7.2 (`SettingsScreen` default), §7.3 (`SetupScreens` named: `SetupScreen`+`NativeLanguageScreen`), §7.4 (`AuthScreens` deseni referansı).
- **Korunan davranış (`03` §2,14):** `setupCompleted`, `@native_language`/`@target_language`/`@user_level`, `hasSeenOnboarding`, dil+RTL (`utils/rtl.ts`).
- **Testler:** `37` §9 (persistence local+remote).
- **Gate:** Settings/Setup < 400 satır/dosya; doğrudan Firestore import yok; setup/dil QA regresyonsuz.
