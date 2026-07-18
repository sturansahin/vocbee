'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  SafetyError,
  assessUserDocument,
  collectDestructiveGateReasons,
  expectedProgressByLevel,
  parseArgs,
  runCleanup,
  validateTarget,
} = require('../lib/firestoreLegacyCleanup.cjs');

const ROOT = path.resolve(__dirname, '..', '..');
const ALLOWLIST = path.join(ROOT, 'scripts', 'firestore-legacy-cleanup.projects.json');

const legacyProgress = {
  currentLevel: 'A1',
  learnedWords: { A1: [1, 2, 3] },
  lastWordIndex: 3,
};
const v2Progress = {
  A1: {
    level: 'A1',
    learnedWordIds: [1, 2, 3],
    learnedCount: 3,
    lastWordIndex: 3,
    version: 1,
    updatedAt: new Date('2026-07-17T12:00:00.000Z'),
  },
};

function emulatorOptions(reportPath, overrides = {}) {
  return {
    execute: false,
    project: 'vocbee-firestore-cleanup-emulator',
    environment: 'emulator',
    allowlistPath: ALLOWLIST,
    reportPath,
    batchSize: 50,
    maxDocuments: 100,
    ...overrides,
  };
}

function withEmulatorHost(callback) {
  const previous = process.env.FIRESTORE_EMULATOR_HOST;
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  try {
    return callback();
  } finally {
    if (previous === undefined) delete process.env.FIRESTORE_EMULATOR_HOST;
    else process.env.FIRESTORE_EMULATOR_HOST = previous;
  }
}

test('builds the exact v2 equivalence model and rejects lossy legacy data', () => {
  assert.deepEqual(expectedProgressByLevel(legacyProgress), {
    models: [{ level: 'A1', learnedWordIds: [1, 2, 3], learnedCount: 3, lastWordIndex: 3 }],
    issues: [],
  });

  const lossy = expectedProgressByLevel({
    currentLevel: 'A1',
    learnedWords: { A1: [1, 1, -1], C2: [9] },
    lastWordIndex: 0,
  });
  assert.ok(lossy.issues.includes('legacy-learned-words-has-unknown-level'));
  assert.ok(lossy.issues.includes('legacy-A1-ids-invalid-or-duplicated'));
});

test('only marks schemaVersion=2 with byte-equivalent level documents as a cleanup candidate', () => {
  assert.equal(
    assessUserDocument({ schemaVersion: 2, progress: legacyProgress }, v2Progress).status,
    'candidate'
  );
  const noSchema = assessUserDocument({ progress: legacyProgress }, v2Progress);
  assert.equal(noSchema.status, 'mismatch');
  assert.ok(noSchema.reasons.includes('schema-version-not-v2'));

  const drifted = assessUserDocument(
    { schemaVersion: 2, progress: legacyProgress },
    { A1: { ...v2Progress.A1, learnedWordIds: [1, 2], learnedCount: 2 } }
  );
  assert.equal(drifted.status, 'mismatch');
  assert.ok(drifted.reasons.includes('progress-by-level-A1-ids-mismatch'));

  const staleSync = assessUserDocument(
    {
      schemaVersion: 2,
      progress: { ...legacyProgress, lastSync: new Date('2026-07-17T12:00:00.000Z') },
      syncMeta: { updatedAt: new Date('2026-07-17T11:59:00.000Z') },
    },
    v2Progress
  );
  assert.equal(staleSync.status, 'mismatch');
  assert.ok(staleSync.reasons.includes('sync-meta-older-than-legacy-last-sync'));
});

test('CLI parser defaults to dry-run and requires explicit execute inputs', () => {
  const parsed = parseArgs([
    '--project', 'vocbee-firestore-cleanup-emulator',
    '--environment', 'emulator',
    '--report', '/tmp/report.json',
    '--expected-documents', '0',
  ]);
  assert.equal(parsed.execute, false);
  assert.equal(parsed.expectedDocuments, 0);
  assert.equal(parsed.batchSize, 200);
  assert.throws(() => parseArgs(['--unknown']), error => error instanceof SafetyError && error.code === 'INVALID_ARGUMENT');
});

test('target validation rejects an environment/project mismatch before Firestore access', () => {
  withEmulatorHost(() => {
    assert.throws(
      () => validateTarget(emulatorOptions('/tmp/report.json', { project: 'vocbee-6fe24' })),
      error => error instanceof SafetyError && error.code === 'PROJECT_NOT_ALLOWLISTED'
    );
  });

  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vocbee-cleanup-credential-'));
  const credentialPath = path.join(temporaryRoot, 'credential.json');
  fs.writeFileSync(credentialPath, JSON.stringify({
    type: 'service_account', client_email: 'cleanup@example.invalid', project_id: 'vocbee-6fe24',
  }));
  assert.throws(
    () => validateTarget({
      ...emulatorOptions('/tmp/report.json'),
      project: 'vocbee-6fe24',
      environment: 'production',
      credentialIdentity: 'different@example.invalid',
    }, { env: { GOOGLE_APPLICATION_CREDENTIALS: credentialPath } }),
    error => error instanceof SafetyError && error.code === 'CREDENTIAL_MISMATCH'
  );
});

test('destructive gate names every required production blocker', () => {
  const reasons = collectDestructiveGateReasons(
    { project: 'vocbee-6fe24', environment: 'production' },
    { candidates: 2, mismatched: 1 }
  );
  assert.ok(reasons.includes('migration-mismatch-count-nonzero'));
  assert.ok(reasons.includes('restore-verification-missing-or-invalid'));
  assert.ok(reasons.includes('second-owner-approval-missing'));
  assert.ok(reasons.includes('approved-document-count-missing-or-mismatch'));
  assert.ok(reasons.includes('staging-evidence-missing'));
});

test('dry-run reports counts and never calls the destructive store method', async () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vocbee-cleanup-unit-'));
  const reportPath = path.join(temporaryRoot, 'repo', 'dry-run.json');
  let deletes = 0;
  const store = {
    async scanUsers(_batchSize, visitor) {
      await visitor({ id: 'raw-uid-never-reported', data: { schemaVersion: 2, progress: legacyProgress } });
      await visitor({ id: 'no-progress', data: { schemaVersion: 2 } });
    },
    async getProgressByLevel() { return v2Progress; },
    async deleteLegacyProgressIfStillVerified() { deletes += 1; },
  };

  const report = await withEmulatorHost(() => runCleanup({
    options: emulatorOptions(reportPath),
    store,
    repositoryRoot: path.join(temporaryRoot, 'repo'),
  }));

  assert.equal(deletes, 0);
  assert.deepEqual(report.counts, {
    scanned: 2,
    legacyDocuments: 1,
    candidates: 1,
    mismatched: 0,
    skipped: 1,
    fieldsPlannedForDeletion: 1,
    mismatchReasons: {},
    deleted: 0,
  });
  const serialized = fs.readFileSync(reportPath, 'utf8');
  assert.equal(serialized.includes('raw-uid-never-reported'), false);
  assert.equal(serialized.includes('@'), false);
});

test('execute requires the exact second approval and writes only a redacted external ops log', async () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vocbee-cleanup-execute-'));
  const repositoryRoot = path.join(temporaryRoot, 'repo');
  const reportPath = path.join(repositoryRoot, 'execute.json');
  const opsLogPath = path.join(temporaryRoot, 'ops', 'cleanup.jsonl');
  let deletes = 0;
  const store = {
    async scanUsers(_batchSize, visitor) {
      await visitor({ id: 'sensitive-uid', data: { schemaVersion: 2, progress: legacyProgress } });
    },
    async getProgressByLevel() { return v2Progress; },
    async deleteLegacyProgressIfStillVerified() { deletes += 1; },
  };
  const approved = emulatorOptions(reportPath, {
    execute: true,
    confirmProject: 'vocbee-firestore-cleanup-emulator',
    backupId: 'emulator-backup-1',
    backupCreatedAt: '2026-07-17T12:00:00.000Z',
    backupRetentionDays: 7,
    restoreVerifiedAt: '2026-07-17T12:05:00.000Z',
    rollbackPlan: 'prompt-9-runbook',
    compatibilityWindow: 'closed',
    dualWrite: 'disabled',
    approvalId: 'owner-second-approval-test',
    approvalProject: 'vocbee-firestore-cleanup-emulator',
    approvalBackupId: 'emulator-backup-1',
    expectedDocuments: 1,
    opsLogPath,
  });

  const report = await withEmulatorHost(() => runCleanup({ options: approved, store, repositoryRoot }));
  assert.equal(report.destructiveGate.ready, true);
  assert.equal(deletes, 1);
  const opsLog = fs.readFileSync(opsLogPath, 'utf8');
  assert.equal(opsLog.includes('sensitive-uid'), false);
  assert.match(opsLog, /subjectHash/);

  const refused = { ...approved, reportPath: path.join(repositoryRoot, 'refused.json'), expectedDocuments: 2 };
  await assert.rejects(
    withEmulatorHost(() => runCleanup({ options: refused, store, repositoryRoot })),
    error => error instanceof SafetyError && error.code === 'DESTRUCTIVE_GATE_CLOSED'
  );
});
