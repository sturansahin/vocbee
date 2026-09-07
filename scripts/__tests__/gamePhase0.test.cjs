const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { collectGateBlockers, validateV4Fixture } = require('../checkGamePhase0.cjs');

const root = path.join(__dirname, '..', '..');
const evidence = JSON.parse(
  readFileSync(path.join(root, 'docs', 'artifacts', 'game-phase0-provenance.json'), 'utf8'),
);
const fixture = JSON.parse(readFileSync(path.join(root, evidence.contract.fixture), 'utf8'));
const languages = new Set(['english', 'turkish']);

test('locks the minimum V4 fixture and keeps the recorded gate state consistent', () => {
  assert.deepEqual(validateV4Fixture(fixture, languages), []);
  assert.match(
    validateV4Fixture({ ...fixture, learnedWordIds: [1, 1] }, languages).join('\n'),
    /unique non-negative safe integers/,
  );
  assert.equal(collectGateBlockers(evidence).length === 0, evidence.phase0Status === 'passed');
});
