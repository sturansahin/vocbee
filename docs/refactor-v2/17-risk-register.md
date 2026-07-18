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

## 2026-07-18 progress v2 rollout hazırlığı

- **R1 kontrollü fakat açık/Kritik:** Legacy veri silinmeden rollout-gated atomik dual-write, fail-closed
  dual-read/reconcile, eski istemci mirror function'ı, v2 rules ve yeni schema doğrulamalı cleanup audit'i
  hazırlandı. Safe default `legacy`; production deploy/backfill/cleanup yapılmadı.
- **R11 kontrollü/Orta:** Ana belge + beş seviye belgesi tek batch'te yazılıyor; her yazım device id,
  server timestamp, vocabulary schema ve doc version taşıyor. Eski istemci mirror'ı duplicate/geçersiz veri
  gördüğünde uzaktan normalize ederek yazmak yerine duruyor.
- **R12 açık/Orta:** `schemaVersion=2` ve `progressMigration` adoption sinyalleri hazır olsa da ayrı staging,
  yayın adoption metriği ve iki sürüm/90 gün compatibility kanıtı henüz yok. Legacy alan ve mirror bu nedenle
  korunur; cleanup gate'i kapalıdır.
- Hesap silme endpoint'i recursive delete'e geçirildi; v2 subcollection'ın yetim kalma riski kapatıldı.
- Ayrıntılı deploy/backfill sırası ve kapalı gate: `44-progress-v2-safe-rollout.md`.

## 2026-07-18 staging bootstrap ve backup gate

- **R1 açık/Kritik:** Ayrı `vocbee-staging-6fe24` projesi, `eur3` Standard/Native Firestore ve delete protection
  oluşturuldu; v2 rules yalnız staging'e deploy edildi. Bu, production veri kaybı riskini azaltan ilk remote
  izolasyon kanıtıdır; production rules/data değişmedi.
- **R1 blocker:** Staging mirror function deploy'u predeploy lint/build sonrasında Blaze/Cloud Build gereksiniminde
  fail-closed durdu. Eski istemci legacy-write mirror smoke'u henüz gerçek staging üzerinde kanıtlanmadı.
- **R1 backup blocker:** Production günlük/14 gün managed backup schedule isteği billing kapalı olduğu için reddedildi;
  son schedule ve backup sayısı 0. Restore kanıtı bu nedenle yoktur.
- **R12 açık/Orta:** Staging rules hazır olsa da function/app flow ve adoption ölçümü yok; safe default `legacy`,
  legacy alan ve cleanup yasağı korunur.
- PII'siz kanıt: `docs/refactor-v2/artifacts/progress-v2-staging-bootstrap-evidence.json`.

## 2026-07-18 client reconciliation owner kararı

- **R1 kontrollü fakat açık/Kritik:** Owner Cloud Function yerine mobile client dual-write + timestamp reconciliation
  seçti ve legacy alana dokunulmamasını istedi. Function export/source/test/CI adımı kaldırıldı; staging Blaze artık
  progress-v2 önkoşulu değildir.
- **R11 kontrollü/Orta:** Yeni client legacy + v2'yi tek batch'te yazar. Eski client'ın daha yeni legacy yazımı,
  yeni client'ın sonraki sync'inde `lastSync > oldestV2.updatedAt` kontrolüyle algılanır; repair yalnız v2 ana
  metadata + beş level belgesini merge eder ve legacy `progress` alanını payload'a dahil etmez. Repair Firestore
  transaction içinde ana legacy belgeyi tekrar okur; aradaki concurrent eski-client yazımı transaction retry'ı
  tetikler ve stale içeriğin daha yeni v2 timestamp'iyle sessizce kazanmasını engeller.
- **Bilinçli eventual-consistency riski/Orta:** Eski client yazımından yeni client'ın sonraki sync'ine kadar v2 stale
  kalabilir. Legacy veri canonical fallback olarak korunduğundan veri kaybı olmaz; bu süre içinde v2 tek başına
  authoritative kabul edilmez.
- **R12 açık/Orta:** Production safe default `legacy`; staging client smoke, backup/restore ve canary adoption kanıtı
  olmadan dual rollout yok. Legacy cleanup mevcut owner kararında yasaktır.
- **Remote config drift/Düşük:** Function kaldırıldıktan sonraki rules farkı yalnız server-owned Admin backfill
  metadata değerlerini sadeleştirir; client v2 rule kontratı değişmedi. Staging redeploy, `firebaserules.googleapis.com`
  DNS `ENOTFOUND/ETIMEOUT` nedeniyle üç denemede gerçekleşmedi; emulator 14/14 PASS. Staging smoke öncesi retry edilir.
- PII'siz karar kanıtı: `docs/refactor-v2/artifacts/progress-v2-client-reconciliation-decision.json`.

## Prompt 10 final readiness audit'i — 2026-07-18

- **R5 yeniden açık/Yüksek:** `eas.json` production profilinde iOS RevenueCat public SDK key'i tanımlı, ancak
  Android `goog_` key'i yok. Production repository Android'de key yoksa fail-fast olur; ilk customer-info
  hatası provider tarafından free fallback'e çevrilse de premium tanıma, paywall ve restore davranışı production
  config kanıtı olmadan doğru kabul edilemez.
- **R7 açık/Orta:** Root mobile `package.json` hâlâ `firebase-admin` production dependency'sini taşır. Güncel
  iOS Hermes HBC string taramasında `firebase-admin` marker'ı 0 olsa da `09`/`30` tarafından istenen server/mobile
  dependency ayrımı yapılmamıştır.
- **R8 kontrollü fakat release gate açık:** Local typecheck/lint/Jest/rules/coverage/audit/secret-scan kapıları
  yeşildir; buna rağmen `ef263d14`, `origin/refactor` önünde 19 commit olduğu için current HEAD'e ait remote CI
  sonucu yoktur. Push ve tüm blocking job'ların green sonucu olmadan release gate kapanmaz.
- **R13 açık/Orta:** Legacy root source temizliği tamamlanmış olsa da gerçek Settings presentation
  implementasyonu 1.951, notification application service 1.041 ve AdMob repository 644 satırdır. Explicit
  `<400` Settings kabulü başarısızdır; diğer büyük dosyalar maintainability/review borcudur.
- **R1 current legacy release için N/A; v2 activation için açık/Kritik kalır:** EAS profillerinde
  `EXPO_PUBLIC_PROGRESS_SYNC_MODE=dual` yoktur ve exact olmayan değer safe `legacy` davranışına düşer. Bu release
  migration/cleanup yapmaz. Gelecekteki v2 activation staging client smoke + production backup/restore + canary
  onayı olmadan başlatılamaz.
- Final karar **BLOCKED**. Kanıt ve blocker ID'leri:
  `docs/refactor-v2/44-final-production-readiness-report.md`.

## Prompt 10 superseding local-ready closure — 2026-07-18 13:01 +03

- **R5 current iOS release için N/A:** Owner Android'ı mevcut release kapsamından çıkardı. iOS RevenueCat config
  kanıtı geçerlidir. Android tekrar release scope'a girerse `goog_` production key, config testi, build ve emulator
  smoke tamamlanmadan R5 yeniden Yüksek açılır.
- **R7 kapalı:** `firebase-admin` root mobile dependency'den çıkarıldı; `api/` npm workspace'i server dependency
  ownership'ini taşır, Functions kendi bağımsız ownership'ini korur. CI manifest/source boundary kontrolü ve iOS
  HBC marker 0 kanıtı mobile bundle regresyonunu fail-closed tutar. Bu ayrım ek çağrı veya maliyet üretmez.
- **R8 local kapalı / owner remote handoff:** Prettier, lint, typecheck, 91/496 Jest, coverage, rules 14/14,
  cleanup 7/7+1/1, Functions ve high/critical audit gate'leri green. Current worktree için GitHub remote CI henüz
  çalışmadı; owner commit/push ve dört blocking job'ın green sonucunu release öncesi doğrulayacak.
- **R13 Settings için kapalı:** Gerçek Settings content 15 satır; controller 359 ve en büyük style modülü 371.
  Settings production dosyalarının tamamı `<400`. Notification application service, AdMob repository ve streak
  overlay boyutları blocker olmayan maintainability borcu olarak kalır.
- **Vercel duplicate project riski / Düşük:** Local build CLI'sı yanlışlıkla boş `vocbee` projesi oluşturup GitHub
  reposuna bağladı; deploy/production URL yok. Gerçek `vocbee-proxy` local build'i PASS. Owner boş projeyi silme
  veya Git bağlantısını kaldırma kararı verene kadar push duplicate Vercel build tetikleyebilir; source/runtime
  correctness'i etkilemez fakat gereksiz build kotası tüketebilir.
- Prompt 9 legacy-preservation ve progress-v2 safe-default `legacy` kararı değişmedi. Production Firebase data,
  cleanup, migration, rules/functions/app deploy veya release yapılmadı. Güncel karar ve kanıt:
  `docs/refactor-v2/44-final-production-readiness-report.md` 13:01 superseding audit'i.
