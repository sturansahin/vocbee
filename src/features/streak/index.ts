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
export { AnimatedCountUp } from './presentation/components/AnimatedCountUp';
export { StreakAlertContent } from './presentation/components/StreakAlertContent';
export { StreakCelebrationOverlay } from './presentation/components/StreakCelebrationOverlay';
export { StreakChip } from './presentation/components/StreakChip';
