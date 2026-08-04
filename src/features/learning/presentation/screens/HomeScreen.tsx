import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import {
  HomeHeader,
  HomeModals,
  HomeProgressSection,
  HomeTutorialSection,
  HomeWordCardSection,
} from '@features/home';
import {
  getStreakStatusMessageKey,
  getStreakSummaryFromState,
  StreakAlertContent,
} from '@features/streak';
import { SafeBannerAd, useMonetization } from '@features/monetization';
import { launchGameSession } from '@features/game';
import { useReducedMotion, useResponsiveLayout } from '@shared/responsive';
import { useTheme } from '@shared/theme';
import { Screen, useAlert } from '@shared/ui';
import type { RootStackParamList } from '@app/navigation/types';
import { createSwarmAnimation } from '../../../../../assets/animations/swarmAnimation';
import type { HomeFacade } from '../../application/contracts';
import { getLearningSpeechLanguage, getTutorialSwipeNextStep } from '../../domain/rules';
import { HomeEmptyState, HomeErrorState, HomeLoadingState } from '../components/HomeScreenStates';
import { useBeeAnimation } from '../hooks/useBeeAnimation';
import { useHomeEngagementFlow } from '../hooks/useHomeEngagementFlow';
import { useLearningSession } from '../hooks/useLearningSession';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { useTutorialOverlay } from '../hooks/useTutorialOverlay';
import { useWordActions } from '../hooks/useWordActions';

export { getTutorialSwipeNextStep };

const BEE_COLOR: [number, number, number, number] = [1, 0.78, 0.08, 1];
const BEE_STATIC_ANIMATION = createSwarmAnimation(BEE_COLOR, true);
const BEE_ACTIVE_ANIMATION = createSwarmAnimation(BEE_COLOR, false);

export interface HomeScreenProps {
  facade: HomeFacade;
}

export default function HomeScreen({ facade }: HomeScreenProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { colors, isDarkMode } = useTheme();
  const layout = useResponsiveLayout();
  const reducedMotion = useReducedMotion();
  const { isAdFree, isLoading: monetizationLoading } = useMonetization();
  const { showAlert } = useAlert();
  const { t } = useTranslation();
  const session = useLearningSession(facade);
  const tutorial = useTutorialOverlay(
    facade,
    session.loadState === 'ready' && session.words.length > 0,
    session.currentWordIndex,
    `${layout.width}x${layout.height}`,
  );
  const shouldShowAds = !isAdFree && !monetizationLoading;
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
  const engagement = useHomeEngagementFlow({
    facade,
    shouldShowAds,
    isTutorialVisible: tutorial.showTutorialRef,
    t,
    showAlert,
  });
  const bees = useBeeAnimation(
    session.loadState === 'ready' && session.words.length > 0,
    layout.width,
    reducedMotion,
    session.currentWord?.id,
  );

  const handleGamePress = useCallback(() => {
    void launchGameSession().catch(() =>
      showAlert({ title: t('common.error'), message: t('game.launchError') }),
    );
  }, [showAlert, t]);

  const handleSwipe = useCallback(
    async (direction: 'left' | 'right') => {
      const word = session.currentWord;
      if (!word) return;
      const wasLastWord = session.currentWordIndex >= session.words.length - 1;
      bees.animateAway();
      if (!wasLastWord) session.setCurrentWordIndex((index) => index + 1);

      if (direction === 'right') {
        const nextLearnedCount = session.learnedCount + 1;
        session.setLearnedCount((count) => count + 1);
        const result = await facade.completeWord(session.currentLevel, word.id);
        session.setStreakSummary(getStreakSummaryFromState(result.streakState));
        const engagementBusy = await engagement.recordLearnedWord(result);
        if (result.level !== session.currentLevel) {
          session.setCurrentLevel(result.level);
          await session.load(true);
          return;
        }
        await engagement.maybeShowReview(nextLearnedCount, engagementBusy);
      }

      const nextIndex = session.currentWordIndex + 1;
      if (nextIndex < session.words.length)
        await facade.saveLastWordId(session.words[nextIndex].id);
      if (wasLastWord) {
        await facade.saveLastWordId(0);
        await session.load(true);
      }
    },
    [bees, engagement, facade, session],
  );

  const swipe = useSwipeGesture({
    viewportWidth: layout.width,
    reducedMotion,
    tutorialVisibleRef: tutorial.showTutorialRef,
    tutorialStepRef: tutorial.tutorialStepRef,
    tutorialVisible: tutorial.showTutorial,
    tutorialStep: tutorial.tutorialStep,
    setTutorialStep: tutorial.setTutorialStep,
    onSwipe: handleSwipe,
  });

  const levelDescription = t(
    `level.${
      ['beginner', 'intermediate', 'advanced'].includes(session.userLevel)
        ? session.userLevel
        : 'beginner'
    }`,
  );
  const header = (
    <HomeHeader
      titleColor={colors.textPrimary}
      iconColor={colors.textPrimary}
      streakCount={session.streakSummary.currentStreak}
      streakCompletedToday={session.streakSummary.completedToday}
      streakAtRisk={session.streakSummary.atRisk}
      streakTextColor={session.streakSummary.completedToday ? colors.streak : colors.textPrimary}
      streakAccentColor={colors.streak}
      streakAccessibilityLabel={t('home.streakAccessibilityLabel', {
        count: session.streakSummary.currentStreak,
      })}
      gameAccessibilityLabel={t('game.open')}
      favoritesAccessibilityLabel={t('home.favorites')}
      settingsAccessibilityLabel={t('home.settings')}
      onPressStreak={() =>
        showAlert({
          title: t('home.streakTitle'),
          content: (
            <StreakAlertContent
              statusMessage={t(getStreakStatusMessageKey(session.streakSummary.status))}
              currentLabel={t('home.currentStreakLabel')}
              bestLabel={t('home.bestStreakLabel')}
              currentValue={session.streakSummary.currentStreak}
              bestValue={session.streakSummary.longestStreak}
            />
          ),
        })
      }
      onPressGame={handleGamePress}
      onPressFavorites={() => navigation.navigate('Favorites')}
      onPressSettings={() => navigation.navigate('Settings')}
    />
  );

  if (session.loadState === 'loading') {
    return (
      <HomeLoadingState
        colors={colors}
        isDarkMode={isDarkMode}
        showBannerPlaceholder={shouldShowAds}
        levelCode={session.currentLevel}
        levelDescription={levelDescription}
        wordsLabel={t('home.words')}
      />
    );
  }
  if (session.loadState === 'error') {
    return (
      <HomeErrorState
        colors={colors}
        title={t('common.error')}
        description={t('home.setupRequired')}
        retryLabel={t('common.retry', { defaultValue: 'Retry' })}
        onRetry={session.retry}
      />
    );
  }
  if (session.words.length === 0) {
    return (
      <HomeEmptyState
        colors={colors}
        header={header}
        title={session.totalCount > 0 ? t('home.levelComplete') : t('home.noVocabulary')}
        description={
          session.totalCount > 0
            ? t('home.levelCompleteDesc', {
                count: session.totalCount,
                level: session.currentLevel,
              })
            : t('home.setupRequired')
        }
      />
    );
  }

  const progress = session.totalCount > 0 ? (session.learnedCount / session.totalCount) * 100 : 0;
  const surfaceStyle = [
    styles.stats,
    {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.borderDefault,
      marginHorizontal: layout.horizontalGutter,
    },
  ];

  return (
    <Screen testID="home-ready" constrainWidth={false} contentStyle={styles.container}>
      <View
        ref={tutorial.rootRef}
        collapsable={false}
        onLayout={tutorial.onRootLayout}
        style={styles.tutorialRoot}
      >
        {header}
        <View style={surfaceStyle}>
          <HomeProgressSection
            isLoading={false}
            isDarkMode={isDarkMode}
            textColor={colors.textPrimary}
            textSecondaryColor={colors.textSecondary}
            primaryColor={colors.accent}
            surfaceLightColor={colors.surfaceMuted}
            borderColor={colors.borderDefault}
            initialLoadingPlaceholderColor="transparent"
            initialLoadingAccentColor="transparent"
            levelCode={session.currentLevel}
            levelDescription={levelDescription}
            learnedCount={session.learnedCount}
            totalCount={session.totalCount}
            wordsLabel={t('home.words')}
            progressPercentage={progress}
          />
        </View>
        <HomeWordCardSection
          colors={colors}
          isDarkMode={isDarkMode}
          t={t}
          currentWord={session.currentWord}
          nextWord={session.nextWord}
          wordsLength={session.words.length}
          isCurrentWordFavorite={wordActions.isFavorite}
          {...tutorial.refs}
          position={swipe.position}
          rotate={swipe.rotate}
          panHandlers={swipe.panHandlers}
          beePositions={bees.beePositions}
          beesAnimating={bees.beesAnimating}
          beeStaticAnimation={BEE_STATIC_ANIMATION}
          beeActiveAnimation={BEE_ACTIVE_ANIMATION}
          onToggleFavorite={() => void wordActions.toggleFavorite()}
          onWordPress={() => void wordActions.speakWord()}
          onExampleSentencePress={() => void wordActions.speakExample()}
          onMoreExamplePress={() => {
            const word = session.currentWord;
            if (!word) return;
            if (tutorial.tutorialStep === 6) void tutorial.complete();
            navigation.navigate('ExampleSentences', {
              ...word,
              pronunciation: word.pronunciation ?? null,
            });
          }}
          onCardLayout={tutorial.onCardLayout}
        />
        {shouldShowAds && (
          <View style={[styles.banner, { backgroundColor: colors.background }]}>
            <SafeBannerAd unitId={facade.getBannerAdUnitId()} />
          </View>
        )}
        <HomeTutorialSection
          showTutorial={tutorial.showTutorial}
          tutorialLayouts={tutorial.tutorialLayouts}
          tutorialStep={tutorial.tutorialStep}
          onTutorialComplete={() => void tutorial.complete()}
          onTutorialNext={() =>
            tutorial.tutorialStep < 6
              ? tutorial.setTutorialStep(tutorial.tutorialStep + 1)
              : void tutorial.complete()
          }
        />
        <HomeModals
          streakCelebrationVisible={engagement.celebration !== null}
          streakCelebrationKey={engagement.celebration?.id ?? 0}
          streakCelebrationCount={engagement.celebration?.count ?? 0}
          streakCelebrationLabel={engagement.celebration?.label ?? ''}
          streakCelebrationMessage={engagement.celebration?.message ?? ''}
          onStreakCelebrationComplete={engagement.completeCelebration}
          reviewPromptVisible={engagement.reviewPromptVisible}
          onReviewPromptDismiss={engagement.dismissReview}
          onReviewRateInStore={engagement.rateInStore}
          onReviewSendFeedback={engagement.sendFeedback}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tutorialRoot: { flex: 1 },
  stats: {
    alignSelf: 'stretch',
    flexGrow: 0,
    flexShrink: 0,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  banner: { alignItems: 'center', justifyContent: 'center' },
});
