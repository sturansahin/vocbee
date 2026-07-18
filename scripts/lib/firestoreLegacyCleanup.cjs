'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const LEVELS = Object.freeze(['A1', 'A2', 'B1', 'B2', 'C1']);
const ENVIRONMENTS = Object.freeze(['emulator', 'dev', 'staging', 'production']);
const LEGACY_FIELD_PATH = 'users/{uid}.progress';
const DEFAULT_BATCH_SIZE = 200;
const DEFAULT_MAX_DOCUMENTS = 100000;

class SafetyError extends Error {
  constructor(message, code = 'SAFETY_GATE_FAILED') {
    super(message);
    this.name = 'SafetyError';
    this.code = code;
  }
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function redactIdentity(identity) {
  return identity ? `sha256:${sha256(identity).slice(0, 16)}` : null;
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parsePositiveInteger(raw, flag, { allowZero = false } = {}) {
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < (allowZero ? 0 : 1)) {
    throw new SafetyError(`${flag} must be a ${allowZero ? 'non-negative' : 'positive'} integer.`, 'INVALID_ARGUMENT');
  }
  return value;
}

function readFlagValue(argv, index, flag) {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new SafetyError(`${flag} requires a value.`, 'INVALID_ARGUMENT');
  }
  return value;
}

function parseArgs(argv) {
  const options = {
    execute: false,
    help: false,
    batchSize: DEFAULT_BATCH_SIZE,
    maxDocuments: DEFAULT_MAX_DOCUMENTS,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--execute') {
      options.execute = true;
      continue;
    }
    if (flag === '--help' || flag === '-h') {
      options.help = true;
      continue;
    }

    const valueFlags = new Map([
      ['--project', 'project'],
      ['--environment', 'environment'],
      ['--credential-identity', 'credentialIdentity'],
      ['--allowlist', 'allowlistPath'],
      ['--report', 'reportPath'],
      ['--ops-log', 'opsLogPath'],
      ['--confirm-project', 'confirmProject'],
      ['--backup-id', 'backupId'],
      ['--backup-created-at', 'backupCreatedAt'],
      ['--backup-retention-days', 'backupRetentionDays'],
      ['--restore-verified-at', 'restoreVerifiedAt'],
      ['--rollback-plan', 'rollbackPlan'],
      ['--compatibility-window', 'compatibilityWindow'],
      ['--dual-write', 'dualWrite'],
      ['--approval-id', 'approvalId'],
      ['--approval-project', 'approvalProject'],
      ['--approval-backup-id', 'approvalBackupId'],
      ['--expected-documents', 'expectedDocuments'],
      ['--staging-evidence-id', 'stagingEvidenceId'],
      ['--batch-size', 'batchSize'],
      ['--max-documents', 'maxDocuments'],
    ]);

    const property = valueFlags.get(flag);
    if (!property) {
      throw new SafetyError(`Unknown argument: ${flag}`, 'INVALID_ARGUMENT');
    }
    options[property] = readFlagValue(argv, index, flag);
    index += 1;
  }

  options.batchSize = parsePositiveInteger(options.batchSize, '--batch-size');
  options.maxDocuments = parsePositiveInteger(options.maxDocuments, '--max-documents');
  if (options.backupRetentionDays !== undefined) {
    options.backupRetentionDays = parsePositiveInteger(options.backupRetentionDays, '--backup-retention-days');
  }
  if (options.expectedDocuments !== undefined) {
    options.expectedDocuments = parsePositiveInteger(options.expectedDocuments, '--expected-documents', {
      allowZero: true,
    });
  }
  return options;
}

function loadAllowlist(allowlistPath) {
  const resolved = path.resolve(allowlistPath);
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  } catch (error) {
    throw new SafetyError(`Unable to read project allowlist: ${error.message}`, 'ALLOWLIST_INVALID');
  }
  if (parsed.schemaVersion !== 1 || !isPlainObject(parsed.environments)) {
    throw new SafetyError('Project allowlist has an unsupported shape.', 'ALLOWLIST_INVALID');
  }
  for (const environment of ENVIRONMENTS) {
    if (!Array.isArray(parsed.environments[environment])) {
      throw new SafetyError(`Project allowlist is missing environment: ${environment}`, 'ALLOWLIST_INVALID');
    }
  }
  return { resolved, environments: parsed.environments };
}

function resolveCredentialEvidence(options, env = process.env) {
  if (options.environment === 'emulator') {
    return { identity: 'firestore-emulator', projectId: options.project, source: 'emulator' };
  }

  const credentialFile = env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialFile) {
    let credential;
    try {
      credential = JSON.parse(fs.readFileSync(path.resolve(credentialFile), 'utf8'));
    } catch (error) {
      throw new SafetyError(`Credential metadata could not be read: ${error.message}`, 'CREDENTIAL_UNVERIFIED');
    }
    if (credential.type !== 'service_account' || !credential.client_email || !credential.project_id) {
      throw new SafetyError('Credential file must contain service-account identity and project metadata.', 'CREDENTIAL_UNVERIFIED');
    }
    return {
      identity: credential.client_email,
      projectId: credential.project_id,
      source: 'service-account-file',
    };
  }

  const identity = env.FIRESTORE_CLEANUP_VERIFIED_CREDENTIAL_IDENTITY;
  const projectId = env.FIRESTORE_CLEANUP_VERIFIED_CREDENTIAL_PROJECT;
  if (!identity || !projectId) {
    throw new SafetyError(
      'Remote runs require verifiable credential metadata via GOOGLE_APPLICATION_CREDENTIALS or the workload-identity attestation variables.',
      'CREDENTIAL_UNVERIFIED'
    );
  }
  return { identity, projectId, source: 'workload-identity-attestation' };
}

function validateTarget(options, context = {}) {
  if (!options.project) throw new SafetyError('--project is required.', 'PROJECT_REQUIRED');
  if (!options.environment || !ENVIRONMENTS.includes(options.environment)) {
    throw new SafetyError(`--environment must be one of: ${ENVIRONMENTS.join(', ')}.`, 'ENVIRONMENT_REQUIRED');
  }
  if (!options.allowlistPath) throw new SafetyError('--allowlist is required.', 'ALLOWLIST_REQUIRED');
  if (!options.reportPath) throw new SafetyError('--report is required.', 'REPORT_REQUIRED');

  const allowlist = loadAllowlist(options.allowlistPath);
  if (!allowlist.environments[options.environment].includes(options.project)) {
    throw new SafetyError(
      `Project is not allowlisted for environment ${options.environment}.`,
      'PROJECT_NOT_ALLOWLISTED'
    );
  }

  const emulatorHost = (context.env || process.env).FIRESTORE_EMULATOR_HOST;
  if (options.environment === 'emulator' && !emulatorHost) {
    throw new SafetyError('Emulator target requires FIRESTORE_EMULATOR_HOST.', 'EMULATOR_HOST_REQUIRED');
  }
  if (options.environment !== 'emulator' && emulatorHost) {
    throw new SafetyError('Remote target refuses to run while FIRESTORE_EMULATOR_HOST is set.', 'TARGET_MISMATCH');
  }

  const evidence = resolveCredentialEvidence(options, context.env || process.env);
  if (options.environment !== 'emulator' && !options.credentialIdentity) {
    throw new SafetyError('--credential-identity is required for remote targets.', 'CREDENTIAL_IDENTITY_REQUIRED');
  }
  if (options.environment !== 'emulator' && evidence.identity !== options.credentialIdentity) {
    throw new SafetyError('Declared credential identity does not match verified credential metadata.', 'CREDENTIAL_MISMATCH');
  }
  if (evidence.projectId !== options.project) {
    throw new SafetyError('Credential project does not match the explicit target project.', 'CREDENTIAL_PROJECT_MISMATCH');
  }

  return { allowlist, credentialEvidence: evidence };
}

function isoDateIsValid(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function collectDestructiveGateReasons(options, summary) {
  const reasons = [];
  if (summary.mismatched !== 0) reasons.push('migration-mismatch-count-nonzero');
  if (summary.candidates === 0) reasons.push('no-cleanup-candidates');
  if (!options.confirmProject || options.confirmProject !== options.project) reasons.push('project-confirmation-missing-or-mismatch');
  if (!options.backupId) reasons.push('backup-id-missing');
  if (!isoDateIsValid(options.backupCreatedAt)) reasons.push('backup-created-at-missing-or-invalid');
  if (!Number.isSafeInteger(options.backupRetentionDays) || options.backupRetentionDays < 1) {
    reasons.push('backup-retention-missing-or-invalid');
  }
  if (!isoDateIsValid(options.restoreVerifiedAt)) reasons.push('restore-verification-missing-or-invalid');
  if (!options.rollbackPlan) reasons.push('rollback-plan-missing');
  if (options.compatibilityWindow !== 'closed') reasons.push('compatibility-window-not-closed');
  if (options.dualWrite !== 'disabled') reasons.push('dual-write-not-disabled');
  if (!options.approvalId) reasons.push('second-owner-approval-missing');
  if (options.approvalProject !== options.project) reasons.push('approval-project-missing-or-mismatch');
  if (!options.backupId || options.approvalBackupId !== options.backupId) reasons.push('approval-backup-missing-or-mismatch');
  if (!Number.isSafeInteger(options.expectedDocuments) || options.expectedDocuments !== summary.candidates) {
    reasons.push('approved-document-count-missing-or-mismatch');
  }
  if (!options.opsLogPath) reasons.push('external-operations-log-missing');
  if (options.environment === 'production' && !options.stagingEvidenceId) reasons.push('staging-evidence-missing');
  return reasons;
}

function canonicalWordIds(value) {
  if (!Array.isArray(value)) return null;
  if (!value.every(id => Number.isSafeInteger(id) && id >= 0)) return null;
  const unique = [...new Set(value)].sort((left, right) => left - right);
  if (unique.length !== value.length) return null;
  return unique;
}

function expectedProgressByLevel(legacyProgress) {
  const issues = [];
  if (!isPlainObject(legacyProgress)) {
    return { models: [], issues: ['legacy-progress-not-a-map'] };
  }
  if (!LEVELS.includes(legacyProgress.currentLevel)) issues.push('legacy-current-level-invalid');
  if (!isPlainObject(legacyProgress.learnedWords)) {
    issues.push('legacy-learned-words-not-a-map');
    return { models: [], issues };
  }

  const unknownKeys = Object.keys(legacyProgress.learnedWords).filter(level => !LEVELS.includes(level));
  if (unknownKeys.length > 0) issues.push('legacy-learned-words-has-unknown-level');

  const lastWordIndex = legacyProgress.lastWordIndex === undefined ? 0 : legacyProgress.lastWordIndex;
  if (!Number.isSafeInteger(lastWordIndex) || lastWordIndex < 0) issues.push('legacy-last-word-index-invalid');

  const models = [];
  for (const level of LEVELS) {
    const rawIds = hasOwn(legacyProgress.learnedWords, level)
      ? legacyProgress.learnedWords[level]
      : [];
    const ids = canonicalWordIds(rawIds);
    if (ids === null) {
      issues.push(`legacy-${level}-ids-invalid-or-duplicated`);
      continue;
    }
    models.push({
      level,
      learnedWordIds: ids,
      learnedCount: ids.length,
      lastWordId: legacyProgress.currentLevel === level ? lastWordIndex : 0,
      vocabularySchemaVersion: 2,
    });
  }
  return { models, issues };
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function timestampMillis(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime();
  if (value && typeof value.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date.getTime() : null;
  }
  if (value && Number.isSafeInteger(value.seconds) && Number.isSafeInteger(value.nanoseconds)) {
    return value.seconds * 1000 + Math.floor(value.nanoseconds / 1000000);
  }
  return null;
}

function assessUserDocument(userData, progressByLevelData) {
  if (!isPlainObject(userData) || !hasOwn(userData, 'progress') || userData.progress === null) {
    return { status: 'skipped', reasons: ['legacy-progress-absent'], expectedModels: [] };
  }

  const { models, issues } = expectedProgressByLevel(userData.progress);
  const reasons = [...issues];
  let legacyLastSync = null;
  if (userData.schemaVersion !== 2) reasons.push('schema-version-not-v2');
  if (!isPlainObject(progressByLevelData)) reasons.push('progress-by-level-snapshot-invalid');
  if (hasOwn(userData.progress, 'lastSync')) {
    legacyLastSync = timestampMillis(userData.progress.lastSync);
    const syncUpdatedAt = timestampMillis(userData.lastActiveAt)
      ?? timestampMillis(userData.syncMeta && userData.syncMeta.updatedAt);
    if (legacyLastSync === null) reasons.push('legacy-last-sync-invalid');
    if (syncUpdatedAt === null) reasons.push('sync-meta-updated-at-missing');
    if (legacyLastSync !== null && syncUpdatedAt !== null && syncUpdatedAt < legacyLastSync) {
      reasons.push('sync-meta-older-than-legacy-last-sync');
    }
  }

  const expectedLevels = new Set(models.map(model => model.level));
  const actualLevels = isPlainObject(progressByLevelData)
    ? Object.keys(progressByLevelData).filter(level => progressByLevelData[level] !== null)
    : [];
  if (actualLevels.some(level => !expectedLevels.has(level)) || models.some(model => !actualLevels.includes(model.level))) {
    reasons.push('progress-by-level-level-set-mismatch');
  }

  for (const expected of models) {
    const actual = progressByLevelData && progressByLevelData[expected.level];
    if (!isPlainObject(actual)) {
      reasons.push(`progress-by-level-${expected.level}-missing`);
      continue;
    }
    const actualIds = canonicalWordIds(actual.learnedWordIds);
    if (actual.level !== expected.level) reasons.push(`progress-by-level-${expected.level}-level-mismatch`);
    if (actualIds === null || !arraysEqual(actualIds, expected.learnedWordIds)) {
      reasons.push(`progress-by-level-${expected.level}-ids-mismatch`);
    }
    if (actual.learnedCount !== expected.learnedCount) {
      reasons.push(`progress-by-level-${expected.level}-count-mismatch`);
    }
    if (actual.lastWordId !== expected.lastWordId) {
      reasons.push(`progress-by-level-${expected.level}-word-id-mismatch`);
    }
    if (actual.vocabularySchemaVersion !== expected.vocabularySchemaVersion) {
      reasons.push(`progress-by-level-${expected.level}-vocabulary-version-invalid`);
    }
    if (actual.version !== 2) {
      reasons.push(`progress-by-level-${expected.level}-version-invalid`);
    }
    const actualUpdatedAt = timestampMillis(actual.updatedAt);
    if (actualUpdatedAt === null) {
      reasons.push(`progress-by-level-${expected.level}-updated-at-invalid`);
    } else if (legacyLastSync !== null && actualUpdatedAt < legacyLastSync) {
      reasons.push(`progress-by-level-${expected.level}-older-than-legacy`);
    }
  }

  const uniqueReasons = [...new Set(reasons)];
  return {
    status: uniqueReasons.length === 0 ? 'candidate' : 'mismatch',
    reasons: uniqueReasons,
    expectedModels: models,
  };
}

function incrementReasonCounts(target, reasons) {
  for (const reason of reasons) target[reason] = (target[reason] || 0) + 1;
}

function sanitizedBeforeAfterExample() {
  return {
    before: {
      path: 'users/{redactedUid}',
      payload: {
        progress: {
          currentLevel: '<CEFR level>',
          learnedWords: { '<level>': '<word-id count only>' },
          lastWordIndex: '<non-negative integer>',
          lastSync: '<timestamp if present>',
        },
        schemaVersion: 2,
      },
    },
    after: {
      path: 'users/{redactedUid}',
      payload: {
        progress: '<deleted>',
        schemaVersion: 2,
        progressByLevel: '<verified subcollection retained>',
      },
    },
  };
}

function ensureReportIsRedacted(report) {
  const serialized = JSON.stringify(report);
  if (serialized.includes('@')) {
    throw new SafetyError('Report redaction check failed.', 'REPORT_CONTAINS_PII');
  }
}

function writeJsonFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(temporaryPath, filePath);
}

function assertOpsLogOutsideRepository(opsLogPath, repositoryRoot) {
  if (!opsLogPath) throw new SafetyError('--ops-log is required in execute mode.', 'OPS_LOG_REQUIRED');
  const resolved = path.resolve(opsLogPath);
  const relative = path.relative(path.resolve(repositoryRoot), resolved);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    throw new SafetyError('Operational log must be stored outside the repository.', 'OPS_LOG_INSIDE_REPOSITORY');
  }
  return resolved;
}

function appendOpsLog(filePath, event) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(event)}\n`, { encoding: 'utf8', mode: 0o600 });
}

function buildReport({ options, target, summary, deleted, gateReasons, runId, generatedAt, mode, opsLogPath, errorCode }) {
  return {
    schemaVersion: 1,
    runId,
    generatedAt,
    mode,
    target: {
      environment: options.environment,
      projectId: options.project,
      credentialIdentity: redactIdentity(target.credentialEvidence.identity),
      credentialEvidenceSource: target.credentialEvidence.source,
    },
    scope: {
      legacyField: LEGACY_FIELD_PATH,
      action: 'delete-field-after-v2-equivalence-check',
      favoritesIncluded: false,
    },
    counts: summary ? { ...summary, deleted } : null,
    destructiveGate: {
      ready: gateReasons.length === 0,
      reasons: gateReasons,
      secondApprovalIdHash: options.approvalId ? `sha256:${sha256(options.approvalId).slice(0, 16)}` : null,
      backupIdHash: options.backupId ? `sha256:${sha256(options.backupId).slice(0, 16)}` : null,
      stagingEvidenceIdHash: options.stagingEvidenceId
        ? `sha256:${sha256(options.stagingEvidenceId).slice(0, 16)}`
        : null,
    },
    execution: {
      status: errorCode ? 'failed' : mode === 'execute' ? 'completed' : mode === 'execute-refused' ? 'refused' : 'not-run',
      errorCode: errorCode || null,
    },
    beforeAfterExample: sanitizedBeforeAfterExample(),
    operationalLog: opsLogPath
      ? { external: true, pathHash: `sha256:${sha256(opsLogPath).slice(0, 16)}` }
      : { external: true, pathHash: null },
  };
}

async function auditStore(store, options) {
  const summary = {
    scanned: 0,
    legacyDocuments: 0,
    candidates: 0,
    mismatched: 0,
    skipped: 0,
    fieldsPlannedForDeletion: 0,
    mismatchReasons: {},
  };
  const candidateIds = [];

  await store.scanUsers(options.batchSize, async user => {
    summary.scanned += 1;
    if (summary.scanned > options.maxDocuments) {
      throw new SafetyError('Scan exceeded --max-documents; no cleanup was executed.', 'MAX_DOCUMENTS_EXCEEDED');
    }
    const userData = user.data || {};
    if (hasOwn(userData, 'progress') && userData.progress !== null) summary.legacyDocuments += 1;
    const progressByLevel = hasOwn(userData, 'progress') && userData.progress !== null
      ? await store.getProgressByLevel(user.id)
      : {};
    const assessment = assessUserDocument(userData, progressByLevel);
    if (assessment.status === 'candidate') {
      summary.candidates += 1;
      summary.fieldsPlannedForDeletion += 1;
      candidateIds.push(user.id);
    } else if (assessment.status === 'mismatch') {
      summary.mismatched += 1;
      incrementReasonCounts(summary.mismatchReasons, assessment.reasons);
    } else {
      summary.skipped += 1;
    }
  });

  return { summary, candidateIds };
}

async function runCleanup({ options, store, repositoryRoot = process.cwd(), now = () => new Date() }) {
  const target = validateTarget(options);
  const startedAt = now().toISOString();
  const runId = crypto.randomUUID();
  let audit;
  try {
    audit = await auditStore(store, options);
  } catch (error) {
    const failureReport = buildReport({
      options,
      target,
      summary: null,
      deleted: 0,
      gateReasons: ['audit-incomplete'],
      runId,
      generatedAt: now().toISOString(),
      mode: 'dry-run-failed',
      errorCode: error.code || 'AUDIT_ERROR',
    });
    ensureReportIsRedacted(failureReport);
    writeJsonFile(path.resolve(options.reportPath), failureReport);
    throw error;
  }
  const { summary, candidateIds } = audit;
  const gateReasons = collectDestructiveGateReasons(options, summary);
  let deleted = 0;
  let opsLogPath;

  if (options.execute) {
    if (gateReasons.length > 0) {
      const refusedReport = buildReport({
        options,
        target,
        summary,
        deleted,
        gateReasons,
        runId,
        generatedAt: now().toISOString(),
        mode: 'execute-refused',
        errorCode: 'DESTRUCTIVE_GATE_CLOSED',
      });
      ensureReportIsRedacted(refusedReport);
      writeJsonFile(path.resolve(options.reportPath), refusedReport);
      throw new SafetyError(`Destructive cleanup refused: ${gateReasons.join(', ')}.`, 'DESTRUCTIVE_GATE_CLOSED');
    }
    try {
      opsLogPath = assertOpsLogOutsideRepository(options.opsLogPath, repositoryRoot);
    } catch (error) {
      const refusedReport = buildReport({
        options,
        target,
        summary,
        deleted,
        gateReasons: ['external-operations-log-invalid'],
        runId,
        generatedAt: now().toISOString(),
        mode: 'execute-refused',
        errorCode: error.code || 'OPS_LOG_INVALID',
      });
      ensureReportIsRedacted(refusedReport);
      writeJsonFile(path.resolve(options.reportPath), refusedReport);
      throw error;
    }
    appendOpsLog(opsLogPath, {
      runId,
      at: startedAt,
      event: 'cleanup-started',
      projectHash: `sha256:${sha256(options.project).slice(0, 16)}`,
      expectedDocuments: summary.candidates,
    });

    for (const userId of candidateIds) {
      const subjectHash = `sha256:${sha256(`${runId}:${userId}`).slice(0, 24)}`;
      try {
        await store.deleteLegacyProgressIfStillVerified(userId);
        deleted += 1;
        appendOpsLog(opsLogPath, { runId, at: now().toISOString(), event: 'legacy-field-deleted', subjectHash });
      } catch (error) {
        appendOpsLog(opsLogPath, {
          runId,
          at: now().toISOString(),
          event: 'cleanup-halted',
          subjectHash,
          errorCode: error.code || 'EXECUTION_ERROR',
        });
        const failedReport = buildReport({
          options,
          target,
          summary,
          deleted,
          gateReasons,
          runId,
          generatedAt: now().toISOString(),
          mode: 'execute-failed',
          opsLogPath,
          errorCode: error.code || 'EXECUTION_ERROR',
        });
        ensureReportIsRedacted(failedReport);
        writeJsonFile(path.resolve(options.reportPath), failedReport);
        throw error;
      }
    }
    appendOpsLog(opsLogPath, { runId, at: now().toISOString(), event: 'cleanup-completed', deleted });
  }

  const report = buildReport({
    options,
    target,
    summary,
    deleted,
    gateReasons,
    runId,
    generatedAt: now().toISOString(),
    mode: options.execute ? 'execute' : 'dry-run',
    opsLogPath,
  });
  ensureReportIsRedacted(report);
  writeJsonFile(path.resolve(options.reportPath), report);
  return report;
}

module.exports = {
  DEFAULT_BATCH_SIZE,
  DEFAULT_MAX_DOCUMENTS,
  ENVIRONMENTS,
  LEGACY_FIELD_PATH,
  LEVELS,
  SafetyError,
  assessUserDocument,
  auditStore,
  buildReport,
  collectDestructiveGateReasons,
  expectedProgressByLevel,
  loadAllowlist,
  parseArgs,
  redactIdentity,
  resolveCredentialEvidence,
  runCleanup,
  sanitizedBeforeAfterExample,
  sha256,
  timestampMillis,
  validateTarget,
};
