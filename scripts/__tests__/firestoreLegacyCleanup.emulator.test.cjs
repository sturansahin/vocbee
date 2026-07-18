'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { deleteApp, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const { runCleanup } = require('../lib/firestoreLegacyCleanup.cjs');
const { FirestoreAdminStore } = require('../firestoreLegacyCleanup.cjs');

const PROJECT = 'vocbee-firestore-cleanup-emulator';
const ROOT = path.resolve(__dirname, '..', '..');
const ALLOWLIST = path.join(ROOT, 'scripts', 'firestore-legacy-cleanup.projects.json');

function options(reportPath, overrides = {}) {
  return {
    execute: false,
    project: PROJECT,
    environment: 'emulator',
    allowlistPath: ALLOWLIST,
    reportPath,
    batchSize: 25,
    maxDocuments: 100,
    ...overrides,
  };
}

test('emulator dry-run, transactional cleanup, post-check and rollback all succeed', async t => {
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'FIRESTORE_EMULATOR_HOST must be set by firebase emulators:exec');
  const app = initializeApp({ projectId: PROJECT }, `cleanup-emulator-test-${process.pid}`);
  const db = getFirestore(app);
  const { FieldPath, FieldValue } = require('firebase-admin/firestore');
  const store = new FirestoreAdminStore(db, { FieldPath, FieldValue });
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vocbee-cleanup-emulator-'));
  const repositoryRoot = path.join(temporaryRoot, 'repo');
  const legacyProgress = {
    currentLevel: 'A1',
    learnedWords: { A1: [1, 2, 3], A2: [] },
    lastWordIndex: 3,
  };

  t.after(async () => {
    await db.recursiveDelete(db.collection('users'));
    await deleteApp(app);
  });
  await db.recursiveDelete(db.collection('users'));

  const user = db.collection('users').doc('emulator-user');
  await user.set({ schemaVersion: 2, progress: legacyProgress, displayName: 'PII must never enter reports' });
  await user.collection('progressByLevel').doc('A1').set({
    level: 'A1', learnedWordIds: [1, 2, 3], learnedCount: 3, lastWordIndex: 3, version: 1, updatedAt: new Date(),
  });
  await user.collection('progressByLevel').doc('A2').set({
    level: 'A2', learnedWordIds: [], learnedCount: 0, lastWordIndex: 0, version: 1, updatedAt: new Date(),
  });

  const dryRunPath = path.join(repositoryRoot, 'dry-run.json');
  const dryRun = await runCleanup({ options: options(dryRunPath), store, repositoryRoot });
  assert.equal(dryRun.mode, 'dry-run');
  assert.equal(dryRun.counts.candidates, 1);
  assert.equal(dryRun.counts.mismatched, 0);
  assert.equal((await user.get()).data().progress.currentLevel, 'A1');
  assert.equal(fs.readFileSync(dryRunPath, 'utf8').includes('PII must never enter reports'), false);

  const executePath = path.join(repositoryRoot, 'execute.json');
  const opsLogPath = path.join(temporaryRoot, 'secure-ops', 'cleanup.jsonl');
  const execute = await runCleanup({
    options: options(executePath, {
      execute: true,
      confirmProject: PROJECT,
      backupId: 'emulator-export-verified',
      backupCreatedAt: '2026-07-17T12:00:00.000Z',
      backupRetentionDays: 7,
      restoreVerifiedAt: '2026-07-17T12:05:00.000Z',
      rollbackPlan: 'docs/refactor-v2/prompt-9-firestore-cleanup-runbook.md',
      compatibilityWindow: 'closed',
      dualWrite: 'disabled',
      approvalId: 'emulator-second-approval',
      approvalProject: PROJECT,
      approvalBackupId: 'emulator-export-verified',
      expectedDocuments: 1,
      opsLogPath,
    }),
    store,
    repositoryRoot,
  });
  assert.equal(execute.counts.deleted, 1);
  assert.equal(Object.prototype.hasOwnProperty.call((await user.get()).data(), 'progress'), false);

  // Rollback exercise: restore the exact pre-cleanup legacy payload and verify v2 data remains intact.
  await user.set({ progress: legacyProgress }, { merge: true });
  const restored = (await user.get()).data();
  assert.deepEqual(restored.progress, legacyProgress);
  assert.deepEqual((await user.collection('progressByLevel').doc('A1').get()).data().learnedWordIds, [1, 2, 3]);
});
