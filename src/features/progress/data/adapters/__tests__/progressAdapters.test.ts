// Real migration transform tests — covers the full edge-case list from docs/refactor-v2/37 §4.
// These must pass before any migration is considered "ready" (no Firebase / emulator needed — pure functions).
import {
  adaptLegacyLearnedWordsToProgressByLevelDocs,
  toProgressByLevelDoc,
  fromProgressByLevelDoc,
  buildProgressSummary,
  sumLegacyLearnedWords,
  sumProgressByLevelModels,
  verifyMigrationCounts,
} from '../progressAdapters';

describe('adaptLegacyLearnedWordsToProgressByLevelDocs — edge cases (docs/refactor-v2/37 §4)', () => {
  it('converts learned word ids by level; currentLevel carries lastWordIndex', () => {
    const docs = adaptLegacyLearnedWordsToProgressByLevelDocs({
      learnedWords: { A1: [1, 2, 3], A2: [10] },
      lastWordIndex: 3,
      currentLevel: 'A1',
    });
    const a1 = docs.find(d => d.level === 'A1');
    const a2 = docs.find(d => d.level === 'A2');
    expect(a1).toMatchObject({ level: 'A1', learnedWordIds: [1, 2, 3], learnedCount: 3, lastWordId: 3 });
    expect(a2).toMatchObject({ level: 'A2', learnedWordIds: [10], learnedCount: 1, lastWordId: 0 });
  });

  it('learnedWords missing / undefined / null / empty -> [] (user counted as skipped)', () => {
    expect(adaptLegacyLearnedWordsToProgressByLevelDocs(undefined)).toEqual([]);
    expect(adaptLegacyLearnedWordsToProgressByLevelDocs(null)).toEqual([]);
    expect(adaptLegacyLearnedWordsToProgressByLevelDocs({})).toEqual([]);
    expect(adaptLegacyLearnedWordsToProgressByLevelDocs({ learnedWords: {} })).toEqual([]);
  });

  it('empty level array (A1: []) -> consistent doc with learnedCount 0', () => {
    const docs = adaptLegacyLearnedWordsToProgressByLevelDocs({ learnedWords: { A1: [] } });
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({ level: 'A1', learnedWordIds: [], learnedCount: 0, lastWordId: 0 });
  });

  it('duplicate wordIds are deduped (A1: [1,1,2,2,3] -> [1,2,3])', () => {
    const docs = adaptLegacyLearnedWordsToProgressByLevelDocs({ learnedWords: { A1: [1, 1, 2, 2, 3] } });
    expect(docs[0].learnedWordIds).toEqual([1, 2, 3]);
    expect(docs[0].learnedCount).toBe(3);
  });

  it('non-integer / negative / non-number entries are filtered', () => {
    const docs = adaptLegacyLearnedWordsToProgressByLevelDocs({
      learnedWords: { A1: ['x', 2, 3.5, -1, 4, null] },
    } as any);
    expect(docs[0].learnedWordIds).toEqual([2, 4]);
  });

  it('lastWordIndex missing -> 0', () => {
    const docs = adaptLegacyLearnedWordsToProgressByLevelDocs({ learnedWords: { A1: [1] }, currentLevel: 'A1' });
    expect(docs[0].lastWordId).toBe(0);
  });

  it('A1 present, A2 absent -> only A1 doc', () => {
    const docs = adaptLegacyLearnedWordsToProgressByLevelDocs({ learnedWords: { A1: [1, 2] } });
    expect(docs.map(d => d.level)).toEqual(['A1']);
  });

  it('ids are sorted ascending', () => {
    const docs = adaptLegacyLearnedWordsToProgressByLevelDocs({ learnedWords: { A1: [3, 1, 2] } });
    expect(docs[0].learnedWordIds).toEqual([1, 2, 3]);
  });

  it('attaches deviceId/version when provided', () => {
    const docs = adaptLegacyLearnedWordsToProgressByLevelDocs(
      { learnedWords: { A1: [1] } },
      { deviceId: 'device-a', version: 2, vocabularySchemaVersion: 2 }
    );
    expect(docs[0].updatedByDeviceId).toBe('device-a');
    expect(docs[0].version).toBe(2);
    expect(docs[0].vocabularySchemaVersion).toBe(2);
  });

  it('is idempotent (re-running yields identical output) — safe to re-run migration', () => {
    const legacy = { learnedWords: { A1: [1, 2], B1: [5] }, lastWordIndex: 1, currentLevel: 'A1' };
    expect(adaptLegacyLearnedWordsToProgressByLevelDocs(legacy)).toEqual(
      adaptLegacyLearnedWordsToProgressByLevelDocs(legacy)
    );
  });
});

describe('verifyMigrationCounts — copy/verify safety (docs/refactor-v2/08 §7)', () => {
  it('ok=true when counts match (clean data)', () => {
    const legacy = { learnedWords: { A1: [1, 2, 3], A2: [10] } };
    const models = adaptLegacyLearnedWordsToProgressByLevelDocs(legacy);
    expect(verifyMigrationCounts(legacy, models)).toEqual({ oldTotal: 4, newTotal: 4, ok: true });
  });

  it('ok=false when duplicates reduce the new count (migration must STOP)', () => {
    const legacy = { learnedWords: { A1: [1, 1, 2] } };
    const models = adaptLegacyLearnedWordsToProgressByLevelDocs(legacy);
    const v = verifyMigrationCounts(legacy, models);
    expect(v).toEqual({ oldTotal: 3, newTotal: 2, ok: false });
  });

  it('ok=false when words live under an invalid level key (dropped -> mismatch)', () => {
    const legacy = { learnedWords: { A1: [1], A0: [9, 9] } } as any;
    const models = adaptLegacyLearnedWordsToProgressByLevelDocs(legacy);
    expect(models.map(m => m.level)).toEqual(['A1']);
    expect(verifyMigrationCounts(legacy, models).ok).toBe(false);
  });

  it('sumLegacyLearnedWords/sumProgressByLevelModels are consistent', () => {
    const legacy = { learnedWords: { A1: [1, 2], A2: [3] } };
    const models = adaptLegacyLearnedWordsToProgressByLevelDocs(legacy);
    expect(sumLegacyLearnedWords(legacy)).toBe(3);
    expect(sumProgressByLevelModels(models)).toBe(3);
  });
});

describe('toProgressByLevelDoc / fromProgressByLevelDoc — no Timestamp leaks into domain', () => {
  it('round-trips and drops updatedAt from the domain model', () => {
    const model = {
      level: 'A1' as const,
      learnedWordIds: [1, 2],
      lastWordId: 2,
      learnedCount: 2,
      vocabularySchemaVersion: 2,
    };
    const dto = toProgressByLevelDoc(model, 'SENTINEL_TS' as any, { deviceId: 'device-a', version: 1 });
    expect(dto.updatedAt).toBe('SENTINEL_TS');
    expect(dto.updatedByDeviceId).toBe('device-a');
    expect(dto.learnedCount).toBe(2);

    const back = fromProgressByLevelDoc(dto);
    expect(back).toMatchObject({
      level: 'A1',
      learnedWordIds: [1, 2],
      learnedCount: 2,
      lastWordId: 2,
      vocabularySchemaVersion: 2,
    });
    expect((back as Record<string, unknown>).updatedAt).toBeUndefined();
  });
});

describe('buildProgressSummary', () => {
  it('computes per-level + overall percent from LOCAL totals', () => {
    const models = adaptLegacyLearnedWordsToProgressByLevelDocs({ learnedWords: { A1: [1, 2, 3], A2: [10] } });
    const summary = buildProgressSummary(models, { A1: 12, A2: 8 });
    expect(summary.byLevel.A1).toEqual({ learnedCount: 3, totalCount: 12, percent: 25 });
    expect(summary.byLevel.A2).toEqual({ learnedCount: 1, totalCount: 8, percent: 13 });
    expect(summary.overallPercent).toBe(20); // 4 / 20
  });
});
