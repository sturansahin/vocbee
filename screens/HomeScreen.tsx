import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
    PanResponder,
    Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { FONT_FAMILY } from '../utils/typography';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// Sample words for the word card
const SAMPLE_WORDS = [
    { id: 1, word: 'Serendipity', type: 'noun', definition: 'The occurrence and development of events by chance in a happy or beneficial way.', translation: 'Şans eseri' },
    { id: 2, word: 'Ephemeral', type: 'adjective', definition: 'Lasting for a very short time.', translation: 'Geçici' },
    { id: 3, word: 'Resilience', type: 'noun', definition: 'The capacity to recover quickly from difficulties.', translation: 'Dayanıklılık' },
    { id: 4, word: 'Eloquent', type: 'adjective', definition: 'Fluent or persuasive in speaking or writing.', translation: 'Etkili konuşan' },
    { id: 5, word: 'Ubiquitous', type: 'adjective', definition: 'Present, appearing, or found everywhere.', translation: 'Her yerde bulunan' },
];

export default function HomeScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();
    const [currentWordIndex, setCurrentWordIndex] = useState(0);

    const currentWord = SAMPLE_WORDS[currentWordIndex];
    const nextWord = SAMPLE_WORDS[(currentWordIndex + 1) % SAMPLE_WORDS.length];

    // Swipe animation setup (from FlashcardScreen)
    const position = useRef(new Animated.ValueXY()).current;
    const rotate = position.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        outputRange: ['-15deg', '0deg', '15deg'],
        extrapolate: 'clamp',
    });

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gesture) => {
                position.setValue({ x: gesture.dx, y: gesture.dy * 0.3 });
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dx > SWIPE_THRESHOLD) {
                    swipeCard('right');
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    swipeCard('left');
                } else {
                    resetPosition();
                }
            },
        })
    ).current;

    const swipeCard = (direction: 'left' | 'right') => {
        const x = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
        Animated.timing(position, {
            toValue: { x, y: 0 },
            duration: 300,
            useNativeDriver: false,
        }).start(() => {
            position.setValue({ x: 0, y: 0 });
            setCurrentWordIndex((prev) => (prev + 1) % SAMPLE_WORDS.length);
        });
    };

    const resetPosition = () => {
        Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 5,
        }).start();
    };

    const handleNext = () => {
        swipeCard('left');
    };

    const handleLearned = () => {
        swipeCard('right');
    };

    // Render background card (static, no animation)
    const renderBackgroundCard = () => {
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
                    <View style={styles.cardCenter}>
                        <Text style={[styles.wordTitle, { color: colors.text }]}>{nextWord.word}</Text>
                        <Text style={[styles.wordType, { color: colors.textSecondary }]}>{nextWord.type}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerSpacer} />
                <Text style={[styles.headerTitle, { color: colors.primary }]}>VOCBEE</Text>
                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => navigation.navigate('Settings')}
                >
                    <Feather name="settings" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Stats Section */}
            <View style={styles.statsSection}>
                <View style={styles.statsRow}>
                    <View>
                        <Text style={[styles.levelLabel, { color: colors.textSecondary }]}>CURRENT LEVEL</Text>
                        <View style={styles.levelRow}>
                            <Text style={[styles.levelValue, { color: colors.text }]}>LEVEL 5</Text>
                            <Text style={[styles.levelSubtext, { color: colors.textSecondary }]}>Intermediate</Text>
                        </View>
                    </View>
                </View>

                {/* Daily Goal */}
                <View>
                    <View style={styles.goalHeader}>
                        <Text style={[styles.goalLabel, { color: colors.text }]}>Daily Goal</Text>
                        <Text style={[styles.goalValue, { color: colors.primary }]}>15/20 words</Text>
                    </View>
                    <View style={[styles.progressBg, { backgroundColor: colors.surface }]}>
                        <View style={[styles.progressFill, { backgroundColor: colors.primary }]} />
                    </View>
                </View>
            </View>

            {/* Card Stack Area */}
            <View style={styles.cardArea}>
                {/* Background Card */}
                {renderBackgroundCard()}

                {/* Top Card - Swipeable */}
                <Animated.View
                    style={[
                        styles.cardContainer,
                        {
                            transform: [
                                { translateX: position.x },
                                { translateY: position.y },
                                { rotate },
                            ],
                            zIndex: 10,
                        },
                    ]}
                    {...panResponder.panHandlers}
                >
                    <View style={[
                        styles.heroCard,
                        {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            borderWidth: 1,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.3,
                            shadowRadius: 20,
                            elevation: 10,
                        }
                    ]}>
                        {/* Skip Overlay - Full card background */}
                        <Animated.View
                            style={[
                                styles.swipeOverlay,
                                {
                                    backgroundColor: '#fca8a8ff',
                                    borderColor: '#fca8a8ff',
                                    opacity: position.x.interpolate({
                                        inputRange: [-SWIPE_THRESHOLD, 0],
                                        outputRange: [1, 0],
                                        extrapolate: 'clamp',
                                    }),
                                },
                            ]}
                        >
                            <View style={styles.swipeLabelContainer}>
                                <Text style={styles.skipText}>SKIP</Text>
                            </View>
                        </Animated.View>

                        {/* Learned Overlay - Full card background */}
                        <Animated.View
                            style={[
                                styles.swipeOverlay,
                                {
                                    backgroundColor: '#98f5c7ff',
                                    borderColor: '#98f5c7ff',
                                    opacity: position.x.interpolate({
                                        inputRange: [0, SWIPE_THRESHOLD],
                                        outputRange: [0, 1],
                                        extrapolate: 'clamp',
                                    }),
                                },
                            ]}
                        >
                            <View style={styles.swipeLabelContainer}>
                                <Text style={styles.learnedText}>LEARNED</Text>
                            </View>
                        </Animated.View>

                        {/* Card Content - above overlay */}
                        <View style={styles.cardContentAbove}>
                            <Text style={[styles.wordTitle, { color: colors.text }]}>{currentWord.word}</Text>
                            <Text style={[styles.wordType, { color: colors.textSecondary }]}>{currentWord.type}</Text>

                            <Text style={[styles.wordDefinition, { color: colors.text }]}>
                                {currentWord.definition}
                            </Text>

                            <TouchableOpacity
                                style={[styles.exampleButton, { borderColor: colors.border }]}
                                onPress={() => navigation.navigate('ExampleSentences', {
                                    word: currentWord.word,
                                    definition: currentWord.definition,
                                    translation: currentWord.translation
                                })}
                            >
                                <Text style={[styles.exampleButtonText, { color: colors.text }]}>EXAMPLE SENTENCES</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </View>

            {/* Tinder-style Action Buttons */}
            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        styles.skipActionButton,
                        { backgroundColor: colors.surface }
                    ]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                >
                    <Image source={require('../components/retry.png')} style={[styles.actionIcon, styles.retryIcon]} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        styles.learnedActionButton,
                        { backgroundColor: colors.surface }
                    ]}
                    onPress={handleLearned}
                    activeOpacity={0.8}
                >
                    <Image source={require('../components/arrow.png')} style={[styles.actionIcon, styles.arrowIcon]} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    headerSpacer: {
        width: 24,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 6,
    },
    settingsButton: {
        padding: 4,
    },
    statsSection: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    levelLabel: {
        fontFamily: FONT_FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 4,
    },
    levelRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    levelValue: {
        fontFamily: FONT_FAMILY,
        fontSize: 28,
        fontWeight: 'bold',
    },
    levelSubtext: {
        fontFamily: FONT_FAMILY,
        fontSize: 14,
        fontWeight: '500',
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    goalLabel: {
        fontFamily: FONT_FAMILY,
        fontSize: 14,
        fontWeight: '500',
    },
    goalValue: {
        fontFamily: FONT_FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
    },
    progressBg: {
        height: 8,
        width: '100%',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        width: '75%',
        borderRadius: 4,
    },
    cardArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    cardContainer: {
        position: 'absolute',
        width: SCREEN_WIDTH - 40,
        height: SCREEN_HEIGHT * 0.55,
    },
    heroCard: {
        flex: 1,
        borderRadius: 32,
        padding: 24,
        justifyContent: 'center',
    },
    cardCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    cardContentAbove: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        zIndex: 200,
    },
    wordTitle: {
        fontFamily: FONT_FAMILY,
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 4,
        letterSpacing: 1,
        textAlign: 'center',
    },
    wordType: {
        fontFamily: FONT_FAMILY,
        fontSize: 18,
        fontStyle: 'italic',
        marginBottom: 24,
    },
    wordDefinition: {
        fontFamily: FONT_FAMILY,
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
        paddingHorizontal: 10,
    },
    exampleButton: {
        paddingVertical: 14,
        paddingHorizontal: 28,
        backgroundColor: 'rgba(128, 128, 128, 0.15)',
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderWidth: 1.5,
    },
    exampleButtonText: {
        fontFamily: FONT_FAMILY,
        fontWeight: '500',
        fontSize: 14,
        letterSpacing: 0.5,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 50,
        paddingBottom: 60,
        paddingTop: 10,
    },
    actionButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    skipActionButton: {
        borderWidth: 1,
        borderColor: '#ea8484',
    },
    learnedActionButton: {
        borderWidth: 1,
        borderColor: '#75e8a3',
    },
    actionIcon: {
        width: 70,
        height: 70,
        resizeMode: 'contain',
    },
    retryIcon: {
        tintColor: '#ea8484',
    },
    arrowIcon: {
        tintColor: '#75e8a3',
    },
    learnedButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
    },
    learnedButtonText: {
        fontFamily: FONT_FAMILY,
        fontSize: 15,
    },
    nextButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
    },
    nextButtonText: {
        fontFamily: FONT_FAMILY,
        fontSize: 15,
    },
    swipeOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 32,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 40,
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
        color: '#75e8a3ff',
        fontSize: 20,
        letterSpacing: 4,
    },
});
