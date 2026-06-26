# 37 — Testing Code Templates (Test İskeletleri)

> Bu bir **implementation-spec**tir. Tüm kod blokları **örnek/skeleton**dır; gerçek implementasyon değildir.
> Kaynak kod/testler bu görevde değiştirilmemiştir. İskeletler gerçek test stiline dayanır:
> `jest-expo`, `describe/it/expect`, `@testing-library/react-native`, `@firebase/rules-unit-testing`
> (kaynak: `services/__tests__/*`, `screens/__tests__/*`, `tests/firestoreRules.ts`).

## 0. Gerçek test komutları (package.json — değiştirilmedi)
```bash
npm test                 # jest
npm run test:watch       # jest --watch
npm run test:ci          # jest --runInBand
npm run typecheck        # tsc -p tsconfig.app.json --noEmit
npm run typecheck:test   # tsc -p tsconfig.test.json --noEmit
npm run typecheck:rules  # tsc -p tsconfig.rules.json --noEmit
npm run test:rules       # firebase emulators:exec --only firestore "jest --runInBand --runTestsByPath tests/firestoreRules.ts"
```
Coverage exclude listesi (`jest.config.js`) faz ilerledikçe **daraltılır** (`15`): bir dosya domain/repo/adapter'a bölünüp
test edilebilir olunca ilgili `!services/...` satırı kaldırılır.

## 1. Domain unit test (saf kural — en yüksek öncelik)
*Skeleton/contract — implementasyon değil.*
```ts
// features/progress/domain/__tests__/rules.test.ts — SKELETON
import { calcLevelPercent, isLevelComplete } from '../rules';

describe('progress domain rules', () => {
  it('calculates percent from learned/total', () => {
    expect(calcLevelPercent(0, 0)).toBe(0);        // totalCount=0 → 0 (progressService.getLevelProgress kuralı)
    expect(calcLevelPercent(3, 12)).toBe(25);
    expect(calcLevelPercent(12, 12)).toBe(100);
  });
  it('marks level complete only when learned >= total and total > 0', () => {
    expect(isLevelComplete(12, 12)).toBe(true);
    expect(isLevelComplete(0, 0)).toBe(false);
  });
});
```

## 2. Adapter test (DTO ↔ model, `.txt` → Word)
*Skeleton/contract — implementasyon değil.*
```ts
// features/vocabulary/data/adapters/__tests__/wordAdapter.test.ts — SKELETON
import { parseVocabularyTxt } from '../wordAdapter';

describe('parseVocabularyTxt', () => {
  it('parses valid rows into VocabularyWord[]', () => {
    const raw = JSON.stringify([
      { id: 1, word: 'el', translation: 'hand', sentence1: '...', sentence2: '...',
        nativeSentence1: '...', nativeSentence2: '...' },
    ]);
    const words = parseVocabularyTxt(raw);
    expect(words).toHaveLength(1);
    expect(words[0]).toMatchObject({ id: 1, word: 'el', translation: 'hand' });
    expect(words[0].pronunciation ?? null).toBeDefined(); // normalize: string | null
  });
  it('skips malformed rows without throwing', () => {
    expect(parseVocabularyTxt('not-json')).toEqual([]);
  });
});
```
```ts
// features/progress/data/adapters/__tests__/progressAdapters.test.ts — SKELETON
import { toProgressByLevelDoc, fromProgressByLevelDoc } from '../progressAdapters';

describe('progress adapters', () => {
  it('round-trips model → DTO → model without Timestamp leaking into domain', () => {
    const model = { level: 'A1' as const, learnedWordIds: [1, 2], lastWordIndex: 2, learnedCount: 2 };
    const dto = toProgressByLevelDoc(model, 'device-a');
    const back = fromProgressByLevelDoc(dto);
    expect(back).toMatchObject({ level: 'A1', learnedWordIds: [1, 2], learnedCount: 2 });
    expect((back as Record<string, unknown>).updatedAt).toBeUndefined(); // domain'de Timestamp YOK
  });
});
```

## 3. Repository mock test (fake ile use-case)
*Skeleton/contract — implementasyon değil.*
```ts
// features/progress/application/__tests__/completeWord.test.ts — SKELETON
import type { ProgressRepository } from '../../data/contracts';
import { makeCompleteWord } from '../useCases/completeWord';

const fakeRepo: ProgressRepository = {
  getProgressSummary: jest.fn(async () => ({ byLevel: {}, overallPercent: 0 })),
  getProgressByLevel: jest.fn(async () => ({ level: 'A1', learnedWordIds: [], lastWordIndex: 0, learnedCount: 0 })),
  saveProgressByLevel: jest.fn(async () => undefined),
  getLegacyProgressFallback: jest.fn(async () => null),
  getLocalLearnedWords: jest.fn(async () => []),
  markWordLearnedLocal: jest.fn(async () => undefined),
  setLastWordId: jest.fn(async () => undefined),
};

describe('completeWord use-case', () => {
  it('persists a newly learned word via repository', async () => {
    const completeWord = makeCompleteWord(fakeRepo);
    await completeWord('uid-1', 'A1', 42);
    expect(fakeRepo.saveProgressByLevel).toHaveBeenCalledTimes(1);   // Firebase olmadan
  });
});
```

## 4. Migration transform test (learnedWords → progressByLevel)
*Skeleton/contract — implementasyon değil.*
```ts
// features/progress/data/adapters/__tests__/migration.test.ts — SKELETON
import { adaptLegacyLearnedWordsToProgressByLevelDocs } from '../progressAdapters';

describe('adaptLegacyLearnedWordsToProgressByLevelDocs', () => {
  it('converts learned word ids by level into progressByLevel docs', () => {
    const legacy = { learnedWords: { A1: [1, 2, 3], A2: [10] }, lastWordIndex: 3, currentLevel: 'A1' };
    const docs = adaptLegacyLearnedWordsToProgressByLevelDocs(legacy);
    const a1 = docs.find(d => d.level === 'A1');
    expect(a1?.learnedWordIds).toEqual([1, 2, 3]);
    expect(a1?.learnedCount).toBe(3);
  });
});
```

### Migration edge-case listesi (bu testler geçmeden "bitti" denmez — `08`/`23`)
- [ ] `learnedWords` yok / `undefined` → boş doc listesi (`[]`), hata yok.
- [ ] level boş dizi (`A1: []`) → `learnedCount = 0`, doc yine de tutarlı.
- [ ] duplicate wordId (`A1: [1,1,2]`) → dedupe → `[1,2]`.
- [ ] wordId number değil (`A1: ['x', 2]`) → number olmayan filtrelenir → `[2]`.
- [ ] `lastWordIndex` yok → varsayılan `0`.
- [ ] kullanıcıda hiç progress yok → migration skipped (sayaçta `skipped++`).
- [ ] A1 var, A2 yok → yalnızca A1 doc'u üretilir.
- [ ] eski ve yeni model aynı anda var → dual-read yeni'yi tercih eder; migration idempotent (tekrar yazma bozmaz).
- [ ] `oldTotal !== newTotal` → `mismatched++`, migration DURUR (verify kuralı).

## 5. Firestore rules test (emulator — `tests/firestoreRules.ts` desenine ek)
*Skeleton/contract — implementasyon değil. Mevcut dosyanın stilini izler (PROJECT_ID, host 127.0.0.1:8080).*
```ts
// tests/firestoreRules.ts içine EKLENECEK blok (PLAN) — SKELETON
describe('users/{uid}/progressByLevel/{level}', () => {
  it('allows owner to write a valid level doc', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();
    const ref = doc(db, 'users/user-a/progressByLevel/A1');
    await assertSucceeds(setDoc(ref, {
      level: 'A1', learnedWordIds: [1, 2, 3], lastWordIndex: 3, learnedCount: 3,
      updatedAt: new Date(), updatedByDeviceId: 'device-a', version: 1,
    }));
  });
  it('denies cross-user write', async () => {
    const other = testEnv.authenticatedContext('other').firestore();
    await assertFails(setDoc(doc(other, 'users/user-a/progressByLevel/A1'),
      { level: 'A1', learnedWordIds: [], lastWordIndex: 0, learnedCount: 0, updatedAt: new Date() }));
  });
  it('denies invalid level id and bad types', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();
    await assertFails(setDoc(doc(db, 'users/user-a/progressByLevel/C2'),
      { level: 'C2', learnedWordIds: [], lastWordIndex: 0, learnedCount: 0, updatedAt: new Date() }));
    await assertFails(setDoc(doc(db, 'users/user-a/progressByLevel/A1'),
      { level: 'A1', learnedWordIds: 'nope', lastWordIndex: -1, learnedCount: 0, updatedAt: new Date() }));
  });
});
```

## 6. Hook test (@testing-library/react-native)
*Skeleton/contract — implementasyon değil.*
```tsx
// features/learning/presentation/hooks/__tests__/useLesson.test.tsx — SKELETON
import { renderHook, act } from '@testing-library/react-native';
import { useLesson } from '../useLesson';

describe('useLesson', () => {
  it('advances to next word and marks learned via injected use-cases', async () => {
    const { result } = renderHook(() => useLesson({ /* fake use-cases / repos */ }));
    await act(async () => { await result.current.completeCurrentWord(); });
    expect(result.current.currentWord).toBeDefined();
  });
});
```

## 7. Notification scheduling test (saf domain — `12`/`26`)
*Skeleton/contract — implementasyon değil.*
```ts
// features/notifications/domain/__tests__/scheduling.test.ts — SKELETON
import { buildSchedulePlan, MAX_VOCABULARY_NOTIFICATIONS } from '../rules';
// gerçek sabitler: MAX_SCHEDULED_NOTIFICATIONS=64, STREAK_NOTIFICATION_RESERVED_SLOTS=1 → MAX_VOCABULARY_NOTIFICATIONS=63

describe('notification scheduling rules', () => {
  it('produces slots within the daily window and frequency', () => {
    const plan = buildSchedulePlan({ startHour: 9, startMinute: 0, endHour: 21, endMinute: 0, frequencyMinutes: 120 });
    expect(plan.length).toBeGreaterThan(0);
    expect(plan.every(s => s.hour >= 9 && s.hour <= 21)).toBe(true);
  });
  it('never exceeds 63 vocabulary slots (1 reserved for streak of 64)', () => {
    const plan = buildSchedulePlan({ startHour: 0, startMinute: 0, endHour: 23, endMinute: 59, frequencyMinutes: 60 });
    expect(plan.length).toBeLessThanOrEqual(MAX_VOCABULARY_NOTIFICATIONS); // 63
  });
});
```

## 8. Auth/profile sync test (device-id çakışma — `10`/`24`)
*Skeleton/contract — implementasyon değil.*
```ts
// features/auth/application/__tests__/syncConflict.test.ts — SKELETON
import { makeSyncAll } from '../SyncOrchestrator';

describe('sync conflict resolution', () => {
  it('detects another active device via lastActiveDeviceId', async () => {
    const syncRepo = { shouldSync: async () => true,
      getActiveDeviceId: async () => 'device-OTHER', getLocalDeviceId: async () => 'device-THIS' };
    const syncAll = makeSyncAll({ syncRepo /*, feature repos*/ });
    const result = await syncAll('uid-1');
    expect(result).toBeDefined(); // son-yazan / device-id kuralı korunur (03)
  });
});
```

## 9. Settings persistence test (local + remote — `13`/`27`)
*Skeleton/contract — implementasyon değil.*
```ts
// features/settings/application/__tests__/savePreferences.test.ts — SKELETON
import type { SettingsRepository } from '../../data/contracts';

const fakeSettings: SettingsRepository = {
  getPreferences: jest.fn(async () => null),
  savePreferences: jest.fn(async () => undefined),
  getAppLanguage: jest.fn(async () => 'tr'),
  setAppLanguage: jest.fn(async () => undefined),
};

describe('savePreferences use-case', () => {
  it('persists locally and delegates remote write to profile repo (no direct Firestore)', async () => {
    await fakeSettings.savePreferences('uid-1', { nativeLanguage: 'turkish', targetLanguage: 'english', level: 'beginner' });
    expect(fakeSettings.savePreferences).toHaveBeenCalled();
  });
});
```

## 10. Premium/free gating test (saf domain — `14`/`28`)
*Skeleton/contract — implementasyon değil.*
```ts
// features/monetization/domain/__tests__/gating.test.ts — SKELETON
import { shouldShowAds } from '../rules';

describe('premium/free gating', () => {
  it('hides ads when entitlement "premium" is active', () => {
    expect(shouldShowAds({ isAdFree: true })).toBe(false);   // REVENUECAT_AD_FREE_ENTITLEMENT_ID = 'premium'
  });
  it('shows ads for free users', () => {
    expect(shouldShowAds({ isAdFree: false })).toBe(true);
  });
});
```

## 11. Test yerleşim / isimlendirme kuralları
- Yeni testler ilgili feature içinde `__tests__/` altında (`features/<f>/<layer>/__tests__/*.test.ts`).
- Firestore rules testleri tek dosyada kalır (`tests/firestoreRules.ts`); emulator gerektirir → `npm run test:rules`.
- Mevcut testler (`services/__tests__/*`, `screens/__tests__/*`) shim sayesinde yeşil kalır; taşıma sırasında kademeli yeni yola taşınır.
- Domain/adapter testleri SDK gerektirmez → CI'da hızlı; öncelik bunlarda.

## Kabul kriterleri
- Her yeni domain/adapter kodu testle gelir; migration edge-case listesi tamamlanır.
- `progressByLevel` rules testi emulator'da yeşil (`test:rules`).
- Coverage exclude listesi her fazda en az 1 dosya azalır (`15`).

## İlgili dokümanlar
`15` (test stratejisi/piramit), `16`/`38` (CI), `34` (migration/rules), `35` (repository/mock).
