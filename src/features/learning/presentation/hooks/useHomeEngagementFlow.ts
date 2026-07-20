import { useCallback, useEffect, useRef, useState } from 'react';
import type { HomeFacade, CompleteWordResult } from '../../application/contracts';
import { getStreakCelebrationMessageKey, shouldCelebrateStreak } from '../../domain/rules';

interface CelebrationState {
  id: number;
  count: number;
  label: string;
  message: string;
}

interface AlertInput {
  title: string;
  message: string;
}

interface HomeEngagementFlowOptions {
  facade: HomeFacade;
  shouldShowAds: boolean;
  isTutorialVisible: React.MutableRefObject<boolean>;
  t: (key: string, values?: Record<string, unknown>) => string;
  showAlert(input: AlertInput): void;
}

export function useHomeEngagementFlow({
  facade,
  shouldShowAds,
  isTutorialVisible,
  t,
  showAlert,
}: HomeEngagementFlowOptions) {
  const learnedThisSession = useRef(0);
  const celebrationId = useRef(0);
  const pendingInterstitial = useRef(false);
  const reviewInFlight = useRef(false);
  const reviewActionInFlight = useRef(false);
  const completionInFlight = useRef(false);
  const reviewPromptVisibleRef = useRef(false);
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);
  const [reviewPromptVisible, setReviewPromptVisible] = useState(false);

  const setReviewVisible = useCallback((visible: boolean) => {
    reviewPromptVisibleRef.current = visible;
    setReviewPromptVisible(visible);
  }, []);

  useEffect(() => {
    if (shouldShowAds) void facade.loadInterstitial();
  }, [facade, shouldShowAds]);

  const maybeShowReview = useCallback(
    async (nextLearnedCount: number, busy: boolean) => {
      if (reviewPromptVisibleRef.current || reviewInFlight.current) return;
      reviewInFlight.current = true;
      try {
        const decision = await facade.getReviewDecision({
          totalLearnedCount: nextLearnedCount,
          sessionLearnedCount: learnedThisSession.current,
          isTutorialVisible: isTutorialVisible.current,
          isBusy: busy,
        });
        if (!decision.shouldPrompt) return;
        if (decision.mode === 'native') {
          await facade.requestNativeReview();
          return;
        }
        await facade.markReviewPromptPresented();
        setReviewVisible(true);
      } catch (error) {
        console.warn('[HomeScreen] Review prompt check failed', error);
      } finally {
        reviewInFlight.current = false;
      }
    },
    [facade, isTutorialVisible, setReviewVisible],
  );

  const recordLearnedWord = useCallback(
    async (result: CompleteWordResult) => {
      void facade.scheduleStreakReminder().catch((error) => {
        console.error('[HomeScreen] Failed to refresh streak reminder notification:', error);
      });

      const celebrate = shouldCelebrateStreak(result.streakDidIncrement);
      if (celebrate) {
        const count = result.streakState.currentStreak;
        setCelebration({
          id: ++celebrationId.current,
          count,
          label: t('home.streakCelebrationLabel'),
          message: t(getStreakCelebrationMessageKey(count), { count }),
        });
      }

      learnedThisSession.current += 1;
      const showInterstitial = shouldShowAds && learnedThisSession.current % 10 === 0;
      if (showInterstitial) {
        if (celebrate) pendingInterstitial.current = true;
        else await facade.showInterstitial();
      }
      return celebrate || showInterstitial;
    },
    [facade, shouldShowAds, t],
  );

  const completeCelebration = useCallback(() => {
    if (completionInFlight.current || !celebration) return;
    completionInFlight.current = true;
    setCelebration(null);
    if (pendingInterstitial.current) {
      pendingInterstitial.current = false;
      if (shouldShowAds) void facade.showInterstitial();
    }
    requestAnimationFrame(() => {
      completionInFlight.current = false;
    });
  }, [celebration, facade, shouldShowAds]);

  const runReviewAction = useCallback(
    async (action: () => Promise<void>) => {
      if (reviewActionInFlight.current) return;
      reviewActionInFlight.current = true;
      setReviewVisible(false);
      try {
        await action();
      } finally {
        reviewActionInFlight.current = false;
      }
    },
    [setReviewVisible],
  );

  const dismissReview = useCallback(
    () => runReviewAction(() => facade.dismissReviewPrompt()),
    [facade, runReviewAction],
  );

  const rateInStore = useCallback(
    (rating: number) =>
      runReviewAction(async () => {
        await facade.recordSatisfactionRating(rating);
        const result = await facade.openStoreReviewPage('automatic-rating-prompt');
        if (!result.opened) {
          showAlert({ title: t('common.error'), message: t('reviewPrompt.storeOpenError') });
        }
      }),
    [facade, runReviewAction, showAlert, t],
  );

  const sendFeedback = useCallback(
    (rating?: number) =>
      runReviewAction(async () => {
        await facade.recordSatisfactionRating(rating ?? 0);
        if (!(await facade.openReviewFeedbackEmail(rating))) {
          showAlert({ title: t('common.error'), message: t('reviewPrompt.feedbackOpenError') });
        }
      }),
    [facade, runReviewAction, showAlert, t],
  );

  return {
    celebration,
    reviewPromptVisible,
    recordLearnedWord,
    maybeShowReview,
    completeCelebration,
    dismissReview,
    rateInStore,
    sendFeedback,
  };
}
