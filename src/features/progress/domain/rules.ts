// src/features/progress/domain/rules.ts
// Layer: domain | Feature: progress | Pure TS (NO SDK).
// These are the PURE extraction of the existing services/progressService.ts formulas — values must match
// exactly (behavior contract, docs/refactor-v2/03):
//   getLevelProgress: totalWords === 0 ? 0 : Math.round((learnedCount / totalWords) * 100)
//   isLevelComplete:  totalWords > 0 && learnedCount >= totalWords
//   getOverallStats:  totalWords > 0 ? Math.round((totalLearned / totalWords) * 100) : 0

/** Percent (0..100) of a level completed. 0 when total <= 0 (matches progressService.getLevelProgress). */
export function calcLevelPercent(learnedCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  return Math.round((learnedCount / totalCount) * 100);
}

/** A level is complete only when it has words and all are learned (matches progressService.isLevelComplete). */
export function isLevelComplete(learnedCount: number, totalCount: number): boolean {
  return totalCount > 0 && learnedCount >= totalCount;
}

/** Overall percent across all levels (matches progressService.getOverallStats). */
export function computeOverallPercent(totalLearned: number, totalWords: number): number {
  if (totalWords <= 0) return 0;
  return Math.round((totalLearned / totalWords) * 100);
}
