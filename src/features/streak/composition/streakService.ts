import { DefaultStreakService } from '../application/DefaultStreakService';
import { AsyncStorageStreakRepository } from '../data/repositories/AsyncStorageStreakRepository';
import type { StreakState } from '../domain/types';

const service = new DefaultStreakService(new AsyncStorageStreakRepository());
export const getStreakState = (now = new Date()) => service.getStreakState(now);
export const getStreakSummary = (now = new Date()) => service.getStreakSummary(now);
export const saveStreakState = (state: Partial<StreakState>, options: { markUnsynced?: boolean } = {}) => service.saveStreakState(state, options);
export const restoreStreakState = (state?: Partial<StreakState> | null) => service.restoreStreakState(state);
export const clearStreakState = () => service.clearStreakState();
export const recordDailyStudyAction = (now = new Date()) => service.recordDailyStudyAction(now);
