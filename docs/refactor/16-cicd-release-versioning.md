# 16 — CI/CD, Release ve Versioning

## Mevcut Durum

- **EAS** (`eas.json`) build profilleri ve build-time env içeriyor (değerler dokümana yazılmaz).
- **Fastlane** (kullanıcı bağlamında belirtilmiş) store dağıtımı için.
- **Scriptler (`package.json`):** `start/android/ios/web`, `test`, `test:watch`, `test:ci` (`jest --runInBand`),
  `typecheck` (tsconfig.app), `typecheck:test`, `typecheck:rules`, `typecheck:worker`, `test:rules`,
  `audit:prod`, `functions:lint`, `functions:build`.
- **Backend ayrı dağıtım:** `functions/` (Firebase), `proxy/` (Cloudflare Worker), `api/` (Vercel).
- CI tanımı repoda doğrulanmalı (görünür bir workflow dosyası incelenmedi).
  Bu repo durumunda `.github/workflows/*` yok; Faz 0'da eklenmesi zorunlu kabul edilir.

## Sorunlar

1. Birçok doğrulama scripti var ama **tek bir CI gate** olarak bağlanmış mı belirsiz.
2. **Çoklu dağıtım hedefi** (app, functions, worker, vercel) farklı süreçler; release koordinasyonu elle.
3. **Versioning/changelog** stratejisi tanımsız; refactor PR'ları ile ürün sürümleri karışabilir.
4. Refactor sırasında **regresyon riski**; CI olmadan PR'lar güvenli birleşemez.
5. Coverage artifact hijyeni eksik: `coverage/` ignore ediliyor ama `config/coverage` altında izlenen
   eski Jest çıktıları var; CI çıktıları repo dosyası olmamalı.

## Önerilen Yaklaşım: Tek CI gate + faz-bazlı doğrulama matrisi

Tüm mevcut scriptleri tek CI workflow'ta zorunlu kapı yap (yeni paket gerekmez; mevcut npm scriptleri).

**CI aşamaları (PR'da zorunlu):**
1. `npm ci`
2. `npm run typecheck` + `npm run typecheck:test`
3. `npm run test:ci` (coverage threshold ile; bkz. `14`)
4. Değişiklik rules'ı etkiliyorsa: `npm run typecheck:rules` + `npm run test:rules`
   - Önkoşul: Java/JDK PATH'te olmalı; Firebase emulator çalışabilmeli; CI'da Firebase project/auth
     erişimi açık kurulmalı.
5. Değişiklik worker/functions'ı etkiliyorsa: `npm run typecheck:worker`,
   `npm --prefix functions run build`, `npm --prefix functions run lint`
6. Secret-scan (bkz. `13`)
7. (Release öncesi) `npm run audit:prod`

**Versioning:** Refactor PR'ları davranış değiştirmediği için **patch/internal**; kullanıcıya görünen
özellik yoksa store sürümü artırılmaz. Conventional commits + otomatik changelog önerilir (opsiyonel).
EAS `runtimeVersion` / build number politikası netleştirilir (refactor OTA-uyumlu mu?).

**Faz çıktısı:** Her refactor fazı (bkz. `18`) sonunda yukarıdaki matris yeşil olmadan merge yok.

## Alternatifler ve Neden Elendiler

- **Monorepo tooling (Nx/Turborepo) ile CI** — Elendi: tek uygulama; mevcut npm scriptleri yeterli.
- **Her PR'da tüm matrisi (worker+functions+rules) koş** — Kısmen: yavaş; path-filtreli koşum daha verimli
  (sadece etkilenen alan). Kritik PR'larda tam matris.
- **Refactor'ı release dondurma (freeze) ile yap** — Elendi: uzun freeze ürün hızını düşürür; küçük PR'lar zaten güvenli.

## Migration / Implementasyon Adımları

1. **PR-1:** CI workflow ekle/güncelle (yukarıdaki aşamalar; path-filtre ile worker/functions/rules).
   - Komut (lokal doğrulama): tüm script matrisi.
   - Workflow yoksa `.github/workflows/verify.yml` sıfırdan eklenir.
2. **PR-2:** Coverage threshold'u CI'a bağla (bkz. `14`).
3. **PR-3:** Secret-scan adımı (bkz. `13`).
4. **PR-4:** Coverage artifact cleanup kararı: `config/coverage` izlenen çıktıysa kaldır; `.gitignore`
   `coverage/` ve `**/coverage/` desenlerini kapsasın.
5. **PR-5 (opsiyonel):** Conventional commits + otomatik changelog; `runtimeVersion` politikası belgele.

## Riskler

- **CI yavaşlarsa** geliştirme hızı düşer. Azaltım: path-filtre + cache (`npm ci` cache, jest cache).
- **OTA (EAS Update) ile native değişiklik karışırsa** çökme. Azaltım: refactor native modul sınırını
  değiştirmedikçe OTA güvenli; native bağımlılık değişirse yeni build.
- **Backend ile client sürüm uyumsuzluğu** (grammar-proxy sözleşmesi). Azaltım: sözleşme testleri (bkz. `13`).

## Test ve Kabul Kriterleri

- CI matrisi PR'da zorunlu ve yeşil; merge ancak yeşilken.
- Release öncesi `audit:prod` temiz.
- Backend değişikliklerinde ilgili build/lint yeşil.

## Etkilenecek Dosyalar

```
.github/workflows/* (veya mevcut CI)  -> aşamalı, path-filtreli pipeline
package.json                          -> (gerekirse) birleşik "verify" scripti
eas.json                              -> değişmez (değerler korunur); runtimeVersion politikası belgelenir
```
