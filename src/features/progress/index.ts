// src/features/progress — public barrel (docs/refactor-v2/33 §4).
// Exposes domain types/rules/constants, repository INTERFACES, and the stable composition API.
// Does NOT export FirestoreProgressRepository (data impl) — it is bound only at a composition root
// (a later phase), never via the barrel.

export * from './domain/types';
export {
  calcLevelPercent,
  computeOverallPercent,
  isLevelComplete as isLevelCompletionReached,
} from './domain/rules';
export * from './domain/constants';
export * from './domain/migration';
export { getProgressSyncMode, resolveProgressSyncMode } from './application/progressRollout';
export type { ProgressSyncMode } from './application/progressRollout';
export type {
  RemoteProgressRepository,
  LocalProgressRepository,
  ProgressRepository,
} from './data/contracts';
export * from './composition/progressService';
