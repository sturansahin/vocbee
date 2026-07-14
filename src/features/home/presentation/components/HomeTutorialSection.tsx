// src/features/home/presentation/components/HomeTutorialSection.tsx
// Pure presentational extraction of the tutorial highlight renderer + overlay wrapper from
// screens/HomeScreen.tsx (ADIM 2, UI-only extraction — docs/refactor-v2/25). VERBATIM JSX/styles:
// `renderTutorialHighlight` (steps 3-6 floating highlight clones) and the `HomeTutorialOverlay`
// wrapper (absolute-fill container + step-advance callback wiring). All step/word state and
// handlers (favorite toggle, word press, example press, more-example press, tutorial
// complete/advance) are owned by HomeScreen and passed in as props — no logic lives here.

import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HomeTutorialOverlay, { LayoutRect } from '../../../../../components/HomeTutorialOverlay';
import type { VocabularyWord } from '@features/vocabulary';
import { FavoriteStarIcon } from './FavoriteStarIcon';
import { FONT_FAMILY } from '../../../../../utils/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 393; // matches original HomeScreen constant verbatim
const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

type TutorialLayoutKey = 'card' | 'favoriteButton' | 'word' | 'exampleSentence' | 'moreExample';
type TutorialLayouts = Record<TutorialLayoutKey, LayoutRect>;

export interface HomeTutorialSectionProps {
    showTutorial: boolean;
    tutorialLayouts: TutorialLayouts | null;
    tutorialStep: number;
    currentWord: VocabularyWord | undefined;
    isCurrentWordFavorite: boolean;
    colors: {
        text: string;
        primary: string;
    };
    isDarkMode: boolean;
    t: (key: string) => string;

    onToggleFavorite: () => void;
    onWordPress: () => void;
    onExampleSentencePress: () => void;
    onMoreExamplePress: () => void;
    onTutorialComplete: () => void;
    onTutorialNext: () => void;
}

export function HomeTutorialSection({
    showTutorial,
    tutorialLayouts,
    tutorialStep,
    currentWord,
    isCurrentWordFavorite,
    colors,
    isDarkMode,
    t,
    onToggleFavorite,
    onWordPress,
    onExampleSentencePress,
    onMoreExamplePress,
    onTutorialComplete,
    onTutorialNext,
}: HomeTutorialSectionProps) {
    if (!showTutorial || !tutorialLayouts) {
        return null;
    }

    const renderTutorialHighlight = (targetLayout: LayoutRect, step: number) => {
        if (!currentWord) return null;

        const absoluteHighlightStyle = {
            position: 'absolute' as const,
            left: targetLayout.x,
            top: targetLayout.y,
            width: targetLayout.width,
            height: targetLayout.height,
            zIndex: 9101,
        };

        if (step === 3) {
            return (
                <TouchableOpacity
                    style={[absoluteHighlightStyle, styles.tutorialIconHighlight]}
                    onPress={onToggleFavorite}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <View style={{ width: 26, height: 26, justifyContent: 'center', alignItems: 'center' }}>
                        <FavoriteStarIcon
                            color={colors.primary}
                            filled={isCurrentWordFavorite}
                            size={24}
                            style={styles.tutorialIconGlow}
                        />
                    </View>
                </TouchableOpacity>
            );
        }

        if (step === 4) {
            return (
                <View style={[absoluteHighlightStyle, styles.tutorialWordHighlight]}>
                    <TouchableOpacity onPress={onWordPress} activeOpacity={0.7} style={styles.tutorialWordTouchable}>
                        <Text
                            style={[styles.wordTitle, { color: colors.text }, styles.tutorialWordText]}
                            adjustsFontSizeToFit
                            numberOfLines={1}
                        >
                            {currentWord.word}
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (step === 5) {
            return (
                <View style={[absoluteHighlightStyle, styles.tutorialSentenceHighlight]}>
                    <TouchableOpacity onPress={onExampleSentencePress} activeOpacity={0.7} style={styles.tutorialSentenceTouchable}>
                        <Text style={[styles.cardExampleText, { color: colors.text }, styles.tutorialSentenceText]}>
                            {currentWord.sentence1}
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (step === 6) {
            return (
                <TouchableOpacity
                    style={[
                        absoluteHighlightStyle,
                        styles.tutorialRaisedButton,
                        styles.tutorialMoreExampleButton,
                        { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }
                    ]}
                    onPress={onMoreExamplePress}
                    activeOpacity={0.85}
                >
                    <Text style={[styles.fullWidthButtonText, { color: colors.text }]}>{t('home.moreExample')}</Text>
                </TouchableOpacity>
            );
        }

        return null;
    };

    return (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9000 }]} pointerEvents="box-none">
            <HomeTutorialOverlay
                visible={showTutorial}
                onComplete={onTutorialComplete}
                currentStep={tutorialStep}
                renderHighlight={renderTutorialHighlight}
                onNext={onTutorialNext}
                layouts={tutorialLayouts}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wordTitle: {
        fontFamily: FONT_FAMILY,
        fontSize: moderateScale(36),
        marginBottom: scale(4),
        letterSpacing: 1,
        textAlign: 'center',
        paddingHorizontal: 40,
        maxWidth: '100%',
    },
    cardExampleText: {
        fontFamily: FONT_FAMILY,
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    fullWidthButtonText: {
        fontFamily: FONT_FAMILY,
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    tutorialIconHighlight: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    tutorialIconGlow: {
        textShadowColor: 'rgba(255, 215, 0, 0.45)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 12,
    },
    tutorialWordHighlight: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    tutorialWordTouchable: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tutorialWordText: {
        textShadowColor: 'rgba(0, 0, 0, 0.35)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    tutorialSentenceHighlight: {
        justifyContent: 'center',
    },
    tutorialSentenceTouchable: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tutorialSentenceText: {
        textShadowColor: 'rgba(0, 0, 0, 0.35)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    tutorialRaisedButton: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 12,
    },
    tutorialMoreExampleButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
});

export default HomeTutorialSection;
