#!/usr/bin/env node
'use strict';

const path = require('node:path');
const {
  LEVELS,
  SafetyError,
  assessUserDocument,
  parseArgs,
  runCleanup,
  validateTarget,
} = require('./lib/firestoreLegacyCleanup.cjs');

const DEFAULT_ALLOWLIST = path.join(__dirname, 'firestore-legacy-cleanup.projects.json');

function usage() {
  return `Firestore legacy progress cleanup (default: read-only dry-run)

Required for every run:
  --project <firebase-project-id>
  --environment <emulator|dev|staging|production>
  --report <redacted-json-path>
  --credential-identity <service-account-email>   Required for remote targets

Target safety:
  --allowlist <path>                               Default: scripts/firestore-legacy-cleanup.projects.json
  --batch-size <1..n>                              Default: 200
  --max-documents <1..n>                           Default: 100000

Destructive mode (all required with --execute):
  --execute
  --confirm-project <firebase-project-id>
  --backup-id <immutable-export-id>
  --backup-created-at <ISO-8601>
  --backup-retention-days <n>
  --restore-verified-at <ISO-8601>
  --rollback-plan <approved-runbook-id>
  --compatibility-window closed
  --dual-write disabled
  --approval-id <second-owner-approval-id>
  --approval-project <firebase-project-id>
  --approval-backup-id <immutable-export-id>
  --expected-documents <exact-dry-run-count>
  --ops-log <absolute-path-outside-repository>
  --staging-evidence-id <id>                       Also required for production

The tool never deletes favorites. It removes only users/{uid}.progress after every v2
progressByLevel document is transactionally revalidated. It never uses firebase use/default project state.`;
}

class FirestoreAdminStore {
  constructor(db, firestoreAdmin) {
    this.db = db;
    this.FieldPath = firestoreAdmin.FieldPath;
    this.FieldValue = firestoreAdmin.FieldValue;
  }

  async scanUsers(batchSize, visitor) {
    let lastId;
    while (true) {
      let query = this.db.collection('users').orderBy(this.FieldPath.documentId()).limit(batchSize);
      if (lastId) query = query.startAfter(lastId);
      const snapshot = await query.get();
      if (snapshot.empty) return;
      for (const document of snapshot.docs) {
        await visitor({ id: document.id, data: document.data() });
      }
      if (snapshot.size < batchSize) return;
      lastId = snapshot.docs[snapshot.docs.length - 1].id;
    }
  }

  async getProgressByLevel(userId) {
    const snapshot = await this.db.collection('users').doc(userId).collection('progressByLevel').get();
    const result = {};
    for (const document of snapshot.docs) result[document.id] = document.data();
    return result;
  }

  async deleteLegacyProgressIfStillVerified(userId) {
    const userReference = this.db.collection('users').doc(userId);
    await this.db.runTransaction(async transaction => {
      const userSnapshot = await transaction.get(userReference);
      if (!userSnapshot.exists) throw new SafetyError('Candidate disappeared during execute.', 'CANDIDATE_CHANGED');

      const levelSnapshots = [];
      for (const level of LEVELS) {
        levelSnapshots.push(await transaction.get(userReference.collection('progressByLevel').doc(level)));
      }
      const progressByLevel = {};
      for (const snapshot of levelSnapshots) {
        if (snapshot.exists) progressByLevel[snapshot.id] = snapshot.data();
      }
      const assessment = assessUserDocument(userSnapshot.data(), progressByLevel);
      if (assessment.status !== 'candidate') {
        throw new SafetyError('Candidate changed after dry-run; cleanup halted.', 'CANDIDATE_CHANGED');
      }
      transaction.update(userReference, { progress: this.FieldValue.delete() });
    });

    const verification = await userReference.get();
    if (verification.exists && Object.prototype.hasOwnProperty.call(verification.data(), 'progress')) {
      throw new SafetyError('Post-delete verification failed.', 'POST_DELETE_VERIFICATION_FAILED');
    }
  }
}

async function createStore(options) {
  const { applicationDefault, deleteApp, initializeApp } = require('firebase-admin/app');
  const { FieldPath, FieldValue, getFirestore } = require('firebase-admin/firestore');
  const appOptions = { projectId: options.project };
  if (options.environment !== 'emulator') appOptions.credential = applicationDefault();
  const app = initializeApp(appOptions, `firestore-legacy-cleanup-${process.pid}-${Date.now()}`);
  return {
    store: new FirestoreAdminStore(getFirestore(app), { FieldPath, FieldValue }),
    close: () => deleteApp(app),
  };
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  options.allowlistPath ||= DEFAULT_ALLOWLIST;

  let connection;
  try {
    // Validate explicit target, environment allowlist and credential evidence before SDK initialization/read.
    validateTarget(options);
    connection = await createStore(options);
    const report = await runCleanup({ options, store: connection.store, repositoryRoot: process.cwd() });
    process.stdout.write(`${JSON.stringify({
      mode: report.mode,
      target: report.target,
      counts: report.counts,
      destructiveGate: report.destructiveGate,
      report: path.resolve(options.reportPath),
    })}\n`);
  } finally {
    if (connection) await connection.close();
  }
}

if (require.main === module) {
  main().catch(error => {
    const code = error instanceof SafetyError ? error.code : 'UNEXPECTED_ERROR';
    const message = error instanceof SafetyError
      ? error.message
      : 'Unexpected cleanup failure. Review the redacted report and secure external operations log.';
    process.stderr.write(`${JSON.stringify({ status: 'failed', code, message })}\n`);
    process.exitCode = 1;
  });
}

module.exports = { FirestoreAdminStore, createStore, main, usage };
