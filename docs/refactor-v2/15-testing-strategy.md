# 15 — Test Stratejisi

## Mevcut durum
- `jest-expo`; testler `__tests__/` + `tests/firestoreRules.ts`.
- `jest.config.js` **büyük/riskli dosyaları coverage’tan dışlıyor** (notification, adMob, vocabulary, progress,
  favorites, SettingsScreen, SetupScreens). → en riskli kod en az test.
- İyi testler: streak, SyncService, storage, groq, i18n, socialAuthProfile.

## Test piramidi (hedef)
| Katman | Kapsam | Araç |
|---|---|---|
| **domain unit** | saf kurallar (progress, level, shuffle, streak, notif scheduling, gating) | jest |
| **repository** | Firestore/AsyncStorage/asset erişimi (fake/emulator) | jest + emulator |
| **adapter** | DTO ↔ model, `.txt` → Word, Firestore v2 dönüşüm | jest |
| **migration transform** | learnedWords → progressByLevel (`08`) | jest |
| **hook** | useLesson/useSettings state | @testing-library/react-native |
| **integration** | use-case + repository birlikte | jest |
| **Firestore rules** | sahiplik + alan doğrulama | emulator (`tests/firestoreRules.ts`) |
| **manuel QA** | faz QA checklist’leri | el ile |

## Öncelikli test alanları (riskli domain)
progress hesabı, level geçiş, local vocabulary seçim, favorites, streak, notification frequency,
Firestore DTO↔model adapter, progressByLevel migration, auth/profile sync conflict, settings persistence, premium/free gating.

## Coverage hedefleri (gerçekçi, kademeli)
- domain (saf kurallar): **≥ %90**.
- repository/adapter: ≥ %70.
- genel global: başlangıç mevcut seviye, her fazda +%5; her şeyi bir anda %100 yapma yok.
- `jest.config.js` exclude listesi **fazlar ilerledikçe daraltılır** (bölünen kod test edilebilir hale geldikçe).

## CI entegrasyonu
`16` ile: `npm run typecheck` + `npm run test:ci` + `npm run test:rules` (emulator) PR gate.

## Kabul kriterleri
- Her faz kendi domain testleriyle gelir; exclude listesi azalır; riskli domain coverage hedefleri tutar.


---

## Implementation-spec detayları (v2 — `32`–`39`)
- **Test skeleton'ları (10 tip):** `37-testing-code-templates.md` — domain, adapter, repository mock, migration transform, Firestore rules (emulator), hook, notification scheduling, auth/sync conflict, settings persistence, premium gating. Hepsi gerçek stile (`jest-expo`, `@testing-library/react-native`, `@firebase/rules-unit-testing`) dayanır.
- **Gerçek komutlar:** `npm run test:ci` (jest --runInBand), `npm run test:rules` (emulator), `npm run typecheck`/`typecheck:test`/`typecheck:rules`.
- **Exclude listesi daraltma sırası (gerçek `jest.config.js`):** bir dosya domain/repo/adapter'a bölününce ilgili satır kaldırılır — sıra: `progressService` (Phase 3/5) → `vocabularyService` (5) → `favoritesService` (5/7) → `notificationService` (6) → `SettingsScreen`/`SetupScreens` (7) → `adMobService` (8).
- **Migration edge-case listesi:** `37` §4 (bu testler geçmeden migration "bitti" sayılmaz).
- **CI gate:** `38` §8 (coverage eşiği düşürülemez).
