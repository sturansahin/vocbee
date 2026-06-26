# 38 — CI / ESLint / Alias Config Spec

> Bu bir **implementation-spec**tir. Tüm kod/konfig blokları **örnek/skeleton**dır; gerçek implementasyon değildir.
> Bu görevde hiçbir konfig dosyası (`tsconfig*`, `babel.config.js`, `metro.config.js`, `jest.config.js`,
> `package.json`, `.github/workflows/*`) DEĞİŞTİRİLMEMİŞTİR. Öneriler gerçek mevcut duruma dayanır.

## 0. Mevcut durum (doğrulandı)
- `tsconfig.json` → `paths: { "@/*": ["./*"] }` (kök bazlı, az kullanılıyor).
- `babel.config.js` → yalnızca `babel-preset-expo` (module-resolver YOK).
- `metro.config.js` → `assetExts`'e `txt` ekliyor (vocabulary asset'leri için).
- `jest.config.js` → `preset: jest-expo`, `moduleNameMapper: { '\\.txt$': txtFileMock }`, coverage exclude listesi.
- `.github/workflows/` → **boş** (CI yok).
- ESLint config → **yok**.
- Scripts → `typecheck`, `typecheck:test`, `typecheck:rules`, `typecheck:worker`, `test`, `test:ci`, `test:rules`, `audit:prod`, `functions:lint`, `functions:build`.

## 1. Path alias hedefi
Geçiş için **iki alias dönemi**:
- **Geçiş dönemi (Phase 1-8):** mevcut `@/*` → `./*` KORUNUR; ek olarak `@app/@shared/@features` → `./src/*` eklenir. Böylece hem eski kök hem yeni `src/` import edilebilir, shim'ler çalışır.
- **Temizlik (Phase 9):** kök boşalınca `@/*` → `./src/*`'a çevrilir (veya kaldırılır).

## 2. tsconfig paths skeleton
*Skeleton/contract — implementasyon değil; `tsconfig.json` değiştirilmedi.*
```jsonc
// tsconfig.json (PLAN — geçiş dönemi)
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],                 // KORUNUR (geçiş; eski importlar + shim)
      "@app/*": ["./src/app/*"],
      "@shared/*": ["./src/shared/*"],
      "@features/*": ["./src/features/*"]
    }
  }
}
```
> `tsconfig.app.json` `include` listesine `src/**/*` eklenmeli (şu an `App.tsx`, `screens`, `services`... sayıyor).
> `tsconfig.test.json`/`tsconfig.rules.json` aynı paths'i `extends` ile devralır.

## 3. babel/metro alias gereksinimi
Metro, JS/TS çözümünü `babel.config.js` üzerinden yapar. Alias'ın **runtime'da** çalışması için `babel-plugin-module-resolver` gerekir (tsconfig paths yalnızca tip çözümü içindir).
*Skeleton/contract — implementasyon değil; `babel.config.js` değiştirilmedi.*
```js
// babel.config.js (PLAN)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['./'],
        alias: {
          '@': './',                 // KORUNUR (geçiş)
          '@app': './src/app',
          '@shared': './src/shared',
          '@features': './src/features',
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      }],
    ],
  };
};
```
> `metro.config.js`'in mevcut `assetExts` (`txt`) ayarı **korunur**; alias için ek metro ayarı gerekmez (babel çözer).
> Yeni dev-dependency: `babel-plugin-module-resolver` (Phase 1'de eklenir — paket yükleme bu görevde YAPILMAZ).

## 4. Jest alias mapping skeleton
Jest, babel alias'ını otomatik bilmez; `moduleNameMapper`'a eklenmeli. Mevcut `.txt` mapping KORUNUR.
*Skeleton/contract — implementasyon değil; `jest.config.js` değiştirilmedi.*
```js
// jest.config.js (PLAN — moduleNameMapper genişletmesi)
moduleNameMapper: {
  '\\.txt$': '<rootDir>/__mocks__/txtFileMock.js',     // KORUNUR
  '^@app/(.*)$': '<rootDir>/src/app/$1',
  '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  '^@features/(.*)$': '<rootDir>/src/features/$1',
  '^@/(.*)$': '<rootDir>/$1',                            // KORUNUR (geçiş)
},
```
> Sıra önemli: spesifik (`@features`) genelden (`@/`) ÖNCE gelmeli, aksi halde `@/` her şeyi yakalar.

## 5. ESLint import boundary önerisi
Yeni `.eslintrc.cjs` + dev-dependency'ler: `eslint`, `@typescript-eslint/*`, `eslint-plugin-import`,
`eslint-import-resolver-typescript`. Kurallar `33`'teki katman matrisini zorlar.
*Skeleton/contract — implementasyon değil; tam kurallar `33` §5.*
```jsonc
// .eslintrc.cjs (PLAN — özet; ayrıntı 33 §5)
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "import"],
  "settings": { "import/resolver": { "typescript": { "project": "./tsconfig.json" } } },
  "rules": {
    "import/no-cycle": ["error", { "maxDepth": 1 }],
    "import/no-restricted-paths": { "zones": [ /* 33 §5 zone'ları */ ] }
  },
  "overrides": [
    { "files": ["src/features/*/domain/**/*.ts"],
      "rules": { "no-restricted-imports": ["error", { "patterns": ["firebase", "firebase/*",
        "@react-native-async-storage/*", "expo", "expo-*", "react", "react-native", "react-native-*"] }] } }
  ],
  "ignorePatterns": ["functions/", "coverage/", "node_modules/", "proxy/", "api/"]
}
```
Önerilen script (PLAN): `"lint": "eslint . --ext .ts,.tsx"` (geçişte `--max-warnings` ile kademeli sertleştirme).

## 6. CI GitHub Actions skeleton (script isimleri package.json'a uygun)
*Skeleton/contract — implementasyon değil; `.github/workflows/` boş, değiştirilmedi.*
```yaml
# .github/workflows/ci.yml (PLAN)
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck            # tsc -p tsconfig.app.json --noEmit
      - run: npm run typecheck:test
      - run: npm run typecheck:rules
      - run: npm run lint                 # eslint (config eklendiğinde)
      - run: npm run test:ci              # jest --runInBand (+coverage)
      - run: npm run audit:prod           # npm audit --omit=dev --audit-level=high

  rules:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run test:rules           # firebase emulators:exec --only firestore ... tests/firestoreRules.ts

  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@v2    # secret scanning (09)
```
> `migration dry-run check` ve `expo prebuild/build check` adımları Phase 3 sonrası ve EAS hattı netleşince eklenir (`16`).
> Build/release CI'da değil EAS pipeline'ında; CI yalnızca **doğrulama** yapar (`16`).

## 7. Secret scanning önerisi
- CI'ye `gitleaks` (veya `trufflehog`) adımı (yukarıda).
- `.gitignore` sertleştirme (`09` §C): `.env*`, `GoogleService-Info.plist`, `google-services.json`, `*.keystore`, `firebase-debug.log`, `coverage/`, `.idea/`, `.vercel/`.
- Mevcut riskler (`09`): `config/firebase.ts` hardcoded web config, `eas.json` RevenueCat public key, repoda izlenen `.env`/plist — **değerler bu dokümanlara yazılmaz**, env/EAS secret'e taşınması önerilir.
- Geçmişte commit'lenmiş secret varsa: rotate + `git filter-repo` (ayrı planlı iş; bu görevde yapılmaz).
- `firebase-admin` mobil `dependencies`'ten ayrılmalı (server-only; `09`/`R7`).

## 8. Quality gate kuralları (PR merge için zorunlu — `16`/`18`)
| Gate | Komut | Kural |
|---|---|---|
| Typecheck | `typecheck` + `typecheck:test` + `typecheck:rules` | hata = merge yok |
| Lint | `lint` (eklenince) | `import/no-cycle` + katman ihlali = merge yok |
| Unit/integration | `test:ci` | kırmızı test = merge yok; coverage eşiği düşüremez |
| Rules | `test:rules` | emulator rules testi kırmızı = merge yok |
| Audit | `audit:prod` | high/critical açık = incele |
| Secret scan | gitleaks | bulgu = merge yok |

Coverage politikası (`15`): global eşik **düşürülemez** (regresyon koruması); domain ≥%90, repo/adapter ≥%70 hedefleri faz bazında.

## 9. Uygulama sırası (hangi konfig hangi fazda)
- **Phase 0:** CI iskeleti (`ci.yml`), gitleaks, ESLint+Prettier config (kurallar önce `warn`), `.gitignore` sertleştirme, baseline `typecheck`/`test:ci` yeşil.
- **Phase 1:** alias (tsconfig paths + babel module-resolver + jest moduleNameMapper), `src/` `include`.
- **Phase 9:** ESLint kuralları `warn` → `error`, `@/*` → `./src/*`, coverage eşikleri yükseltme.

## Kabul kriterleri
- PR'da otomatik gate'ler çalışıyor; kırmızı gate merge'i engelliyor; secret-scan aktif.
- Alias üç katmanda tutarlı (tsconfig + babel + jest); `@/*` geçişte korunmuş.
- `domain/**` SDK import lint'i yeşil.

## İlgili dokümanlar
`16` (CI/CD/quality gates), `09` (secret/env), `33` (ESLint katman kuralları), `15`/`37` (test), `20`/`21`/`29` (faz uygulaması).
