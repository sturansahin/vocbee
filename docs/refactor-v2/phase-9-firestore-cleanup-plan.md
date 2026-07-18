# Phase 9 — Firestore Legacy Cleanup Plan

> Bu doküman ilk olarak **yalnızca plan** olarak yazıldı. 2026-07-17 Prompt 9 revalidation'ında yalnız izole
> Firestore Emulator fixture'ı okundu/yazıldı/silindi ve geri yüklendi; staging/production Firestore'a
> dokunulmadı, `firestore.rules` değiştirilmedi. Aşağıdaki production adımları ayrı onaylıdır.

## 2026-07-17 Prompt 9 superseding revalidation

Bu dokümanın aşağıdaki ilk audit bölümleri tarihsel plan kanıtıdır; root `services/` path'leri Prompt 8'de
silindiği için güncel owner path'leri `src/features/**` altındadır. Güncel checkout yeniden doğrulaması:

- `FirestoreProgressRepository` concrete hazırlık implementasyonu artık vardır, fakat production composition'a
  bağlı değildir; v2 read flag sabit `false` ve runtime consumer sayısı sıfırdır.
- Aktif `FirestoreSyncRepository.saveSnapshot` ve `FirestoreUserProfileRepository.saveSetupCompletion` legacy
  `progress` yazmaya; `LegacySyncDomainGateway.restoreRemoteDomains` legacy alanı okumaya devam eder.
- Rules hâlâ legacy-only'dir ve v2 subcollection'ı catch-all ile reddeder.
- Production-safe, varsayılan dry-run ve çoklu fail-closed gate içeren cleanup CLI'sı
  `scripts/firestoreLegacyCleanup.cjs` olarak hazırlanmıştır. Unit ve gerçek emulator
  dry-run/transaction-delete/rollback testi PASS'tir.
- Staging, v2 rollout/adoption, backup restore ve ikinci owner onayı bulunmadığı için production dry-run/execute
  çalıştırılmadı. Güncel ayrıntı: `prompt-9-static-audit.md`, runbook ve production approval checklist.

Bu revalidation eski “script yok”/“concrete repository yok” ifadelerini supersede eder; destructive cleanup'ın
hazır olmadığı ana kararını değiştirmez.

## 0. Zemin doğrulaması (bu audit'te yapıldı)

Plan yazılmadan önce gerçek kod tabanı denetlendi:
- `firestore.rules` → `users/{uid}` dokümanında `validProgress()` yalnızca **legacy şekli** kabul ediyor:
  `{ currentLevel, learnedWords, lastWordIndex, lastSync }`. `progressByLevel` alt-koleksiyonu veya "v2"
  alanı için **hiçbir rule tanımı yok**.
- `services/SyncService.ts` + `services/progressService.ts` (aktif production kodu) yalnızca bu legacy
  şekli okuyup yazıyor.
- `src/features/progress/data/contracts.ts` içinde `RemoteProgressRepository` arayüzü v2
  (`progressByLevel` + dual-read) için **tasarlanmış** ama **hiçbir concrete implementasyonu yok**
  (`FirestoreProgressRepository.ts` sadece iskelet/contract, gerçek Firestore v2 repository sınıfı yazılmamış).
- Dual-write / dual-read / migration script'i / backfill kodu **hiçbir yerde production kodunda mevcut değil**.

**Sonuç: v2 Firestore modeli henüz hiçbir kullanıcı verisine uygulanmadı.** Aşağıdaki plan bu gerçek
duruma göre yazılmıştır — "temizlenecek v2 sonrası eski alan" şu anda **yok**, çünkü v2'ye geçiş henüz
başlamadı. Bu doküman, o geçiş **gerçekleştiğinde** izlenecek cleanup prosedürünü tanımlar.

---

## 1. Hangi legacy alanlar var?

`firestore.rules` → `validUserDocument()` şu alanları tanımlıyor (`users/{uid}` dokümanı):
```
email, displayName, photoURL, createdAt, setupCompleted,
preferences, progress, streak, notificationSettings,
lastActiveDeviceId, favorites, syncMeta
```

Bunların içinde "legacy" olarak işaretlenebilecek, gelecekte v2 modele geçince eski sayılacak alan:
- `progress.learnedWords` (map: `{ [level]: number[] }`) — plan dokümanlarında (`07`, `08`, `34`) v2'de
  `progressByLevel/{level}` alt-koleksiyonuna taşınması öngörülüyor.
- `progress.currentLevel`, `progress.lastWordIndex` — v2'de `progressByLevel` içine dağıtılması planlanan alanlar.
- `favorites` (flat list, max 1000 eleman) — v1 modelinde `users/{uid}.favorites`; v2 planında ayrı
  alt-koleksiyon (`favorites/{level}_{id}` gibi) önerilmiş olabilir (doc `07`'de detaylandırılmış, henüz
  kod tarafında karşılığı yok).

**Not:** Bunların hiçbiri şu anda "eski/kullanılmayan" değil — hepsi **şu anki tek ve aktif** production
şeklidir. "Legacy" sıfatı yalnızca v2 migration'ı gerçekleştiğinde anlam kazanacak.

## 2. Hangi alanlar hâlâ aktif kod tarafından kullanılıyor?

**Hepsi.** Doğrulama: `services/SyncService.ts`, `services/progressService.ts`, `services/favoritesService.ts`,
`services/notificationService.ts`, `context/AuthContext.tsx` (via `services/SyncService.ts`) bu alanların
tümünü okuyup yazıyor. `firestore.rules`'ın `validUserDocument()` fonksiyonu bunları `hasOnly(...)` ile
sıkı şekilde doğruluyor — yani bugün bu alanlardan biri kaldırılırsa **mevcut production app'i kırar**.

## 3. Hangi alanlar migration sonrası temizlenebilir?

Şu an **hiçbiri temizlenemez** çünkü migration henüz yok. v2 migration'ı (doc `08` planına göre) tamamlanıp
aşağıdaki koşullar sağlandığında, şu alanlar cleanup adayı olur:
- `progress.learnedWords`, `progress.currentLevel`, `progress.lastWordIndex` → `progressByLevel/{level}`
  alt-koleksiyonuna taşındıktan ve doğrulandıktan sonra.
- Flat `favorites` listesi → (varsa) v2 favorites modeline taşındıktan sonra.

Cleanup **koşulları** (doc `08` §9-10 ile uyumlu):
- Dry-run migration raporu %0 uyumsuzluk göstermeli.
- Rastgele örneklenen kullanıcılarda manuel doğrulama yapılmalı.
- Backup alınmış ve geri yüklenebilirliği test edilmiş olmalı.
- Uyumluluk penceresi (bkz. §4) kapanmış olmalı — yani dual-read gerektiren hiçbir eski app sürümü
  aktif kullanıcı tarafından kullanılmıyor olmalı.

## 4. Kaç sürüm backward compatibility korunmalı?

Bu depoda **sürüm/rollout telemetrisi altyapısı yok** (analytics/version-distribution tracking kod
tabanında bulunamadı — `expo-updates`/EAS kullanılıyor ama app-sürümüne-göre-kullanıcı-dağılımı raporlayan
bir mekanizma yok). Bu nedenle şu an **kesin bir sayı verilemez**; öneri:
- **Minimum 2 minor sürüm** (v2 model destekleyen ilk sürüm + bir sonraki) dual-read açık tutulmalı —
  bu, EAS OTA update benimseme oranı ile app store review süresi (iOS/Android manuel güncelleme gecikmesi)
  dikkate alınarak konservatif bir alt sınırdır.
- Gerçek sayı, aşağıdaki §5'teki adoption-rate ölçümü kurulmadan **belirlenemez** — bu plan dokümanı bunu
  bir **açık risk** olarak işaretler (bkz. doc `17-risk-register.md` R12).

## 5. Kaç kullanıcı yeni modele geçtiği nasıl doğrulanacak?

Mevcut kod tabanında bu ölçüm için **hazır bir mekanizma yok**. Kurulması gereken (henüz kurulmadı):
- `users/{uid}.syncMeta` alanına (zaten var, `version` alanı içeriyor — `firestore.rules` §`validSyncMeta`)
  bir **schema/model versiyonu** eklenmesi (örn. `syncMeta.progressSchemaVersion: 1 | 2`).
- Cloud Functions (`functions/src/index.ts`) tarafında, periyodik olarak `users` koleksiyonunu tarayıp
  `progressSchemaVersion` dağılımını raporlayan **salt-okunur** bir script/fonksiyon (yazma yapmaz).
- Rapor formatı: `toplam kullanıcı`, `v1 (legacy) sayısı`, `v2 sayısı`, `%v2 oranı`, tarih damgası.
- Adoption **%100'e** ulaşmadan (veya kabul edilebilir bir eşik + kalan kullanıcıların aktif olmadığı
  kanıtlanmadan) cleanup script'i **çalıştırılmaz**.

## 6. Dry-run raporu ne içermeli?

Doc `08` §6 ve `34` §6 (implementation-spec) ile uyumlu, dry-run script'i (yazma YAPMAZ) şunları üretmeli:
- **Satır bazlı:** `uidMask=ab12…` (uid'nin maskeli hali — PII yok), her seviye için
  `A1: eskiSayı→yeniSayı, A2: ..., status=OK|MISMATCH|SKIPPED`.
- **Toplam özet:** taranan kullanıcı sayısı, geçen (`OK`) sayısı, uyumsuz (`MISMATCH`) sayısı, atlanan
  (`SKIPPED` — örn. `progress` alanı `null` olan kullanıcılar) sayısı.
- **Uyumsuzluk detayı:** `MISMATCH` olan her kayıt için hangi seviyede kaç kelime farkı var (debug için,
  yine PII'siz).
- **Karar kuralı:** `MISMATCH > 0` ise migration **otomatik durur**, insan incelemesi gerekir — script
  bu durumda hiçbir yazma işlemi yapmamalı (yalnızca rapor).
- **Performans/rate-limit notu:** kaç batch'te tamamlandığı, Firestore read/write quota kullanımı.

## 7. Rollback penceresi ne zaman kapanır?

Önerilen pencere modeli (henüz uygulanmadı, karar bekliyor):
- **Backfill sonrası, cleanup öncesi:** rollback penceresi **backup alındığı andan**, §5'teki adoption
  ölçümü ile "eski alanlara artık hiçbir kod erişmiyor" doğrulanana kadar **açık** kalır.
- Pencere şu koşulların **hepsi** sağlanınca kapanır (yani cleanup'a izin verilir):
  1. Dry-run %0 mismatch.
  2. Rastgele N kullanıcı manuel doğrulaması geçti (doc `08` checklist).
  3. §5 adoption raporu → eski şemaya bağımlı aktif kullanıcı sayısı sıfıra yakın (kabul edilen eşik
     ayrı onayla belirlenir).
  4. Backup'tan geri yükleme **test edilmiş** (canlıya değil, ayrı bir projede/emulator'da).
  5. En az §4'teki minimum sürüm sayısı kadar süre geçmiş.
- Bu koşullardan biri sağlanmadan pencere kapanmaz; cleanup script'i bu kontrolleri **otomatik olarak
  reddetmeli** (insan onayı olmadan çalışamamalı — bkz. §8).

## 8. Production cleanup için hangi açık onay gerekir?

Doc `29` (Phase 9 planı) §16 ile uyumlu, production'da gerçek alan silme işlemi şu onay zincirini
gerektirir (bu depoda **hiçbiri bu görevde alınmamıştır/uygulanmamıştır**):
1. **Backup doğrulaması onayı** — `gcloud firestore export` alınmış VE bir test projesine restore
   edilerek doğrulanmış olmalı; bu adımın kanıtı (export ID, restore test sonucu) onay isteğine eklenir.
2. **Dry-run raporu onayı** — §6'daki raporun %0 mismatch ile insan tarafından gözden geçirilmiş olması.
3. **Adoption eşiği onayı** — §5 raporunun, önceden üzerinde anlaşılan eşiği (örn. "%99+ v2'de VEYA kalan
   %1 son 90 gündür aktif değil") karşıladığının onaylanması.
5. **Ayrı, yazılı, kod-dışı onay** — bu silme işlemi bu chat/agent oturumunda **otomatik tetiklenemez**;
   repo sahibinin (ürün/veri sorumlusu) açık, yazılı onayı olmadan hiçbir silme script'i çalıştırılmaz
   (doc `29` §16: "Eski alan silme onayı alınmadan silme yapılmaz").
6. **Rollback planı hazır onayı** — silme script'i çalıştırılmadan önce, geri alma prosedürünün
   (backup'tan restore adımlarının) yazılı ve test edilmiş olması.

Bu onay zincirinden **herhangi biri** eksikse, cleanup script'i **yazılabilir/test edilebilir** ama
production'da **çalıştırılamaz**.

---

## 9. Bu planın kapsam dışı bıraktığı işler

- `firestore.rules` değişikliği (v2 alanlarını `hasOnly` listesine ekleme) — ayrı, onaylı bir sub-phase.
- `FirestoreProgressRepository` concrete implementasyonu — ayrı bir feature-refactor işi (Phase 4/5 kapsamı,
  Phase 9 değil; bkz. Phase 9A analizindeki bulgu: bu iş henüz tamamlanmamış).
- Gerçek backfill/migration script'inin yazılması ve çalıştırılması — bu doküman sadece **prosedürü**
  tanımlar, script'i içermez.
- Adoption/version-tracking telemetrisinin kurulması — ayrı bir gözlemlenebilirlik (observability) işi.

## Kabul kriterleri (bu planın "tamamlandı" sayılması için)

- [x] Legacy alanlar tespit edildi (§1).
- [x] Aktif kullanım doğrulandı (§2).
- [x] Cleanup koşulları tanımlandı (§3).
- [x] Backward-compat süresi için öneri + açık risk not edildi (§4).
- [x] Adoption doğrulama mekanizması tanımlandı, henüz kurulmadığı not edildi (§5).
- [x] Dry-run rapor formatı tanımlandı (§6).
- [x] Rollback penceresi kapanma koşulları tanımlandı (§7).
- [x] Production onay zinciri tanımlandı (§8).
- [ ] **Uygulama** — bu doküman kapsamı dışında; ayrı, açık onaylı bir faz gerektirir.
