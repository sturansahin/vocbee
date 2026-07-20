import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { HomeFacade } from '../../../application/contracts';
import { useHomeEngagementFlow } from '../useHomeEngagementFlow';

function createFacade(): jest.Mocked<HomeFacade> {
  return {
    loadInterstitial: jest.fn(async () => undefined),
    showInterstitial: jest.fn(async () => undefined),
    scheduleStreakReminder: jest.fn(async () => undefined),
    getReviewDecision: jest.fn(async () => ({ shouldPrompt: false, mode: 'native' as const })),
    requestNativeReview: jest.fn(async () => false),
    markReviewPromptPresented: jest.fn(async () => undefined),
    dismissReviewPrompt: jest.fn(async () => undefined),
    recordSatisfactionRating: jest.fn(async () => undefined),
    openStoreReviewPage: jest.fn(async () => ({ opened: true, attemptedUrls: [] })),
    openReviewFeedbackEmail: jest.fn(async () => true),
  } as unknown as jest.Mocked<HomeFacade>;
}

const result = {
  level: 'A1' as const,
  streakState: {
    currentStreak: 10,
    longestStreak: 10,
    brokenStreak: null,
    lastQualifiedDay: '2026-07-20',
    lastQualifiedAt: '2026-07-20T08:00:00.000Z',
  },
  streakDidIncrement: false,
};

describe('useHomeEngagementFlow', () => {
  it('defers the tenth-word interstitial until celebration completion and completes once', async () => {
    const facade = createFacade();
    const tutorialVisible = { current: false };
    const { result: hook } = renderHook(() =>
      useHomeEngagementFlow({
        facade,
        shouldShowAds: true,
        isTutorialVisible: tutorialVisible,
        t: (key) => key,
        showAlert: jest.fn(),
      }),
    );

    await waitFor(() => expect(facade.loadInterstitial).toHaveBeenCalledTimes(1));
    for (let index = 0; index < 9; index += 1) {
      await act(async () => {
        await hook.current.recordLearnedWord(result);
      });
    }
    await act(async () => {
      await hook.current.recordLearnedWord({ ...result, streakDidIncrement: true });
    });

    expect(hook.current.celebration?.count).toBe(10);
    expect(facade.showInterstitial).not.toHaveBeenCalled();
    act(() => {
      hook.current.completeCelebration();
      hook.current.completeCelebration();
    });
    expect(facade.showInterstitial).toHaveBeenCalledTimes(1);
  });

  it('publishes manual review state and guards duplicate modal callbacks', async () => {
    let resolveDismiss: (() => void) | undefined;
    const facade = createFacade();
    facade.getReviewDecision.mockResolvedValue({ shouldPrompt: true, mode: 'satisfaction' });
    facade.dismissReviewPrompt.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveDismiss = resolve;
        }),
    );
    const { result: hook } = renderHook(() =>
      useHomeEngagementFlow({
        facade,
        shouldShowAds: false,
        isTutorialVisible: { current: false },
        t: (key) => key,
        showAlert: jest.fn(),
      }),
    );

    await act(async () => {
      await hook.current.maybeShowReview(20, false);
    });
    expect(facade.markReviewPromptPresented).toHaveBeenCalledTimes(1);
    expect(hook.current.reviewPromptVisible).toBe(true);

    act(() => {
      void hook.current.dismissReview();
      void hook.current.dismissReview();
    });
    expect(facade.dismissReviewPrompt).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveDismiss?.();
    });
  });
});
