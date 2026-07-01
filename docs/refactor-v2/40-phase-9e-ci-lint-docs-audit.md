# 40 — Phase 9E: CI / Lint / Docs Audit (durum + güvenli plan)

> Bu doküman **plandır + audit sonucudur**. Bu görevde `.eslintrc*`, `package.json` dependency listesi
> veya `npm install` gibi büyük/riskli değişiklikler YAPILMAMIŞTIR. Yapılan tek konfig değişikliği:
> `.github/workflows/ci.yml` push branch trigger listesine `refactor` ve `refactor/**` eklenmesi (bkz. §2).

## 1. package.json script analizi (mevcut durum)

| Script | Var mı? | CI'da çalışıyor mu? |
|---|---|---|
| `typecheck` | ✅ | ✅ (`quality` job) |
| `typecheck:test` | ✅ | ✅ (`quality` job) |
| `typecheck:rules` | ✅ | ✅ (`quality` job) |
| `typecheck:worker` | ✅ | ✅ (`quality` job) |
| `typecheck:all` | ✅ (yukarıdaki 4'ünü sırayla çalıştırır) | Dolaylı (CI ayrı ayrı çalıştırıyor, `typecheck:all` script'i CI'da tek adım olarak kullanılmıyor) |
| `test` / `test:ci` | ✅ | ✅ (`quality` job, `test:ci`) |
| `test:rules` | ✅ | ✅ (`rules` job, `setup-java@v4` ile) |
| `functions:lint` | ✅ | ✅ (`quality` job) |
| `functions:build` | ✅ | ✅ (`quality` job) |
| `audit:prod` | ✅ | ✅ (`audit` job, `continue-on-error: true`) |
| `lint` (root ESLint) | ❌ **YOK** | ❌ CI'da yok (olmayan script çağrılamaz) |

**Bulgu:** Kök seviyede ESLint config (`.eslintrc*`, `eslint.config.*`) yok, `package.json`'da `lint` script'i yok,
`eslint`/`@typescript-eslint/*` dev-dependency olarak yüklü değil. Sadece `functions/.eslintrc.js` var (Cloud
Functions'a özel, ayrı `npm --prefix functions run lint` ile çalışıyor ve CI'da zaten yeşil).

## 2. CI workflow branch trigger denetimi

**Denetim öncesi (`.github/workflows/ci.yml`):**
```yaml
on:
  pull_request:
  push:
    branches: [master, refactor-v2]
```

**Bulgu — kritik boşluk:** Bu repoda çalışılan gerçek branch `refactor` (`git status` → `On branch refactor`,
tüm Phase 9A-9D commit'siz değişiklikleri bu branch üzerinde). `refactor` branch'i push trigger listesinde
**yoktu**. Sonuç: bu branch'e doğrudan push edilen commit'ler CI'da tetiklenmiyordu (yalnızca PR açıldığında
`pull_request` event'i üzerinden kontrol ediliyordu — PR yoksa hiç doğrulama yok).

**Yapılan minimal düzeltme:**
```yaml
on:
  pull_request:
  push:
    branches: [master, refactor, refactor-v2, 'refactor/**']
```
- Tek satır değişiklik, yalnızca `branches:` listesi genişletildi.
- Hiçbir job, step, script adı veya dependency değişmedi.
- `refactor/**` wildcard eklendi (talep edilen 4. branch deseni), gelecekteki `refactor/<alt-görev>` branch'lerini de kapsar.

## 3. Quality gate coverage denetimi (CI içinde gerçekten çalışıyor mu?)

`quality` job (`.github/workflows/ci.yml`) doğrulandı — şu an zaten şunları çalıştırıyor:
```
npm run typecheck
npm run typecheck:test
npm run typecheck:rules
npm run typecheck:worker
npm run test:ci
npm --prefix functions ci
npm run functions:lint
npm run functions:build
```
Bu, istenen "typecheck:all, test:ci, functions:lint, functions:build CI'da çalışıyor mu" kontrolünü karşılıyor —
**evet, hepsi zaten CI'da var** (typecheck:all'ın 4 alt-komutu ayrı ayrı adım olarak zaten mevcut; tek script
çağrısı olarak birleştirilmemiş olması işlevsel bir eksiklik değil).

## 4. `test:rules` / Java (setup-java) durumu

- CI tarafında: `rules` job'ı `actions/setup-java@v4` (`distribution: temurin`, `java-version: '17'`) içeriyor —
  **doğru kurulmuş**, ek değişiklik gerekmiyor.
- **Yerel ortam bulgusu:** Bu audit sırasında yerel geliştirme ortamında (bu görev bu makinede çalıştırıldı)
  `java -version` → `command not found`. `npm run test:rules` bu nedenle yerel olarak **çalıştırılamadı**
  (`Error: Could not spawn 'java -version'. Please make sure Java is installed and on your system PATH.`).
  Bu bir kod/CI defekti değil, yerel makine eksikliğidir; CI ortamı (`ubuntu-latest` + `setup-java@v4`) bundan
  etkilenmez. Yerelde çalıştırmak isteyen geliştirici JDK 17 kurmalı.

## 5. Root ESLint — güvenli plan (kurulum YAPILMADI)

Doküman `38-ci-eslint-alias-config-spec.md` §5 zaten tam bir ESLint skeleton içeriyor (kurallar, import
boundary, `.eslintrc.cjs` örneği) ve `39-phase-pr-breakdown.md` bunu **PR-0.2** olarak planlamış — ancak
`git log` denetiminde bu PR'ın hiçbir zaman uygulanmadığı doğrulandı (Phase 0 commit'i `9f26bf3` yalnızca
CI iskeletini ekledi, ESLint'i eklemedi).

**Bu fazda ESLint kurulmuyor** çünkü:
1. Talimat açıkça "doğrudan büyük config kurma; önce plan yaz" diyor.
2. Yeni dev-dependency eklemek (`eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`,
   `eslint-plugin-import`, `eslint-import-resolver-typescript`) bu fazın "minimal, testleri bozmayan, büyük
   dependency upgrade yapma" kısıtına aykırı olurdu — bunlar yeni paketler, upgrade değil ama yine de riski
   "plan onayı olmadan kurulum yapma" ilkesine göre üstlenilmemesi gereken bir iş.

**Önerilen uygulama sırası (onay sonrası, ayrı bir sub-phase'de):**
1. `devDependencies`'e ekle: `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`,
   `eslint-plugin-import`, `eslint-import-resolver-typescript` (pinned exact version, `38` §5'teki gibi).
2. `.eslintrc.cjs` oluştur — kurallar **`warn`** ile başlar (doc `38` §9: "Phase 0: kurallar önce warn").
3. `package.json`'a `"lint": "eslint . --ext .ts,.tsx"` script'i eklenir.
4. CI `quality` job'ına `- run: npm run lint` adımı eklenir (henüz merge-blocking yapılmaz; `continue-on-error: true`
   ile bir süre gözlemlenir).
5. Baseline'da kaç warning çıktığı raporlanır; sıfır warning'e inmeden `error`'a çevrilmez.
6. Ancak baseline temizlendiğinde (bu depo için gerçek Phase 9 hedefi — doc `38` §9: "Phase 9: warn → error")
   kurallar sıkılaştırılır ve `continue-on-error` kaldırılır.

**Bu sıra hiçbir mevcut testi bozmaz** çünkü lint, typecheck/test:ci'den ayrı bir gate'tir ve `warn` modunda
CI'ı kırmadan eklenir.

## 6. Secret scanning — öneri (entegrasyon YAPILMADI)

Doküman `38` §7 zaten `gitleaks/gitleaks-action@v2` önerisini içeriyor. Bu fazda **hiçbir tool entegre
edilmedi** (talimat: "büyük tool entegrasyonu yapma", sadece dokümante et).

**Öneri (uygulanmadı, gelecekteki onaylı bir sub-phase için):**
```yaml
secret-scan:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
      with: { fetch-depth: 0 }
    - uses: gitleaks/gitleaks-action@v2
```
- Ek olarak `.gitignore` sertleştirmesi (doc `09` §C): `.env*`, `GoogleService-Info.plist`, `google-services.json`,
  `*.keystore`, `firebase-debug.log` — bu görevde **kontrol edildi, değiştirilmedi** (bkz. §7).
- Bilinen risk (`09`): `config/firebase.ts`'te hardcoded web config, `eas.json`'da RevenueCat public key,
  repoda izlenen `.env`/`GoogleService-Info.plist`/`google-services.json` dosyaları. Bu değerlerin gerçek
  içeriği bu dokümana **yazılmamıştır**; secret rotation + env/EAS secret'e taşıma ayrı, onaylı bir iş.

## 7. .gitignore denetimi (değiştirilmedi, sadece kontrol edildi)

Mevcut `.gitignore` içeriği incelendi. `.env`, `.env.local`, `GoogleService-Info.plist`, `google-services.json`
gibi dosyaların repoda **izlenen (tracked)** durumda olduğu (`git status`/dosya listesinde görünüyorlar)
doğrulandı — bu doc `09`'da zaten bilinen bir risk olarak kayıtlı. Bu fazda `.gitignore` değiştirilmedi
(kapsam dışı; secret rotation gerektirir, "yapılmayacaklar" listesinde açık olmasa da yüksek riskli ve
onay gerektiren bir işlem olduğu için dokunulmadı).

## 8. README / docs güncellik denetimi

**Bulgu — docs drift:** `docs/refactor-v2/16-ci-cd-quality-gates.md` ve `38-ci-eslint-alias-config-spec.md`,
"‎`.github/workflows` pratikte boş → CI yok" diyor. Ancak gerçek repo durumu: `.github/workflows/ci.yml`
**mevcut ve çalışıyor** (Phase 0 commit'i `9f26bf3` ile eklenmiş). Bu iki doküman **güncelliğini kaybetmiş**.

Bu fazda bu dokümanlar düzeltilmedi (kapsam: yalnızca CI/lint/docs **audit** + yeni Firestore cleanup planı;
mevcut plan dokümanlarını geriye dönük güncellemek ayrı bir temizlik işi). **Öneri:** `16` ve `38`'in "Mevcut
durum" bölümleri bir sonraki docs-cleanup sub-phase'inde güncellenmeli (örn. "CI yok" → "CI var (Phase 0),
`lint`/secret-scan job'ları eksik").

`src/README.md` denetlendi — güncel: kök klasörlerin (`screens/`, `services/`, `context/`) "shim'ler arkasında
kalıp kademeli taşınacağı" ifadesi hâlâ doğru referans niteliğinde, ancak Phase 9B/9C/9D sonrası bazı shim'ler
(`storageKeys`, `storage`, `revenueCatService`, `MonetizationContext`) zaten kaldırıldı. Bu README'nin de
gelecekteki bir docs-sync adımında güncellenmesi önerilir (bu fazda yapılmadı — kapsam dışı, sadece not edildi).

## 9. Bu fazda yapılan değişikliklerin özeti

| Dosya | Değişiklik | Risk |
|---|---|---|
| `.github/workflows/ci.yml` | `push.branches` listesine `refactor`, `'refactor/**'` eklendi | Düşük — tek satır, sadece hangi push'ların CI'ı tetikleyeceğini genişletiyor, hiçbir job/step/script değişmedi |
| `docs/refactor-v2/40-phase-9e-ci-lint-docs-audit.md` | Yeni doküman (bu dosya) | Yok — sadece dokümantasyon |
| `docs/refactor-v2/phase-9-firestore-cleanup-plan.md` | Yeni doküman | Yok — sadece dokümantasyon |

**Yapılmayan (bilerek ertelenen) değişiklikler:** ESLint kurulumu, `lint` script'i, secret-scan job'ı,
`.gitignore` sertleştirmesi, `16`/`38`/`src/README.md` docs-sync güncellemesi. Hepsi §5/§6/§7/§8'de plan
olarak dokümante edildi.
