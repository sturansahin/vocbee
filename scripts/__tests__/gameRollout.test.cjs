const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { evaluateRolloutStage, monitoringPasses } = require('../checkGameRollout.cjs');

const eas = JSON.parse(readFileSync(path.join(__dirname, '..', '..', 'eas.json'), 'utf8'));

const policy = {
  minimumObservationHours: 24,
  minimumSessions: 100,
  minimumCrashFreeSessionsPercent: 99.5,
  maximumAndroidAnrRatePercent: 0.47,
  maximumGameLaunchErrorRatePercent: 1,
  maximumCatalogMismatchCount: 0,
};
const metrics = {
  observedHours: 24,
  sessions: 100,
  crashFreeSessionsPercent: 99.5,
  androidAnrRatePercent: 0.47,
  gameLaunchErrorRatePercent: 1,
  catalogMismatchCount: 0,
};
const phase5 = {
  status: 'passed',
  blockers: [],
  catalogHash: 'b'.repeat(64),
  unity: { sourceCommit: 'a'.repeat(40) },
  android: { sha256: 'c'.repeat(64) },
};
const rollout = {
  releaseCandidate: {
    hostCommit: 'd'.repeat(40),
    unityCommit: phase5.unity.sourceCommit,
    catalogHash: phase5.catalogHash,
    androidSha256: phase5.android.sha256,
    iosSha256: 'e'.repeat(64),
    androidBuildId: 'android-build-1',
    iosBuildId: 'ios-build-1',
  },
  approval: { id: 'release-approval-1' },
  rollback: { status: 'ready' },
  policy,
  stages: {
    internalBuild: { status: 'passed' },
    playInternal: { status: 'passed' },
    testflight: { status: 'passed' },
    production5: { status: 'passed', monitoring: metrics },
    production25: { status: 'passed', monitoring: metrics },
    production50: { status: 'passed', monitoring: metrics },
  },
};

test('rollout is ordered and fail-closed', () => {
  assert.deepEqual(
    evaluateRolloutStage('internal-build', rollout, phase5, { status: 'passed' }),
    [],
  );
  assert.deepEqual(
    evaluateRolloutStage('production-25', rollout, phase5, { status: 'passed' }),
    [],
  );
  assert.deepEqual(
    evaluateRolloutStage(
      'internal-build',
      rollout,
      { ...phase5, status: 'blocked' },
      { status: 'passed' },
    ),
    ['PHASE5_NOT_PASSED'],
  );
  assert.deepEqual(evaluateRolloutStage('unknown', rollout, phase5, { status: 'passed' }), [
    'UNKNOWN_ROLLOUT_STAGE',
  ]);
});

test('production expansion requires healthy observed metrics', () => {
  assert.equal(monitoringPasses(metrics, policy), true);
  assert.equal(monitoringPasses({ ...metrics, catalogMismatchCount: 1 }, policy), false);
  const unhealthy = structuredClone(rollout);
  unhealthy.stages.production5.monitoring.catalogMismatchCount = 1;
  assert.deepEqual(evaluateRolloutStage('production-25', unhealthy, phase5, { status: 'passed' }), [
    'PRODUCTION_5_MONITORING_FAILED',
  ]);
});

test('EAS profiles default to internal or draft-safe submission', () => {
  assert.equal(eas.cli.requireCommit, true);
  assert.equal(eas.build.preview.distribution, 'internal');
  assert.equal(eas.build.production.distribution, 'store');
  assert.deepEqual(eas.submit.internal.android, {
    track: 'internal',
    releaseStatus: 'completed',
  });
  assert.deepEqual(eas.submit['production-5'].android, {
    track: 'production',
    releaseStatus: 'inProgress',
    rollout: 0.05,
  });
  assert.equal(eas.submit.production.android.releaseStatus, 'draft');
});
