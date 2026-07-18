# Prompt 9 — Production Approval Checklist

Bu dosya secret, service-account JSON, ham payload, UID, email veya displayName içermez. Değerler yalnız owner ve
operasyon ekibi tarafından doğrulandıktan sonra doldurulur. Bugünkü durum `NOT APPROVED`dır.

## A. İlk onay — audit/script/remote dry-run hazırlığı

| Soru | Owner cevabı / kanıt | Durum |
|---|---|---|
| Hedef environment (`dev`, `staging`, `production`) | Erişilebilir tek proje ve production app kayıtları nedeniyle `production` olarak çıkarıldı; destructive onayda owner exact teyidi yine zorunlu | PARTIAL |
| Exact Firebase project ID | `vocbee-6fe24`, state `ACTIVE`; `.firebaserc` ve remote Firebase Projects API eşleşiyor | PASS |
| Credential identity ve environment ayrımı | Interactive Firebase CLI owner identity secure oturumda doğrulandı; raw identity repository'ye yazılmadı. Dedicated migration identity ve staging/production ayrımı yok | BLOCKED |
| Backup alındı mı? | Hayır; `firestore:backups:list --location eur3` sonucu 0 | BLOCKED |
| Backup path/resource ID | Yok | BLOCKED |
| Backup zamanı ve retention | Backup yok; database version retention `3600s`, PITR disabled. Bu değer doğrulanmış backup yerine geçmez | BLOCKED |
| Ayrı hedefte restore doğrulaması | Backup ve ayrı staging target olmadığı için yok | BLOCKED |
| Rollback plan ID | Cevap bekleniyor | BLOCKED |
| Compatibility window kapandı mı? | Hayır/kanıt yok; version adoption telemetry yok | BLOCKED |
| Dual-write durumu | v2 dual-write yok; runtime legacy-only yazıyor | BLOCKED |
| Staging target + credential | Remote project listesinde yalnız `vocbee-6fe24` var; ayrı staging bulunamadı, allowlist staging listesi boş | BLOCKED |
| Firestore database koruması | `(default)`, `eur3`, Native/Standard; PITR disabled ve delete protection disabled | BLOCKED |
| Backup schedule | 0 | BLOCKED |

Owner'ın 2026-07-17 tarihli “Prompt 9'u uygula” talebi yerel audit/script/emulator hazırlığı için ilk aşama
yetkilendirmesi olarak yorumlandı. O tarihte zorunlu cevaplar verilmediğinden remote dry-run yetkilendirmesi
sayılmadı.
2026-07-18 owner talebiyle Firebase'e salt-okunur metadata erişimi verildi; sonuç
`artifacts/prompt-9-firebase-metadata-audit.json` içinde PII'siz kaydedildi. Bu izin backup oluşturma, staging
oluşturma, rules deploy, user document okuma veya destructive cleanup yetkisi olarak genişletilmedi.

## B. Dry-run sonucu

| Alan | Değer |
|---|---|
| Environment/project | Çalıştırılmadı |
| Credential identity hash | Çalıştırılmadı |
| Report artifact + SHA-256 | Çalıştırılmadı |
| Scanned | Bilinmiyor |
| Candidates | Bilinmiyor |
| Mismatched | Bilinmiyor |
| Backup ID eşleşmesi | Doğrulanmadı |
| Owner review | Bekleniyor |

## C. İkinci onay — destructive production execute

İkinci onay, B bölümündeki dry-run owner'a sunulduktan sonra verilebilir. Aşağıdaki alanlardan biri eksikse script
fail-closed durur.

- [ ] `PROMPT9_EXECUTE_APPROVED` açık ifadesi
- [ ] Exact `environment=production`
- [ ] Exact project ID
- [ ] Exact/verified credential identity
- [ ] Exact backup resource ID
- [ ] Exact dry-run candidate/document sayısı
- [ ] Dry-run report SHA-256
- [ ] Restore verification timestamp
- [ ] Backup retention
- [ ] Approved rollback plan ID
- [ ] Staging migration+rollback evidence ID
- [ ] `compatibilityWindow=closed`
- [ ] `dualWrite=disabled`
- [ ] Immutable second approval ID

Durum: **NOT APPROVED — production execute yasak.**
