# 41 — ESLint Import Boundary / Architecture Guard (Lint Policy)

> Bu doküman **uygulama kaydıdır** (implementation record), plan değil — `.eslintrc.cjs`, `package.json`
> `lint` script'i ve `.github/workflows/ci.yml`'deki `lint` step'i bu görevde (ADIM 8) gerçekten eklendi.
> Bu doküman `33-layer-contracts-and-import-rules.md` §5 ve `38-ci-eslint-alias-config-spec.md` §5'teki
> skeleton'ların **gerçek uygulamasını** ve alınan kapsam kararlarını kayda geçirir.

## 0. Amaç

`docs/refactor-v2/33` ve `38`'de tanımlanan katman-sınırı (layer boundary) importları artık **otomatik**
tespit ediliyor: `src/features/*/domain` SDK import edemez, `src/features/*/presentation` doğrudan
Firestore/AsyncStorage/Expo-notifications import edemez ve `data/*` içine derin import yapamaz. Amaç,
bundan sonraki refactor adımlarının (ADIM 1-7'de yapılan `src/features/*` çıkarımları gibi) mimariyi
yanlışlıkla bozmasını **CI'da görünür** kılmak.

## 1. Neden `warn` modu (neden `error` değil)?

Talimatın kesin kuralı: *"İlk uygulamada çok sert yapıp tüm repo kırmızıya düşürme."* Baseline `npm run
lint` çalıştırıldığında **52 problem (0 error, 52 warning)** çıktı — bunların büyük kısmı legacy
`screens/`, `components/`, `services/` dosyalarındaki kullanılmayan import'lar (`@typescript-eslint/
no-unused-vars`) ve mevcut, üretim kodunda çalışan `AsyncStorage`/`firebase/firestore` import'ları
(`screens/HomeScreen.tsx`, `screens/SettingsScreen.tsx`, `screens/SetupScreens.tsx`,
`screens/OnboardingScreen.tsx`, `screens/LevelTestScreen.tsx`, `screens/ExampleSentencesScreen.tsx`).

Bunların hepsini `error` yapmak:
- Bu görevin "production kod refactor yapma" kısıtını ihlal eder (dosyaları düzeltmek zorunda kalırdık),
- CI'ı anında kırmızıya düşürür (talimatın açıkça yasakladığı sonuç).

Bu yüzden **tüm mimari kuralları `warn` seviyesinde** ekledik. `npm run lint` script'i
`--max-warnings=-1` ile hiçbir zaman warning sayısına göre başarısız olmaz (`exit 0`). CI'daki `lint`
step'i ayrıca `continue-on-error: true` ile işaretlendi — yani script bir sebeple `exit 1` dönse bile
(örn. config hatası), pipeline'ın diğer adımları (typecheck, test:ci, functions:*) hâlâ çalışır ve
sonuçları raporlanır.

## 2. Kapsam: hangi katmanlar zorlanıyor, hangileri değil

| Bölge | Kural | Seviye |
|---|---|---|
| `src/features/*/domain/**` | Firebase/AsyncStorage/Expo/React/RN import yasak | `warn` |
| `src/features/*/presentation/**` | Firestore/AsyncStorage/expo-notifications import yasak; `data/*`'a derin import yasak | `warn` |
| `src/features/*/application/**` | Firestore/Auth/AsyncStorage/expo-notifications doğrudan import yasak | `warn` |
| `screens/**` | Firestore/AsyncStorage import'una **legacy allowlist uyarısı** (aşağıda) | `warn` |
| Repo geneli | `import/no-cycle` (barrel döngüleri) | `warn` |

**Neden sadece `src/features/*`?** Bu, `docs/refactor-v2/05`'teki hedef `presentation/application/domain/
data` klasör yapısına **zaten sahip olan tek bölge**. `screens/`, `services/`, `context/`,
`components/`, `config/` henüz bu yapıya geçmedi (ADIM 1-7'de kademeli olarak `src/features/*`'e
taşınıyor) — bu klasörlere path-tabanlı katman kuralı uygulamak anlamsız olurdu (hangi "katmanda"
oldukları tanımsız). Bu yüzden bu klasörler yalnızca **dar, isim-tabanlı** bir uyarı alıyor (bkz. §3).

## 3. Legacy allowlist (açık liste)

`screens/**/*.{ts,tsx}` için **iki spesifik import** `warn` ile işaretleniyor:
- `firebase/firestore` — mesaj: *"screens should not grow new direct Firestore imports; prefer a
  feature repository"*
- `@react-native-async-storage/async-storage` — mesaj: *"screens should not grow new direct
  AsyncStorage imports; prefer a feature repository/service"*

**Bu bir "yasaklama" değil, bir "büyütmeme" uyarısıdır.** Mevcut kullanım (`HomeScreen.tsx`,
`SettingsScreen.tsx`, `SetupScreens.tsx`, `OnboardingScreen.tsx`, `LevelTestScreen.tsx`,
`ExampleSentencesScreen.tsx` — hepsi ADIM 1-6'da kısmen refactor edildi ama hâlâ bazı doğrudan SDK
çağrıları içeriyor) **kaldırılmadı, silinmedi, değiştirilmedi**. Kural sadece görünürlük sağlıyor: bir
geliştirici bu dosyalara **yeni** bir Firestore/AsyncStorage import'u eklerse, lint çıktısında görünür
(CI'da kırmızı olmasa da, PR diff'inde/log'da fark edilir).

`services/`, `context/`, `components/`, `config/` için **henüz** bir override eklenmedi — bu görevin
kapsamı `docs/refactor-v2/33` §6'da açıkça listelenen ("screens → firebase/firestore", "screens →
AsyncStorage") kalemleriyle sınırlı tutuldu. Diğer legacy klasörler için benzer bir allowlist,
istenirse ayrı bir adımda eklenebilir (bu doküman güncellenir).

## 4. Allowlist'in kaldırılma koşulları

Bir `screens/*.tsx` dosyası şu koşulları sağladığında, o dosya için allowlist uyarısı **doğal olarak
kaybolur** (kod taşındıkça, ayrı bir "allowlist kaldırma" adımı gerekmez):
1. Dosyadaki tüm `firebase/firestore` / `AsyncStorage` çağrıları ilgili `src/features/*/data/
   repositories/*` implementasyonuna taşınmış olmalı (ADIM 1-7'de zaten kısmen yapıldı — örn.
   `FirestoreUserProfileRepository`, `FirestoreProgressRepository`, `PendingWordRepository`).
2. Ekran, o repository'yi (veya onu kullanan bir hook/facade'ı) `@features/*` barrel'ından import
   etmeli — doğrudan SDK import'u kalmamalı.
3. İlgili ekranın testleri (`screens/__tests__/*.test.tsx`) hâlâ geçmeli (davranış değişmemiş olmalı).

Bu koşullar **bu görevde kontrol edilmedi/uygulanmadı** — yalnızca gelecekteki temizlik adımları için
kayıt altına alındı.

## 5. `warn` → `error` geçiş kriteri

`docs/refactor-v2/40` §5 ile uyumlu: kurallar sıfır warning'e inmeden `error`'a çevrilmez.
Somut kriter:
- `src/features/*/domain` ve `src/features/*/presentation` zone kuralları: bu görev sırasında zaten
  **0 ihlal** ile başlıyor (baseline lint çıktısında bu path'ler için hiçbir warning yok) — yani bu
  ikisi, ayrı bir onaydan sonra **hemen** `error`'a çevrilebilir çünkü bugün kırılacak hiçbir şey yok.
- `screens/**` allowlist kuralı: legacy kod tamamen taşınana kadar (§4) `warn` kalmalı.
- `@typescript-eslint/no-unused-vars` ve `@typescript-eslint/ban-ts-comment`: bu görevin mimari-sınır
  kapsamı dışında (genel kod kalitesi kuralları) — sıkılaştırma kararı ayrı bir işe bırakıldı.

## 6. Eklenen dosyalar / bağımlılıklar

- **devDependencies** (pinned exact version, upgrade değil yeni ekleme):
  `eslint@8.57.1`, `@typescript-eslint/parser@6.21.0`, `@typescript-eslint/eslint-plugin@6.21.0`,
  `eslint-plugin-import@2.31.0`, `eslint-import-resolver-typescript@3.7.0`.
  (`functions/` alt-projesindeki mevcut ESLint 8.x + `@typescript-eslint` konvansiyonuyla uyumlu.)
- **`.eslintrc.cjs`** (yeni, kök dizin) — legacy `.eslintrc` formatı (ESLint 9 flat-config'e geçilmedi;
  `functions/.eslintrc.js` ile aynı format, ek migration riski yok).
- **`package.json`** → `"lint": "eslint . --ext .ts,.tsx --max-warnings=-1"` script'i eklendi.
- **`.github/workflows/ci.yml`** → `quality` job'ına `continue-on-error: true` ile bir `lint` step'i
  eklendi (typecheck adımlarından sonra, `test:ci`'den önce).

## 7. Bu görevde YAPILMAYANLAR (bilerek)

- `npm audit fix` / `npm audit fix --force` çalıştırılmadı (talimatın kesin kuralı).
- Hiçbir `tsconfig*`, `babel.config.js`, `jest.config.js` değiştirilmedi.
- Hiçbir production dosyası (`screens/`, `services/`, `context/`, `components/`) lint hatalarını
  gidermek için değiştirilmedi — bu görev yalnızca **tespit** ekliyor, **düzeltme** yapmıyor.
- `services/`, `context/`, `components/`, `config/` için legacy allowlist override'ı eklenmedi (§3) —
  kapsam `docs/refactor-v2/33` §6'nın `screens` için açıkça listelediği kalemlerle sınırlı tutuldu.
- Secret scanning (`gitleaks`) entegre edilmedi — bu görevin kapsamı dışında, `38` §7'de zaten ayrı
  plan olarak duruyor.

## İlgili dokümanlar
`33` (katman sözleşmeleri/import kuralları — bu dokümanın uygulandığı skeleton), `38` (CI/ESLint/alias
spec — devDependency ve script önerisi), `40` (Phase 9E audit — ESLint'in neden bu ana kadar
eklenmediğinin kaydı, warn-mode planının ilk yazıldığı yer).

## 8. Prompt 7 production hardening — 2026-07-16

Bu bölüm §1-5'teki geçici `warn` politikasını supersede eder:

- Mimari zone kuralları ve `import/no-cycle` artık `error` seviyesindedir.
- Root `screens/services/config/context/components/utils` alias/path importları ile root `constants/types`
  support importları `src/**` için yasaktır.
- Cross-feature deep alias importları yasaktır; feature dışı tüketici yalnızca `@features/<feature>` public
  barrel'ını kullanabilir.
- `domain` SDK/React bağımsızlığı; `application` ve `presentation` side-effect SDK sınırları error olarak
  uygulanır. `shared`, `app` veya `features` import edemez.
- `npm run lint`, `--max-warnings=0` ile çalışır. Prompt 7 baseline'i **0 error / 0 warning**'dir.
- CI lint step'i blocking'dir; `continue-on-error` kaldırılmıştır.
- ESLint'e ek olarak TypeScript AST tabanlı `npm run test:boundaries`, legacy root importlarını, cross-feature
  deep importları, layer/SDK sınırlarını, shared bağımsızlığını, public barrel data implementation sızıntılarını
  ve her feature için `index.ts` varlığını doğrular.
- CI quality job'ı `test:boundaries` komutunu ayrı blocking gate olarak çalıştırır.

Root shim'lerin fiziksel silinmesi Prompt 8 kapsamındadır; Prompt 7 itibarıyla aktif production `src` graph'i
bu shim'leri tüketmez.
