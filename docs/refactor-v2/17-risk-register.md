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
