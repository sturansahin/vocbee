import { buildProgressV2WritePlan, progressV2LevelsToLegacy } from '../migration';

describe('progress v2 migration plan', () => {
  it('builds all levels, canonicalizes ids, and keeps a word-id resume pointer', () => {
    const plan = buildProgressV2WritePlan({
      currentLevel: 'B1',
      learnedWords: { A1: [3, 1, 3, -1], B1: [8, 7] },
      lastWordId: 8,
      vocabularySchemaVersion: 2,
    });

    expect(plan.activeLevel).toBe('B1');
    expect(plan.levels).toHaveLength(5);
    expect(plan.levels.find(level => level.level === 'A1')).toMatchObject({
      learnedWordIds: [1, 3], lastWordId: 0, learnedCount: 2,
    });
    expect(plan.levels.find(level => level.level === 'B1')).toMatchObject({
      learnedWordIds: [7, 8], lastWordId: 8, learnedCount: 2,
      vocabularySchemaVersion: 2,
    });
    expect(plan.summary.totalLearnedCount).toBe(4);
  });

  it('uses safe bounded defaults for malformed local values', () => {
    const plan = buildProgressV2WritePlan({
      currentLevel: 'C2',
      learnedWords: { A1: [1] },
      lastWordId: -1,
      vocabularySchemaVersion: 0,
    });

    expect(plan.activeLevel).toBe('A1');
    expect(plan.levels[0]).toMatchObject({ lastWordId: 0, vocabularySchemaVersion: 1 });
  });

  it('round-trips a v2 plan to the legacy-compatible runtime view', () => {
    const plan = buildProgressV2WritePlan({
      currentLevel: 'A2',
      learnedWords: { A1: [1], A2: [5] },
      lastWordId: 5,
      vocabularySchemaVersion: 2,
    });

    expect(progressV2LevelsToLegacy(plan.activeLevel, plan.levels)).toEqual({
      currentLevel: 'A2',
      learnedWords: { A1: [1], A2: [5], B1: [], B2: [], C1: [] },
      lastWordId: 5,
    });
  });
});
