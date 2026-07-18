import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearStreakState,
  getStreakState,
  getStreakSummary,
  recordDailyStudyAction,
  restoreStreakState,
} from '../streakService';
import { DEFAULT_STREAK_SUMMARY } from '../../domain/types';
import { getStreakStatusMessageKey } from '../../domain/rules';
import { STORAGE_KEYS } from '@shared/storage';

describe('streakService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('starts a new streak on the first qualified action', async () => {
    const result = await recordDailyStudyAction(new Date(2026, 3, 12, 9, 0, 0));

    expect(result.didIncrement).toBe(true);
    expect(result.state.currentStreak).toBe(1);
    expect(result.state.longestStreak).toBe(1);
    expect(result.state.brokenStreak).toBeNull();
    expect(result.state.lastQualifiedDay).toBe('2026-04-12');
  });

  it('does not increment twice on the same local day', async () => {
    await recordDailyStudyAction(new Date(2026, 3, 12, 9, 0, 0));

    const result = await recordDailyStudyAction(new Date(2026, 3, 12, 21, 30, 0));

    expect(result.didIncrement).toBe(false);
    expect(result.state.currentStreak).toBe(1);
    expect(result.state.brokenStreak).toBeNull();
    expect(result.completedToday).toBe(true);
  });

  it('extends the streak on consecutive days', async () => {
    await recordDailyStudyAction(new Date(2026, 3, 12, 9, 0, 0));

    const result = await recordDailyStudyAction(new Date(2026, 3, 13, 8, 15, 0));

    expect(result.state.currentStreak).toBe(2);
    expect(result.state.longestStreak).toBe(2);
    expect(result.state.brokenStreak).toBeNull();
    expect(result.state.lastQualifiedDay).toBe('2026-04-13');
  });

  it('resets the current streak after a missed day but preserves best streak', async () => {
    await restoreStreakState({
      currentStreak: 5,
      longestStreak: 7,
      lastQualifiedDay: '2026-04-10',
      lastQualifiedAt: '2026-04-10T09:00:00.000Z',
    });

    const result = await recordDailyStudyAction(new Date(2026, 3, 12, 9, 0, 0));

    expect(result.state.currentStreak).toBe(1);
    expect(result.state.longestStreak).toBe(7);
    expect(result.state.brokenStreak).toBeNull();
    expect(result.state.lastQualifiedDay).toBe('2026-04-12');
  });

  it('reports completion and risk status for today', async () => {
    await restoreStreakState({
      currentStreak: 4,
      longestStreak: 6,
      lastQualifiedDay: '2026-04-11',
      lastQualifiedAt: '2026-04-11T09:00:00.000Z',
    });

    const beforeStudy = await getStreakSummary(new Date(2026, 3, 12, 7, 0, 0));
    expect(beforeStudy.completedToday).toBe(false);
    expect(beforeStudy.atRisk).toBe(true);
    expect(beforeStudy.isBroken).toBe(false);
    expect(beforeStudy.status).toBe('atRisk');

    await recordDailyStudyAction(new Date(2026, 3, 12, 9, 0, 0));

    const afterStudy = await getStreakSummary(new Date(2026, 3, 12, 18, 0, 0));
    expect(afterStudy.completedToday).toBe(true);
    expect(afterStudy.atRisk).toBe(false);
    expect(afterStudy.isBroken).toBe(false);
    expect(afterStudy.status).toBe('completedToday');
    expect(afterStudy.currentStreak).toBe(5);
  });

  it('marks the streak as broken after a missed day and normalizes the stored current streak', async () => {
    await restoreStreakState({
      currentStreak: 5,
      longestStreak: 7,
      lastQualifiedDay: '2026-04-10',
      lastQualifiedAt: '2026-04-10T09:00:00.000Z',
    });

    const summary = await getStreakSummary(new Date(2026, 3, 12, 7, 0, 0));

    expect(summary).toMatchObject({
      currentStreak: 0,
      storedCurrentStreak: 5,
      longestStreak: 7,
      completedToday: false,
      atRisk: false,
      isBroken: true,
      status: 'broken',
    });

    const normalizedState = await getStreakState(new Date(2026, 3, 12, 7, 0, 0));
    expect(normalizedState.currentStreak).toBe(0);
    expect(normalizedState.brokenStreak).toBe(5);
    expect(normalizedState.longestStreak).toBe(7);
    expect(normalizedState.lastQualifiedDay).toBe('2026-04-10');
  });

  it('restores and clears streak state without marking sync dirty', async () => {
    await restoreStreakState({
      currentStreak: 3,
      longestStreak: 4,
      lastQualifiedDay: '2026-04-12',
      lastQualifiedAt: '2026-04-12T09:00:00.000Z',
    });

    expect(await AsyncStorage.getItem(STORAGE_KEYS.SYNC_FLAG)).toBeNull();

    const restored = await getStreakState(new Date(2026, 3, 12, 10, 0, 0));
    expect(restored.currentStreak).toBe(3);

    await clearStreakState();
    expect(await AsyncStorage.getItem(STORAGE_KEYS.STREAK)).toBeNull();
  });

  it('returns a safe default summary', () => {
    expect(DEFAULT_STREAK_SUMMARY).toMatchObject({
      currentStreak: 0,
      storedCurrentStreak: 0,
      completedToday: false,
      atRisk: false,
      isBroken: false,
      status: 'inactive',
    });
  });

  it('maps each streak status to the correct message key', () => {
    expect(getStreakStatusMessageKey('completedToday')).toBe('home.streakDoneToday');
    expect(getStreakStatusMessageKey('atRisk')).toBe('home.streakAtRisk');
    expect(getStreakStatusMessageKey('broken')).toBe('home.streakBroken');
    expect(getStreakStatusMessageKey('inactive')).toBe('home.startStreak');
  });
});
