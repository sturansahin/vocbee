import { DefaultHomeFacade } from '../HomeFacade';
import type { HomePlatformGateway, HomeServiceDependencies } from '../contracts';
import { DEFAULT_STREAK_SUMMARY } from '@features/streak';

const word = {
  id: 1,
  word: 'Haus',
  pronunciation: '/haʊs/',
  translation: 'House',
  sentence1: 'Das ist ein Haus',
  sentence2: 'Ein Haus',
  nativeSentence1: 'Bu bir ev',
  nativeSentence2: 'Bir ev',
};

function makeDependencies(overrides: Partial<HomeServiceDependencies> = {}) {
  const platform: HomePlatformGateway = {
    getItem: jest.fn(
      async (key) =>
        (
          ({
            '@native_language': 'turkish',
            '@target_language': 'german',
            '@user_level': 'beginner',
          }) as Record<string, string>
        )[key] ?? null,
    ),
    setItem: jest.fn(async () => undefined),
    speak: jest.fn(async () => undefined),
  };
  const services: HomeServiceDependencies = {
    isVocabularyGenerated: jest.fn(async () => true),
    generateVocabulary: jest.fn(async () => undefined),
    getStoredVocabulary: jest.fn(async () => [word]),
    shuffleWords: jest.fn((words) => words),
    getCurrentLevel: jest.fn(async () => 'A1'),
    getLearnedWords: jest.fn(async () => []),
    getLearnedCount: jest.fn(async () => 0),
    getTotalWords: jest.fn(async () => 100),
    getLastWordId: jest.fn(async () => null),
    saveLastWordId: jest.fn(async () => undefined),
    markWordAsLearned: jest.fn(async () => undefined),
    checkAndAdvanceLevel: jest.fn(async () => 'A1'),
    getPendingWord: jest.fn(async () => null),
    clearPendingWord: jest.fn(async () => undefined),
    getStreakSummary: jest.fn(async () => DEFAULT_STREAK_SUMMARY),
    recordDailyStudyAction: jest.fn(async () => ({
      state: DEFAULT_STREAK_SUMMARY,
      didIncrement: true,
    })),
    scheduleStreakReminder: jest.fn(async () => undefined),
    isFavorite: jest.fn(async () => false),
    addFavorite: jest.fn(async () => undefined),
    removeFavorite: jest.fn(async () => undefined),
    loadInterstitial: jest.fn(async () => undefined),
    showInterstitial: jest.fn(async () => undefined),
    bannerAdUnitId: 'banner',
    getReviewDecision: jest.fn(async () => ({ shouldPrompt: false, mode: 'native' as const })),
    markReviewPromptPresented: jest.fn(async () => undefined),
    requestNativeReview: jest.fn(async () => false),
    dismissReviewPrompt: jest.fn(async () => undefined),
    recordSatisfactionRating: jest.fn(async () => undefined),
    openStoreReviewPage: jest.fn(async () => ({ opened: true, attemptedUrls: [] })),
    openReviewFeedbackEmail: jest.fn(async () => true),
    ...overrides,
  };
  return { facade: new DefaultHomeFacade(platform, services), platform, services };
}

describe('DefaultHomeFacade', () => {
  it('loads a local-first session and persists the language-pair shuffle order', async () => {
    const { facade, platform } = makeDependencies();
    const result = await facade.loadSession();
    expect(result.words).toEqual([word]);
    expect(result.totalCount).toBe(100);
    expect(platform.setItem).toHaveBeenCalledWith('@shuffle_order_turkish_german_A1', '[1]');
  });

  it('completes a word through progress and streak dependencies', async () => {
    const { facade, services } = makeDependencies();
    const result = await facade.completeWord('A1', 1);
    expect(services.markWordAsLearned).toHaveBeenCalledWith('A1', 1);
    expect(services.recordDailyStudyAction).toHaveBeenCalledTimes(1);
    expect(services.checkAndAdvanceLevel).toHaveBeenCalledTimes(1);
    expect(result.streakDidIncrement).toBe(true);
  });

  it('delegates favorite toggling and speech to their adapters', async () => {
    const { facade, platform, services } = makeDependencies();
    await expect(facade.toggleFavorite(word, 'A1', false)).resolves.toBe(true);
    await expect(facade.toggleFavorite(word, 'A1', true)).resolves.toBe(false);
    await facade.speak('Haus', 'de-DE');
    expect(services.addFavorite).toHaveBeenCalledWith(word, 'A1');
    expect(services.removeFavorite).toHaveBeenCalledWith(1, 'A1');
    expect(platform.speak).toHaveBeenCalledWith('Haus', {
      language: 'de-DE',
      pitch: 1,
      rate: 0.75,
    });
  });
});
