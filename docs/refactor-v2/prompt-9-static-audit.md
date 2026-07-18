# Prompt 9 — Firestore Legacy Cleanup Static Audit

Audit tarihi: 2026-07-17 (Europe/Istanbul)  
Checkout: `refactor` / başlangıç `1b4aa35f`

## Karar

`users/{uid}.progress` alanı bugün legacy adı taşısa da hâlâ production'ın aktif ve tek progress sync
kontratıdır. `progressByLevel` rollout edilmemiştir. Bu nedenle production cleanup **hazır değildir** ve bu
checkout'ta remote Firestore okunmamış, yazılmamış veya silinmemiştir.

Kullanıcının “Prompt 9'u uygula” isteği yalnızca Prompt 9 sözleşmesindeki ilk aşama olan yerel audit, script ve
dry-run hazırlık onayı olarak kaydedildi. Hedefe özgü ikinci destructive onay verilmedi.

## Aktif runtime kanıtı

| Kontrat | Aktif kanıt | Sonuç |
|---|---|---|
| Legacy progress yazımı | `src/features/sync/data/repositories/FirestoreSyncRepository.ts::saveSnapshot` | Her sync'te `progress.currentLevel`, `learnedWords`, `lastWordIndex`, `lastSync` yazılıyor |
| Setup legacy yazımı | `src/features/profile/data/repositories/FirestoreUserProfileRepository.ts::saveSetupCompletion` | Setup tamamlanınca legacy `progress` oluşturuluyor |
| Legacy progress okuma | `src/features/sync/data/gateways/LegacySyncDomainGateway.ts::restoreRemoteDomains` | Cloud restore `remote.progress` üzerinden yapılıyor |
| Runtime tetikleme | `src/app/lifecycle/useAppLifecycle.ts`, auth/settings facade'leri | `autoSync`, login restore ve `forceSync` aktif |
| v2 repository | `src/features/progress/data/repositories/FirestoreProgressRepository.ts` | Hazırlık kodu; composition/public runtime'a bağlı değil |
| v2 read flag | `src/features/progress/data/repositories/progressV2ReadFlag.ts` | Sabit `false`; production çağrısı yok |
| Firestore rules | `firestore.rules` | Ana doc yalnız legacy `progress` kabul ediyor; `schemaVersion`, `progressSummary` ve `progressByLevel` rule'u yok; catch-all subcollection'ı reddediyor |
| Favorites | `FirestoreFavoritesRepository` + `DefaultFavoritesService` | Ana doc `favorites` alanı hâlâ aktif; Prompt 9 script'i bunu özellikle kapsam dışı bırakıyor |

## Compatibility ve rollout kanıtı

- Uygulama sürümü `1.0.14` (iOS build `7`, Android versionCode `5`).
- Aktif client sürüm dağılımını veya progress schema adoption oranını ölçen analytics/telemetry bulunmuyor.
- Dual-write uygulanmamış ve dolayısıyla kapatılmış olduğu kanıtlanamıyor; gerçek durum legacy-only write.
- `schemaVersion=2` üretim write path'i ve v2 rules deployment'ı yok.
- Staging project/credential/evidence tanımlı değil; allowlist'te staging listesi kasıtlı olarak boş.
- Eski app compatibility window'unun kapandığına dair kanıt yok.

Bu maddelerin her biri tek başına production destructive cleanup blocker'ıdır.

## Hazırlanan güvenlik yüzeyi

- CLI: `scripts/firestoreLegacyCleanup.cjs`
- Saf audit/gate çekirdeği: `scripts/lib/firestoreLegacyCleanup.cjs`
- Environment/project allowlist: `scripts/firestore-legacy-cleanup.projects.json`
- Birim test: `scripts/__tests__/firestoreLegacyCleanup.test.cjs`
- Gerçek emulator testi: `scripts/__tests__/firestoreLegacyCleanup.emulator.test.cjs`
- Runbook: `docs/refactor-v2/prompt-9-firestore-cleanup-runbook.md`
- İki aşamalı approval checklist: `docs/refactor-v2/prompt-9-production-approval-checklist.md`
- Redacted emulator kanıtı: `docs/refactor-v2/artifacts/prompt-9-emulator-evidence.json`
- Redacted Firebase metadata kanıtı: `docs/refactor-v2/artifacts/prompt-9-firebase-metadata-audit.json`

Araç yalnız `users/{uid}.progress` alanının tamamını, `schemaVersion=2` ve her level için birebir v2 eşdeğerliği
kanıtlandıktan sonra silebilir. `learnedWordIds`, `learnedCount`, `lastWordIndex`, doc version/updatedAt ve legacy
`lastSync` varsa `syncMeta.updatedAt` tutarlılığı doğrulanır. Her aday execute transaction'ı içinde tekrar okunur;
dry-run sonrası drift varsa işlem durur.

## Production durumu

| Gate | Durum |
|---|---|
| Yerel statik audit | PASS |
| Fail-closed CLI ve unit test | PASS — 7/7 |
| Firestore Emulator dry-run/execute/rollback | PASS |
| Staging migration/rollback | BLOCKED — staging hedefi/credential'ı yok |
| Production target/credential declaration | `vocbee-6fe24` remote metadata ile doğrulandı; interactive owner identity var, dedicated migration identity/env separation yok |
| Backup ID, retention ve restore drill | Remote audit: backup 0, schedule 0, restore kanıtı yok; PITR disabled |
| Compatibility window | Açık / kapanış kanıtı yok |
| Dual-write | Legacy-only; v2 rollout edilmemiş |
| Production remote dry-run | Çalıştırılmadı |
| İkinci destructive owner onayı | Verilmedi |
| Production destructive cleanup | **BLOCKED / çalıştırılmadı** |

2026-07-18 remote metadata revalidation artifact'i:
`docs/refactor-v2/artifacts/prompt-9-firebase-metadata-audit.json`. Audit user document okumadı; project,
registered app, database, backup/schedule ve admin-operation metadata'sıyla sınırlı kaldı. Ayrı staging projesi
bulunmadı. Database `(default)` / `eur3` / Native / Standard; version retention `3600s`, PITR ve delete protection
disabled. Backup ve backup schedule sayısı sıfırdır.
