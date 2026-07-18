# 17 — Risk Register

| # | Risk | Olasılık | Etki | Azaltma | Sahip faz |
|---|---|---|---|---|---|
| R1 | Firestore migration’da veri kaybı | Düşük | Kritik | backup + dual-read/write + dry-run + cleanup en sonda | 07/08/23 |
| R2 | God-screen bölünürken davranış regresyonu | Orta | Yüksek | davranış sözleşmesi (`03`) + shim + QA | 25/27 |
| R3 | Notification zamanlama bozulması | Orta | Yüksek | domain testleri + staged rollout | 26 |
| R4 | Auth/login provider regresyonu | Orta | Yüksek | provider başına QA + shim | 24 |
| R5 | Premium tanınmama / reklam gelir kaybı | Düşük | Yüksek | gating testleri + QA | 28 |
| R6 | Secret sızıntısı (.env, plist, admin key) | Orta | Kritik | gitignore + rotate + secret-scan | 09/20 |
| R7 | `firebase-admin` mobil bundle’da | Yüksek | Orta | sunucu paketine ayır | 09/20 |
| R8 | CI yokluğu → regresyon kaçışı | Yüksek | Orta | Phase 0’da CI kur | 16/20 |
| R9 | Coverage exclude’daki riskli kod | Yüksek | Orta | bölündükçe exclude daralt | 15 |
| R10 | Barrel/döngüsel import | Orta | Orta | `import/no-cycle` lint | 21 |
| R11 | Dual-write penceresinde çakışma | Düşük | Orta | `syncMeta` device-id kuralı | 23 |
| R12 | Eski app sürümü yeni şemayı bilmiyor | Orta | Orta | uyumluluk penceresi + schemaVersion | 23 |
| R13 | Devasa diff / review zorluğu | Orta | Orta | shim + küçük PR + faz sıralaması | tümü |
| R14 | i18n/RTL regresyonu (22 dil) | Düşük | Orta | dil değişimi QA | 21/27 |

## İzleme
- Her faz sonu risk durumu güncellenir; açık Kritik/Yüksek risk varken sonraki faza geçilmez (`30`/`31`).

## Phase 4 / Prompt 1 durumu — 2026-07-13

- **R4 açık / Yüksek:** Auth, profile ve sync katman ayrımı; provider factory; compatibility shim'leri ve otomatik regresyon testleri tamamlandı.
- Email/Google/Apple login, şifre sıfırlama, hesap silme, iki cihaz sync çakışması ve profil güncelleme fiziksel cihaz QA'sı bu checkout'ta çalıştırılamadı.
- R4, provider başına cihaz QA'sı tamamlanıp execution ledger'a kanıt eklenene kadar kapanmış sayılmaz; Prompt 2 gate'i kapalıdır.

## Phase 4 / Prompt 1 QA güncellemesi — 2026-07-14

- **R4 kapalı:** iPhone 17 Pro / iOS 26.5 Simulator üzerinde session bootstrap, logout cleanup ve email login akışları runtime loglarıyla doğrulandı.
- Google/Apple ilk başarısız deneme loglarından sonra kullanıcı nihai manual QA sonucunu email/Google/Apple login, şifre sıfırlama, hesap silme, iki cihaz sync çakışması ve profil güncelleme dahil "hepsi çalışıyor" olarak onayladı.
- Prompt 1 execution ledger'ına superseding `complete` kaydı eklendi; Prompt 2 gate'i açıldı.

## Prompt 2 servis katmanı güncellemesi — 2026-07-14

- **R1/R11/R12 kontrollü:** Firestore migration, schema veya storage-key değişikliği yapılmadı. `users/{uid}` ana dokümanı, `progress`/`favorites`/`streak` payload'ları ve `syncMeta.version=1` davranışı korundu; mevcut `progressByLevel` hazırlık repository'si aktive edilmedi.
- **R9 azaltıldı:** vocabulary cache fallback, progress mutation, favorites add/remove/check ve review eligibility için 4 suite/15 test eklendi; mevcut streak ve SyncOrchestrator retry/integration testleriyle birlikte hedefli 6 suite/43 test geçti. Full Jest 74 suite/425 testtir; coverage exclude listesi genişletilmedi.
- **R2'nin Prompt 2 servis kapsamı kapalı:** iPhone 17 Pro / iOS 26.5 Simulator üzerinde vocabulary üretimi, progress/favorites restore, üç kelime öğrenme, iki favori ekleme, streak güncelleme, reload sonrası progress kalıcılığı ve favorites Firebase sync gözlendi. HomeScreen parçalama ve Phase 5'in tam ekran/manual checklist'i Prompt 3 sahibi olarak açık kalır.
- Prompt 2'nin sahibi olduğu açık Kritik/Yüksek risk kalmadı; compatibility shim'leri rollback yüzeyi olarak korunuyor.

## Prompt 6 Settings / Setup / Onboarding / Auth ekran güncellemesi — 2026-07-16

- **R2 açık / Yüksek (manual QA bekliyor):** Beş root screen logic-free shim'e çevrildi; Settings/Setup/Auth ana
  ekranları 400 satır altında, platform erişimleri facade/adapter arkasında ve iOS production bundle'ı 1.870
  modülle başarıyla üretildi. Ancak bu sandbox CoreSimulatorService'e erişemediği için ilk kurulum, dil/seviye,
  bildirim ayarı, avatar/profil, logout ve hesap silme etkileşimli checklist'i çalıştırılamadı.
- **R14 açık / Orta:** Dil değiştirme ve sistem dili akışı `SettingsFacade` arkasına alındı; storage key'leri ve
  notification reschedule davranışı korundu. RTL dilin gerçek cihaz/simulator görsel doğrulaması owner QA'sına
  kadar açık kalır.
- Auth provider/repository davranışı değiştirilmedi; login/register/forgot validation ve facade success/error
  yolları otomatik testlerle kapsandı. Prompt 7 gate'i, Prompt 6 manual QA sonucu execution ledger'da
  superseding `complete` kaydıyla belgelenene kadar kapalıdır.

## Prompt 6 QA güncellemesi — 2026-07-16

- **R2 kapalı:** Kullanıcı/owner güncel Prompt 6 checkout'unda ilk kurulum/onboarding/setup, dil ve seviye
  değişimi, notification ayarı, profil/avatar, login/register/forgot, logout ve hesap silme confirmation
  checklist'inin tamamı için "çalışıyor hepsi" sonucunu bildirdi. Simulator runtime logları setup
  persistence/vocabulary/notification tamamlanmasını, MainTabs'e geçişi ve logout sonrası local cleanup ile
  Login route'una dönüşü ayrıca doğruladı.
- **R14 kapalı:** Owner onayı RTL dil ve dil değiştirme akışını da kapsar; storage key, route veya payload
  uyumluluğunda regresyon bildirilmedi.
- Prompt 6 execution ledger'ına önceki `blocked` kaydı koruyan superseding `complete` kaydı eklendi; Prompt 7
  gate'i açıldı.

## Prompt 7 shared/boundary güncellemesi — 2026-07-16

- **R10 kapalı:** `import/no-cycle` error seviyesine yükseltildi; AST boundary suite'i legacy root import,
  cross-feature deep import, layer/SDK ve public-barrel sınırlarını 5/5 testle doğruluyor.
- **R13 kontrollü:** 50 root production modülü owner/hedef path ile envanterlendi; tamamı logic-free shim.
  Aktif implementasyonlar shared/app/feature sınırlarına taşındı ve rollback yüzeyi Prompt 8'e kadar korunuyor.
- **R6 değişmedi/kontrollü:** Firebase initialization tek `@shared/firebase` entrypoint'ine taşındı; config
  değerleri, credential veya environment sözleşmesi değiştirilmedi ve yeni secret eklenmedi.
- **R14 kapalı kalır:** iOS simulator smoke persisted Türkçe/dark-theme Login render'ını doğruladı; Prompt 6
  owner QA'sındaki dil/RTL sonucu geçerlidir. i18n kaynakları, dil listesi ve storage key'leri değişmedi.
- Prompt 7 sahibi açık Kritik/Yüksek risk yoktur.

## Prompt 8 cleanup/security güncellemesi — 2026-07-16

- **R6 açık / Kritik:** Mevcut mobile/server/tool source ağacı Gitleaks ile temizdir; ancak tam Git geçmişi
  `0212d97eb3fb0620d35d3be578aa94ce81402a24:services/groqService.ts:1` konumunda gerçek bir `gsk_...` Groq
  token'ı buldu. Token current tree'de yoktur fakat revoke/rotation kanıtı repository'den doğrulanamaz.
- Yedi ek `generic-api-key` bulgusu CocoaPods SHA-1 checksum'ları ve AppCheckCore public header'ındaki örnek debug
  token yorumudur; yalnızca exact rule/path/pattern kombinasyonları `.gitleaks.toml` içinde allowlist edilmiştir.
- R6, owner Groq anahtarını revoke/rotate edip kanıtlı olarak bildirmeden kapanmaz. Bu gerçekleşene kadar Prompt 8
  production-readiness ve Prompt 9/10 gate'leri fail-closed kalır; gerçek bulgu CI'da ignore edilmez.
- **R8 azaltıldı:** secret scan, zero-warning lint, AST boundary, feature coverage, rules emulator,
  Functions lint/build ve high/critical production dependency audit blocking CI gate'leridir.
- **R9 azaltıldı:** Auth/Profile/Learning/Vocabulary/Notifications/Settings/Setup için ayrı line-coverage alt
  sınırları ve toplam `%50` line gate'i eklenmiştir; son full run toplam `%51.7` line coverage üretmiştir.

## Prompt 8 Groq rotation güncellemesi — 2026-07-17

- **R6 kapalı:** Owner yeni Groq production key'i oluşturup Vercel `vocbee-proxy` Preview+Production
  `GROQ_API_KEY` secret'ını güncelledi. Replacement secret tarihsel değerden farklıdır; Groq models ve gerçek
  inference smoke çağrıları HTTP 200 ve geçerli payload döndürdü.
- Mevcut production artifact yeni environment revision ile yeniden deploy edildi:
  `dpl_BbMAicHuitfhqhtrYNAVa79KV3Df`, status `Ready`, alias `https://vocbee-proxy.vercel.app`. Proxy'nin
  unauthenticated request'i HTTP 401 ile fail-closed kaldı.
- Tarihsel `...52DO` key rotation öncesi HTTP 200, owner revocation sonrası HTTP 401 döndürdü. Revoked immutable
  Gitleaks fingerprint'i `.gitleaksignore` içinde exact fingerprint olarak baselinedir; yeni secret repository'ye,
  loglara veya ledger'a yazılmadı.
- Current source ve full-history Gitleaks gate'leri bu baseline dışındaki tüm bulgular için blocking kalır.

## Prompt 9 Firestore cleanup hazırlığı — 2026-07-17

- **R1 açık / Kritik:** Production runtime legacy `users/{uid}.progress` alanını hâlâ aktif okuyup yazıyor;
  `progressByLevel` rules/rollout/adoption tamamlanmadı. Bu nedenle production field deletion yasaktır.
- **R11 kontrollü fakat cleanup için kapalı gate:** v2 dual-write hiç aktive edilmedi. Script execute için
  `dualWrite=disabled` ister, ancak bugünkü legacy-only write durumu v2 geçişinin tamamlandığı anlamına gelmez.
- **R12 açık / Orta:** App version/schema adoption telemetry yok ve compatibility window kapanışı kanıtlanamıyor.
- Fail-closed cleanup CLI, explicit environment/project allowlist, verified credential metadata, backup/restore,
  exact dry-run count, staging evidence ve ikinci owner approval gate'leriyle hazırlandı. Unit test 7/7 ve gerçek
  Firestore Emulator dry-run → transaction delete → post-check → rollback testi 1/1 PASS.
- Staging hedefi/credential'ı tanımlı değil; production remote dry-run ve destructive execute yapılmadı. R1/R12
  kapanmadan Prompt 9 `complete`, production-ready veya Prompt 10 gate `open` beyan edilemez.
- **2026-07-18 metadata kanıtı:** Firebase Projects/Firestore Admin API salt-okunur audit'inde erişilebilir tek
  proje `vocbee-6fe24`; ayrı staging yok. `(default)` database `eur3`, Native/Standard; backup 0, schedule 0,
  PITR disabled, delete protection disabled ve restore kanıtı yok. Bu sonuç R1 cleanup riskini azaltmaz; aksine
  backup/staging gate'lerini somut olarak kapalı doğrular. User document okunmadı ve remote write/delete yapılmadı.
