import { addToFavorites, isFavorite, removeFromFavorites } from '@features/favorites';
import {
  checkAndAdvanceLevel,
  getCurrentLevel,
  getLastWordId,
  getLearnedCount,
  getLearnedWords,
  getTotalWords,
  markWordAsLearned,
  saveLastWordId,
} from '@features/progress';
import {
  dismissReviewPrompt,
  getAutomaticReviewPromptDecision,
  markAutomaticReviewPromptPresented,
  openReviewFeedbackEmail,
  openStoreReviewPage,
  recordSatisfactionRating,
  requestNativeReview,
} from '@features/review';
import { getStreakSummary, recordDailyStudyAction } from '@features/streak';
import {
  generateVocabulary,
  getStoredVocabulary,
  isVocabularyGenerated,
  shuffleArray,
} from '@features/vocabulary';
import { AD_IDS, loadInterstitial, showInterstitial } from '@features/monetization';
import {
  clearPendingNotificationWord,
  getPendingNotificationWord,
  scheduleStreakReminderNotification,
} from '@features/notifications';
import { DefaultHomeFacade } from '../application/HomeFacade';
import { ExpoHomePlatformGateway } from '../data/ExpoHomePlatformGateway';

export const homeFacade = new DefaultHomeFacade(new ExpoHomePlatformGateway(), {
  isVocabularyGenerated,
  generateVocabulary,
  getStoredVocabulary,
  shuffleWords: shuffleArray,
  getCurrentLevel,
  getLearnedWords,
  getLearnedCount,
  getTotalWords,
  getLastWordId,
  saveLastWordId,
  markWordAsLearned,
  checkAndAdvanceLevel,
  getPendingWord: getPendingNotificationWord,
  clearPendingWord: clearPendingNotificationWord,
  getStreakSummary,
  recordDailyStudyAction,
  scheduleStreakReminder: scheduleStreakReminderNotification,
  isFavorite,
  addFavorite: addToFavorites,
  removeFavorite: removeFromFavorites,
  loadInterstitial: async () => {
    await loadInterstitial();
  },
  showInterstitial: async () => {
    await showInterstitial();
  },
  bannerAdUnitId: AD_IDS.BANNER,
  getReviewDecision: getAutomaticReviewPromptDecision,
  markReviewPromptPresented: async () => {
    await markAutomaticReviewPromptPresented('satisfactionShown');
  },
  requestNativeReview,
  dismissReviewPrompt: async () => {
    await dismissReviewPrompt();
  },
  recordSatisfactionRating: async (rating) => {
    await recordSatisfactionRating(rating);
  },
  openStoreReviewPage,
  openReviewFeedbackEmail,
});
