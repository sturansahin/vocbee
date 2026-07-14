export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  brokenStreak: number | null;
  lastQualifiedDay: string | null;
  lastQualifiedAt: string | null;
}

export type StreakStatus = 'inactive' | 'completedToday' | 'atRisk' | 'broken';

export interface StreakSummary extends StreakState {
  storedCurrentStreak: number;
  completedToday: boolean;
  atRisk: boolean;
  isBroken: boolean;
  status: StreakStatus;
}

export interface RecordStreakResult {
  state: StreakState;
  didIncrement: boolean;
  completedToday: boolean;
}

export const DEFAULT_STREAK_STATE: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  brokenStreak: null,
  lastQualifiedDay: null,
  lastQualifiedAt: null,
};

export const DEFAULT_STREAK_SUMMARY: StreakSummary = {
  ...DEFAULT_STREAK_STATE,
  storedCurrentStreak: 0,
  completedToday: false,
  atRisk: false,
  isBroken: false,
  status: 'inactive',
};
