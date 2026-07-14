import type { StreakSummary, StreakState } from '@features/streak';
import type { Level, VocabularyWord } from '@features/vocabulary';
import type { ReviewPromptContext, ReviewPromptDecision, StoreReviewOpenResult } from '@features/review';

export interface PendingLearningWord {
  wordId: number;
  level?: string;
  targetLanguage?: string;
}

export interface HomeSessionSnapshot {
  level: Level;
  userLevel: string;
  targetLanguage: string;
  words: VocabularyWord[];
  currentWordIndex: number;
  learnedCount: number;
  totalCount: number;
  streakSummary: StreakSummary;
}

export interface CompleteWordResult {
  level: Level;
  streakState: StreakState;
  streakDidIncrement: boolean;
}

export interface HomeFacade {
  loadSession(forceReload?: boolean): Promise<HomeSessionSnapshot>;
  refreshCounts(level: Level): Promise<{ learnedCount: number; totalCount: number }>;
  getCurrentLevel(): Promise<Level>;
  getVocabulary(level: Level): Promise<VocabularyWord[]>;
  saveLastWordId(wordId: number): Promise<void>;
  getPendingWord(): Promise<PendingLearningWord | null>;
  clearPendingWord(): Promise<void>;
  getTargetLanguage(): Promise<string | null>;
  getStreakSummary(): Promise<StreakSummary>;
  completeWord(level: Level, wordId: number): Promise<CompleteWordResult>;
  scheduleStreakReminder(): Promise<void>;
  isFavorite(wordId: number, level: Level): Promise<boolean>;
  toggleFavorite(word: VocabularyWord, level: Level, currentlyFavorite: boolean): Promise<boolean>;
  speak(text: string, language: string): Promise<void>;
  hasSeenTutorial(): Promise<boolean>;
  markTutorialSeen(): Promise<void>;
  loadInterstitial(): Promise<void>;
  showInterstitial(): Promise<void>;
  getBannerAdUnitId(): string;
  getReviewDecision(context: ReviewPromptContext): Promise<ReviewPromptDecision>;
  markReviewPromptPresented(): Promise<void>;
  requestNativeReview(): Promise<boolean>;
  dismissReviewPrompt(): Promise<void>;
  recordSatisfactionRating(rating: number): Promise<void>;
  openStoreReviewPage(source: string): Promise<StoreReviewOpenResult>;
  openReviewFeedbackEmail(rating?: number): Promise<boolean>;
}

export interface HomePlatformGateway {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  speak(text: string, options: { language: string; pitch: number; rate: number }): Promise<void>;
}

export interface HomeServiceDependencies {
  isVocabularyGenerated(): Promise<boolean>;
  generateVocabulary(nativeLanguage: string, targetLanguage: string): Promise<void>;
  getStoredVocabulary(level: Level): Promise<VocabularyWord[]>;
  shuffleWords(words: VocabularyWord[]): VocabularyWord[];
  getCurrentLevel(): Promise<Level>;
  getLearnedWords(level: Level): Promise<number[]>;
  getLearnedCount(level: Level): Promise<number>;
  getTotalWords(level: Level): Promise<number>;
  getLastWordId(): Promise<number | null>;
  saveLastWordId(wordId: number): Promise<void>;
  markWordAsLearned(level: Level, wordId: number): Promise<void>;
  checkAndAdvanceLevel(): Promise<Level>;
  getPendingWord(): Promise<PendingLearningWord | null>;
  clearPendingWord(): Promise<void>;
  getStreakSummary(): Promise<StreakSummary>;
  recordDailyStudyAction(): Promise<{ state: StreakState; didIncrement: boolean }>;
  scheduleStreakReminder(): Promise<void>;
  isFavorite(wordId: number, level: Level): Promise<boolean>;
  addFavorite(word: VocabularyWord, level: Level): Promise<void>;
  removeFavorite(wordId: number, level: Level): Promise<void>;
  loadInterstitial(): Promise<void> | void;
  showInterstitial(): Promise<void>;
  bannerAdUnitId: string;
  getReviewDecision(context: ReviewPromptContext): Promise<ReviewPromptDecision>;
  markReviewPromptPresented(): Promise<void>;
  requestNativeReview(): Promise<boolean>;
  dismissReviewPrompt(): Promise<void>;
  recordSatisfactionRating(rating: number): Promise<void>;
  openStoreReviewPage(source: string): Promise<StoreReviewOpenResult>;
  openReviewFeedbackEmail(rating?: number): Promise<boolean>;
}
