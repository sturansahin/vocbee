# Prompt 9 — Firestore Legacy Cleanup Runbook

Bu runbook `users/{uid}.progress` alanının v2 `progressByLevel` rollout'u tamamlandıktan sonra güvenli biçimde
temizlenmesi içindir. Bugünkü checkout'ta rollout tamamlanmadığından production execute yetkili değildir.

## 1. Değişmez güvenlik kuralları

1. `firebase use` veya CLI default project kullanılmaz; her komutta explicit project ID bulunur.
2. Script varsayılan olarak read-only dry-run'dır. Yazma yalnız `--execute` ile açılır.
3. Production remote dry-run'dan önce hedef environment/project, doğrulanabilir credential identity, backup ve
   rollback cevapları owner tarafından doldurulur.
4. Execute; exact project confirmation, restore-verified backup, kapalı compatibility window, disabled dual-write,
   staging kanıtı, dry-run'daki exact candidate sayısı ve hedefe özgü ikinci owner onayı olmadan fail-closed durur.
5. Adayların tamamı önce taranır. `mismatched > 0` ise hiçbir alan silinmez.
6. Her aday transaction içinde yeniden doğrulanır. Dry-run ile execute arasındaki drift tüm çalışmayı durdurur.
7. Repository raporları yalnız redacted özet taşır. Execute operasyon logu repository dışında, erişimi sınırlı
   bir path'e yazılır. UID, email, displayName, credential veya ham payload loglanmaz.
8. `favorites` cleanup kapsamı dışındadır.

## 2. Ön koşul sırası

Production dry-run'dan önce:

- v2 rules deploy edilmiş ve emulator/staging rules testleri PASS olmalı;
- production runtime `progressByLevel` read/write yoluna geçmiş olmalı;
- geçici dual-write dönemi tamamlanmış ve dual-write kapatılmış olmalı;
- client version/schema adoption kanıtı compatibility window'un kapandığını göstermeli;
- staging project ve production'dan ayrı credential identity tanımlı olmalı;
- immutable backup/export alınmış, retention kaydedilmiş ve ayrı database/projede restore drill PASS olmalı;
- owner checklist'in ilk bölümü doldurulmalı.

Bugünkü static audit bu koşulların sağlanmadığını gösterir.

## 3. Backup ve restore drill

Google'ın güncel dokümantasyonuna göre Firestore scheduled backup restore'u yeni bir database oluşturur; managed
export/import ise Cloud Storage üzerinden yapılır. Kaynaklar:

- https://cloud.google.com/firestore/docs/backups
- https://docs.cloud.google.com/firestore/native/docs/manage-data/export-import

Operasyon ekibi aşağıdakilerden birini seçip exact resource ID'yi kaydetmelidir. Placeholder'lar değiştirilmeden
komut çalıştırılmaz.

### Seçenek A — mevcut Firestore backup

```bash
gcloud firestore backups list \
  --project='<EXPLICIT_PROJECT_ID>' \
  --location='<FIRESTORE_LOCATION>' \
  --format='table(name,database,state)'

gcloud firestore backups describe \
  --project='<EXPLICIT_PROJECT_ID>' \
  --location='<FIRESTORE_LOCATION>' \
  --backup='<BACKUP_ID>'
```

Restore drill, production database'i değiştirmeyen yeni bir database ID'ye yapılır:

```bash
gcloud firestore databases restore \
  --project='<EXPLICIT_PROJECT_ID>' \
  --source-backup='projects/<EXPLICIT_PROJECT_ID>/locations/<LOCATION>/backups/<BACKUP_ID>' \
  --destination-database='<NEW_RESTORE_TEST_DATABASE_ID>'
```

### Seçenek B — managed export

```bash
gcloud firestore export 'gs://<BUCKET>/<IMMUTABLE_PREFIX>' \
  --project='<EXPLICIT_PROJECT_ID>' \
  --database='(default)'

gcloud firestore operations list \
  --project='<EXPLICIT_PROJECT_ID>'
```

Export operasyonu tamamlanmadan backup geçerli sayılmaz. Restore drill hedefi production olmayan ayrı bir
project/database olmalı; `users` ve `progressByLevel` collection group'larının tamamı restore kapsamına alınmalıdır.
Managed export tam anlık snapshot olmayabileceğinden cleanup boyunca write-free bakım penceresi ayrıca gerekir.

Restore kanıtı şunları içermelidir: backup/export resource ID, kaynak project ID, oluşturulma zamanı, retention,
restore hedefi, operation `done` sonucu, document count karşılaştırması ve v2/legacy equivalence dry-run sonucu.
Ham payload veya PII repository'ye konmaz.

> Production database'i silip aynı ID'ye restore etmek ayrı ve çok daha destructive bir incident prosedürüdür;
> bu Prompt 9 onayı onu kapsamaz. Alan cleanup rollback yöntemi, onaylanan backup'tan yalnız etkilenen user
> document'larını bakım penceresinde geri getiren ve staging'de test edilmiş prosedür olmalıdır.

## 4. Yerel ve emulator doğrulama

```bash
npm run firestore:cleanup:check
npm run test:firestore-cleanup
npm run test:firestore-cleanup:emulator
```

Emulator testi gerçek Admin SDK/Firestore Emulator ile şu zinciri çalıştırır:

`seed → dry-run (write=0) → exact approval fixture → transaction delete → post-delete verify → legacy rollback → verify`

## 5. Remote dry-run

Bu komut yalnız checklist'in ilk onayı ve staging/backup hazırlığı tamamlandıktan sonra güvenli operasyon
ortamında çalıştırılır. Service-account JSON repository dışında tutulur; workload identity kullanılıyorsa doğrulanmış
identity/project attestation environment tarafından sağlanır.

```bash
GOOGLE_APPLICATION_CREDENTIALS='/secure/outside-repo/service-account.json' \
npm run firestore:cleanup -- \
  --project '<EXPLICIT_PROJECT_ID>' \
  --environment '<dev|staging|production>' \
  --credential-identity '<VERIFIED_SERVICE_ACCOUNT_EMAIL>' \
  --report 'docs/refactor-v2/artifacts/prompt-9-production-dry-run.json'
```

Beklenen karar: `counts.mismatched=0`. Report'taki `candidates`, ikinci owner onayındaki
`expectedDocuments` ile birebir aynı yazılmalıdır. Report SHA-256'sı ve güvenli operasyon artifact referansı
approval kaydına eklenir. Production dry-run raporu owner'a sunulmadan execute komutu hazırlanmaz.

## 6. İkinci owner onayı ve execute

Onay metni en az şunları aynı kayıtta içermelidir:

```text
PROMPT9_EXECUTE_APPROVED
environment=production
projectId=<EXACT_PROJECT_ID>
credentialIdentity=<EXACT_IDENTITY>
backupId=<EXACT_BACKUP_RESOURCE_ID>
expectedDocuments=<EXACT_DRY_RUN_CANDIDATE_COUNT>
dryRunReportSha256=<SHA256>
stagingEvidenceId=<EXACT_ID>
compatibilityWindow=closed
dualWrite=disabled
approvalId=<IMMUTABLE_APPROVAL_ID>
```

Execute ancak bu onay `43-current-refactor-gap-report.md` ledger'ına redacted referansla işlendiğinde çalıştırılır:

```bash
GOOGLE_APPLICATION_CREDENTIALS='/secure/outside-repo/service-account.json' \
npm run firestore:cleanup -- \
  --project '<EXACT_PROJECT_ID>' \
  --environment production \
  --credential-identity '<VERIFIED_SERVICE_ACCOUNT_EMAIL>' \
  --report 'docs/refactor-v2/artifacts/prompt-9-production-execute-report.json' \
  --execute \
  --confirm-project '<EXACT_PROJECT_ID>' \
  --backup-id '<EXACT_BACKUP_RESOURCE_ID>' \
  --backup-created-at '<ISO-8601>' \
  --backup-retention-days '<DAYS>' \
  --restore-verified-at '<ISO-8601>' \
  --rollback-plan '<APPROVED_RUNBOOK_ID>' \
  --compatibility-window closed \
  --dual-write disabled \
  --approval-id '<IMMUTABLE_SECOND_APPROVAL_ID>' \
  --approval-project '<EXACT_PROJECT_ID>' \
  --approval-backup-id '<EXACT_BACKUP_RESOURCE_ID>' \
  --expected-documents '<EXACT_DRY_RUN_CANDIDATE_COUNT>' \
  --staging-evidence-id '<EXACT_STAGING_EVIDENCE_ID>' \
  --ops-log '/secure/outside-repo/prompt-9-operations.jsonl'
```

## 7. Hata ve rollback

- Audit hatası: redacted `dry-run-failed` report üretilir, write başlamaz.
- Gate hatası: `execute-refused` report üretilir, write başlamaz.
- Transaction drift/hatası: mevcut transaction commit edilmez; script hemen durur, tamamlanan önceki document
  sayısı secure ops log ve redacted `execute-failed` report'ta bulunur.
- Kısmi execute oluşursa client write path'i tekrar açılmaz. Ops log'daki redacted tamamlanma sayısı ile backup
  restoration prosedürü başlatılır; restore sonrası aynı dry-run `candidates=0`, `mismatched=0` beklenene kadar
  incident kapanmaz.
- Rollback production'da denenmediyse cleanup complete sayılmaz.
