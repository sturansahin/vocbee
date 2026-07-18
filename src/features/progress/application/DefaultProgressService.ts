import {
  calcLevelPercent,
  computeOverallPercent,
  isLevelComplete as isComplete,
} from '../domain/rules';
import { LEVELS, type Level, type OverallProgressStats, type UserProgress } from '../domain/types';
import type { ProgressLocalStore, ProgressVocabularySource } from './contracts';

export class DefaultProgressService {
  constructor(
    private readonly store: ProgressLocalStore,
    private readonly vocabulary: ProgressVocabularySource,
  ) {}

  async getUserProgress(): Promise<UserProgress> {
    try {
      return await this.store.readProgress();
    } catch (error) {
      console.error('Error loading progress:', error);
      return {};
    }
  }

  private async saveUserProgress(progress: UserProgress): Promise<void> {
    try {
      await this.store.writeProgress(progress);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }

  async getLearnedWords(level: Level): Promise<number[]> {
    return (await this.getUserProgress())[level] || [];
  }

  async markWordAsLearned(level: Level, wordId: number): Promise<void> {
    const progress = await this.getUserProgress();
    if (!progress[level]) progress[level] = [];
    if (!progress[level].includes(wordId)) {
      progress[level].push(wordId);
      await this.saveUserProgress(progress);
    }
  }

  async unmarkWord(level: Level, wordId: number): Promise<void> {
    const progress = await this.getUserProgress();
    if (progress[level]) {
      progress[level] = progress[level].filter((id) => id !== wordId);
      await this.saveUserProgress(progress);
    }
  }

  async getLearnedCount(level: Level): Promise<number> {
    return (await this.getLearnedWords(level)).length;
  }
  async getTotalWords(level: Level): Promise<number> {
    return (await this.vocabulary.getStoredWordIds(level)).length;
  }

  async isLevelComplete(level: Level): Promise<boolean> {
    return isComplete(await this.getLearnedCount(level), await this.getTotalWords(level));
  }

  async getLevelProgress(level: Level): Promise<number> {
    return calcLevelPercent(await this.getLearnedCount(level), await this.getTotalWords(level));
  }

  async getCurrentLevel(): Promise<Level> {
    try {
      const level = await this.store.readCurrentLevel();
      return level && LEVELS.includes(level as Level) ? (level as Level) : 'A1';
    } catch (error) {
      console.error('Error getting current level:', error);
      return 'A1';
    }
  }

  async setCurrentLevel(level: Level): Promise<void> {
    try {
      await this.store.writeCurrentLevel(level);
    } catch (error) {
      console.error('Error setting current level:', error);
    }
  }

  async checkAndAdvanceLevel(): Promise<Level> {
    const current = await this.getCurrentLevel();
    if (await this.isLevelComplete(current)) {
      const index = LEVELS.indexOf(current);
      if (index < LEVELS.length - 1) {
        const next = LEVELS[index + 1];
        await this.setCurrentLevel(next);
        return next;
      }
    }
    return current;
  }

  async resetProgress(options: { markUnsynced?: boolean } = {}): Promise<void> {
    try {
      await this.store.clear(options.markUnsynced !== false);
      console.log('Progress reset successfully (including last word)');
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  }

  async getUnlearnedWords(level: Level): Promise<number[]> {
    const [allIds, learned] = await Promise.all([
      this.vocabulary.getStoredWordIds(level),
      this.getLearnedWords(level),
    ]);
    return allIds.filter((id) => !learned.includes(id));
  }

  async getOverallStats(): Promise<OverallProgressStats> {
    let totalLearned = 0;
    let totalWords = 0;
    const completedLevels: Level[] = [];
    for (const level of LEVELS) {
      const learned = await this.getLearnedCount(level);
      const total = await this.getTotalWords(level);
      totalLearned += learned;
      totalWords += total;
      if (isComplete(learned, total)) completedLevels.push(level);
    }
    return {
      totalLearned,
      totalWords,
      percentage: computeOverallPercent(totalLearned, totalWords),
      completedLevels,
    };
  }

  async restoreProgressFromFirebase(
    learnedWords: UserProgress | null,
    currentLevel: string | null,
    lastWordIndex?: number | null,
  ): Promise<void> {
    try {
      await this.store.restore(learnedWords, currentLevel, lastWordIndex);
    } catch (error) {
      console.error('Error restoring progress from Firebase:', error);
    }
  }

  async saveLastWordId(wordId: number): Promise<void> {
    try {
      await this.store.writeLastWordId(wordId);
    } catch (error) {
      console.error('Error saving last word ID:', error);
    }
  }

  async getLastWordId(): Promise<number | null> {
    try {
      const raw = await this.store.readLastWordId();
      return raw ? parseInt(raw, 10) : null;
    } catch (error) {
      console.error('Error getting last word ID:', error);
      return null;
    }
  }
}
