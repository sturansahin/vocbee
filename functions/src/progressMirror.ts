export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;

export type CefrLevel = typeof CEFR_LEVELS[number];

type LegacyProgress = {
  currentLevel?: unknown;
  learnedWords?: unknown;
  lastWordIndex?: unknown;
};

export type ProgressMirrorLevel = {
  level: CefrLevel;
  learnedWordIds: number[];
  lastWordId: number;
  learnedCount: number;
  vocabularySchemaVersion: number;
};

export type ProgressMirrorPlan = {
  activeLevel: CefrLevel;
  levels: ProgressMirrorLevel[];
  summary: {
    byLevel: Record<CefrLevel, {learnedCount: number}>;
    totalLearnedCount: number;
  };
};

/**
 * Checks for a plain JSON object.
 * @param {unknown} value Candidate value.
 * @return {boolean} Whether the value is a record.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Checks the bounded set of levels represented by v2 document ids.
 * @param {unknown} value Candidate value.
 * @return {boolean} Whether the value is a supported CEFR level.
 */
function isCefrLevel(value: unknown): value is CefrLevel {
  return typeof value === "string" &&
    (CEFR_LEVELS as readonly string[]).includes(value);
}

/**
 * Strictly parses one level without silently discarding legacy data.
 * @param {unknown} value Candidate word-id list.
 * @return {number[]} Canonical word ids.
 */
function parseWordIds(value: unknown): number[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error("learned-words-level-not-array");

  const ids = value.map((item) => {
    if (typeof item !== "number" || !Number.isSafeInteger(item) || item < 0) {
      throw new Error("learned-word-id-invalid");
    }
    return item;
  });
  if (new Set(ids).size !== ids.length) {
    throw new Error("learned-word-id-duplicate");
  }
  return [...ids].sort((left, right) => left - right);
}

/**
 * Converts legacy progress into five deterministic v2 write models.
 * @param {LegacyProgress} progress Legacy progress field.
 * @param {number} vocabularySchemaVersion Vocabulary data version.
 * @return {ProgressMirrorPlan} Validated v2 write plan.
 */
export function buildLegacyMirrorPlan(
  progress: LegacyProgress,
  vocabularySchemaVersion = 2
): ProgressMirrorPlan {
  if (!isRecord(progress)) throw new Error("legacy-progress-invalid");
  if (!isCefrLevel(progress.currentLevel)) {
    throw new Error("legacy-current-level-invalid");
  }
  if (!isRecord(progress.learnedWords)) {
    throw new Error("legacy-learned-words-invalid");
  }
  if (!Number.isSafeInteger(vocabularySchemaVersion) ||
      vocabularySchemaVersion < 1) {
    throw new Error("vocabulary-schema-version-invalid");
  }

  const learnedWords = progress.learnedWords;
  const activeLevel = progress.currentLevel;
  const unknownLevel = Object.keys(learnedWords)
    .find((level) => !isCefrLevel(level));
  if (unknownLevel) throw new Error("legacy-learned-words-level-invalid");

  const lastWordId = progress.lastWordIndex === undefined ? 0 :
    progress.lastWordIndex;
  if (typeof lastWordId !== "number" ||
      !Number.isSafeInteger(lastWordId) || lastWordId < 0) {
    throw new Error("legacy-last-word-id-invalid");
  }

  const levels = CEFR_LEVELS.map((level) => {
    const learnedWordIds = parseWordIds(learnedWords[level]);
    return {
      level,
      learnedWordIds,
      lastWordId: level === activeLevel ? lastWordId : 0,
      learnedCount: learnedWordIds.length,
      vocabularySchemaVersion,
    };
  });
  const byLevel = Object.fromEntries(levels.map((level) => [
    level.level,
    {learnedCount: level.learnedCount},
  ])) as ProgressMirrorPlan["summary"]["byLevel"];

  return {
    activeLevel,
    levels,
    summary: {
      byLevel,
      totalLearnedCount: levels.reduce(
        (total, level) => total + level.learnedCount,
        0
      ),
    },
  };
}

/**
 * Prevents recursive mirror writes when only v2 metadata changed.
 * @param {Record<string, unknown>|undefined} before Previous user document.
 * @param {Record<string, unknown>|undefined} after Current user document.
 * @return {boolean} Whether legacy progress changed.
 */
export function legacyProgressChanged(
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown> | undefined
): boolean {
  return JSON.stringify(before?.progress) !== JSON.stringify(after?.progress);
}
