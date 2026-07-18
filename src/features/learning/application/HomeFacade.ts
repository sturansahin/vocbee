import { STORAGE_KEYS } from '@shared/storage/storageKeys';
import type { Level, VocabularyWord } from '@features/vocabulary';
import type {
  CompleteWordResult,
  HomeFacade,
  HomePlatformGateway,
  HomeServiceDependencies,
  HomeSessionSnapshot,
} from './contracts';

const UNKNOWN_LANGUAGE = 'unknown';

function parseSavedOrder(raw: string | null): number[] | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) && value.every((id) => typeof id === 'number') ? value : null;
  } catch {
    return null;
  }
}

export class DefaultHomeFacade implements HomeFacade {
  constructor(
    private readonly platform: HomePlatformGateway,
    private readonly services: HomeServiceDependencies,
  ) {}

  async loadSession(forceReload = false): Promise<HomeSessionSnapshot> {
    if (!(await this.services.isVocabularyGenerated())) {
      const nativeLanguage = await this.platform.getItem(STORAGE_KEYS.NATIVE_LANGUAGE);
      const targetLanguage = await this.platform.getItem(STORAGE_KEYS.TARGET_LANGUAGE);
      if (!nativeLanguage || !targetLanguage) {
        return this.emptySession();
      }
      await this.services.generateVocabulary(nativeLanguage, targetLanguage);
    }

    const level = await this.services.getCurrentLevel();
    const vocabulary = await this.services.getStoredVocabulary(level);
    const userLevel = (await this.platform.getItem(STORAGE_KEYS.USER_LEVEL)) || 'beginner';
    const nativeLanguage =
      (await this.platform.getItem(STORAGE_KEYS.NATIVE_LANGUAGE)) || UNKNOWN_LANGUAGE;
    const targetLanguage =
      (await this.platform.getItem(STORAGE_KEYS.TARGET_LANGUAGE)) || UNKNOWN_LANGUAGE;

    if (vocabulary.length === 0) {
      return this.emptySession(level, userLevel, targetLanguage);
    }

    const learnedIds = await this.services.getLearnedWords(level);
    const unlearnedWords = vocabulary.filter((word) => !learnedIds.includes(word.id));
    const shuffleOrderKey = `@shuffle_order_${nativeLanguage}_${targetLanguage}_${level}`;
    const savedOrder = forceReload
      ? null
      : parseSavedOrder(await this.platform.getItem(shuffleOrderKey));
    let orderedWords: VocabularyWord[];

    if (savedOrder) {
      orderedWords = savedOrder
        .map((id) => unlearnedWords.find((word) => word.id === id))
        .filter((word): word is VocabularyWord => word !== undefined);
      const savedIds = new Set(savedOrder);
      const newWords = unlearnedWords.filter((word) => !savedIds.has(word.id));
      if (newWords.length > 0) {
        orderedWords = [...orderedWords, ...this.services.shuffleWords(newWords)];
        await this.saveShuffleOrder(shuffleOrderKey, orderedWords);
      }
    } else {
      orderedWords = this.services.shuffleWords(unlearnedWords);
      await this.saveShuffleOrder(shuffleOrderKey, orderedWords);
    }

    const pending = await this.services.getPendingWord();
    const pendingWordId =
      pending &&
      (!pending.level || pending.level === level) &&
      (!pending.targetLanguage || pending.targetLanguage === targetLanguage) &&
      orderedWords.some((word) => word.id === pending.wordId)
        ? pending.wordId
        : null;
    const resumeWordId = pendingWordId ?? (await this.services.getLastWordId());
    const resumeIndex =
      resumeWordId === null
        ? 0
        : Math.max(
            0,
            orderedWords.findIndex((word) => word.id === resumeWordId),
          );

    const [learnedCount, totalCount, streakSummary] = await Promise.all([
      this.services.getLearnedCount(level),
      this.services.getTotalWords(level),
      this.services.getStreakSummary(),
    ]);

    if (pendingWordId !== null) {
      await this.services.saveLastWordId(pendingWordId);
      await this.services.clearPendingWord();
    }

    return {
      level,
      userLevel,
      targetLanguage,
      words: orderedWords,
      currentWordIndex: resumeIndex,
      learnedCount,
      totalCount,
      streakSummary,
    };
  }

  async refreshCounts(level: Level) {
    const [learnedCount, totalCount] = await Promise.all([
      this.services.getLearnedCount(level),
      this.services.getTotalWords(level),
    ]);
    return { learnedCount, totalCount };
  }

  getCurrentLevel = () => this.services.getCurrentLevel();
  getVocabulary = (level: Level) => this.services.getStoredVocabulary(level);
  saveLastWordId = (wordId: number) => this.services.saveLastWordId(wordId);
  getPendingWord = () => this.services.getPendingWord();
  clearPendingWord = () => this.services.clearPendingWord();
  getTargetLanguage = () => this.platform.getItem(STORAGE_KEYS.TARGET_LANGUAGE);
  getStreakSummary = () => this.services.getStreakSummary();

  async completeWord(level: Level, wordId: number): Promise<CompleteWordResult> {
    await this.services.markWordAsLearned(level, wordId);
    const streak = await this.services.recordDailyStudyAction();
    const nextLevel = await this.services.checkAndAdvanceLevel();
    return {
      level: nextLevel,
      streakState: streak.state,
      streakDidIncrement: streak.didIncrement,
    };
  }

  scheduleStreakReminder = () => this.services.scheduleStreakReminder();
  isFavorite = (wordId: number, level: Level) => this.services.isFavorite(wordId, level);

  async toggleFavorite(word: VocabularyWord, level: Level, currentlyFavorite: boolean) {
    if (currentlyFavorite) {
      await this.services.removeFavorite(word.id, level);
      return false;
    }
    await this.services.addFavorite(word, level);
    return true;
  }

  speak(text: string, language: string) {
    return this.platform.speak(text, { language, pitch: 1, rate: 0.75 });
  }

  async hasSeenTutorial() {
    return (await this.platform.getItem(STORAGE_KEYS.HAS_SEEN_HOME_TUTORIAL)) === 'true';
  }

  markTutorialSeen = () => this.platform.setItem(STORAGE_KEYS.HAS_SEEN_HOME_TUTORIAL, 'true');
  async loadInterstitial() {
    await this.services.loadInterstitial();
  }
  showInterstitial = () => this.services.showInterstitial();
  getBannerAdUnitId = () => this.services.bannerAdUnitId;
  getReviewDecision(context: Parameters<HomeServiceDependencies['getReviewDecision']>[0]) {
    return this.services.getReviewDecision(context);
  }
  async markReviewPromptPresented() {
    await this.services.markReviewPromptPresented();
  }
  requestNativeReview() {
    return this.services.requestNativeReview();
  }
  async dismissReviewPrompt() {
    await this.services.dismissReviewPrompt();
  }
  async recordSatisfactionRating(rating: number) {
    await this.services.recordSatisfactionRating(rating);
  }
  openStoreReviewPage(source: string) {
    return this.services.openStoreReviewPage(source);
  }
  openReviewFeedbackEmail(rating?: number) {
    return this.services.openReviewFeedbackEmail(rating);
  }

  private saveShuffleOrder(key: string, words: VocabularyWord[]) {
    return this.platform.setItem(key, JSON.stringify(words.map((word) => word.id)));
  }

  private async emptySession(
    level?: Level,
    userLevel = 'beginner',
    targetLanguage = UNKNOWN_LANGUAGE,
  ): Promise<HomeSessionSnapshot> {
    const resolvedLevel = level ?? (await this.services.getCurrentLevel());
    return {
      level: resolvedLevel,
      userLevel,
      targetLanguage,
      words: [],
      currentWordIndex: 0,
      learnedCount: 0,
      totalCount: 0,
      streakSummary: await this.services.getStreakSummary(),
    };
  }
}
