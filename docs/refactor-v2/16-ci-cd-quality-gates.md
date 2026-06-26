# 16 — CI/CD ve Quality Gates

## Mevcut durum
- `.github/workflows` pratikte boş → **CI yok**.
- `package.json` script’leri mevcut: `typecheck` (tsc -p tsconfig.app.json), `typecheck:test`,
  `typecheck:rules`, `typecheck:worker`, `test`/`test:ci` (jest), `test:rules` (firebase emulators),
  `audit:prod`, `functions:lint`, `functions:build`.

## Problem
Kalite kapıları otomatik değil; regresyon ve secret sızıntısı elle yakalanıyor. Refactor için emniyet ağı zayıf.

## Hedef PR pipeline (GitHub Actions — plan, gerçek script’lere göre)
```
1. npm ci
2. npm run typecheck           # + typecheck:test, typecheck:rules, typecheck:worker
3. eslint .                    # (ESLint config eklenecek)
4. prettier --check .          # format gate
5. npm run test:ci             # jest + coverage
6. npm run test:rules          # firestore emulator rules
7. migration dry-run check     # script eklendiğinde (07/08), şimdilik placeholder
8. expo prebuild/build check   # veya eas build --local kontrolü
9. secret scanning             # gitleaks/trufflehog
```

## Quality gate kuralları
- PR merge için: typecheck + test:ci + test:rules + eslint + prettier + secret-scan yeşil zorunlu.
- Coverage eşiği düşürme PR’ı engellenir (regresyon koruma).
- `firebase-admin` mobil bundle kontrolü (dependency audit, `09`).

## Eksik araçlar (eklenecek)
- ESLint config (yok) + `import/no-cycle`, katman sınır kuralı (`import/no-restricted-paths`).
- Prettier check (format script’i netleştir).
- gitleaks/trufflehog secret scan.

## CD
- EAS build profilleri `eas.json`’da mevcut; CI yalnızca doğrulama, build/release manuel/EAS pipeline’ında.

## Kabul kriterleri
- PR’larda otomatik gate’ler çalışır; kırmızı gate merge’i engeller; secret-scan aktif.


---

## Implementation-spec detayları (v2 — `32`–`39`)
- **Tam CI/alias/ESLint config skeleton'ları:** `38-ci-eslint-alias-config-spec.md` — GitHub Actions `ci.yml` (quality + rules + secret-scan job'ları; script isimleri gerçek `package.json`'a uygun), tsconfig/babel/jest alias mapping, ESLint `import/no-cycle` + katman sınırı.
- **Katman lint kuralları:** `33` §5 (`import/no-restricted-paths` zone'ları + `domain/**` SDK yasağı).
- **Quality gate tablosu:** `38` §8 (typecheck/lint/test:ci/test:rules/audit:prod/secret-scan → kırmızı = merge yok).
- **Uygulama sırası:** `38` §9 — Phase 0 (CI iskeleti + lint `warn` + gitignore), Phase 1 (alias), Phase 9 (lint `warn`→`error`, coverage yükseltme, `@/*`→`./src/*`).
- **Mevcut durum:** `.github/workflows/` boş (CI yok); ESLint config yok; bunlar Phase 0'da eklenir.
