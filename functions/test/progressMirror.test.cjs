const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildLegacyMirrorPlan,
  legacyProgressChanged,
} = require('../lib/progressMirror.js');

test('builds all five deterministic v2 documents without deleting legacy data', () => {
  const plan = buildLegacyMirrorPlan({
    currentLevel: 'A2',
    learnedWords: { A1: [3, 1], A2: [8] },
    lastWordIndex: 8,
  });

  assert.equal(plan.activeLevel, 'A2');
  assert.equal(plan.levels.length, 5);
  assert.deepEqual(plan.levels[0], {
    level: 'A1',
    learnedWordIds: [1, 3],
    lastWordId: 0,
    learnedCount: 2,
    vocabularySchemaVersion: 2,
  });
  assert.equal(plan.levels[1].lastWordId, 8);
  assert.equal(plan.summary.totalLearnedCount, 3);
});

test('fails closed for duplicate, malformed, or unknown legacy data', () => {
  assert.throws(() => buildLegacyMirrorPlan({
    currentLevel: 'A1', learnedWords: { A1: [1, 1] }, lastWordIndex: 1,
  }), /duplicate/);
  assert.throws(() => buildLegacyMirrorPlan({
    currentLevel: 'A1', learnedWords: { A1: ['1'] }, lastWordIndex: 1,
  }), /invalid/);
  assert.throws(() => buildLegacyMirrorPlan({
    currentLevel: 'A1', learnedWords: { C2: [1] }, lastWordIndex: 1,
  }), /level-invalid/);
});

test('only reports changes to the legacy progress field', () => {
  const progress = { currentLevel: 'A1', learnedWords: {}, lastWordIndex: 0 };
  assert.equal(legacyProgressChanged({ progress }, { progress, displayName: 'New' }), false);
  assert.equal(legacyProgressChanged({ progress }, {
    progress: { ...progress, lastWordIndex: 1 },
  }), true);
});
