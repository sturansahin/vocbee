# 39 — Phase PR Breakdown (Faz → PR Kırılımı)

> Bu bir **implementation-spec**tir. Tüm kod blokları **örnek/skeleton**dır; gerçek implementasyon değildir.
> Kaynak kod bu görevde değiştirilmemiştir. Her PR **küçük, bağımsız merge edilebilir ve shim ile geri alınabilir** olmalı.

## PR ortak kuralları (binding)
- Bir PR tek bir sorumluluk taşır; büyük dosya **tek PR'da parçalanmaz** (aşağıdaki alt-PR'lar).
- Her PR: `npm run typecheck` + `npm run test:ci` yeşil; davranış `03`'e göre korunur; shim ile eski yol çalışır.
- Her PR şablonu: **Amaç / Etkilenen dosyalar / Yapılacak / Yapılmayacak / Testler / Kabul kriterleri / Rollback**.
- Format kısaltması aşağıda: `D=Yapılacak, ND=Yapılmayacak, T=Testler, A=Kabul, RB=Rollback`.

---

## Phase 0 — Safety Baseline (`20`)
**PR-0.1 — CI pipeline iskeleti**
- Amaç: PR gate (typecheck+test+rules+audit). Etkilenen: `.github/workflows/ci.yml` (yeni).
- D: `38` §6 CI skeleton. ND: kod taşıma. T: CI mevcut `test:ci`+`test:rules` yeşil. A: PR'da CI çalışıyor. RB: workflow sil.

**PR-0.2 — ESLint + Prettier config (warn)**
- Amaç: lint altyapısı. Etkilenen: `.eslintrc.cjs`, `.prettierrc` (yeni), `package.json` script `lint`.
- D: `38` §5 (kurallar `warn`). ND: kuralları `error` yapma. T: `lint` çalışır. A: lint baseline. RB: config sil.

**PR-0.3 — Secret hijyeni + gitignore**
- Amaç: secret-scan + gitignore sertleştirme. Etkilenen: `.gitignore`, CI `secret-scan` job.
- D: `09`/`38` §7. ND: secret değeri yazma; geçmiş temizleme (ayrı iş). T: gitleaks yeşil. A: tarama aktif. RB: job sil.

**PR-0.4 — Baseline metrik + backup prosedürü**
- Amaç: `wc -l`/coverage baseline + Firestore backup prosedürünü dokümana bağlama. Etkilenen: yok (salt rapor).
- D: `08` §1 backup prosedürü. ND: gerçek migration/silme. T: yok. A: backup adımı onaylı. RB: yok.

---

## Phase 1 — `src/` İskeleti + Shared (`21`)
**PR-1.1 — Alias açılması** — Etkilenen: `tsconfig.json`, `babel.config.js`, `jest.config.js`, `tsconfig.app.json`.
D: `38` §2-4 (`@app/@shared/@features` + `@/*` korunur, `babel-plugin-module-resolver` eklenir). ND: dosya taşıma. T: `typecheck`+`test:ci`. A: alias çözülüyor. RB: paths/plugin geri al.

**PR-1.2 — `src/` boş iskelet** — `src/{app,shared,features}` + boş `features/*` klasörleri + placeholder `index.ts`. T: typecheck. RB: klasör sil.

**PR-1.3 — `shared/storage`** — `services/storageKeys.ts`+`storage.ts` → `@shared/storage`; eski yol shim (`export *`). D: taşı+shim. ND: key string değiştirme. T: `storage.test.ts` yeşil (yeni yola taşı). A: key'ler AYNEN. RB: shim geri.

**PR-1.4 — `shared/firebase`** — `config/firebase.ts` → `@shared/firebase`; shim. ND: config değer değiştirme. T: typecheck. RB: shim.

**PR-1.5 — `shared/i18n`** — `services/i18n.ts`+`locales/*`+`utils/rtl.ts` → `@shared/i18n`; shim. T: `i18n.test.ts`. A: 22 dil + RTL aynı. RB: shim.

**PR-1.6 — `shared/theme`** — `context/ThemeContext.tsx`+`utils/typography.ts`+`constants.ts`(renkler) → `@shared/theme`; shim. T: typecheck. RB: shim.

**PR-1.7 — `shared/ui`** — `components/{UIComponents,CustomAlert,OfflineNotice,ConnectionErrorScreen,AnimatedCountUp,SwarmLogo,ErrorBoundary}.tsx` → `@shared/ui`; shim. T: component testleri. RB: shim.

**PR-1.8 — `shared/errors` + `shared/utils`** — yeni `AppError` (davranış değiştirmeden) + `utils/profileAvatar.ts`. T: typecheck. RB: sil/shim.

---

## Phase 2 — App Bootstrap (`22`)  — `App.tsx` (App@487-566 + AppContent@67-477)
**PR-2.1 — `app/providers/AppProviders`** — provider zinciri (Theme→Alert→Auth→Monetization→ErrorBoundary) çıkar. ND: sıra değiştirme. T: provider render smoke. A: sıra AYNEN. RB: App.tsx shim.

**PR-2.2 — `app/navigation/RootNavigator` + `types.ts`** — navigator + `RootStackParamList` (gerçek route'lar: Onboarding, Login, SignUp, ForgotPassword, NativeLanguage, LevelTest, MainTabs, Settings, Favorites, ExampleSentences). T: navigation smoke. RB: shim.

**PR-2.3 — `app/lifecycle/useAppLifecycle`** — AppState + notif maintenance + ad init + sync + review yan etkileri (App.tsx'ten). D: facade çağrıları placeholder (gerçek facade sonraki fazlar). ND: tetik sırası/koşul değiştirme. T: lifecycle hook unit (mock yan etki). A: tetik sırası AYNEN (`03` §1). RB: shim.

**PR-2.4 — `app/bootstrap` + kök `App.tsx` shim** — font/splash gate ayrımı; kök `App.tsx` → `export { default } from '@app/App'`. T: soğuk açılış QA. RB: shim geri.

---

## Phase 3 — Firestore Model + Migration Prep (`23`) — KRİTİK VERİ FAZI
**PR-3.1 — Progress domain + DTO tipleri** — `features/progress/domain/{types,rules,constants}` + `data/dto.ts` (`34` §2-4). ND: Firestore yazma. T: domain rules (`37` §1). RB: sil.

**PR-3.2 — Progress adapters** — `data/adapters/progressAdapters` (`34` §5, `35` §10). T: adapter + migration transform (`37` §2/§4 + edge-case listesi). RB: sil.

**PR-3.3 — ProgressRepository (dual-read)** — `data/repositories/FirestoreProgressRepository` + `LocalProgressRepository` (`35` §3). D: yeni→eski fallback. ND: dual-write/eski alan silme. T: dual-read fallback (fake). A: eski kullanıcı okunur. RB: repo devre dışı (eski progressService shim).

**PR-3.4 — Rules v2 plan + emulator test** — `firestore.rules` `progressByLevel` + `schemaVersion`/`lastActiveAt`/`progressSummary` genişletmesi (`34` §7). D: rules + `tests/firestoreRules.ts` eki (`37` §5). ND: prod deploy (ayrı onay). T: `test:rules`. A: emulator yeşil. RB: rules geri al (git).

**PR-3.5 — Dual-write (schemaVersion gating)** — yazma hem `progressByLevel` hem eski alan; `34` §9. ND: eski alan silme. T: dual-write tutarlılık. A: iki şekil de tutarlı. RB: dual-write kapat (flag).

**PR-3.6 — Dry-run script iskeleti (çalıştırma onaylı)** — `scripts/migrateProgressByLevel.ts` (`34` §6). D: yalnızca okuma+rapor, PII maskeli. ND: yazma/silme. T: transform birim testi. A: dry-run %0 mismatched. RB: script sil.

---

## Phase 4 — Auth/Profile/Sync (`24`) — `AuthContext` (780) + `SyncService` (434)
**PR-4.1 — AuthRepository** — `features/auth/data/repositories/FirebaseAuthRepository` (`35` §1). D: email/Google/Apple/reset/delete sarmalama. T: fake auth use-case. RB: AuthContext shim.

**PR-4.2 — UserProfileRepository** — cache-first profil + `deleteDoc(users/{uid})` + `createUserDocument`/`fetchAndSaveUserData` (`35` §2). T: cache-first sıra. A: `profile_${uid}` davranışı. RB: shim.

**PR-4.3 — Provider Factory** — Email/Google/Apple provider (OCP, `06`/`10`). T: factory seçim. RB: shim.

**PR-4.4 — Auth use-case'leri** — signIn/signUp/signOut/deleteAccount/loadProfile/syncProfile. D: recent-auth 5dk (`RECENT_LOGIN_WINDOW_MS`) domain kuralı. T: recent-auth saf + use-case fake. RB: shim.

**PR-4.5 — AuthContext ince state + shim** — `context/AuthContext.tsx` → `@features/auth` seçici shim (`36` §7.5). A: `AuthContext` < 200 satır, Firestore import yok. RB: shim geri.

**PR-4.6 — SyncRepository + SyncOrchestrator** — `SyncService` parçalanır (`35` §8). D: device-id çakışma + `syncMeta` copy-verify korunur. T: sync conflict (`37` §8). RB: SyncService shim.

---

## Phase 5 — Learning/Home (`25`) — `HomeScreen` (2391), `vocabularyService` (547), `progressService` (301), `ExampleSentencesScreen` (854)
**PR-5.1 — HomeScreen pure UI/helper extraction** — `getTutorialSwipeNextStep` → `learning/domain/rules` (zaten `HomeScreen.test.tsx` test ediyor); saf UI parçaları. ND: davranış. T: mevcut HomeScreen testi yeşil. RB: shim.

**PR-5.2 — Vocabulary repository + wordAdapter** — `vocabularyService` → `features/vocabulary/data/*` (`35` §4). D: `.txt`→Word adapter; `VOCABULARY_SCHEMA_VERSION=2`. ND: Firestore'a kelime. T: wordAdapter parse (`37` §2). RB: shim.

**PR-5.3 — Learning domain rules** — kelime seçim/shuffle (seed)/level geçiş (A1→C1) saf. T: shuffle determinizm + level geçiş. RB: sil.

**PR-5.4 — ProgressService local + domain entegrasyon** — `progressService` local-first + Phase 3 repo tüketimi. D: `@user_progress`/`@last_word_id` korunur. T: percent ≥%90. RB: shim.

**PR-5.5 — useHomeScreen / useLesson hook** — state binding hook'u; use-case'ler (startLesson/completeWord/nextWord). T: hook (`37` §6). RB: shim.

**PR-5.6 — HomeScreen kompozisyona indirme + shim** — `screens/HomeScreen.tsx` → `learning` (default+named shim, `36` §7.1). A: HomeScreen < 400 satır. RB: shim geri.

**PR-5.7 — ExampleSentences + GrammarApiClient** — `ExampleSentencesScreen` + `groqService` → `learning` (grammar alt-modül). D: `@grammar_cache` korunur. T: grammar client. RB: shim.

---

## Phase 6 — Notifications (`26`) — `notificationService` (1355)
**PR-6.1 — Scheduling domain rules (saf)** — pencere+frequency+64-slot+streak rezervi → `domain/rules`+`constants` (`MAX_SCHEDULED_NOTIFICATIONS=64`, `STREAK_NOTIFICATION_RESERVED_SLOTS=1`, `NOTIFICATION_CONTENT_VERSION=4`). T: scheduling (`37` §7, ≥%85). RB: sil.

**PR-6.2 — PermissionRepository** — `35` §6. D: tek-kez prompt (`@notification_permission_prompted_${uid}`). T: permission durumları. RB: shim.

**PR-6.3 — NotificationScheduler** — `expo-notifications` sarmalama; id prefix'leri (`vocbee-vocab-`, `vocbee-streak-reminder`). T: scheduler mock. RB: shim.

**PR-6.4 — TrackingRepository** — `@tracked_notifications` + `processDeliveredNotifications` + settings. T: tracking. RB: shim.

**PR-6.5 — ResponseHandler** — pending word (`@pending_notification_word`) → navigation hedefi. T: response→hedef. RB: shim.

**PR-6.6 — NotificationFacade + lifecycle bağlama + shim** — `notificationService` → `@features/notifications` shim (`36` §7.6); `useAppLifecycle` facade çağırır. A: 4 arayüz; davranış birebir. RB: shim geri.

---

## Phase 7 — Settings/Onboarding (`27`) — `SettingsScreen` (2310), `SetupScreens` (1240)
**PR-7.1 — SettingsRepository + Setup preferences** — local + ProfileRepository delegasyonu (`35` §7). ND: doğrudan Firestore (stale import kaldır). T: persistence (`37` §9). RB: shim.

**PR-7.2 — Settings section'ları** — ProfileSection/LanguageSection/NotificationSection/PremiumSection/AccountSection. T: section render. RB: shim.

**PR-7.3 — SettingsScreen ince + shim** — `screens/SettingsScreen.tsx` → `settings` (default shim, `36` §7.2). A: < 400 satır; Firestore import yok. RB: shim geri.

**PR-7.4 — Setup step'leri + useSetup** — LanguageStep/LevelStep + `completeSetup` use-case; doğrudan Firestore → ProfileRepository. D: `setupCompleted`/`@native_language`/`@target_language`/`@user_level` korunur. T: setup persistence + dil/RTL. RB: shim.

**PR-7.5 — SetupScreens/Onboarding/LevelTest shim** — named shim (`36` §7.3). A: setup < 400 satır/dosya. RB: shim geri.

---

## Phase 8 — Monetization (`28`) — `adMobService` (604), `revenueCatService` (237), `MonetizationContext` (191)
**PR-8.1 — Gating domain rules (saf)** — `shouldShowAds(isAdFree)` (`premium` entitlement). T: gating (`37` §10). RB: sil.

**PR-8.2 — RevenueCatRepository** — `35` §9. D: `hasActiveAdFreeEntitlement`/`presentAdFreePaywall`/`restore`/listener. T: restore (fake). RB: shim.

**PR-8.3 — AdMobRepository** — consent(UMP)+ATT+banner+interstitial+appOpen ayrı metotlar; web no-op (`adMobService.web.ts`). T: consent→reklam. RB: shim.

**PR-8.4 — MonetizationFacade + Context ince + shim** — `MonetizationContext` ince state; iş facade'a; shim (`36` §6 deseni d). A: adMob 4 sorumluluğa bölünmüş. RB: shim geri.

---

## Phase 9 — Cleanup/Hardening (`29`)
**PR-9.1 — Import güncelleme** — eski yol import'larını `@features/@shared/@app`'a çevir (grep ile sayaç 0'a). T: typecheck+test:ci. RB: revert.

**PR-9.2 — Shim silme** — kök `screens/services/context/components/utils/config` shim'leri sil (import sayacı 0 olanlar). A: kökte shim yok. RB: shim commit'ini geri al.

**PR-9.3 — Dead code temizliği** — kullanılmayan import/dosya (`SKIPPED` legacy key vb.). T: test:ci. RB: revert.

**PR-9.4 — Eski Firestore alan cleanup (AYRI ONAY)** — `progress.learnedWords`/`favorites` silme **yalnızca**: migration %100 doğrulanmış + uyumluluk penceresi kapanmış + backup'lı (`08`/`R1`). D: ayrı onaylı script. ND: onaysız silme. T: silme sonrası progress sağlam. RB: backup'tan restore.

**PR-9.5 — Dual-write kapatma** — yalnızca yeni model yazımı. RB: dual-write flag aç.

**PR-9.6 — Coverage/lint sertleştirme** — `jest.config.js` exclude daralt; ESLint `warn`→`error`; `@/*`→`./src/*`. A: coverage hedefleri (`15`) tutuyor; lint `error`. RB: eşik/flag geri.

---

## Büyük dosya → PR sayısı özeti
| Dosya | Satır | Faz | Min PR |
|---|---|---|---|
| `HomeScreen.tsx` | 2391 | 5 | 5.1–5.6 (6) |
| `SettingsScreen.tsx` | 2310 | 7 | 7.1–7.3 (3) |
| `SetupScreens.tsx` | 1240 | 7 | 7.4–7.5 (2) |
| `notificationService.ts` | 1355 | 6 | 6.1–6.6 (6) |
| `AuthContext.tsx` | 780 | 4 | 4.1–4.5 (5) |
| `SyncService.ts` | 434 | 4 | 4.6 (+orchestrator) |
| `vocabularyService.ts` | 547 | 5 | 5.2 |
| `progressService.ts` | 301 | 3+5 | 3.1–3.6, 5.4 |
| `favoritesService.ts` | 312 | (favorites) | FavoritesRepository PR (Phase 5/7 ile) |
| `adMobService.ts` | 604 | 8 | 8.1–8.4 |

> `favoritesService` favori senkronu learning/settings akışlarına bağlı; FavoritesRepository PR'ı Phase 5 (Home favori) veya
> Phase 7 (Settings) ile birlikte küçük bir alt-PR olarak gelir; tek başına god-dosya değil.

## Kabul kriterleri (her faz)
- Faz dokümanındaki (16 başlık) kabul kriterleri + bu PR listesi tamamlandı.
- Her PR küçük, shim'li, testli; davranış `03`'e göre korunmuş.
- Açık Kritik/Yüksek risk yok (`17`); sonraki faza geçiş `31` döngüsüne göre.

## İlgili dokümanlar
`19` (roadmap), `20`–`29` (faz detayları), `30` (kabul), `31` (sıra), `36` (shim reçeteleri), `35` (repository).
