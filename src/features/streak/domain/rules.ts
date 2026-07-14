import type { RecordStreakResult, StreakState, StreakStatus, StreakSummary } from './types';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const normalizeCount = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

const isValidDayKey = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

const normalizeTimestamp = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export function normalizeStreakState(state?: Partial<StreakState> | null): StreakState {
  const normalized: StreakState = {
    currentStreak: normalizeCount(state?.currentStreak),
    longestStreak: normalizeCount(state?.longestStreak),
    brokenStreak: normalizeCount(state?.brokenStreak) || null,
    lastQualifiedDay: isValidDayKey(state?.lastQualifiedDay) ? state.lastQualifiedDay : null,
    lastQualifiedAt: normalizeTimestamp(state?.lastQualifiedAt),
  };
  if (normalized.currentStreak > 0) normalized.brokenStreak = null;
  if (normalized.longestStreak < normalized.currentStreak) normalized.longestStreak = normalized.currentStreak;
  if (normalized.brokenStreak && normalized.longestStreak < normalized.brokenStreak) normalized.longestStreak = normalized.brokenStreak;
  return normalized;
}

export function getLocalDayKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const dayKeyToNoonDate = (dayKey: string): Date | null => {
  if (!isValidDayKey(dayKey)) return null;
  const [year, month, day] = dayKey.split('-').map(Number);
  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getDayDifference = (from: string, to: string): number | null => {
  const fromDate = dayKeyToNoonDate(from);
  const toDate = dayKeyToNoonDate(to);
  return fromDate && toDate ? Math.round((toDate.getTime() - fromDate.getTime()) / DAY_IN_MS) : null;
};

const derive = (state: StreakState, now = new Date()) => {
  const normalized = normalizeStreakState(state);
  if (normalized.currentStreak <= 0) return { normalized, status: normalized.brokenStreak ? 'broken' as const : 'inactive' as const, effectiveCurrentStreak: 0 };
  if (!normalized.lastQualifiedDay) return { normalized, status: 'inactive' as const, effectiveCurrentStreak: 0 };
  const difference = getDayDifference(normalized.lastQualifiedDay, getLocalDayKey(now));
  if (difference === null) return { normalized, status: 'inactive' as const, effectiveCurrentStreak: 0 };
  if (difference <= 0) return { normalized, status: 'completedToday' as const, effectiveCurrentStreak: normalized.currentStreak };
  if (difference === 1) return { normalized, status: 'atRisk' as const, effectiveCurrentStreak: normalized.currentStreak };
  return { normalized, status: 'broken' as const, effectiveCurrentStreak: 0 };
};

export function getCanonicalStreakState(state: StreakState, now = new Date()): StreakState {
  const derived = derive(state, now);
  if (derived.status === 'broken') return { ...derived.normalized, brokenStreak: derived.normalized.brokenStreak ?? derived.normalized.currentStreak, currentStreak: 0 };
  if (derived.effectiveCurrentStreak === derived.normalized.currentStreak) return derived.normalized;
  return { ...derived.normalized, brokenStreak: null, currentStreak: derived.effectiveCurrentStreak };
}

export const isStreakCompletedToday = (state: StreakState, now = new Date()): boolean => derive(state, now).status === 'completedToday';
export const getStreakStatus = (state: StreakState, now = new Date()): StreakStatus => derive(state, now).status;

export function getStreakStatusMessageKey(status: StreakStatus): string {
  if (status === 'completedToday') return 'home.streakDoneToday';
  if (status === 'atRisk') return 'home.streakAtRisk';
  if (status === 'broken') return 'home.streakBroken';
  return 'home.startStreak';
}

export function getStreakSummaryFromState(state: StreakState, now = new Date()): StreakSummary {
  const { normalized, status, effectiveCurrentStreak } = derive(state, now);
  return {
    ...normalized,
    currentStreak: effectiveCurrentStreak,
    storedCurrentStreak: normalized.brokenStreak ?? normalized.currentStreak,
    completedToday: status === 'completedToday',
    atRisk: status === 'atRisk',
    isBroken: status === 'broken',
    status,
  };
}

export function recordDailyStudyActionState(current: StreakState, now = new Date()): RecordStreakResult {
  const todayKey = getLocalDayKey(now);
  if (current.lastQualifiedDay === todayKey) return { state: current, didIncrement: false, completedToday: true };
  const next = normalizeStreakState(current);
  if (!current.lastQualifiedDay) next.currentStreak = 1;
  else next.currentStreak = getDayDifference(current.lastQualifiedDay, todayKey) === 1 ? current.currentStreak + 1 : 1;
  next.longestStreak = Math.max(next.longestStreak, next.currentStreak);
  next.brokenStreak = null;
  next.lastQualifiedDay = todayKey;
  next.lastQualifiedAt = now.toISOString();
  return { state: next, didIncrement: true, completedToday: true };
}
