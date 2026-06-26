# 13 — Settings / Onboarding Planı

## Mevcut durum
- `screens/SettingsScreen.tsx` (2310): profil, dil/seviye, bildirim ayarları, premium/paywall, dil değiştirme,
  hesap silme, çıkış. v1 notu: stale Firestore import’ları olabilir.
- `screens/OnboardingScreen.tsx` (361) + `screens/SetupScreens.tsx` (1240): tanıtım + dil/seviye setup.
  v1 notu: SetupScreen doğrudan Firestore’a yazıyor.

## Problem
- Settings god-screen; her domain’in ayarı tek dosyada. Setup çok adım tek dosyada + doğrudan Firestore.

## Hedef yapı
```
features/settings/
  presentation/ screens/SettingsScreen (ince), components/(ProfileSection, LanguageSection,
                NotificationSection, PremiumSection, AccountSection), hooks/(useSettings*)
  application/  useCases (diğer feature use-case’lerini çağırır; kendi Firestore erişimi YOK)
features/setup/
  presentation/ screens/(SetupFlow), steps/(LanguageStep, LevelStep), hooks/(useSetup)
  application/  completeSetup useCase
  domain/       validation(dil/CEFR)
  data/         preferences repository (local + Firestore via auth/profile repo)
features/onboarding/ presentation/screens/OnboardingScreen
```
- Settings yalnızca section component’lerini dizer; her section ilgili feature’ın use-case’ini kullanır.
- Stale Firestore import’ları kaldırılır; Setup’ın doğrudan Firestore yazması → ProfileRepository üzerinden (`10`).

## Davranış korunacak noktalar
- `setupCompleted`, `@native_language`, `@target_language`, `@user_level`, `hasSeenOnboarding` davranışı.
- Dil değiştirme + RTL (`utils/rtl.ts`) davranışı; hesap silme/logout akışları.

## Test / QA
- setup persistence (local+remote), dil değişimi, settings’ten bildirim ayarı → scheduler.
- QA: ilk kurulum akışı, dil/seviye değiştirme, hesap silme, çıkış.

## Riskler / rollback
- Risk: setup regresyonu yeni kullanıcıyı etkiler → öncelikli QA. Rollback: shim.

## Kabul kriterleri
- `SettingsScreen` ve setup < 400 satır/dosya; doğrudan Firestore import’u yok; davranış birebir.


---

## Implementation-spec detayları (v2 — `32`–`39`)
- **SettingsRepository sözleşmesi:** `35-repository-adapter-contracts.md` §7 — local + `UserProfileRepository` delegasyonu; **doğrudan Firestore yazımı YOK** (mevcut stale import sorunu çözülür).
- **Shim reçeteleri:** `36` §7.2 (`SettingsScreen` default shim), §7.3 (`SetupScreens` named shim: `SetupScreen`+`NativeLanguageScreen`).
- **Korunacak davranış:** `setupCompleted`, `@native_language`/`@target_language`/`@user_level`, `hasSeenOnboarding`, dil değişimi + RTL (`utils/rtl.ts`).
- **Testler:** `37` §9 (persistence local+remote). **PR kırılımı:** `39` Phase 7 (PR-7.1 SettingsRepository → 7.2 section'lar → 7.3 SettingsScreen ince → 7.4 Setup step → 7.5 shim).
