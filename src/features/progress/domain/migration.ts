import { LEVELS, isLevel, type Level, type ProgressV2WritePlan, type UserProgress } from './types';

export type ProgressV2WriteInput = {
  currentLevel: string;
  learnedWords: Record<string, number[]>;
  lastWordId: number | null;
  vocabularySchemaVersion: number;
};

function canonicalWordIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter(
    (id): id is number => typeof id === 'number' && Number.isSafeInteger(id) && id >= 0
  ))).sort((left, right) => left - right);
}

/**
 * Builds all five bounded v2 level documents. Keeping empty level docs makes the shape deterministic,
 * simplifies verification, and stays far below Firestore's per-document size limit for VocBee's vocabulary.
 */
export function buildProgressV2WritePlan(input: ProgressV2WriteInput): ProgressV2WritePlan {
  const activeLevel: Level = isLevel(input.currentLevel) ? input.currentLevel : 'A1';
  const resumeWordId = Number.isSafeInteger(input.lastWordId) && (input.lastWordId ?? -1) >= 0
    ? input.lastWordId ?? 0
    : 0;
  const vocabularySchemaVersion = Number.isSafeInteger(input.vocabularySchemaVersion)
    && input.vocabularySchemaVersion >= 1
    ? input.vocabularySchemaVersion
    : 1;

  const levels = LEVELS.map(level => {
    const learnedWordIds = canonicalWordIds(input.learnedWords[level]);
    return {
      level,
      learnedWordIds,
      lastWordId: level === activeLevel ? resumeWordId : 0,
      learnedCount: learnedWordIds.length,
      vocabularySchemaVersion,
    };
  });
  const byLevel = Object.fromEntries(
    levels.map(level => [level.level, { learnedCount: level.learnedCount }])
  ) as ProgressV2WritePlan['summary']['byLevel'];

  return {
    activeLevel,
    levels,
    summary: {
      byLevel,
      totalLearnedCount: levels.reduce((total, level) => total + level.learnedCount, 0),
    },
  };
}

export function progressV2LevelsToLegacy(
  activeLevel: Level,
  levels: ProgressV2WritePlan['levels']
): { learnedWords: UserProgress; currentLevel: Level; lastWordId: number } {
  const learnedWords: UserProgress = {};
  for (const level of levels) learnedWords[level.level] = canonicalWordIds(level.learnedWordIds);
  return {
    learnedWords,
    currentLevel: activeLevel,
    lastWordId: levels.find(level => level.level === activeLevel)?.lastWordId ?? 0,
  };
}
