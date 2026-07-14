import React, { type ReactNode } from 'react';
import { fireEvent, render, waitFor, type RenderOptions } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { HomeFacade, HomeSessionSnapshot } from '@features/learning';
import { DEFAULT_STREAK_SUMMARY } from '@features/streak';
import HomeScreen, { getTutorialSwipeNextStep } from '../../src/features/learning/presentation/screens/HomeScreen';

jest.mock('../../components/SafeBannerAd', () => ({ SafeBannerAd: () => null }));
jest.mock('../../components/CustomAlert', () => ({ useAlert: () => ({ showAlert: jest.fn() }) }));
jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#fff', text: '#111', textSecondary: '#666', primary: '#ffc814',
      surface: '#fff', surfaceLight: '#f5f5f5', border: '#ddd', error: '#c00',
    },
    isDarkMode: false,
  }),
}));
jest.mock('@features/monetization', () => ({
  useMonetization: () => ({ isAdFree: true, isLoading: false }),
}));

const word = {
  id: 1,
  word: 'Haus',
  pronunciation: '/haʊs/',
  translation: 'House',
  sentence1: 'Das ist ein Haus',
  sentence2: 'Ein großes Haus',
  nativeSentence1: 'Bu bir ev',
  nativeSentence2: 'Büyük bir ev',
};

const readySnapshot: HomeSessionSnapshot = {
  level: 'A1',
  userLevel: 'beginner',
  targetLanguage: 'german',
  words: [word],
  currentWordIndex: 0,
  learnedCount: 0,
  totalCount: 100,
  streakSummary: { ...DEFAULT_STREAK_SUMMARY, currentStreak: 3, longestStreak: 5 },
};

function createFacade(overrides: Partial<HomeFacade> = {}): HomeFacade {
  return {
    loadSession: jest.fn(async () => readySnapshot),
    refreshCounts: jest.fn(async () => ({ learnedCount: 0, totalCount: 100 })),
    getCurrentLevel: jest.fn(async () => 'A1'),
    getVocabulary: jest.fn(async () => [word]),
    saveLastWordId: jest.fn(async () => undefined),
    getPendingWord: jest.fn(async () => null),
    clearPendingWord: jest.fn(async () => undefined),
    getTargetLanguage: jest.fn(async () => 'german'),
    getStreakSummary: jest.fn(async () => readySnapshot.streakSummary),
    completeWord: jest.fn(async () => ({
      level: 'A1' as const,
      streakState: readySnapshot.streakSummary,
      streakDidIncrement: false,
    })),
    scheduleStreakReminder: jest.fn(async () => undefined),
    isFavorite: jest.fn(async () => false),
    toggleFavorite: jest.fn(async () => true),
    speak: jest.fn(async () => undefined),
    hasSeenTutorial: jest.fn(async () => true),
    markTutorialSeen: jest.fn(async () => undefined),
    loadInterstitial: jest.fn(async () => undefined),
    showInterstitial: jest.fn(async () => undefined),
    getBannerAdUnitId: jest.fn(() => 'test-banner'),
    getReviewDecision: jest.fn(async () => ({ shouldPrompt: false, mode: 'native' as const })),
    markReviewPromptPresented: jest.fn(async () => undefined),
    requestNativeReview: jest.fn(async () => false),
    dismissReviewPrompt: jest.fn(async () => undefined),
    recordSatisfactionRating: jest.fn(async () => undefined),
    openStoreReviewPage: jest.fn(async () => ({ opened: true, attemptedUrls: [] })),
    openReviewFeedbackEmail: jest.fn(async () => true),
    ...overrides,
  };
}

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderHome(facade: HomeFacade, options?: Omit<RenderOptions, 'wrapper'>) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <SafeAreaProvider initialMetrics={initialMetrics}>{children}</SafeAreaProvider>
  );
  return render(<HomeScreen facade={facade} />, { wrapper: Wrapper, ...options });
}

describe('HomeScreen', () => {
  it('keeps the loading state visible until the facade resolves', () => {
    const facade = createFacade({ loadSession: jest.fn(() => new Promise(() => undefined)) });
    const { getByTestId } = renderHome(facade);
    expect(getByTestId('home-loading')).toBeTruthy();
  });

  it('renders a loaded word and delegates favorite and speech actions', async () => {
    const facade = createFacade();
    const { getByText, getByTestId } = renderHome(facade);
    await waitFor(() => expect(getByTestId('home-ready')).toBeTruthy());

    fireEvent.press(getByTestId('home-favorite-action'));
    fireEvent.press(getByText('Haus'));

    await waitFor(() => {
      expect(facade.toggleFavorite).toHaveBeenCalledWith(word, 'A1', false);
      expect(facade.speak).toHaveBeenCalledWith('Haus', 'de-DE');
    });
  });

  it('renders the empty state for a session without words', async () => {
    const facade = createFacade({
      loadSession: jest.fn(async () => ({ ...readySnapshot, words: [], totalCount: 0 })),
      refreshCounts: jest.fn(async () => ({ learnedCount: 0, totalCount: 0 })),
    });
    const { getByTestId, getByText } = renderHome(facade);
    await waitFor(() => expect(getByTestId('home-empty')).toBeTruthy());
    expect(getByText('home.noVocabulary')).toBeTruthy();
  });

  it('renders an error state and retries through the facade', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const loadSession = jest.fn()
      .mockRejectedValueOnce(new Error('storage unavailable'))
      .mockResolvedValueOnce(readySnapshot);
    const facade = createFacade({ loadSession });
    const { getByTestId, getByText } = renderHome(facade);
    await waitFor(() => expect(getByTestId('home-error')).toBeTruthy());
    fireEvent.press(getByText('common.retry'));
    await waitFor(() => expect(getByTestId('home-ready')).toBeTruthy());
    expect(loadSession).toHaveBeenCalledTimes(2);
    consoleError.mockRestore();
  });

  it('only treats prompted tutorial swipes as practice gestures', () => {
    expect(getTutorialSwipeNextStep(1, 'right')).toBe(2);
    expect(getTutorialSwipeNextStep(2, 'left')).toBe(3);
    expect(getTutorialSwipeNextStep(1, 'left')).toBeNull();
    expect(getTutorialSwipeNextStep(2, 'right')).toBeNull();
    expect(getTutorialSwipeNextStep(3, 'right')).toBeNull();
  });
});
