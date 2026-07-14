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
import { FONT_FAMILY } from '../../../../../utils/typography';
import { VocabularyCardHeader } from '../../../../../components/VocabularyCardHeader';
import type { VocabularyWord } from '@features/vocabulary';
import { FavoriteStarIcon } from './FavoriteStarIcon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const BASE_WIDTH = 393; // matches original HomeScreen constant verbatim
const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;

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

const styles = StyleSheet.create({
    cardArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardStackContainer: {
        width: SCREEN_WIDTH - 40,
        height: SCREEN_HEIGHT * 0.55,
        position: 'relative',
    },
    cardContainer: {
        position: 'absolute',
        width: SCREEN_WIDTH - 40,
        height: SCREEN_HEIGHT * 0.55,
    },
    heroCard: {
        flex: 1,
        borderRadius: 32,
        padding: 0,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    cardContentAbove: {
        flex: 1,
        width: '100%',
        justifyContent: 'space-between',
        zIndex: 200,
    },
    favoriteButton: {
        position: 'absolute',
        top: scale(16),
        left: scale(16),
        width: scale(40),
        height: scale(40),
        borderRadius: scale(20),
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
    },
    swipeOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    swipeLabelContainer: {
        alignItems: 'center',
        gap: 8,
    },
    skipText: {
        fontFamily: FONT_FAMILY,
        color: '#ea8484ff',
        fontSize: 20,
        letterSpacing: 4,
    },
    learnedText: {
        fontFamily: FONT_FAMILY,
        color: '#35de5dff',
        fontSize: 20,
        letterSpacing: 4,
    },
    cardUpperSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 10,
    },
    cardLowerSectionStruct: {
        width: '100%',
        paddingTop: 20,
        paddingHorizontal: 0,
        alignItems: 'center',
    },
    exampleSentencesContainer: {
        width: '100%',
        paddingHorizontal: 20,
        paddingBottom: 12,
        alignItems: 'center',
    },
    exampleSentenceTouchable: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardExampleText: {
        fontFamily: FONT_FAMILY,
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    thinDivider: {
        height: 1,
        width: '100%',
        marginVertical: 10,
        opacity: 0.5,
    },
    cardTranslationText: {
        fontFamily: FONT_FAMILY,
        fontSize: 14,
        fontStyle: 'italic',
        lineHeight: 20,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    fullWidthButton: {
        width: '100%',
        paddingVertical: 18,
        paddingHorizontal: 0,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    fullWidthButtonText: {
        fontFamily: FONT_FAMILY,
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    bee: {
        position: 'absolute',
        width: 50,
        height: 50,
        zIndex: 300,
    },
    beeAnim: {
        width: 50,
        height: 50,
    },
});

export default HomeWordCardSection;
