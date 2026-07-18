# Prompt 9 — Production Approval Checklist

Bu dosya secret, service-account JSON, ham payload, UID, email veya displayName içermez. Değerler yalnız owner ve
operasyon ekibi tarafından doğrulandıktan sonra doldurulur. Bugünkü durum `NOT APPROVED`dır.

## A. İlk onay — audit/script/remote dry-run hazırlığı

| Soru | Owner cevabı / kanıt | Durum |
|---|---|---|
| Hedef environment (`dev`, `staging`, `production`) | Rollout doğrulaması `staging`, backup/restore ve gelecekteki cleanup `production`; destructive onayda owner exact teyidi yine zorunlu | PARTIAL |
| Exact Firebase project ID | `vocbee-6fe24`, state `ACTIVE`; `.firebaserc` ve remote Firebase Projects API eşleşiyor | PASS |
| Credential identity ve environment ayrımı | Interactive Firebase CLI owner identity secure oturumda doğrulandı; raw identity repository'ye yazılmadı. Ayrı staging project var, fakat dedicated migration identity hâlâ yok | BLOCKED |
| Backup alındı mı? | Hayır; günlük/14 gün schedule isteği production billing kapalı olduğu için HTTP 403 ile reddedildi. Son backup sayısı 0 | BLOCKED |
| Backup path/resource ID | Yok | BLOCKED |
| Backup zamanı ve retention | Backup yok; database version retention `3600s`, PITR disabled. Bu değer doğrulanmış backup yerine geçmez | BLOCKED |
| Ayrı hedefte restore doğrulaması | Yok. Managed backup restore aynı source project içinde yeni named database gerektiriyor; ilk backup oluşmadan test edilemez | BLOCKED |
| Rollback plan ID | Cevap bekleniyor | BLOCKED |
| Compatibility window kapandı mı? | Hayır/kanıt yok; version adoption telemetry yok | BLOCKED |
| Dual-write durumu | Client dual-write + timestamp reconciliation kodu hazır; safe default hâlâ `legacy`, production rollout yapılmadı | BLOCKED |
| Staging target + credential | `vocbee-staging-6fe24` ACTIVE; `(default)` Firestore `eur3`, delete protection açık ve ilk rules deploy PASS. Function kaldırıldı/Blaze gerekmiyor. Client kontratı değişmedi; yalnız Admin backfill metadata rules redeploy'u DNS timeout nedeniyle pending. Staging client smoke ve dedicated backfill identity yok | PARTIAL |
| Firestore database koruması | `(default)`, `eur3`, Native/Standard; PITR disabled ve delete protection disabled | BLOCKED |
| Backup schedule | Günlük/14 gün oluşturma denendi; production billing kapalı olduğu için oluşmadı. Son sayı 0 | BLOCKED |

Owner'ın 2026-07-17 tarihli “Prompt 9'u uygula” talebi yerel audit/script/emulator hazırlığı için ilk aşama
yetkilendirmesi olarak yorumlandı. O tarihte zorunlu cevaplar verilmediğinden remote dry-run yetkilendirmesi
sayılmadı.
2026-07-18 owner talebiyle Firebase'e salt-okunur metadata erişimi verildi; sonuç
`artifacts/prompt-9-firebase-metadata-audit.json` içinde PII'siz kaydedildi. Bu izin backup oluşturma, staging
oluşturma, rules deploy, user document okuma veya destructive cleanup yetkisi olarak genişletilmedi.

Owner daha sonra planın sonraki aşamasına geçilmesini onayladı. Bu kapsamda ayrı staging proje/database oluşturuldu,
rules staging'e deploy edildi ve production managed backup schedule güvenli biçimde denendi. Function deploy ve
backup schedule billing gate'lerinde durdu; production user belgesi okunmadı/yazılmadı. Güncel PII'siz kanıt:
`artifacts/progress-v2-staging-bootstrap-evidence.json`.

Owner'ın aynı gün verdiği “kod içinde yap, legacy alana dokunma” kararı Cloud Function yaklaşımını supersede eder.
Yeni istemci dual-write yapar; eski istemci legacy'yi daha yeni hale getirirse yeni istemci v2'yi timestamp tabanlı
onarır ve repair sırasında legacy alanı yazmaz/silmez. Cleanup için yeni bir owner onayı verilmemiştir. Kanıt:
`artifacts/progress-v2-client-reconciliation-decision.json`.

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
