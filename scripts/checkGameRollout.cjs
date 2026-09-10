#!/usr/bin/env node

const { readFileSync } = require('node:fs');
const path = require('node:path');

const { checkPhase0 } = require('./checkGamePhase0.cjs');

const root = path.join(__dirname, '..');
const stages = {
  'internal-build': [],
  'play-internal': ['internalBuild'],
  testflight: ['internalBuild'],
  'production-5': ['playInternal', 'testflight'],
  'production-25': ['production5'],
  'production-50': ['production25'],
  'production-100': ['production50'],
};
const blockerNames = {
  internalBuild: 'INTERNAL_BUILD',
  playInternal: 'PLAY_INTERNAL',
  testflight: 'TESTFLIGHT',
  production5: 'PRODUCTION_5',
  production25: 'PRODUCTION_25',
  production50: 'PRODUCTION_50',
};

function monitoringPasses(metrics, policy) {
  return (
    metrics?.observedHours >= policy.minimumObservationHours &&
    metrics?.sessions >= policy.minimumSessions &&
    metrics?.crashFreeSessionsPercent >= policy.minimumCrashFreeSessionsPercent &&
    metrics?.androidAnrRatePercent <= policy.maximumAndroidAnrRatePercent &&
    metrics?.gameLaunchErrorRatePercent <= policy.maximumGameLaunchErrorRatePercent &&
    metrics?.catalogMismatchCount <= policy.maximumCatalogMismatchCount
  );
}

function evaluateRolloutStage(stage, rollout, phase5, releaseGate) {
  if (!Object.hasOwn(stages, stage)) return ['UNKNOWN_ROLLOUT_STAGE'];

  const blockers = [];
  if (releaseGate.status !== 'passed') blockers.push('RELEASE_GATE_NOT_PASSED');
  if (phase5.status !== 'passed' || phase5.blockers.length > 0) blockers.push('PHASE5_NOT_PASSED');
  if (rollout.rollback.status !== 'ready') blockers.push('ROLLBACK_NOT_READY');
  if (
    !/^[0-9a-f]{40}$/.test(rollout.releaseCandidate.hostCommit || '') ||
    rollout.releaseCandidate.unityCommit !== phase5.unity.sourceCommit ||
    rollout.releaseCandidate.catalogHash !== phase5.catalogHash ||
    rollout.releaseCandidate.androidSha256 !== phase5.android.sha256 ||
    !/^[0-9a-f]{64}$/.test(rollout.releaseCandidate.iosSha256 || '')
  ) {
    blockers.push('RELEASE_CANDIDATE_NOT_PINNED');
  }

  for (const prerequisite of stages[stage]) {
    if (rollout.stages[prerequisite]?.status !== 'passed') {
      blockers.push(`${blockerNames[prerequisite]}_NOT_PASSED`);
    }
  }

  if (
    (stage === 'play-internal' || stage.startsWith('production-')) &&
    !rollout.releaseCandidate.androidBuildId
  ) {
    blockers.push('ANDROID_BUILD_ID_MISSING');
  }
  if (
    (stage === 'testflight' || stage.startsWith('production-')) &&
    !rollout.releaseCandidate.iosBuildId
  ) {
    blockers.push('IOS_BUILD_ID_MISSING');
  }
  if (
    stage.startsWith('production-') &&
    (typeof rollout.approval.id !== 'string' || !rollout.approval.id.trim())
  ) {
    blockers.push('PRODUCTION_APPROVAL_MISSING');
  }

  const previousProductionStage = {
    'production-25': 'production5',
    'production-50': 'production25',
    'production-100': 'production50',
  }[stage];
  if (
    previousProductionStage &&
    !monitoringPasses(rollout.stages[previousProductionStage]?.monitoring, rollout.policy)
  ) {
    blockers.push(`${blockerNames[previousProductionStage]}_MONITORING_FAILED`);
  }

  return [...new Set(blockers)];
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

if (require.main === module) {
  const stage = process.argv[2] || 'internal-build';
  const rollout = readJson('docs/artifacts/game-phase6-rollout.json');
  const phase5 = readJson('docs/artifacts/game-phase5-release.json');
  const blockers = evaluateRolloutStage(stage, rollout, phase5, checkPhase0());
  console.log(`Game rollout ${stage}: ${blockers.length === 0 ? 'READY' : 'BLOCKED'}`);
  for (const blocker of blockers) console.error(`BLOCKED ${blocker}`);
  if (blockers.length > 0) process.exitCode = 1;
}

module.exports = { evaluateRolloutStage, monitoringPasses };
