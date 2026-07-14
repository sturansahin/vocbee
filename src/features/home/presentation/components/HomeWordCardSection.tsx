// src/features/home/presentation/components/HomeWordCardSection.tsx
// Pure presentational extraction of the card-stack area (background card + swipeable top card +
// bee animation layer) from screens/HomeScreen.tsx (ADIM 2, UI-only extraction —
// docs/refactor-v2/25). VERBATIM JSX/styles — every prop below is exactly the value/handler/ref
// HomeScreen already owned; nothing here computes state, calls services, or touches
// AsyncStorage/Firebase. PanResponder, Animated.Value instances, and all callbacks are created and
// owned by HomeScreen and passed down; this component only renders them.

import React from 'react';
import {
    Animated,
    PanResponderInstance,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { VocabularyCardHeader } from '../../../../../components/VocabularyCardHeader';
import type { VocabularyWord } from '@features/vocabulary';
import { FavoriteStarIcon } from './FavoriteStarIcon';
import { homeWordCardStyles as styles } from './homeWordCardStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

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
        text: string;
        textSecondary: string;
        primary: string;
        surface: string;
        border: string;
    };
    isDarkMode: boolean;
    t: (key: string) => string;

    currentWord: VocabularyWord | undefined;
    nextWord: VocabularyWord | undefined;
    wordsLength: number;

    // Tutorial state (read-only here; HomeScreen owns the mutable state)
    showTutorial: boolean;
    tutorialStep: number;
    isCurrentWordFavorite: boolean;

    // Refs for tutorial element measurement — owned by HomeScreen, forwarded for layout capture.
    cardRef: React.Ref<any>;
    favoriteRef: React.Ref<any>;
    wordRef: React.Ref<View>;
    exampleSentenceRef: React.Ref<View>;
    moreExampleRef: React.Ref<any>;

    // Animated swipe position + derived rotation — owned by HomeScreen.
    position: Animated.ValueXY;
    rotate: Animated.AnimatedInterpolation<string>;
    panHandlers: PanResponderInstance['panHandlers'];

    // Bee animation state — owned by HomeScreen.
    beePositions: HomeBeePosition[];
    beesAnimating: boolean;
    /** Lottie source data (createSwarmAnimation() output) — untyped upstream, same as original inline usage. */
    beeStaticAnimation: any;
    beeActiveAnimation: any;

    // Handlers — all defined and owned by HomeScreen; this component only wires them to touch targets.
    onToggleFavorite: () => void;
    onWordPress: () => void;
    onExampleSentencePress: () => void;
    onMoreExamplePress: () => void;
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
    const renderBackgroundCard = () => {
        if (!nextWord || wordsLength <= 1) return null;

        return (
            <View
                style={[
                    styles.cardContainer,
                    {
                        transform: [
                            { scale: 0.95 },
                            { translateY: 12 },
                        ],
                        zIndex: 5,
                        opacity: 0.8,
                    },
                ]}
            >
                <View style={[
                    styles.heroCard,
                    {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderWidth: 1,
                    }
                ]}>
                    <View style={styles.cardContentAbove}>
                        <View style={styles.favoriteButton}>
                            <View style={{ width: 26, height: 26, justifyContent: 'center', alignItems: 'center' }}>
                                <FavoriteStarIcon color={colors.primary} size={24} />
                            </View>
                        </View>
                        <VocabularyCardHeader
                            style={styles.cardUpperSection}
                            word={nextWord.word}
                            pronunciation={nextWord.pronunciation}
                            translation={nextWord.translation}
                            wordColor={colors.text}
                            pronunciationColor={colors.textSecondary}
                            translationColor={colors.primary}
                        />

                        <View style={[styles.cardLowerSectionStruct, { zIndex: 1 }]}>
                            <View style={[
                                StyleSheet.absoluteFillObject,
                                {
                                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                    borderBottomLeftRadius: 32,
                                    borderBottomRightRadius: 32,
                                }
                            ]} />

                            <View style={styles.exampleSentencesContainer}>
                                <View style={styles.exampleSentenceTouchable}>
                                    <Text style={[styles.cardExampleText, { color: colors.text }]}>
                                        {nextWord.sentence1}
                                    </Text>
                                </View>
                                <View style={[styles.thinDivider, { backgroundColor: colors.border }]} />
                                <Text style={[styles.cardTranslationText, { color: colors.textSecondary }]}>
                                    {nextWord.nativeSentence1}
                                </Text>
                            </View>

                            <View style={[styles.fullWidthButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                                <Text style={[styles.fullWidthButtonText, { color: colors.text }]}>{t('home.moreExample')}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.cardArea}>
            <View style={styles.cardStackContainer}>
                {renderBackgroundCard()}

                {currentWord && (
                    <Animated.View
                        key={currentWord.id}
                        testID="home-word-card"
                        ref={cardRef}
                        collapsable={false}
                        style={[
                            styles.cardContainer,
                            {
                                transform: [
                                    { translateX: position.x },
                                    { translateY: position.y },
                                    { rotate },
                                ],
                                zIndex: (showTutorial && tutorialStep <= 2) ? 10000 : 10,
                            },
                        ]}
                        {...panHandlers}
                    >
                        <View style={[
                            styles.heroCard,
                            {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                                borderWidth: 0.5,
                                shadowColor: '#FFD700',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.5,
                                shadowRadius: 20,
                                elevation: 15,
                            }
                        ]}>
                            <Animated.View
                                style={[
                                    styles.swipeOverlay,
                                    {
                                        backgroundColor: isDarkMode ? '#5c2a2a' : '#ffddddff',
                                        opacity: position.x.interpolate({
                                            inputRange: [-SWIPE_THRESHOLD, 0],
                                            outputRange: [1, 0],
                                            extrapolate: 'clamp',
                                        }),
                                    },
                                ]}
                            >
                                <View style={styles.swipeLabelContainer}>
                                    <Text style={[styles.skipText, { color: isDarkMode ? '#ff8a8a' : '#ff6b6bff' }]}>{t('home.skip')}</Text>
                                </View>
                            </Animated.View>

                            <Animated.View
                                style={[
                                    styles.swipeOverlay,
                                    {
                                        backgroundColor: isDarkMode ? '#2a5c3a' : '#ddffddff',
                                        opacity: position.x.interpolate({
                                            inputRange: [0, SWIPE_THRESHOLD],
                                            outputRange: [0, 1],
                                            extrapolate: 'clamp',
                                        }),
                                    },
                                ]}
                            >
                                <View style={styles.swipeLabelContainer}>
                                    <Text style={[styles.learnedText, { color: isDarkMode ? '#8aff8a' : '#6bff6bff' }]}>{t('home.learned')}</Text>
                                </View>
                            </Animated.View>

                            <View style={styles.cardContentAbove} pointerEvents="box-none">
                                <TouchableOpacity
                                    ref={favoriteRef}
                                    testID="home-favorite-action"
                                    accessibilityRole="button"
                                    style={[styles.favoriteButton, { zIndex: (showTutorial && tutorialStep === 3) ? 100 : 1 }]}
                                    onPress={onToggleFavorite}
                                    activeOpacity={0.7}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <View style={{ width: 26, height: 26, justifyContent: 'center', alignItems: 'center' }}>
                                        <FavoriteStarIcon
                                            color={colors.primary}
                                            filled={isCurrentWordFavorite}
                                            size={24}
                                        />
                                    </View>
                                </TouchableOpacity>

                                <VocabularyCardHeader
                                    style={styles.cardUpperSection}
                                    word={currentWord.word}
                                    pronunciation={currentWord.pronunciation}
                                    translation={currentWord.translation}
                                    wordColor={colors.text}
                                    pronunciationColor={colors.textSecondary}
                                    translationColor={colors.primary}
                                    wordContainerRef={wordRef}
                                    wordContainerStyle={{ zIndex: (showTutorial && tutorialStep === 4) ? 100 : 1 }}
                                    onPressWord={onWordPress}
                                />

                                <View style={[styles.cardLowerSectionStruct, { zIndex: (showTutorial && tutorialStep >= 5) ? 100 : 1 }]}>
                                    <View style={[
                                        StyleSheet.absoluteFillObject,
                                        {
                                            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                            borderBottomLeftRadius: 32,
                                            borderBottomRightRadius: 32,
                                        }
                                    ]} />

                                    <View style={styles.exampleSentencesContainer}>
                                        <View
                                            ref={exampleSentenceRef}
                                            collapsable={false}
                                            style={{ width: '100%', zIndex: (showTutorial && tutorialStep === 5) ? 100 : 1 }}
                                        >
                                            <TouchableOpacity
                                                testID="home-example-speech-action"
                                                accessibilityRole="button"
                                                onPress={onExampleSentencePress}
                                                activeOpacity={0.75}
                                                style={styles.exampleSentenceTouchable}
                                            >
                                                <Text style={[styles.cardExampleText, { color: colors.text }]}>
                                                    {currentWord.sentence1}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>

                                        <View style={[styles.thinDivider, { backgroundColor: colors.border }]} />

                                        <Text style={[styles.cardTranslationText, { color: colors.textSecondary }]}>
                                            {currentWord.nativeSentence1}
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        ref={moreExampleRef}
                                        testID="home-more-examples-action"
                                        accessibilityRole="button"
                                        style={[styles.fullWidthButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', zIndex: (showTutorial && tutorialStep === 6) ? 100 : 1 }]}
                                        onPress={onMoreExamplePress}
                                    >
                                        <Text style={[styles.fullWidthButtonText, { color: colors.text }]}>{t('home.moreExample')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {beePositions.map((bee) => (
                            <Animated.View
                                key={bee.id}
                                style={[
                                    styles.bee,
                                    {
                                        left: bee.x,
                                        top: bee.y,
                                        transform: [
                                            { translateX: bee.translateX },
                                            { translateY: bee.translateY },
                                            {
                                                rotate: bee.rotation.interpolate({
                                                    inputRange: [-360, 360],
                                                    outputRange: ['-360deg', '360deg'],
                                                })
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
                                    loop={true}
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

export default HomeWordCardSection;
