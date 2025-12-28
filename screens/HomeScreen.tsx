import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
    PanResponder,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import Feather from '@expo/vector-icons/Feather';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { FONT_FAMILY, HEADER_FONT_FAMILY } from '../utils/typography';
import { SwarmLogo } from '../components/SwarmLogo';
import { ArrowIcon } from '../components/ArrowIcon';
import { RetryIcon } from '../components/RetryIcon';
import { StarIcon } from '../components/StarIcon';
import {
    VocabularyWord,
    Level,
    getStoredVocabulary,
    shuffleArray,
    isVocabularyGenerated
} from '../services/vocabularyService';
import * as Speech from 'expo-speech';
import {
    markWordAsLearned,
    getLearnedWords,
    getCurrentLevel,
    checkAndAdvanceLevel,
    getLearnedCount,
    getTotalWords,
    markWordAsSkipped,
    saveLastWordId,
    getLastWordId
} from '../services/progressService';
import { addToFavorites } from '../services/favoritesService';
import { getPendingNotificationWord } from '../services/notificationService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export default function HomeScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();

    // State
    const [words, setWords] = useState<VocabularyWord[]>([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentLevel, setCurrentLevel] = useState<Level>('A1');
    const [userLevel, setUserLevel] = useState('beginner');
    const [isLoading, setIsLoading] = useState(true);
    const [learnedCount, setLearnedCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    // Ref to track if initial load has been done
    const hasInitiallyLoaded = useRef(false);

    // Load vocabulary and progress (only called on initial load or after reset)
    const loadData = useCallback(async (forceReload = false) => {
        // Skip if already loaded and not forcing reload
        if (hasInitiallyLoaded.current && !forceReload) {
            return;
        }

        setIsLoading(true);
        try {
            // Check if vocabulary is generated
            const hasVocab = await isVocabularyGenerated();
            if (!hasVocab) {
                console.log('No vocabulary generated yet');
                setIsLoading(false);
                return;
            }

            // Get current level
            const level = await getCurrentLevel();
            setCurrentLevel(level);

            // Get user level display
            const savedUserLevel = await AsyncStorage.getItem('@user_level');
            if (savedUserLevel) {
                setUserLevel(savedUserLevel);
            }

            // Get vocabulary for current level
            const vocabulary = await getStoredVocabulary(level);

            // Get learned words
            const learnedIds = await getLearnedWords(level);

            // Filter out learned words and shuffle
            const unlearnedWords = vocabulary.filter(word => !learnedIds.includes(word.id));
            const shuffledWords = shuffleArray(unlearnedWords);

            setWords(shuffledWords);

            // Resume from last saved word ID (find its position in shuffled array)
            const lastWordId = await getLastWordId();
            let resumeIndex = 0;
            if (lastWordId !== null) {
                const foundIndex = shuffledWords.findIndex(w => w.id === lastWordId);
                if (foundIndex !== -1) {
                    resumeIndex = foundIndex;
                    console.log(`Resuming from word ID ${lastWordId} at position ${foundIndex}`);
                }
            }
            setCurrentWordIndex(resumeIndex);

            // Update counts
            const learned = await getLearnedCount(level);
            const total = await getTotalWords(level);
            setLearnedCount(learned);
            setTotalCount(total);

            hasInitiallyLoaded.current = true;

            console.log(`Loaded ${shuffledWords.length} unlearned words from ${vocabulary.length} total for level ${level}`);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Update only counts (called on focus without reshuffling)
    const updateCounts = useCallback(async () => {
        try {
            const learned = await getLearnedCount(currentLevel);
            const total = await getTotalWords(currentLevel);
            setLearnedCount(learned);
            setTotalCount(total);
        } catch (error) {
            console.error('Error updating counts:', error);
        }
    }, [currentLevel]);

    // Initial load - only once
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Update counts on focus and check if level changed or pending notification word
    useFocusEffect(
        useCallback(() => {
            const checkAndUpdate = async () => {
                // Check for pending notification word first
                const pendingWordId = await getPendingNotificationWord();
                if (pendingWordId !== null) {
                    // Find the word and move it to front
                    const level = await getCurrentLevel();
                    const vocabulary = await getStoredVocabulary(level);
                    const pendingWord = vocabulary.find(w => w.id === pendingWordId);

                    if (pendingWord) {
                        // Put the pending word at the front
                        const otherWords = words.filter(w => w.id !== pendingWordId);
                        setWords([pendingWord, ...otherWords]);
                        setCurrentWordIndex(0);
                        console.log(`Showing word from notification: ${pendingWord.word}`);
                    }
                    return;
                }

                if (hasInitiallyLoaded.current) {
                    // Check if level has changed
                    const newLevel = await getCurrentLevel();
                    if (newLevel !== currentLevel) {
                        // Level changed, reload everything
                        hasInitiallyLoaded.current = false;
                        loadData(true);
                    } else {
                        updateCounts();
                    }
                }
            };
            checkAndUpdate();
        }, [currentLevel, loadData, updateCounts, words])
    );

    // Get level display
    const getLevelDisplay = () => {
        switch (userLevel) {
            case 'beginner':
                return { code: currentLevel, description: 'Beginner' };
            case 'intermediate':
                return { code: currentLevel, description: 'Intermediate' };
            case 'advanced':
                return { code: currentLevel, description: 'Advanced' };
            default:
                return { code: currentLevel, description: 'Beginner' };
        }
    };

    const levelDisplay = getLevelDisplay();

    const currentWord = words[currentWordIndex];
    const nextWord = words[(currentWordIndex + 1) % Math.max(words.length, 1)];

    // Swipe animation setup
    const position = useRef(new Animated.ValueXY()).current;
    const rotate = position.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        outputRange: ['-15deg', '0deg', '15deg'],
        extrapolate: 'clamp',
    });

    // Use refs for swipe functions to avoid stale closures in panResponder
    const swipeCardRef = useRef<((direction: 'left' | 'right') => void) | null>(null);
    const resetPositionRef = useRef<(() => void) | null>(null);

    const swipeCard = useCallback(async (direction: 'left' | 'right') => {
        const x = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;

        Animated.timing(position, {
            toValue: { x, y: 0 },
            duration: 300,
            useNativeDriver: false,
        }).start(async () => {
            const swipedWord = currentWord;
            const wasLastWord = currentWordIndex >= words.length - 1;

            // Advance UI immediately to avoid showing the previous word
            if (!wasLastWord) {
                setCurrentWordIndex(prev => prev + 1);
            }

            // Reset card position on the next frame so the new word renders first
            requestAnimationFrame(() => {
                position.setValue({ x: 0, y: 0 });
            });

            // Side effects (storage/progress) can run after UI has advanced
            if (direction === 'right' && swipedWord) {
                await markWordAsLearned(currentLevel, swipedWord.id);
                setLearnedCount(prev => prev + 1);

                const newLevel = await checkAndAdvanceLevel();
                if (newLevel !== currentLevel) {
                    console.log(`Advanced to level ${newLevel}`);
                    setCurrentLevel(newLevel);
                    await loadData(true);
                    return;
                }
            } else if (direction === 'left' && swipedWord) {
                // Mark word as skipped
                await markWordAsSkipped(currentLevel, swipedWord.id);
            }

            // Save current word ID for resuming later (next word's ID)
            const nextWordIndex = currentWordIndex + 1;
            if (nextWordIndex < words.length) {
                await saveLastWordId(words[nextWordIndex].id);
            }

            // If we were at the end, reload the deck
            if (wasLastWord) {
                await saveLastWordId(0); // Reset to beginning
                await loadData(true);
            }
        });
    }, [currentWord, currentLevel, currentWordIndex, words.length, loadData, position]);

    const resetPosition = useCallback(() => {
        Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 5,
        }).start();
    }, [position]);

    // Update refs when functions change
    useEffect(() => {
        swipeCardRef.current = swipeCard;
        resetPositionRef.current = resetPosition;
    }, [swipeCard, resetPosition]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gesture) => {
                position.setValue({ x: gesture.dx, y: gesture.dy * 0.3 });
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dx > SWIPE_THRESHOLD) {
                    swipeCardRef.current?.('right');
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    swipeCardRef.current?.('left');
                } else {
                    resetPositionRef.current?.();
                }
            },
        })
    ).current;

    const handleNext = () => {
        swipeCard('left');
    };

    const handleLearned = () => {
        swipeCard('right');
    };

    const handleAddToFavorites = async () => {
        if (currentWord) {
            await addToFavorites(currentWord);
            // Optional: Show feedback to user
            console.log('Added to favorites:', currentWord.word);
        }
    };

    // Render background card
    const renderBackgroundCard = () => {
        if (!nextWord || words.length <= 1) return null;

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
                        <View style={styles.translationRow}>
                            <MaterialIcons name="translate" size={24} color={colors.primary} />
                            <Text style={[styles.wordType, { color: colors.primary }]}>{nextWord.translation}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    // Loading state
    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.text }]}>Loading vocabulary...</Text>
                </View>
            </View>
        );
    }

    // No words state
    if (words.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTitleContainer}>
                        <View style={styles.logoContainer}>
                            <SwarmLogo size={26} color={colors.text} />
                        </View>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>VOCBEE</Text>
                    </View>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => navigation.navigate('Favorites')}
                        >
                            <Feather name="star" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => navigation.navigate('Settings')}
                        >
                            <Feather name="settings" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>
                        {totalCount > 0 ? '🎉 Level Complete!' : 'No Vocabulary'}
                    </Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        {totalCount > 0
                            ? `You've learned all ${totalCount} words in ${currentLevel}!`
                            : 'Please complete the setup to start learning.'
                        }
                    </Text>
                </View>
            </View>
        );
    }

    // Calculate progress
    const progressPercentage = totalCount > 0 ? (learnedCount / totalCount) * 100 : 0;

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTitleContainer}>
                    <View style={styles.logoContainer}>
                        <SwarmLogo size={28} color={colors.text} />
                    </View>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>VOCBEE</Text>
                </View>
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => navigation.navigate('Favorites')}
                    >
                        <Feather name="star" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <Feather name="settings" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats Section */}
            <BlurView
                intensity={20}
                tint={isDarkMode ? "dark" : "light"}
                style={styles.statsBlurContainer}
            >
                <View style={styles.statsSection}>
                    {/* Level and Progress */}
                    <View>
                        <View style={styles.levelRow}>
                            <Text style={[styles.levelValue, { color: colors.text }]}>{levelDisplay.code}</Text>
                            <Text style={[styles.levelSubtext, { color: colors.textSecondary }]}>{levelDisplay.description}</Text>
                            <Text style={[styles.goalValue, { color: colors.text, marginLeft: 'auto' }]}>
                                {learnedCount}/{totalCount} words
                            </Text>
                        </View>
                        <View style={[styles.progressBg, { backgroundColor: isDarkMode ? '#2c2c2e' : '#f0f0f0' }]}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        backgroundColor: colors.primary,
                                        width: `${progressPercentage}%`,
                                        shadowColor: '#FFD700',
                                        shadowOffset: { width: 0, height: 0 },
                                        shadowOpacity: 0.8,
                                        shadowRadius: 6,
                                        elevation: 5,
                                    }
                                ]}
                            />
                        </View>
                    </View>
                </View>
            </BlurView>

            {/* Card Stack Area */}
            <View style={styles.cardArea}>
                {/* Background Card */}
                {renderBackgroundCard()}

                {/* Top Card - Swipeable */}
                {currentWord && (
                    <Animated.View
                        key={currentWord.id}
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
                                borderWidth: 0.5,
                                shadowColor: '#FFD700',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.5,
                                shadowRadius: 20,
                                elevation: 15,
                            }
                        ]}>
                            {/* Skip Overlay */}
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
                                    <Text style={[styles.skipText, { color: isDarkMode ? '#ff8a8a' : '#ff6b6bff' }]}>SKIP</Text>
                                </View>
                            </Animated.View>

                            {/* Learned Overlay */}
                            <Animated.View
                                style={[
                                    styles.swipeOverlay,
                                    {
                                        backgroundColor: isDarkMode ? '#1a3d22' : '#d5ffdfff',
                                        opacity: position.x.interpolate({
                                            inputRange: [0, SWIPE_THRESHOLD],
                                            outputRange: [0, 1],
                                            extrapolate: 'clamp',
                                        }),
                                    },
                                ]}
                            >
                                <View style={styles.swipeLabelContainer}>
                                    <Text style={[styles.learnedText, { color: isDarkMode ? '#5eff82' : '#35de5dff' }]}>LEARNED</Text>
                                </View>
                            </Animated.View>

                            {/* Card Content - above overlay */}
                            <View style={styles.cardContentAbove}>
                                <TouchableOpacity
                                    style={styles.wordTitleRow}
                                    onPress={() => Speech.speak(currentWord.word, { language: 'en-US' })}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.wordTitle, { color: colors.text }]}>{currentWord.word}</Text>
                                    <MaterialIcons name="volume-up" size={24} color={colors.primary} />
                                </TouchableOpacity>
                                <View style={styles.translationRow}>
                                    <MaterialIcons name="translate" size={20} color={colors.primary} />
                                    <Text style={[styles.translationText, { color: colors.primary }]}>{currentWord.translation}</Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.exampleButton}
                                    onPress={() => navigation.navigate('ExampleSentences', {
                                        word: currentWord.word,
                                        translation: currentWord.translation,
                                        sentence1: currentWord.sentence1,
                                        sentence2: currentWord.sentence2,
                                        nativeSentence1: currentWord.nativeSentence1,
                                        nativeSentence2: currentWord.nativeSentence2
                                    })}
                                >
                                    <Text style={[styles.exampleButtonText, { color: colors.text }]}>EXAMPLE SENTENCES</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                )}
            </View>

            {/* Action Buttons - NanoBanana Pro Style */}
            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                    style={[
                        styles.nanoBananaButton,
                        {
                            backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                            shadowColor: '#FFD700',
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.5,
                            shadowRadius: 12,
                            elevation: 8,
                        }
                    ]}
                    onPress={handleNext}
                    activeOpacity={0.7}
                >
                    <RetryIcon size={32} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.nanoBananaButtonLarge,
                        {
                            backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.98)',
                            shadowColor: '#FFD700',
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.7,
                            shadowRadius: 20,
                            elevation: 12,
                        }
                    ]}
                    onPress={handleAddToFavorites}
                    activeOpacity={0.7}
                >
                    <StarIcon size={50} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.nanoBananaButton,
                        {
                            backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                            shadowColor: '#FFD700',
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.5,
                            shadowRadius: 12,
                            elevation: 8,
                        }
                    ]}
                    onPress={handleLearned}
                    activeOpacity={0.7}
                >
                    <ArrowIcon size={36} />
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
    headerTitle: {
        fontSize: 22,
        fontFamily: HEADER_FONT_FAMILY,
        letterSpacing: 6,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        gap: 6,
        flex: 1,
    },
    logoContainer: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerButton: {
        padding: 4,
    },
    statsBlurContainer: {
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    statsSection: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    levelRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    levelValue: {
        fontFamily: FONT_FAMILY,
        fontSize: 26,
    },
    levelSubtext: {
        fontFamily: FONT_FAMILY,
        fontSize: 14,
    },
    goalValue: {
        fontFamily: FONT_FAMILY,
        fontSize: 12,
    },
    progressBg: {
        height: 8,
        width: '100%',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
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
        marginBottom: 4,
        letterSpacing: 1,
        textAlign: 'center',
    },
    wordType: {
        fontFamily: FONT_FAMILY,
        fontSize: 20,

    },
    translationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 24,
    },
    translationText: {
        fontFamily: FONT_FAMILY,
        fontSize: 20,
        fontWeight: '500',
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
    },
    exampleButtonText: {
        fontFamily: FONT_FAMILY,
        fontWeight: '500',
        fontSize: 14,
        letterSpacing: 0.5,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
        paddingBottom: 100,
        paddingTop: 10,
    },
    nanoBananaButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0.6,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    nanoBananaButtonLarge: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0.6,
        borderColor: 'rgba(255, 215, 0, 0.4)',
        marginTop: -8,
    },
    actionButton: {
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconShadow: {
        shadowColor: '#FF9B2F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    swipeOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 32,
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
        color: '#35de5dff',
        fontSize: 20,
        letterSpacing: 4,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    loadingText: {
        fontFamily: FONT_FAMILY,
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontFamily: FONT_FAMILY,
        fontSize: 28,
        marginBottom: 16,
        textAlign: 'center',
    },
    emptyText: {
        fontFamily: FONT_FAMILY,
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    // Speech button styles
    wordTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    speakerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
