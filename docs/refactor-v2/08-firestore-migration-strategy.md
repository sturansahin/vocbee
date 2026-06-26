# 08 — Firestore Migration Stratejisi

> Yalnızca **plan**. Bu aşamada hiçbir migration script’i yazılıp çalıştırılmaz, Firestore verisi değiştirilmez.

## Temel ilke
**Önce kopyala → sonra doğrula → en son temizle.** 100+ mevcut kullanıcı varsayılır. Eski alanlar erken silinmez.

## Aşamalar
1. **Backup:** `gcloud firestore export gs://<bucket>/pre-v2-<tarih>` ile tam yedek. Yedek doğrulanmadan ilerlenmez.
2. **Yeni repository (app tarafı):** `progressByLevel` okuyabilen repository + adapter tasarlanır (`07` §13).
3. **Dual-read:** App önce yeni modeli okur; yoksa eski `progress.learnedWords[level]`’den fallback.
4. **Dual-write (gerekirse):** Yazma hem yeni subcollection hem eski alana; `schemaVersion` ile yönetilir.
5. **Backfill script’i (sadece plan):** `users/{uid}.progress.learnedWords` → `progressByLevel/{level}` kopyalar.
   Idempotent (yeniden çalıştırılabilir), batch + retry, rate-limit dostu.
6. **Dry-run:** `--dry-run` yazmadan kullanıcı başına planlanan dönüşüm özeti üretir.
7. **Doğrulama:** rastgele N kullanıcı; eski `learnedWords.length` == yeni `learnedWordIds.length`; checksum.
8. **Metrics/logging:** geçen/geçemeyen kullanıcı sayısı, hata dağılımı; PII yok.
9. **Uyumluluk penceresi:** en eski desteklenen app sürümü dual-read’i bırakana kadar eski alanlar durur.
10. **Cleanup (Phase 9):** %100 doğrulama sonrası eski alanlar planlı silinir.

## Dry-run çıktısı nasıl kontrol edilir
- Satır başına: `uidMask=ab12…, A1: 312→312, A2: 90→90, status=OK`.
- Toplam: geçen/uyumsuz/atlanan sayıları. Uyumsuz > 0 ise migration durdurulur, incelenir.

## Rastgele kullanıcı doğrulama checklist’i
- [ ] Yeni `progressByLevel` toplamı = eski `learnedWords` toplamı.
- [ ] `lastWordIndex` taşınmış.
- [ ] `favorites` sayısı korunmuş.
- [ ] `progressSummary.percent` UI ile tutarlı.
- [ ] Cihaz/login türleri farklı 5 kullanıcı manuel kontrol.

## PII / güvenlik
- Çıktılarda email/displayName/uid açık yazılmaz; uid maskelenir (`ab12…`).
- Script’ler service-account ile sunucuda çalışır, repoya credential girilmez (`09`).

## Riskler ve önlemler
| Risk | Önlem |
|---|---|
| Kısmi backfill | idempotent + checkpoint + resume |
| Eski app dual-read bilmiyor | uyumluluk penceresi + `schemaVersion` gating |
| Çift yazma çakışması | `syncMeta.updatedByDeviceId` + son-yazan kuralı korunur |
| Yanlış silme | cleanup yalnızca Phase 9, ayrı onay |

## Kabul kriterleri
- Dry-run %0 uyumsuz; backup doğrulanmış; rollback denenmiş.
- Hiçbir kullanıcı verisi kaybı yok; eski alanlar henüz duruyor.


---

## Implementation-spec detayları (v2 — `32`–`39`)
- **Dry-run script iskeleti (ÇALIŞTIRILMAZ):** `34-firestore-types-rules-migration-spec.md` §6 — `DRY_RUN` flag (varsayılan güvenli), kullanıcı tarama, eski `learnedWords` okuma, `progressByLevel` payload üretme, yazmadan raporlama, PII maskeli log (`maskUid`), `mismatched>0 → DURDUR` kuralı, eski veri SİLİNMEZ.
- **Legacy → V2 transform fonksiyonu:** `34` §5 `adaptLegacyLearnedWordsToProgressByLevelDocs` + `buildProgressSummary`.
- **Migration edge-case test listesi:** `37-testing-code-templates.md` §4 (learnedWords yok / boş level / duplicate / number-değil / lastWordIndex yok / progress yok / A1 var A2 yok / eski+yeni birlikte / oldTotal≠newTotal).
- **Dual-read/dual-write akışı (repository seviyesi):** `34` §9 + `35` §3.
- **PR kırılımı:** `39` Phase 3 (PR-3.1 tipler → 3.2 adapter → 3.3 dual-read → 3.4 rules+emulator → 3.5 dual-write → 3.6 dry-run).
