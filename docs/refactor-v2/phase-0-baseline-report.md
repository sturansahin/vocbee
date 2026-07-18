# Phase 0 — Safety Baseline Raporu

> Durum: **salt-okur baseline** (snapshot). Bu rapor refactor öncesi emniyet referansıdır.
> Ölçüm tarihi: 2026-06-26. Ölçüm dalı: `master` @ `8373d5b` ("Add refactor-v2 docs and remove v1 docs").
> Bu rapor üretilirken **hiçbir kaynak kod, `firestore.rules`, Firestore verisi veya konfig dosyası çalıştırılmadı/değiştirilmedi**.
> Secret değerleri bu dokümana **yazılmamıştır**; yalnızca dosya adı + risk + önerilen aksiyon raporlanır.

İlgili dokümanlar: `20-phase-0-safety-baseline.md`, `16-ci-cd-quality-gates.md`, `17-risk-register.md`,
`09-security-rules-and-env-hygiene.md`, `08-firestore-migration-strategy.md`, `38-ci-eslint-alias-config-spec.md`,
`39-phase-pr-breakdown.md`, `18-definition-of-done.md`.

---

## 1. Ortam

| Öğe | Değer |
|---|---|
| node | v25.9.0 |
| npm | 11.12.1 |
| Java (JDK) | **YOK** (`java` PATH'te değil, `JAVA_HOME` boş) → Firestore emulator çalışamaz |
| firebase CLI | 15.16.0 |
| node_modules | mevcut (root + `functions/`) |
| git | `master`, `origin/master` ile senkron, çalışma ağacı temiz, **tag yok** |
| remote | github.com/sturansahin/vocbee.git |

## 2. package.json script envanteri

**Mevcut:** `start`, `android`, `ios`, `web`, `test`, `test:watch`, `test:ci` (`jest --runInBand`),
`typecheck` (`tsc -p tsconfig.app.json --noEmit`), `typecheck:test`, `typecheck:rules`, `typecheck:worker`,
`test:rules` (`firebase emulators:exec --only firestore "... tests/firestoreRules.ts"`), `audit:prod`
(`npm audit --omit=dev --audit-level=high`), `functions:lint`, `functions:build`.

**Mevcut DEĞİL (uydurulmadı):**
- `lint` — root'ta **yok** (ESLint root'ta kurulu değil; yalnızca `functions/` kendi ESLint'ine sahip).
- `build` — root'ta **yok** (mobil build = Expo/EAS; root build script'i tasarımca yok).

## 3. Büyük dosyalar (yeniden ölçüldü — `wc -l` / exact newline)

Değerler doc 01 audit snapshot'ıyla **birebir eşleşiyor**.

| Eşik | Dosya | Satır | Sorumluluk |
|---|---|---|---|
| 2000+ | `screens/HomeScreen.tsx` | 2391 | God-screen: kelime akışı, progress, streak, favorites, shuffle cache, reklam, tutorial |
| 2000+ | `screens/SettingsScreen.tsx` | 2310 | God-screen: profil, dil/seviye, bildirim, premium, hesap silme, review |
| 1000+ | `services/notificationService.ts` | 1355 | Permission + scheduling + tracking + response + test + streak hatırlatıcı |
| 1000+ | `screens/SetupScreens.tsx` | 1240 | Çok adımlı setup tek dosyada |
| 500+ | `screens/AuthScreens.tsx` | 876 | Login + SignUp |
| 500+ | `screens/ExampleSentencesScreen.tsx` | 854 | Grammar + UI |
| 500+ | `context/AuthContext.tsx` | 780 | Auth + profile + notif settings + device-id + delete + sync |
| 500+ | `services/adMobService.ts` | 604 | Consent + ATT + interstitial + app-open + banner |
| 500+ | `App.tsx` | 566 | Bootstrap + provider zinciri + lifecycle yan etkileri |
| 500+ | `services/vocabularyService.ts` | 547 | Asset map + merge + storage + schema migration |
| 400–500 | `LevelTestScreen.tsx` (485), `StreakCelebrationOverlay.tsx` (465), `SyncService.ts` (434) | | izlenmeli |

Veri/test dosyaları (kod karmaşıklığı değil): `SyncService.test.ts` 479, `swarmAnimation.ts` 437, `locales/*.ts` ~418 (21 dil), `grammar-worker.ts` 413, `api/grammarProxy.js` 379.

## 4. Quality gate baseline (ölçüm anı)

| Gate | Komut | Sonuç |
|---|---|---|
| Typecheck (app) | `typecheck` | ✅ PASS (exit 0) |
| Typecheck (test) | `typecheck:test` | ✅ PASS |
| Typecheck (rules) | `typecheck:rules` | ✅ PASS |
| Typecheck (worker) | `typecheck:worker` | ✅ PASS |
| Unit/integration | `test:ci` | ✅ PASS — 21 suite / 173 test, ~20.9 sn |
| Functions lint | `functions:lint` | ✅ PASS |
| Functions build | `functions:build` | ✅ PASS |
| Lint (root) | `lint` | ❌ Script yok |
| Build (root) | `build` | ❌ Script yok (Expo/EAS) |
| Prod audit | `audit:prod` | ❌ exit 1 — 40 zafiyet (1 kritik, 6 yüksek, 32 orta, 1 düşük) |
| Firestore rules | `test:rules` | ⛔ BLOKE — Java (JDK) yok; emulator çalışamaz |

**Coverage** (jest her zaman açık; büyük dosyalar `jest.config.js`'te coverage-dışı): global
%55.04 stmts / %44.75 branch / %51.03 funcs / %55.55 lines (yalnızca dışlanmamış alt-küme).
İyi: `storageKeys 100%`, `streakService 87.85%`, `SyncService 87.28%`, `storage 85.52%`.
Dışlanmadığı halde düşük: `revenueCatService 0%`, `reviewPromptService 6.66%`, `adMobService.web 0%`.

## 5. Secret / env riskleri (değer YAZILMAZ)

`git ls-files` ve `git check-ignore` ile doğrulandı.

**Public remote'a commit'lenmiş (TRACKED):**
| Dosya | İçerik | Risk | Önerilen aksiyon |
|---|---|---|---|
| `config/firebase.ts` | Firebase web config (apiKey/authDomain/projectId/appId/messagingSenderId/measurementId) **hardcoded** | Düşük-orta (web config public sayılır; rules + API-key kısıtı korur) | env / `app.config` extra'ya taşı |
| `google-services.json` | Android Firebase config | Orta | EAS secure file; gitignore kararı ayrı onayla |
| `GoogleService-Info.plist` | iOS Firebase config | Orta | EAS secure file; gitignore kararı ayrı onayla |
| `eas.json` | RevenueCat iOS **public SDK** key satır-içi | Düşük (public key) | EAS secret / env değişkeni |
| `.env.example` | Şablon; `test_`-önekli RevenueCat **test** key | Düşük (test key, örnek) | bırakılabilir; gerçek key girilmemeli |

**Doğru gitignore'lu VE geçmişte hiç commit edilmemiş (git history doğrulandı — boş):**
`.env`, `.env.local`, `functions/.env` (0 byte). → Gerçek/yüksek-riskli secret **sızmamış**. Rotasyon **ihtiyati**, acil değil.

**Repoda bulunmayan (iyi):** keystore / `.jks` / `.p8` / `.p12` / `.pem` / service-account / firebase-adminsdk json — **hiç yok**.

**Artifact hijyeni:** `firebase-debug.log`, `coverage/`, `.idea/`, `.vercel/` ignore'lu; `config/coverage/` ignore değildi → Phase 0'da gitignore'a eklendi.

> Gerçek secret sızıntısı şüphesi: **yok** (hassas `.env`/credential dosyaları hiç commit edilmemiş). Yine de
> commit'li client identifier'lar (Firebase web/Android/iOS config, RevenueCat public key) görünür durumda;
> bunlar tasarımca public olsa da env/EAS secret'e taşınması ve gerekirse **rotate edilmesi** önerilir.

## 6. Firestore / Firebase riskleri (production verisine dokunulmadı)

`firestore.rules` (gerçek kod) analizi:
- **Katı kurallar:** `isOwner(uid)` sahiplik; `validUserDocument` **`hasOnly` ile 12 alanlık whitelist**
  [`email, displayName, photoURL, createdAt, setupCompleted, preferences, progress, streak, notificationSettings, lastActiveDeviceId, favorites, syncMeta`];
  alan-tip doğrulama (21 dil, `beginner/intermediate/advanced`, CEFR A1–C1, `frequencyMinutes ∈ [60,120,180,360,1440]`, `favorites` list ≤ 1000);
  `progress.learnedWords` bir **map**; catch-all `match /{document=**} { allow read, write: if false }`.
- **🔑 Migration kısıtı (Phase 3 konusu, şimdi DEĞİL):** `hasOnly` nedeniyle yeni top-level alan
  (`schemaVersion`/`lastActiveAt`/`progressSummary`) veya yeni subcollection (`progressByLevel`),
  **kurallar genişletilip deploy edilmeden dual-write açılırsa REDDEDİLİR.** Sıra: önce rules v2 deploy → sonra dual-write.
- `firestore.indexes.json` **YOK**; `firebase.json` yalnızca rules'a referans. v2 subcollection sorguları ileride index gerektirebilir.
- **R7:** `firebase-admin` mobil root `dependencies`'te; yalnızca sunucu `api/deleteAccount.js` + `api/grammarProxy.js` kullanıyor.
  `api/` ve `proxy/` kendi `package.json`'ına **sahip değil** → Vercel fonksiyonları admin SDK'yı **root manifest'ten** çözüyor.
  Bu yüzden admin SDK **güvenle kaldırılamaz**; ayrı manifest + Vercel config gerektirir → **ayrı onay** kalemi.
- Varsayılan proje: `vocbee-6fe24`. ~100+ kullanıcı varsayılır. **105 vocabulary asset** (21 dil × 5 CEFR) **local kalır**.

## 7. Backup önerisi (Phase 3 ön-koşulu)

Phase 0 Firestore verisine dokunmaz. Migration (Phase 3) öncesi:
- Tam export: `gcloud firestore export gs://<bucket>/pre-v2-<tarih>`.
- İlke: **önce kopyala → doğrula → en son temizle**; yedek doğrulanmadan ilerlenmez; eski alanlar yalnızca Phase 9'da silinir.
- Phase 0'da yapılacak: backup bucket + proje erişimi + `gcloud` yetkisinin **hazır olduğunun doğrulanması** (export çalıştırılmaz).

## 8. Branch / commit / tag stratejisi

- **Baseline tag (geri dönüş çıpası):** `git tag -a pre-refactor-v2-baseline 8373d5b -m "Phase 0 baseline"` + `git push origin --tags`.
- **Uzun-ömürlü dal:** `refactor-v2` (`master`'dan). Tüm faz PR'ları bunun üstüne.
- **PR başına küçük dallar** (doc 39): `feat/phase0-ci`, `chore/phase0-gitignore`, `docs/phase0-baseline`, vb.
- `master`'a doğrudan push yok; PR + CI gate ile merge. Conventional Commits önerilir.

## 9. Bilinen riskler (risk register `17` ile)

| # | Risk | Durum |
|---|---|---|
| R8 | CI yok → regresyon kaçışı | Phase 0'da minimal CI eklendi (`.github/workflows/ci.yml`). |
| R7 | `firebase-admin` mobil bundle'da | Root deps'te; `api/` root'tan çözüyor → kaldırma ayrı onay. audit:prod yüksek/kritik ağacının kaynağı. |
| R6 | Secret sızıntısı | Gerçek `.env` hiç commit edilmemiş; `.gitignore` sertleştirildi; secret-scan (gitleaks) follow-up. |
| — | Root `lint`/`build` yok | `lint` ESLint kurulumu gerektiriyor (PR-0.2); `build` EAS. Bu fazda eklenmedi (uydurma script yok). |
| — | `audit:prod` KIRMIZI | 1 kritik + 6 yüksek; çoğu build/dev/server-transitive. CI'da non-blocking; güvenli fix triajı bu raporda. |
| R9 | Riskli dosyalar coverage-dışı | `jest.config.js` exclude listesi; fazlar ilerledikçe daraltılır. |

**Faz-dışı gözlemler (kod değiştirilmedi):** rules + locale 21 dil iken bazı dokümanlar "22 dil" diyor; `config/coverage/` artifact.

## 10. Phase 1 geçiş kapısı (gate)

Doc 20 §16 + doc 18 DoD + doc 38 §8:
- [ ] `refactor-v2` dalı + `pre-refactor-v2-baseline` tag push.
- [ ] CI bir PR'da yeşil (typecheck variants + test:ci + functions:lint/build; rules CI'da `setup-java` ile).
- [ ] ESLint + Prettier + `lint` script (PR-0.2, `warn`).
- [ ] `.gitignore` sertleştirme (yapıldı) + secret-scan (gitleaks) job aktif.
- [ ] Commit'li client-config kararı (env/EAS secure file) + gerekirse rotate.
- [ ] `firebase-admin` ayrımı (R7) için ayrı onaylı plan.
- [ ] `audit:prod` triajı (güvenli fix uygulandı/raporlandı; --force YOK).
- [ ] Firestore backup prosedürü + erişim doğrulandı (Phase 3 kapısı).

**Geçiş şartı:** CI yeşil değilse, secret raporu kapanmadıysa veya backup doğrulanmadıysa **Phase 1'e geçme**.
