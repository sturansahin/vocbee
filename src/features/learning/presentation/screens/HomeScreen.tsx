import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  HomeModals,
  HomeProgressSection,
  HomeTutorialSection,
  HomeWordCardSection,
} from '@features/home';
import { getStreakStatusMessageKey, getStreakSummaryFromState } from '@features/streak';
import { useMonetization } from '@features/monetization';
import type { RootStackParamList } from '../../../../../types';
import { createSwarmAnimation } from '../../../../../assets/animations/swarmAnimation';
import { HomeHeader } from '../../../../../components/HomeHeader';
import { SafeBannerAd } from '../../../../../components/SafeBannerAd';
import { StreakAlertContent } from '../../../../../components/StreakAlertContent';
import { useAlert } from '../../../../../components/CustomAlert';
import { useTheme } from '../../../../../context/ThemeContext';
import type { HomeFacade } from '../../application/contracts';
import {
  getLearningSpeechLanguage,
  getStreakCelebrationMessageKey,
  getTutorialSwipeNextStep,
  shouldCelebrateStreak,
} from '../../domain/rules';
import { HomeEmptyState, HomeErrorState, HomeLoadingState } from '../components/HomeScreenStates';
import { useBeeAnimation } from '../hooks/useBeeAnimation';
import { useLearningSession } from '../hooks/useLearningSession';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { useTutorialOverlay } from '../hooks/useTutorialOverlay';
import { useWordActions } from '../hooks/useWordActions';

export { getTutorialSwipeNextStep };

const BEE_COLOR: [number, number, number, number] = [1, 0.78, 0.08, 1];
const BEE_STATIC_ANIMATION = createSwarmAnimation(BEE_COLOR, true);
const BEE_ACTIVE_ANIMATION = createSwarmAnimation(BEE_COLOR, false);

interface CelebrationState {
  id: number;
  count: number;
  label: string;
  message: string;
}

export interface HomeScreenProps { facade: HomeFacade }

export default function HomeScreen({ facade }: HomeScreenProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { colors, isDarkMode } = useTheme();
  const { isAdFree, isLoading: monetizationLoading } = useMonetization();
  const { showAlert } = useAlert();
  const { t } = useTranslation();
  const session = useLearningSession(facade);
  const tutorial = useTutorialOverlay(
    facade,
    session.loadState === 'ready' && session.words.length > 0,
    session.currentWordIndex,
  );
  const shouldShowAds = !isAdFree && !monetizationLoading;
  const sessionLearnedCountRef = useRef(0);
  const celebrationIdRef = useRef(0);
  const pendingInterstitialRef = useRef(false);
  const reviewInFlightRef = useRef(false);
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);
  const [reviewPromptVisible, setReviewPromptVisible] = useState(false);
  const speechLanguage = getLearningSpeechLanguage(session.targetLanguage);
  const wordActions = useWordActions({
    facade,
    word: session.currentWord,
    level: session.currentLevel,
    language: speechLanguage,
    tutorialStep: tutorial.tutorialStep,
    tutorialVisible: tutorial.showTutorial,
    setTutorialStep: tutorial.setTutorialStep,
  });
  const bees = useBeeAnimation(
    session.loadState === 'ready' && session.words.length > 0,
    session.currentWord?.id,
  );

  const maybeShowReview = useCallback(async (nextLearnedCount: number, busy: boolean) => {
    if (reviewPromptVisible || reviewInFlightRef.current) return;
    reviewInFlightRef.current = true;
    try {
      const decision = await facade.getReviewDecision({
        totalLearnedCount: nextLearnedCount,
        sessionLearnedCount: sessionLearnedCountRef.current,
        isTutorialVisible: tutorial.showTutorialRef.current,
        isBusy: busy,
      });
      if (!decision.shouldPrompt) return;
      if (decision.mode === 'native') await facade.requestNativeReview();
      else {
        await facade.markReviewPromptPresented();
        setReviewPromptVisible(true);
      }
    } catch (error) {
      console.warn('[HomeScreen] Review prompt check failed', error);
    } finally {
      reviewInFlightRef.current = false;
    }
  }, [facade, reviewPromptVisible, tutorial.showTutorialRef]);

  const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
    const word = session.currentWord;
    if (!word) return;
    const wasLastWord = session.currentWordIndex >= session.words.length - 1;
    bees.animateAway();
    if (!wasLastWord) session.setCurrentWordIndex(index => index + 1);

    if (direction === 'right') {
      const nextLearnedCount = session.learnedCount + 1;
      session.setLearnedCount(count => count + 1);
      const result = await facade.completeWord(session.currentLevel, word.id);
      session.setStreakSummary(getStreakSummaryFromState(result.streakState));
      void facade.scheduleStreakReminder().catch(error => {
        console.error('[HomeScreen] Failed to refresh streak reminder notification:', error);
      });
      const celebrate = shouldCelebrateStreak(result.streakDidIncrement);
      if (celebrate) {
        const count = result.streakState.currentStreak;
        setCelebration({
          id: ++celebrationIdRef.current,
          count,
          label: t('home.streakCelebrationLabel'),
          message: t(getStreakCelebrationMessageKey(count), { count }),
        });
      }
      sessionLearnedCountRef.current += 1;
      const showInterstitial = shouldShowAds && sessionLearnedCountRef.current % 10 === 0;
      if (showInterstitial) {
        if (celebrate) pendingInterstitialRef.current = true;
        else await facade.showInterstitial();
      }
      if (result.level !== session.currentLevel) {
        session.setCurrentLevel(result.level);
        await session.load(true);
        return;
      }
      await maybeShowReview(nextLearnedCount, celebrate || showInterstitial);
    }

    const nextIndex = session.currentWordIndex + 1;
    if (nextIndex < session.words.length) await facade.saveLastWordId(session.words[nextIndex].id);
    if (wasLastWord) {
      await facade.saveLastWordId(0);
      await session.load(true);
    }
  }, [bees, facade, maybeShowReview, session, shouldShowAds, t]);

  const swipe = useSwipeGesture({
    tutorialVisibleRef: tutorial.showTutorialRef,
    tutorialStepRef: tutorial.tutorialStepRef,
    tutorialVisible: tutorial.showTutorial,
    tutorialStep: tutorial.tutorialStep,
    setTutorialStep: tutorial.setTutorialStep,
    onSwipe: handleSwipe,
  });

  React.useEffect(() => {
    if (shouldShowAds) void facade.loadInterstitial();
  }, [facade, shouldShowAds]);

  const levelDescription = t(`level.${['beginner', 'intermediate', 'advanced'].includes(session.userLevel)
    ? session.userLevel
    : 'beginner'}`);
  const header = (
    <HomeHeader titleColor={colors.text} iconColor={colors.text}
      streakCount={session.streakSummary.currentStreak}
      streakCompletedToday={session.streakSummary.completedToday}
      streakAtRisk={session.streakSummary.atRisk}
      streakTextColor={session.streakSummary.completedToday ? '#FF8F1F' : colors.text}
      streakAccentColor="#FF8F1F"
      streakAccessibilityLabel={t('home.streakAccessibilityLabel', { count: session.streakSummary.currentStreak })}
      onPressStreak={() => showAlert({
        title: t('home.streakTitle'),
        content: <StreakAlertContent statusMessage={t(getStreakStatusMessageKey(session.streakSummary.status))}
          currentLabel={t('home.currentStreakLabel')} bestLabel={t('home.bestStreakLabel')}
          currentValue={session.streakSummary.currentStreak} bestValue={session.streakSummary.longestStreak} />,
      })}
      onPressFavorites={() => navigation.navigate('Favorites')}
      onPressSettings={() => navigation.navigate('Settings')} />
  );

  if (session.loadState === 'loading') {
    return <HomeLoadingState colors={colors} isDarkMode={isDarkMode} topInset={insets.top}
      showBannerPlaceholder={shouldShowAds} levelCode={session.currentLevel}
      levelDescription={levelDescription} wordsLabel={t('home.words')} />;
  }
  if (session.loadState === 'error') {
    return <HomeErrorState colors={colors} topInset={insets.top} title={t('common.error')}
      description={t('home.setupRequired')} retryLabel={t('common.retry', { defaultValue: 'Retry' })}
      onRetry={session.retry} />;
  }
  if (session.words.length === 0) {
    return <HomeEmptyState colors={colors} topInset={insets.top} header={header}
      title={session.totalCount > 0 ? t('home.levelComplete') : t('home.noVocabulary')}
      description={session.totalCount > 0
        ? t('home.levelCompleteDesc', { count: session.totalCount, level: session.currentLevel })
        : t('home.setupRequired')} />;
  }

  const progress = session.totalCount > 0 ? (session.learnedCount / session.totalCount) * 100 : 0;
  const surfaceStyle = [styles.stats, {
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.72)',
    borderColor: colors.border,
  }];

  return (
    <View testID="home-ready" style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {header}
      <View style={surfaceStyle}>
        <HomeProgressSection isLoading={false} isDarkMode={isDarkMode} textColor={colors.text}
          textSecondaryColor={colors.textSecondary} primaryColor={colors.primary}
          surfaceLightColor={colors.surfaceLight} borderColor={colors.border}
          initialLoadingPlaceholderColor="transparent" initialLoadingAccentColor="transparent"
          levelCode={session.currentLevel} levelDescription={levelDescription}
          learnedCount={session.learnedCount} totalCount={session.totalCount}
          wordsLabel={t('home.words')} progressPercentage={progress} />
      </View>
      <HomeWordCardSection colors={colors} isDarkMode={isDarkMode} t={t}
        currentWord={session.currentWord} nextWord={session.nextWord} wordsLength={session.words.length}
        showTutorial={tutorial.showTutorial} tutorialStep={tutorial.tutorialStep}
        isCurrentWordFavorite={wordActions.isFavorite} {...tutorial.refs}
        position={swipe.position} rotate={swipe.rotate} panHandlers={swipe.panHandlers}
        beePositions={bees.beePositions} beesAnimating={bees.beesAnimating}
        beeStaticAnimation={BEE_STATIC_ANIMATION} beeActiveAnimation={BEE_ACTIVE_ANIMATION}
        onToggleFavorite={() => void wordActions.toggleFavorite()}
        onWordPress={() => void wordActions.speakWord()}
        onExampleSentencePress={() => void wordActions.speakExample()}
        onMoreExamplePress={() => {
          const word = session.currentWord;
          if (!word) return;
          if (tutorial.tutorialStep === 6) void tutorial.complete();
          navigation.navigate('ExampleSentences', { ...word, pronunciation: word.pronunciation ?? null });
        }} />
      {shouldShowAds && <View style={[styles.banner, { backgroundColor: colors.background, paddingBottom: insets.bottom > 0 ? 0 : 10 }]}>
        <SafeBannerAd unitId={facade.getBannerAdUnitId()} />
      </View>}
      <HomeTutorialSection showTutorial={tutorial.showTutorial} tutorialLayouts={tutorial.tutorialLayouts}
        tutorialStep={tutorial.tutorialStep} currentWord={session.currentWord}
        isCurrentWordFavorite={wordActions.isFavorite} colors={colors} isDarkMode={isDarkMode} t={t}
        onToggleFavorite={() => void wordActions.toggleFavorite()} onWordPress={() => void wordActions.speakWord()}
        onExampleSentencePress={() => void wordActions.speakExample()}
        onMoreExamplePress={() => {
          if (tutorial.tutorialStep === 6) void tutorial.complete();
          navigation.navigate('ExampleSentences', { ...session.currentWord!, pronunciation: session.currentWord!.pronunciation ?? null });
        }}
        onTutorialComplete={() => void tutorial.complete()}
        onTutorialNext={() => tutorial.tutorialStep < 6
          ? tutorial.setTutorialStep(tutorial.tutorialStep + 1)
          : void tutorial.complete()} />
      <HomeModals streakCelebrationVisible={celebration !== null} streakCelebrationKey={celebration?.id ?? 0}
        streakCelebrationCount={celebration?.count ?? 0} streakCelebrationLabel={celebration?.label ?? ''}
        streakCelebrationMessage={celebration?.message ?? ''}
        onStreakCelebrationComplete={() => {
          setCelebration(null);
          if (pendingInterstitialRef.current) {
            pendingInterstitialRef.current = false;
            if (shouldShowAds) void facade.showInterstitial();
          }
        }}
        reviewPromptVisible={reviewPromptVisible}
        onReviewPromptDismiss={async () => { setReviewPromptVisible(false); await facade.dismissReviewPrompt(); }}
        onReviewRateInStore={async rating => {
          setReviewPromptVisible(false);
          await facade.recordSatisfactionRating(rating);
          const result = await facade.openStoreReviewPage('automatic-rating-prompt');
          if (!result.opened) showAlert({ title: t('common.error'), message: t('reviewPrompt.storeOpenError') });
        }}
        onReviewSendFeedback={async rating => {
          setReviewPromptVisible(false);
          await facade.recordSatisfactionRating(rating ?? 0);
          if (!(await facade.openReviewFeedbackEmail(rating))) {
            showAlert({ title: t('common.error'), message: t('reviewPrompt.feedbackOpenError') });
          }
        }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stats: { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  banner: { alignItems: 'center', justifyContent: 'center' },
});
