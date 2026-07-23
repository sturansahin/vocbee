import React from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type PanResponderInstance,
} from 'react-native';
import LottieView from 'lottie-react-native';
import type { VocabularyWord } from '@features/vocabulary';
import { useResponsiveLayout } from '@shared/responsive';
import { FavoriteStarIcon } from './FavoriteStarIcon';
import { homeWordCardStyles as styles } from './homeWordCardStyles';
import { VocabularyCardBackground } from './VocabularyCardBackground';
import { VocabularyCardHeader } from './VocabularyCardHeader';

export interface HomeBeePosition {
  id: number;
  x: number;
  y: number;
  translateX: Animated.Value;
  translateY: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
}

export interface HomeWordCardSectionProps {
  colors: {
    textPrimary: string;
    textSecondary: string;
    accent: string;
    surface: string;
    borderDefault: string;
    shadow: string;
    swipeSkip: string;
    swipeSkipSoft: string;
    swipeLearn: string;
    swipeLearnSoft: string;
  };
  isDarkMode: boolean;
  t: (key: string) => string;
  currentWord: VocabularyWord | undefined;
  nextWord: VocabularyWord | undefined;
  wordsLength: number;
  showTutorial: boolean;
  tutorialStep: number;
  isCurrentWordFavorite: boolean;
  cardRef: React.Ref<any>;
  favoriteRef: React.Ref<any>;
  wordRef: React.Ref<View>;
  exampleSentenceRef: React.Ref<View>;
  moreExampleRef: React.Ref<any>;
  position: Animated.ValueXY;
  rotate: Animated.AnimatedInterpolation<string>;
  panHandlers: PanResponderInstance['panHandlers'];
  beePositions: HomeBeePosition[];
  beesAnimating: boolean;
  beeStaticAnimation: any;
  beeActiveAnimation: any;
  onToggleFavorite: () => void;
  onWordPress: () => void;
  onExampleSentencePress: () => void;
  onMoreExamplePress: () => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function HomeWordCardSection({
  colors,
  isDarkMode,
  t,
  currentWord,
  nextWord,
  wordsLength,
  showTutorial,
  tutorialStep,
  isCurrentWordFavorite,
  cardRef,
  favoriteRef,
  wordRef,
  exampleSentenceRef,
  moreExampleRef,
  position,
  rotate,
  panHandlers,
  beePositions,
  beesAnimating,
  beeStaticAnimation,
  beeActiveAnimation,
  onToggleFavorite,
  onWordPress,
  onExampleSentencePress,
  onMoreExamplePress,
}: HomeWordCardSectionProps) {
  const { width, height, orientation, contentMaxWidth, horizontalGutter, isSmallHeight } =
    useResponsiveLayout();
  const deckWidth = Math.max(280, Math.min(560, contentMaxWidth, width - horizontalGutter * 2));
  const deckHeight =
    orientation === 'landscape'
      ? clamp(height * 0.54, 220, 360)
      : clamp(height * (isSmallHeight ? 0.44 : 0.48), 300, 480);
  const cardSize = { width: deckWidth, height: deckHeight };
  const swipeThreshold = deckWidth * 0.25;

  return (
    <View style={styles.cardArea}>
      <View style={[styles.cardStackContainer, cardSize]}>
        <VocabularyCardBackground
          word={nextWord}
          wordsLength={wordsLength}
          cardStyle={cardSize}
          colors={colors}
          isDarkMode={isDarkMode}
          moreExampleLabel={t('home.moreExample')}
        />

        {currentWord && (
          <Animated.View
            key={currentWord.id}
            testID="home-word-card"
            ref={cardRef}
            collapsable={false}
            style={[
              styles.cardContainer,
              cardSize,
              {
                transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }],
                zIndex: showTutorial && tutorialStep <= 2 ? 10000 : 10,
              },
            ]}
            {...panHandlers}
          >
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderDefault,
                  borderWidth: 0.5,
                  shadowColor: colors.accent,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.5,
                  shadowRadius: 20,
                  elevation: 15,
                },
              ]}
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.swipeOverlay,
                  {
                    backgroundColor: colors.swipeSkipSoft,
                    opacity: position.x.interpolate({
                      inputRange: [-swipeThreshold, 0],
                      outputRange: [1, 0],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              >
                <Text style={[styles.skipText, { color: colors.swipeSkip }]}>{t('home.skip')}</Text>
              </Animated.View>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.swipeOverlay,
                  {
                    backgroundColor: colors.swipeLearnSoft,
                    opacity: position.x.interpolate({
                      inputRange: [0, swipeThreshold],
                      outputRange: [0, 1],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              >
                <Text style={[styles.learnedText, { color: colors.swipeLearn }]}>
                  {t('home.learned')}
                </Text>
              </Animated.View>

              <View style={styles.cardContentAbove} pointerEvents="box-none">
                <TouchableOpacity
                  ref={favoriteRef}
                  testID="home-favorite-action"
                  accessibilityLabel={t('home.favorites')}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isCurrentWordFavorite }}
                  style={[
                    styles.favoriteButton,
                    { zIndex: showTutorial && tutorialStep === 3 ? 100 : 1 },
                  ]}
                  onPress={onToggleFavorite}
                  activeOpacity={0.7}
                >
                  <FavoriteStarIcon
                    color={colors.accent}
                    filled={isCurrentWordFavorite}
                    size={24}
                  />
                </TouchableOpacity>

                <VocabularyCardHeader
                  style={styles.cardUpperSection}
                  word={currentWord.word}
                  pronunciation={currentWord.pronunciation}
                  translation={currentWord.translation}
                  wordColor={colors.textPrimary}
                  pronunciationColor={colors.textSecondary}
                  translationColor={colors.accent}
                  wordContainerRef={wordRef}
                  wordContainerStyle={{ zIndex: showTutorial && tutorialStep === 4 ? 100 : 1 }}
                  onPressWord={onWordPress}
                />

                <View
                  style={[
                    styles.cardLowerSectionStruct,
                    { zIndex: showTutorial && tutorialStep >= 5 ? 100 : 1 },
                  ]}
                >
                  <View
                    style={[
                      StyleSheet.absoluteFillObject,
                      {
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                        borderBottomLeftRadius: 32,
                        borderBottomRightRadius: 32,
                      },
                    ]}
                  />
                  <View style={styles.exampleSentencesContainer}>
                    <View
                      ref={exampleSentenceRef}
                      collapsable={false}
                      style={localStyles.measuredContent}
                    >
                      <TouchableOpacity
                        testID="home-example-speech-action"
                        accessibilityLabel={currentWord.sentence1}
                        accessibilityRole="button"
                        onPress={onExampleSentencePress}
                        activeOpacity={0.75}
                        style={styles.exampleSentenceTouchable}
                      >
                        <Text style={[styles.cardExampleText, { color: colors.textPrimary }]}>
                          {currentWord.sentence1}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={[styles.thinDivider, { backgroundColor: colors.borderDefault }]} />
                    <Text style={[styles.cardTranslationText, { color: colors.textSecondary }]}>
                      {currentWord.nativeSentence1}
                    </Text>
                  </View>
                  <TouchableOpacity
                    ref={moreExampleRef}
                    testID="home-more-examples-action"
                    accessibilityLabel={t('home.moreExample')}
                    accessibilityRole="button"
                    style={[
                      styles.fullWidthButton,
                      {
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        zIndex: showTutorial && tutorialStep === 6 ? 100 : 1,
                      },
                    ]}
                    onPress={onMoreExamplePress}
                  >
                    <Text style={[styles.fullWidthButtonText, { color: colors.textPrimary }]}>
                      {t('home.moreExample')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {beePositions.map((bee) => (
              <Animated.View
                key={bee.id}
                pointerEvents="none"
                style={[
                  styles.bee,
                  {
                    left: Math.min(bee.x, deckWidth - 50),
                    top: bee.y,
                    transform: [
                      { translateX: bee.translateX },
                      { translateY: bee.translateY },
                      {
                        rotate: bee.rotation.interpolate({
                          inputRange: [-360, 360],
                          outputRange: ['-360deg', '360deg'],
                        }),
                      },
                      { scale: bee.scale },
                    ],
                    opacity: bee.opacity,
                  },
                ]}
              >
                <LottieView
                  key={`${bee.id}-${beesAnimating ? 'animated' : 'static'}`}
                  source={beesAnimating ? beeActiveAnimation : beeStaticAnimation}
                  style={styles.beeAnim}
                  autoPlay={beesAnimating}
                  loop={beesAnimating}
                  speed={1.5}
                />
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  measuredContent: {
    width: '100%',
  },
});

export default HomeWordCardSection;
