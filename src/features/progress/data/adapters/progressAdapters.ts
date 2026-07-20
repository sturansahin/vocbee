// src/features/progress/data/adapters/progressAdapters.ts
// Layer: data (adapters) | Feature: progress. PURE functions (Timestamp/FieldValue are TYPE-ONLY imports —
// no Firestore SDK is loaded), so the migration transform is fully unit-testable without an emulator.
// The repository injects serverTimestamp() as `updatedAt` at write time (docs/architecture.md).

import type { FieldValue, Timestamp } from 'firebase/firestore';
import { LEVELS, isLevel, type Level, type LevelProgress } from '../../domain/types';
import { calcLevelPercent, computeOverallPercent } from '../../domain/rules';
import type {
  LegacyProgressDoc,
  ProgressByLevelDoc,
  ProgressByLevelWriteModel,
  ProgressSummaryDoc,
} from '../dto';

/** A learned word id is a finite non-negative integer. Anything else is dropped (defensive). */
function isValidWordId(id: unknown): id is number {
  return typeof id === 'number' && Number.isInteger(id) && Number.isFinite(id) && id >= 0;
}

/**
 * Legacy users/{uid}.progress.learnedWords  →  progressByLevel write models (copy step of migration).
 * Pure + deterministic:
 *  - learnedWords missing / not an object  → [] (caller counts this user as "skipped")
 *  - one doc per level KEY present (Array) — even if empty (key absent → no doc, e.g. "A1 var A2 yok")
 *  - ids deduped, non-integer/negative filtered out, sorted ascending
 *  - legacy single lastWordIndex (actually a word id) assigned to currentLevel.lastWordId; other levels get 0
 *  - learnedCount = learnedWordIds.length
 * updatedAt is NOT set here (added by the repository) — keeps this SDK-free.
 */
export function adaptLegacyLearnedWordsToProgressByLevelDocs(
  legacy: LegacyProgressDoc | null | undefined,
  opts: { deviceId?: string; version?: number; vocabularySchemaVersion?: number } = {},
): ProgressByLevelWriteModel[] {
  const learnedWords = legacy?.learnedWords;
  if (!learnedWords || typeof learnedWords !== 'object') return [];

  const currentLevel: Level | undefined = isLevel(legacy?.currentLevel)
    ? (legacy!.currentLevel as Level)
    : undefined;
  const rawIndex = legacy?.lastWordIndex;
  const legacyLastWordIndex =
    typeof rawIndex === 'number' && Number.isFinite(rawIndex) && rawIndex >= 0
      ? Math.floor(rawIndex)
      : 0;

  const models: ProgressByLevelWriteModel[] = [];

  for (const level of LEVELS) {
    const rawIds = (learnedWords as Record<string, unknown>)[level];
    if (!Array.isArray(rawIds)) continue; // level key absent / not an array → no doc

    const cleaned = Array.from(new Set(rawIds.filter(isValidWordId))).sort((a, b) => a - b);
    const isCurrent = currentLevel === level;

    const model: ProgressByLevelWriteModel = {
      level,
      learnedWordIds: cleaned,
      lastWordId: isCurrent ? legacyLastWordIndex : 0,
      learnedCount: cleaned.length,
      vocabularySchemaVersion: opts.vocabularySchemaVersion ?? 1,
    };
    if (opts.deviceId !== undefined) model.updatedByDeviceId = opts.deviceId;
    if (opts.version !== undefined) model.version = opts.version;
    models.push(model);
  }

  return models;
}

/** Domain model → Firestore DTO. `updatedAt` is injected by the caller (repository passes serverTimestamp()). */
export function toProgressByLevelDoc(
  model: LevelProgress,
  updatedAt: Timestamp | FieldValue,
  opts: { deviceId?: string; version?: number } = {},
): ProgressByLevelDoc {
  const learnedWordIds = [...model.learnedWordIds];
  const doc: ProgressByLevelDoc = {
    level: model.level,
    learnedWordIds,
    lastWordId: model.lastWordId,
    learnedCount: learnedWordIds.length, // authoritative: always derived from the list
    vocabularySchemaVersion: model.vocabularySchemaVersion,
    updatedAt,
  };
  if (model.favoriteWordIds) doc.favoriteWordIds = [...model.favoriteWordIds];
  if (opts.deviceId !== undefined) doc.updatedByDeviceId = opts.deviceId;
  if (opts.version !== undefined) doc.version = opts.version;
  return doc;
}

/** Firestore DTO → domain model. Timestamp/updatedAt is intentionally dropped (domain has no Timestamp). */
export function fromProgressByLevelDoc(doc: ProgressByLevelDoc): LevelProgress {
  const learnedWordIds = Array.isArray(doc.learnedWordIds)
    ? doc.learnedWordIds.filter(isValidWordId)
    : [];
  const model: LevelProgress = {
    level: doc.level,
    learnedWordIds,
    lastWordId: typeof doc.lastWordId === 'number' && doc.lastWordId >= 0 ? doc.lastWordId : 0,
    learnedCount: learnedWordIds.length,
    vocabularySchemaVersion:
      typeof doc.vocabularySchemaVersion === 'number' && doc.vocabularySchemaVersion >= 1
        ? doc.vocabularySchemaVersion
        : 1,
  };
  if (Array.isArray(doc.favoriteWordIds))
    model.favoriteWordIds = doc.favoriteWordIds.filter(isValidWordId);
  return model;
}

/** Build the main-doc progressSummary. totalCount per level comes from LOCAL vocabulary (docs/architecture.md). */
export function buildProgressSummary(
  models: ProgressByLevelWriteModel[],
  totalCountByLevel: Partial<Record<Level, number>>,
): ProgressSummaryDoc {
  const byLevel: ProgressSummaryDoc['byLevel'] = {};
  let totalLearned = 0;
  let totalWords = 0;

  for (const m of models) {
    const totalCount = totalCountByLevel[m.level] ?? 0;
    const learnedCount = m.learnedCount;
    byLevel[m.level] = {
      learnedCount,
      totalCount,
      percent: calcLevelPercent(learnedCount, totalCount),
    };
    totalLearned += learnedCount;
    totalWords += totalCount;
  }

  return {
    byLevel,
    totalLearnedCount: totalLearned,
    overallPercent: computeOverallPercent(totalLearned, totalWords),
  };
}

/** Raw legacy learned-word count (sum of ALL array lengths, every key) — used by the verify step. */
export function sumLegacyLearnedWords(legacy: LegacyProgressDoc | null | undefined): number {
  const lw = legacy?.learnedWords;
  if (!lw || typeof lw !== 'object') return 0;
  let total = 0;
  for (const key of Object.keys(lw)) {
    const arr = (lw as Record<string, unknown>)[key];
    if (Array.isArray(arr)) total += arr.length;
  }
  return total;
}

/** New-model learned-word count. */
export function sumProgressByLevelModels(models: ProgressByLevelWriteModel[]): number {
  return models.reduce((n, m) => n + m.learnedWordIds.length, 0);
}

/**
 * Migration verify (docs/architecture.md): old raw total must equal new total.
 * ok=false (e.g. duplicates, non-number entries, or words under an invalid level key were dropped)
 * means the migration MUST STOP for that user and be reviewed before any write.
 */
export function verifyMigrationCounts(
  legacy: LegacyProgressDoc | null | undefined,
  models: ProgressByLevelWriteModel[],
): { oldTotal: number; newTotal: number; ok: boolean } {
  const oldTotal = sumLegacyLearnedWords(legacy);
  const newTotal = sumProgressByLevelModels(models);
  return { oldTotal, newTotal, ok: oldTotal === newTotal };
}
