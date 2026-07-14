// src/features/progress — public barrel (docs/refactor-v2/33 §4).
// Exposes: domain types/rules/constants, repository INTERFACES, and pure adapters.
// Does NOT export FirestoreProgressRepository (data impl) — it is bound only at a composition root
// (a later phase), never via the barrel.

export * from './domain/types';
export {
  calcLevelPercent,
  computeOverallPercent,
  isLevelComplete as isLevelCompletionReached,
} from './domain/rules';
export * from './domain/constants';
export type {
  RemoteProgressRepository,
  LocalProgressRepository,
  ProgressRepository,
} from './data/contracts';
export type {
  ProgressByLevelDoc,
  ProgressByLevelWriteModel,
  ProgressSummaryDoc,
  LegacyProgressDoc,
  LegacyLocalUserProgress,
  UserDocV2,
  NotificationSettingsDoc,
  StreakDoc,
} from './data/dto';
export {
  adaptLegacyLearnedWordsToProgressByLevelDocs,
  toProgressByLevelDoc,
  fromProgressByLevelDoc,
  buildProgressSummary,
  sumLegacyLearnedWords,
  sumProgressByLevelModels,
  verifyMigrationCounts,
} from './data/adapters/progressAdapters';
export * from './composition/progressService';
