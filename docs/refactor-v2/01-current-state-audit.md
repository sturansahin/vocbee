# 01 — Mevcut Durum Audit'i

> Snapshot: zip açılışındaki kod. Satır sayıları `wc -l` ile ölçüldü; refactor başlamadan `20` ile yeniden üretilmelidir.

## 1. Teknoloji yığını (`package.json`)
- Expo `^54.0.31`, React Native `0.81.5`, React `19.1.0`, TypeScript `~5.9.2` (strict).
- Firebase Web SDK `^12.7.0` (client) + `firebase-admin ^13.6.0` (⚠️ mobil dependency'lerde, bkz. `09`).
- Navigation: `@react-navigation/native` v6 (stack). Tab navigator pakette ama kullanılmıyor.
- Monetization: `react-native-purchases` v10 (RevenueCat), `react-native-google-mobile-ads` v16 (AdMob).
- i18n: `i18next` + `react-i18next` + `expo-localization`; 22 dil.
- UI: `nativewind` v2 + `tailwindcss`, `react-native-svg`, lottie.

## 2. Büyük dosyalar (>400 satır)
| Dosya | Satır | Sorun |
|---|---|---|
| `screens/HomeScreen.tsx` | **2391** | God-screen: kelime akışı, progress, streak, favorites, shuffle cache, ad, tutorial. |
| `screens/SettingsScreen.tsx` | **2310** | God-screen: profil, dil, bildirim, premium, hesap silme, review. |
| `context/AuthContext.tsx` | **780** | Auth + profile + notification settings + device-id + delete-account + sync orchestrasyonu. |
| `screens/SetupScreens.tsx` | **1240** | Çok adımlı setup tek dosyada. |
| `services/notificationService.ts` | **1355** | Permission + scheduling + tracking + response + test + streak reminder. |
| `screens/AuthScreens.tsx` | 876 | Login + SignUp birlikte. |
| `screens/ExampleSentencesScreen.tsx` | 854 | Grammar + UI birlikte. |
| `services/adMobService.ts` | 604 | Consent + ATT + interstitial + app-open + banner. |
| `services/vocabularyService.ts` | 547 | Asset map + merge + storage + schema-migration. |
| `screens/LevelTestScreen.tsx` | 485 | |
| `components/StreakCelebrationOverlay.tsx` | 465 | |
| `services/SyncService.ts` | 434 | Tüm domain'lerin Firestore sync orkestrasyonu. |

## 3. Screen içinde olmaması gereken kullanımlar
- **Firebase/Firestore doğrudan:** `context/AuthContext.tsx` (`doc`, `deleteDoc`, `db`). Ekranların
  çoğu servis üzerinden erişiyor; ancak `SettingsScreen`/`SetupScreens` içinde Firestore import izleri
  raporlanmıştır (v1 `08` notu) → `13`/`24`/`27` ile doğrulanacak ve kapatılacak.
- **AsyncStorage doğrudan ekranlarda:** `App.tsx` (`HAS_SEEN_ONBOARDING`), `context/AuthContext.tsx`
  (`PROFILE_PREFIX`). Servis katmanı çoğunu sarıyor ama screen seviyesinde shuffle/onboarding key'leri var.
- **Notification SDK:** `App.tsx` doğrudan `expo-notifications` listener/response yönetiyor (lifecycle).
- **AdMob/Review:** `App.tsx` doğrudan `initializeAdMob`, `checkAndShowAppOpenAd`, `recordReviewAppLaunch`.

## 4. Servis şişmesi (Interface Segregation ihlalleri)
- `notificationService.ts`: ~30 export, 6+ ayrı sorumluluk (permission, settings, schedule, refill, track,
  response, test, streak-reminder). → `12`.
- `SyncService.ts`: progress + profile + favorites + notification + streak + device-id + user-doc CRUD.
  Domain'ler tek fonksiyonda (`syncToFirestore`) iç içe. → `10`.
- `adMobService.ts`: consent + lifecycle + 3 reklam tipi. → `14`.
- `vocabularyService.ts`: asset registry + merge algoritması + storage + schema migration. → `11`.

## 5. Context şişmesi
- `AuthContext.tsx` (780): saf auth değil; profile state, notificationSettings state, device-id kontrolü,
  cache-first fetch, delete-account HTTP çağrısı, sync tetikleme. → 5+ application service'e bölünmeli (`10`).
- `MonetizationContext.tsx` (191): makul; RevenueCat listener + paywall. Korunur, sadece `data` katmanına bağlanır.
- `ThemeContext.tsx` (32): sade; sistem color-scheme'e bağlı. Dark/light toggle yok (sadece sistem).

## 6. Storage key dağılımı
- `services/storageKeys.ts` merkezi ve iyi belgelenmiş (`STORAGE_KEYS`). **Versiyonlama yok** (ör. `@user_progress`
  için schema-version yok; sadece vocabulary'de `VOCABULARY_SCHEMA_VERSION` var).
- Dinamik key'ler: `profile_${uid}`, `@favorites_${uid}`, `@shuffle_order_${level}`,
  `@notification_permission_prompted_${uid}`. Merkezi prefix ile yönetiliyor (iyi).
- Legacy key'ler henüz duruyor: `USER_PROGRESS_LEGACY`, `SKIPPED`, monolith `VOCABULARY`.

## 7. Firestore veri modeli (özet)
Tek doc `users/{uid}`; `firestore.rules → validUserDocument` ile katı `hasOnly` sözleşmesi. Detay + büyüme
riski `07`. Kritik: `progress.learnedWords` (seviye→id dizileri) ve `favorites` (max 1000) ana doc içinde büyüyor.

## 8. Test ve coverage
- `jest-expo`; testler `__tests__/` (services, screens, components, utils) + `tests/firestoreRules.ts`.
- `jest.config.js` **coverage'tan büyük dosyaları dışlıyor**: `notificationService`, `adMobService`,
  `vocabularyService`, `progressService`, `favoritesService`, `SettingsScreen`, `SetupScreens`, vb. →
  yani en riskli kod en az test edilen. → `15`.
- Var olan iyi testler: `streakService`, `SyncService`, `storage`, `groqService`, `i18n`, `socialAuthProfile`.

## 9. CI/CD
- `.github/workflows` pratikte boş/etkisiz → **CI yok**. `package.json` script'leri mevcut
  (`typecheck`, `test:ci`, `test:rules`, `audit:prod`, `functions:*`) ama otomatik çalışmıyor. → `16`.

## 10. Repo hijyeni / güvenlik (özet, detay `09`)
- `config/firebase.ts` → Firebase web config **kaynak kodda hardcoded**.
- `eas.json` → RevenueCat iOS public key plain.
- `GoogleService-Info.plist`, `google-services.json`, `.env`, `.env.local` zip içinde.
- `firebase-debug.log`, `coverage/`, `config/coverage/`, `.idea/`, `.vercel/` izlenmiş/zip'te → artifact hijyeni.
- `firebase-admin` mobil `dependencies` içinde (server-only paket).

## En kritik 5 bulgu
1. İki god-screen (Home 2391, Settings 2310) ve god-context (Auth 780) test edilemez yoğunlukta.
2. `notificationService` (1355) tek dosyada 6+ sorumluluk; coverage dışı.
3. Firestore tek-doc modeli `learnedWords`/`favorites` ile büyüyor; subcollection'a geçiş gerekli (`07`).
4. CI yok + en riskli dosyalar coverage'tan dışlanmış → refactor emniyet ağı zayıf.
5. Kaynak kodda hardcoded config + repoda izlenen secret/artifact dosyaları.
