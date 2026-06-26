# 20 — Phase 0: Safety Baseline

1. **Amaç** — Refactor öncesi emniyet ağı: branch, backup, CI, secret hijyeni, mevcut typecheck/test baseline.
2. **Kapsam** — `refactor-v2` branch; GitHub Actions CI (`16`); `.gitignore` güncelleme; baseline `wc -l`/test/typecheck çıktıları; Firestore backup planı (`08`); secret raporu (`09`).
3. **Kapsam dışı** — Kod taşıma, dosya bölme, davranış değişimi.
4. **Ön koşullar** — Repo erişimi; Firebase proje erişimi (backup için); CI secret’leri.
5. **Etkilenecek dosyalar** — `.github/workflows/*`, `.gitignore`, `package.json` (script netleştirme), ESLint/Prettier config (yeni).
6. **Taşınacak/bölünecek dosyalar** — Yok (sadece altyapı).
7. **Yeni hedef klasör yapısı** — Yok; `src/` Phase 1’de.
8. **Adım adım işler** — (a) branch aç; (b) baseline metrik kaydet; (c) CI pipeline kur; (d) ESLint/Prettier ekle; (e) gitignore + secret raporu; (f) Firestore backup prosedürünü dokümana bağla; (g) `firebase-admin` mobil bundle ayırma planını not et.
9. **Kod davranışı korunacak noktalar** — Hiçbir runtime davranışı değişmez; yalnızca tooling.
10. **Firestore/Storage/Auth/Notification etkileri** — Yok (backup salt-okur).
11. **Test gereksinimleri** — Mevcut `test:ci` + `test:rules` CI’da yeşil geçsin (baseline).
12. **Manuel QA checklist** — [ ] CI PR’da çalışıyor [ ] secret-scan aktif [ ] uygulama build oluyor.
13. **Riskler** — R6/R7/R8 (`17`): secret, admin bundle, CI yokluğu.
14. **Rollback planı** — Branch silinir; tooling değişiklikleri runtime’ı etkilemez.
15. **Kabul kriterleri** — CI yeşil; gitignore güncel; baseline metrikler kayıtlı; backup prosedürü onaylı.
16. **Sonraki faza geçmeme şartları** — CI yeşil değilse, secret raporu kapanmadıysa veya backup doğrulanmadıysa Phase 1’e geçme.


## Implementation-spec bağlantıları (v2 — `32`–`39`)
- **PR kırılımı:** `39` Phase 0 → PR-0.1 CI pipeline, PR-0.2 ESLint+Prettier (`warn`), PR-0.3 secret hijyeni+gitignore, PR-0.4 baseline metrik+backup.
- **Config skeleton'ları:** `38` §6 (CI `ci.yml`), §5 (ESLint), §7 (secret-scan + `.gitignore`).
- **Bu fazda DOKUNULMAYAN:** tüm kaynak kod (`screens/`, `services/`, `context/` dahil); yalnızca tooling/CI/gitignore.
- **Gate (sonraki faza geçiş):** CI yeşil + secret-scan aktif + backup prosedürü onaylı (`38` §8 gate tablosu, `18` DoD).
