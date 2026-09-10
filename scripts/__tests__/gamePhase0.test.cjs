const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  collectGateBlockers,
  validateArtifactProvenance,
  validateV4Fixture,
} = require('../checkGamePhase0.cjs');

const root = path.join(__dirname, '..', '..');
const evidence = JSON.parse(
  readFileSync(path.join(root, 'docs', 'artifacts', 'game-phase0-provenance.json'), 'utf8'),
);
const fixture = JSON.parse(readFileSync(path.join(root, evidence.contract.fixture), 'utf8'));
const release = JSON.parse(
  readFileSync(path.join(root, 'docs', 'artifacts', 'game-phase5-release.json'), 'utf8'),
);
const languages = new Set(['english', 'turkish']);

test('locks the minimum V4 fixture and keeps the recorded gate state consistent', () => {
  assert.deepEqual(validateV4Fixture(fixture, languages), []);
  assert.match(
    validateV4Fixture({ ...fixture, learnedWordIds: [1, 1] }, languages).join('\n'),
    /unique non-negative safe integers/,
  );
  assert.equal(collectGateBlockers(evidence).length === 0, evidence.phase0Status === 'passed');
});

test('artifact provenance is fail-closed', () => {
  const expected = {
    schemaVersion: 1,
    sourceCommit: 'a'.repeat(40),
    catalogHash: 'b'.repeat(64),
  };
  assert.deepEqual(validateArtifactProvenance({ ...expected }, expected), []);
  assert.deepEqual(validateArtifactProvenance({ ...expected, sourceCommit: 'stale' }, expected), [
    'sourceCommit mismatch',
  ]);
  assert.deepEqual(validateArtifactProvenance(null, expected), ['must be one object']);
});

test('keeps Phase 5 release evidence internally consistent', () => {
  assert.equal(release.unity.sourceCommit, evidence.unity.commit);
  assert.equal(release.catalogHash, fixture.catalogHash);
  assert.equal(release.android.sha256, evidence.artifacts.android.sha256);
  assert.equal(release.status, release.blockers.length === 0 ? 'passed' : 'blocked');
  assert.equal(release.rollback.status, 'ready');
});
