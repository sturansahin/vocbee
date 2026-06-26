# 23 — Phase 3: Firestore Model v2 + Migration Hazırlığı

1. **Amaç** — `progressByLevel` modeline geçiş için repository/adapter, dual-read/write, dry-run ve rules planını hayata geçirmek (veri silmeden).
2. **Kapsam** — ProgressRepository v2, DTO↔model adapter, dual-read fallback, dual-write penceresi, `schemaVersion`, dry-run script’i (çalıştırma onaylı), rules planı (`09`).
3. **Kapsam dışı** — Eski alan silme (Phase 9); UI bölme; `wordProgress`/`sessions` (gerekmedikçe açılmaz).
4. **Ön koşullar** — Phase 0 backup; Phase 1-2 altyapı; `07`/`08` onayı.
5. **Etkilenecek dosyalar** — `services/SyncService.ts`, `services/progressService.ts`, `config/firebase.ts`, `firestore.rules` (plan), yeni `features/progress/data/*`.
6. **Taşınacak/bölünecek dosyalar** — progress Firestore erişimi → `ProgressRepository`; sync progress parçası → v2 repository.
7. **Yeni hedef klasör yapısı** — `features/progress/data/{ProgressRepository,adapters,dto}`, `features/progress/domain/rules`.
8. **Adım adım işler** — (a) v2 repository + adapter; (b) dual-read (yeni→eski fallback); (c) dual-write (schemaVersion gating); (d) dry-run script (sadece okuma+rapor, PII maskeli); (e) rules v2 planı + emulator testleri; (f) metrik/log.
9. **Kod davranışı korunacak noktalar** — learnedCount/percent aynı; `lastWordIndex`; favorites; device-id çakışma; offline-first.
10. **Firestore/Storage/Auth/Notification etkileri** — Firestore: yeni subcollection yazılır, eski alan korunur; Storage: progress cache aynı; Auth/Notif: etkilenmez.
11. **Test gereksinimleri** — migration transform testi; adapter testi; dual-read fallback testi; rules emulator testi.
12. **Manuel QA checklist** — [ ] yeni kullanıcı v2 yazar [ ] eski kullanıcı dual-read çalışır [ ] dry-run %0 uyumsuz [ ] rastgele 5 kullanıcı doğru.
13. **Riskler** — R1 (veri kaybı), R11 (dual-write çakışma), R12 (eski app). Azaltma: backup + copy-verify + uyumluluk penceresi.
14. **Rollback planı** — Eski alan duruyor; yeni app geri çekilir, dual-write kapatılır; veri kaybı yok.
15. **Kabul kriterleri** — Dual-read/write çalışır; dry-run temiz; rules emulator yeşil; eski alan silinmedi.
16. **Sonraki faza geçmeme şartları** — Dry-run uyumsuz > 0 veya backup/rollback doğrulanmadıysa Phase 4’e geçme.


## Implementation-spec bağlantıları (v2 — `32`–`39`)
- **PR kırılımı:** `39` Phase 3 → PR-3.1 tipler, 3.2 adapter, 3.3 ProgressRepository (dual-read), 3.4 rules v2+emulator, 3.5 dual-write, 3.6 dry-run iskeleti.
- **Tipler + rules + dry-run:** `34` §2-9 (`UserDocV2`/`ProgressByLevelDoc`/`LegacyProgressDoc`, `validProgressByLevel` rules skeleton, `DRY_RUN` script, `mismatched>0 → DURDUR`).
- **Repository:** `35` §3 `ProgressRepository`.
- **Testler:** `37` §4 (migration edge-case), §5 (`progressByLevel` emulator rules — `tests/firestoreRules.ts` deseni).
- **Bağlayıcı veri kaybı kuralı:** copy→verify→cleanup; eski `progress.learnedWords` SİLİNMEZ (cleanup Phase 9); dual-read; dual-write `schemaVersion` gating (`32` §8).
- **Gate:** dry-run %0 mismatched + rules emulator yeşil + backup/rollback doğrulanmış (`18` migration DoD).
