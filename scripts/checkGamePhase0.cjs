#!/usr/bin/env node

const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { existsSync, readFileSync, readdirSync, statSync } = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const evidencePath = path.join(root, 'docs', 'artifacts', 'game-phase0-provenance.json');

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function sha256File(file) {
  return sha256(readFileSync(file));
}

function filesBelow(directory, current = directory) {
  return readdirSync(current)
    .flatMap((name) => {
      const file = path.join(current, name);
      return statSync(file).isDirectory() ? filesBelow(directory, file) : file;
    })
    .sort((left, right) =>
      path.relative(directory, left).localeCompare(path.relative(directory, right), 'en'),
    );
}

function sha256Tree(directory) {
  const digest = createHash('sha256');
  for (const file of filesBelow(directory)) {
    const relative = path.relative(directory, file).replaceAll(path.sep, '/');
    digest.update(relative).update('\0').update(sha256File(file)).update('\n');
  }
  return digest.digest('hex');
}

function validateV4Fixture(value, supportedLanguages) {
  const errors = [];
  const requiredKeys = [
    'bridgeVersion',
    'catalogHash',
    'catalogVersion',
    'learnedWordIds',
    'level',
    'nativeLanguage',
    'schemaVersion',
    'sessionId',
    'targetLanguage',
    'vocabularySchemaVersion',
  ];

  if (!value || typeof value !== 'object' || Array.isArray(value)) return ['must be one object'];
  if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify(requiredKeys)) {
    errors.push('must contain exactly the minimum V4 fields');
  }
  if (value.schemaVersion !== 4) errors.push('schemaVersion must be 4');
  if (value.bridgeVersion !== 1) errors.push('bridgeVersion must be 1');
  if (value.vocabularySchemaVersion !== 2) {
    errors.push('vocabularySchemaVersion must be 2');
  }
  if (!Number.isSafeInteger(value.catalogVersion) || value.catalogVersion <= 0) {
    errors.push('catalogVersion must be a positive safe integer');
  }
  if (!/^[a-f0-9]{64}$/.test(value.catalogHash)) {
    errors.push('catalogHash must be lowercase SHA-256');
  }
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value.sessionId,
    )
  ) {
    errors.push('sessionId must be a UUID');
  }
  if (!['A1', 'A2', 'B1', 'B2', 'C1'].includes(value.level)) {
    errors.push('level is unsupported');
  }
  if (!supportedLanguages.has(value.nativeLanguage)) errors.push('nativeLanguage is unsupported');
  if (!supportedLanguages.has(value.targetLanguage)) errors.push('targetLanguage is unsupported');
  if (value.nativeLanguage === value.targetLanguage) errors.push('languages must differ');
  if (!Array.isArray(value.learnedWordIds)) {
    errors.push('learnedWordIds must be an array');
  } else {
    const unique = new Set(value.learnedWordIds);
    if (
      unique.size !== value.learnedWordIds.length ||
      value.learnedWordIds.some((id) => !Number.isSafeInteger(id) || id < 0)
    ) {
      errors.push('learnedWordIds must contain unique non-negative safe integers');
    }
  }
  if (Buffer.byteLength(JSON.stringify(value), 'utf8') > 32 * 1024) {
    errors.push('fixture exceeds the 32 KiB internal budget');
  }
  return errors;
}

function validateArtifactProvenance(value, expected) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ['must be one object'];
  return Object.entries(expected)
    .filter(([key, expectedValue]) => value[key] !== expectedValue)
    .map(([key]) => `${key} mismatch`);
}

function runGit(cwd, ...args) {
  return execFileSync('git', ['-c', `safe.directory=${cwd}`, ...args], {
    cwd,
    encoding: 'utf8',
  }).trim();
}

function normalizeRemote(remote) {
  return remote.replace(/\.git$/, '').replace(/\/$/, '');
}

function supportedLanguages() {
  return new Set(
    readdirSync(path.join(root, 'assets', 'vocabulary'))
      .map((name) => name.match(/^(.+)_(?:A1|A2|B1|B2|C1)\.txt$/)?.[1])
      .filter(Boolean),
  );
}

function unityProjectArgument(argv = process.argv.slice(2)) {
  const index = argv.indexOf('--unity-project');
  if (index >= 0) return argv[index + 1];
  const inline = argv.find((argument) => argument.startsWith('--unity-project='));
  return inline?.slice('--unity-project='.length);
}

function collectGateBlockers(evidence) {
  const blockers = [];
  const editModeTest = evidence.unity.editModeTest;
  if (
    editModeTest.result !== 'passed' ||
    editModeTest.failed !== 0 ||
    editModeTest.passed !== editModeTest.total ||
    editModeTest.commit !== evidence.unity.commit ||
    editModeTest.editorVersion !== evidence.unity.editorVersion
  ) {
    blockers.push('UNITY_EDITMODE_NOT_VERIFIED');
  }
  const playModeTest = evidence.unity.playModeTest;
  if (
    !playModeTest ||
    playModeTest.result !== 'passed' ||
    playModeTest.failed !== 0 ||
    playModeTest.passed !== playModeTest.total ||
    playModeTest.commit !== evidence.unity.commit ||
    playModeTest.editorVersion !== evidence.unity.editorVersion
  ) {
    blockers.push('UNITY_PLAYMODE_NOT_VERIFIED');
  }
  for (const [platform, artifact] of Object.entries(evidence.artifacts)) {
    if (artifact.verifiedSourceCommit !== evidence.unity.commit) {
      blockers.push(`${platform.toUpperCase()}_ARTIFACT_NOT_FROM_PINNED_UNITY_COMMIT`);
    }
  }
  if (!evidence.contract.hostRuntimeAccepted) blockers.push('HOST_V4_NOT_ACCEPTED');
  if (!evidence.contract.unityRuntimeAccepted) blockers.push('UNITY_V4_NOT_ACCEPTED');
  if (
    evidence.inferno.status !== 'verified' ||
    !evidence.inferno.path ||
    !evidence.inferno.guid ||
    !evidence.inferno.license ||
    !evidence.inferno.mobileUrpCompatibility
  ) {
    blockers.push('INFERNO_NOT_VERIFIED');
  }
  return blockers;
}

function checkPhase0({ unityProject } = {}) {
  const evidence = readJson(evidencePath);
  const fixtureFile = path.join(root, evidence.contract.fixture);
  const fixture = readJson(fixtureFile);
  const failures = validateV4Fixture(fixture, supportedLanguages()).map(
    (error) => `CONTRACT_FIXTURE_INVALID: ${error}`,
  );

  if (sha256File(fixtureFile) !== evidence.contract.sha256) {
    failures.push('CONTRACT_FIXTURE_HASH_MISMATCH');
  }

  const hostSession = readFileSync(
    path.join(root, 'src', 'features', 'game', 'domain', 'gameSession.ts'),
    'utf8',
  );
  const hostSchema = Number(hostSession.match(/GAME_SESSION_SCHEMA_VERSION\s*=\s*(\d+)/)?.[1]);
  if (hostSchema !== evidence.host.runtimeSessionSchemaVersion) {
    failures.push('HOST_SCHEMA_EVIDENCE_STALE');
  }

  const unityRoot = path.resolve(
    unityProject || process.env.VOCBEE_UNITY_PROJECT || path.join(root, '..', 'vocbee-game'),
  );
  if (!existsSync(unityRoot)) {
    failures.push(`UNITY_PROJECT_MISSING: ${unityRoot}`);
  } else {
    const remote = normalizeRemote(runGit(unityRoot, 'remote', 'get-url', 'origin'));
    const branch = runGit(unityRoot, 'branch', '--show-current');
    const commit = runGit(unityRoot, 'rev-parse', 'HEAD');
    const dirty = runGit(unityRoot, 'status', '--porcelain');
    const versionFile = readFileSync(
      path.join(unityRoot, 'ProjectSettings', 'ProjectVersion.txt'),
      'utf8',
    );

    if (remote !== normalizeRemote(evidence.unity.repository))
      failures.push('UNITY_REMOTE_MISMATCH');
    if (branch !== evidence.unity.branch) failures.push('UNITY_BRANCH_MISMATCH');
    if (commit !== evidence.unity.commit) failures.push('UNITY_COMMIT_MISMATCH');
    if (dirty) failures.push('UNITY_WORKTREE_DIRTY');
    if (!versionFile.includes(`m_EditorVersion: ${evidence.unity.editorVersion}`)) {
      failures.push('UNITY_EDITOR_VERSION_MISMATCH');
    }
    if (
      !versionFile.includes(
        `m_EditorVersionWithRevision: ${evidence.unity.editorVersion} (${evidence.unity.editorRevision})`,
      )
    ) {
      failures.push('UNITY_EDITOR_REVISION_MISMATCH');
    }

    for (const sourceCheck of evidence.unity.sourceChecks) {
      const file = path.join(unityRoot, sourceCheck.path);
      if (!existsSync(file)) {
        failures.push(`${sourceCheck.id}: file missing`);
        continue;
      }
      const contents = readFileSync(file, 'utf8');
      for (const marker of sourceCheck.contains) {
        if (!contents.includes(marker))
          failures.push(`${sourceCheck.id}: marker missing: ${marker}`);
      }
    }
  }

  for (const [platform, artifact] of Object.entries(evidence.artifacts)) {
    const artifactPath = path.join(root, artifact.path);
    if (!existsSync(artifactPath)) {
      failures.push(`${platform.toUpperCase()}_ARTIFACT_MISSING`);
      continue;
    }
    const actual = statSync(artifactPath).isDirectory()
      ? sha256Tree(artifactPath)
      : sha256File(artifactPath);
    if (actual !== artifact.sha256)
      failures.push(`${platform.toUpperCase()}_ARTIFACT_HASH_MISMATCH`);

    const provenancePath = artifact.provenancePath && path.join(root, artifact.provenancePath);
    if (!provenancePath || !existsSync(provenancePath)) {
      failures.push(`${platform.toUpperCase()}_PROVENANCE_MISSING`);
      continue;
    }
    const expected = {
      schemaVersion: 1,
      sourceCommit: evidence.unity.commit,
      catalogHash: fixture.catalogHash,
      unityVersion: evidence.unity.editorVersion,
      ...(platform === 'android'
        ? { buildTarget: 'Android', buildGuid: artifact.buildGuid }
        : {
            deviceBuildGuid: artifact.deviceBuildGuid,
            simulatorBuildGuid: artifact.simulatorBuildGuid,
          }),
    };
    for (const error of validateArtifactProvenance(readJson(provenancePath), expected)) {
      failures.push(`${platform.toUpperCase()}_PROVENANCE_INVALID: ${error}`);
    }
  }

  const blockers = collectGateBlockers(evidence);
  const status = failures.length === 0 && blockers.length === 0 ? 'passed' : 'blocked';
  if (status !== evidence.phase0Status) failures.push('PHASE0_STATUS_EVIDENCE_STALE');
  return { blockers, failures, status, unityRoot };
}

if (require.main === module) {
  const result = checkPhase0({ unityProject: unityProjectArgument() });
  console.log(`Phase 0: ${result.status.toUpperCase()}`);
  console.log(`Unity project: ${result.unityRoot}`);
  for (const failure of result.failures) console.error(`FAIL ${failure}`);
  for (const blocker of result.blockers) console.error(`BLOCKED ${blocker}`);
  if (result.status !== 'passed') process.exitCode = 1;
}

module.exports = {
  collectGateBlockers,
  sha256File,
  sha256Tree,
  validateArtifactProvenance,
  validateV4Fixture,
};
