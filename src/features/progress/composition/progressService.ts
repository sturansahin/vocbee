import { getStoredVocabulary } from '@features/vocabulary';

import { DefaultProgressService } from '../application/DefaultProgressService';
import { AsyncStorageProgressRepository } from '../data/repositories/AsyncStorageProgressRepository';
import type { Level, UserProgress } from '../domain/types';

const service = new DefaultProgressService(new AsyncStorageProgressRepository(), {
  async getStoredWordIds(level) {
    return (await getStoredVocabulary(level)).map((word) => word.id);
  },
});

export const getUserProgress = () => service.getUserProgress();
export const getLearnedWords = (level: Level) => service.getLearnedWords(level);
export const markWordAsLearned = (level: Level, wordId: number) =>
  service.markWordAsLearned(level, wordId);
export const unmarkWord = (level: Level, wordId: number) => service.unmarkWord(level, wordId);
export const getLearnedCount = (level: Level) => service.getLearnedCount(level);
export const getTotalWords = (level: Level) => service.getTotalWords(level);
export const isLevelComplete = (level: Level) => service.isLevelComplete(level);
export const getLevelProgress = (level: Level) => service.getLevelProgress(level);
export const getCurrentLevel = () => service.getCurrentLevel();
export const setCurrentLevel = (level: Level) => service.setCurrentLevel(level);
export const checkAndAdvanceLevel = () => service.checkAndAdvanceLevel();
export const resetProgress = (options: { markUnsynced?: boolean } = {}) =>
  service.resetProgress(options);
export const getUnlearnedWords = (level: Level) => service.getUnlearnedWords(level);
export const getOverallStats = () => service.getOverallStats();
export const restoreProgressFromFirebase = (
  learned: UserProgress | null,
  level: string | null,
  last?: number | null,
) => service.restoreProgressFromFirebase(learned, level, last);
export const saveLastWordId = (wordId: number) => service.saveLastWordId(wordId);
export const getLastWordId = () => service.getLastWordId();
export const saveLastWordIndex = saveLastWordId;
export const getLastWordIndex = async () => (await getLastWordId()) || 0;
