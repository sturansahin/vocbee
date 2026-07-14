export * from './domain/types';
export {
  normalizeStreakState,
  getLocalDayKey,
  isStreakCompletedToday,
  getStreakStatus,
  getStreakStatusMessageKey,
  getStreakSummaryFromState,
  recordDailyStudyActionState,
} from './domain/rules';
export * from './composition/streakService';
