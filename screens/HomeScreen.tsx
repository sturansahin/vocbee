import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
    PanResponder,
    Easing,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { createSwarmAnimation } from '../assets/animations/swarmAnimation';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { FONT_FAMILY, HEADER_FONT_FAMILY } from '../utils/typography';
import { SwarmLogo } from '../components/SwarmLogo';
import {
    VocabularyWord,
    Level,
    getStoredVocabulary,
    shuffleArray,
    isVocabularyGenerated,
    generateVocabulary
} from '../services/vocabularyService';
import * as Speech from 'expo-speech';
import * as Network from 'expo-network';
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
import { addToFavorites, removeFromFavorites, isFavorite } from '../services/favoritesService';
import { getPendingNotificationWord } from '../services/notificationService';
import { useAlert } from '../components/CustomAlert';
import { SafeBannerAd } from '../components/SafeBannerAd';
import { loadInterstitial, showInterstitial, AD_IDS, getBannerAdSize } from '../services/adMobService';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// Responsive utilities
const BASE_WIDTH = 393; // iPhone 14 Pro base width
const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;


export default function HomeScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();
    const { showAlert } = useAlert();
    const { t } = useTranslation();

    // State
    const [words, setWords] = useState<VocabularyWord[]>([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentLevel, setCurrentLevel] = useState<Level>('A1');
    const [userLevel, setUserLevel] = useState('beginner');
    const [isLoading, setIsLoading] = useState(true);
    const [learnedCount, setLearnedCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [isCurrentWordFavorite, setIsCurrentWordFavorite] = useState(false);

    // Ref to track if initial load has been done
    const hasInitiallyLoaded = useRef(false);

    // Track session learned words for Interstitial Ad
    const sessionLearnedCount = useRef(0);

    // Bee animation state
    interface BeePosition {
        id: number;
        x: number;
        y: number;
        translateX: Animated.Value;
        translateY: Animated.Value;
        opacity: Animated.Value;
        rotation: Animated.Value;
        scale: Animated.Value;
    }

    const [beePositions, setBeePositions] = useState<BeePosition[]>([]);
    const [beesAnimating, setBeesAnimating] = useState(false);
    const beeAnimationRef = useRef<any>(null);

    // Yellow bee color (same as login screen)
    const beeColor: [number, number, number, number] = [1, 0.78, 0.08, 1];

    // Generate position for single bee in top-right corner
    const generateBeePositions = useCallback((): BeePosition[] => {
        const cardWidth = SCREEN_WIDTH - 40; // Card container width

        // Single bee positioned in top-right corner area
        const beePosition: BeePosition = {
            id: 0,
            x: cardWidth - 60, // 60px from right edge
            y: 20,              // 20px from top
            translateX: new Animated.Value(0),
            translateY: new Animated.Value(0),
            opacity: new Animated.Value(0),
            rotation: new Animated.Value(0),
            scale: new Animated.Value(0.5),
        };

        return [beePosition];
    }, []);

    // Animate bee flying in with realistic exploration flight before landing
    const animateBeesIn = useCallback((positions: BeePosition[]) => {
        if (positions.length === 0) return;

        setBeesAnimating(true);
        const bee = positions[0];

        // Set initial off-screen position (coming from left)
        bee.translateX.setValue(-SCREEN_WIDTH);
        bee.translateY.setValue(-250 + Math.random() * 500); // Random height between 50-200
        bee.opacity.setValue(1);
        bee.rotation.setValue(-20);
        bee.scale.setValue(0.7);

        // Realistic flight sequence with exploration
        const animation = Animated.sequence([
            // Phase 1: Fly in from left side
            Animated.parallel([
                Animated.timing(bee.translateX, {
                    toValue: -20,
                    duration: 1000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(bee.translateY, {
                    toValue: -20,
                    duration: 1000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(bee.rotation, {
                    toValue: 10,
                    duration: 1000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.spring(bee.scale, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 30,
                    friction: 5,
                }),
            ]),

            // Phase 2: Exploration flight (2 seconds) - flying around the screen
            // Move 1: Fly right and up
            Animated.parallel([
                Animated.timing(bee.translateX, {
                    toValue: 15,
                    duration: 500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(bee.translateY, {
                    toValue: -15,
                    duration: 500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(bee.rotation, {
                    toValue: -10,
                    duration: 500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ]),

            // Move 2: Fly left and down
            Animated.parallel([
                Animated.timing(bee.translateX, {
                    toValue: -10,
                    duration: 450,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(bee.translateY, {
                    toValue: -10,
                    duration: 450,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(bee.rotation, {
                    toValue: 15,
                    duration: 450,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ]),

            // Move 3: Fly right and down
            Animated.parallel([
                Animated.timing(bee.translateX, {
                    toValue: 5,
                    duration: 500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(bee.translateY, {
                    toValue: -5,
                    duration: 500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(bee.rotation, {
                    toValue: -8,
                    duration: 500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ]),

            // Move 4: Fly up
            Animated.parallel([
                Animated.timing(bee.translateX, {
                    toValue: 5,
                    duration: 550,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(bee.translateY, {
                    toValue: -5,
                    duration: 550,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(bee.rotation, {
                    toValue: 5,
                    duration: 550,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ]),

            // Phase 3: Approach target position (slowing down)
            Animated.parallel([
                Animated.timing(bee.translateX, {
                    toValue: 3,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(bee.translateY, {
                    toValue: -3,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(bee.rotation, {
                    toValue: -3,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),

            // Phase 5: Landing (settle down gently)
            Animated.parallel([
                Animated.spring(bee.translateX, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 15,
                    friction: 8,
                }),
                Animated.spring(bee.translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 15,
                    friction: 8,
                }),
                Animated.spring(bee.rotation, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 20,
                    friction: 7,
                }),
            ]),
        ]);

        beeAnimationRef.current = animation.start(() => {
            setBeesAnimating(false);
        });
    }, []);

    // Animate bees flying away when card is swiped
    const animateBeesAway = useCallback((positions: BeePosition[], callback?: () => void) => {
        setBeesAnimating(true);

        // Create animations for each bee to fly away
        const animations = positions.map((bee, index) => {
            // Random exit direction
            const exitDirections = [
                { x: -300, y: -400 },  // Top-left
                { x: 300, y: -400 },   // Top-right
                { x: -400, y: -200 },  // Mid-left
                { x: 400, y: -200 },   // Mid-right
                { x: 0, y: -500 },     // Straight up
            ];

            const exitPos = exitDirections[index % exitDirections.length];

            return Animated.parallel([
                Animated.timing(bee.translateX, {
                    toValue: exitPos.x,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(bee.translateY, {
                    toValue: exitPos.y,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(bee.opacity, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(bee.rotation, {
                    toValue: (Math.random() - 0.5) * 120,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(bee.scale, {
                    toValue: 0.3,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]);
        });

        beeAnimationRef.current = Animated.stagger(50, animations).start(() => {
            setBeesAnimating(false);
            callback?.();
        });
    }, []);


    // Memoize bee animation to prevent recreation on each render (fixes white flash)
    const beeAnimation = useMemo(() => {
        return createSwarmAnimation(beeColor, !beesAnimating);
    }, [beesAnimating, beeColor]);


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
                console.log('No vocabulary generated yet - attempting to regenerate...');

                // Try to get language preferences from AsyncStorage or Firebase
                const nativeLanguage = await AsyncStorage.getItem('@native_language');
                const targetLanguage = await AsyncStorage.getItem('@target_language');

                if (nativeLanguage && targetLanguage) {
                    console.log(`Regenerating vocabulary: ${nativeLanguage} -> ${targetLanguage}`);
                    await generateVocabulary(nativeLanguage, targetLanguage);
                    console.log('Vocabulary regenerated successfully');

                    // Get current level to verify vocabulary was generated
                    const level = await getCurrentLevel();
                    const testVocab = await getStoredVocabulary(level);
                    if (testVocab.length === 0) {
                        console.error('Vocabulary generation failed - no words loaded');
                        setLearnedCount(0);
                        setTotalCount(0);
                        setWords([]);
                        setIsLoading(false);
                        return;
                    }
                    console.log(`Verified: ${testVocab.length} words generated for level ${level}`);
                } else {
                    console.log('No stored language preferences found');
                    setLearnedCount(0);
                    setTotalCount(0);
                    setWords([]);
                    setIsLoading(false);
                    return;
                }
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

            // Validate vocabulary is not empty
            if (vocabulary.length === 0) {
                console.warn(`No vocabulary available for level ${level}`);
                setLearnedCount(0);
                setTotalCount(0);
                setWords([]);
                setIsLoading(false);
                return;
            }

            // Get learned words
            const learnedIds = await getLearnedWords(level);

            // Filter out learned words
            const unlearnedWords = vocabulary.filter(word => !learnedIds.includes(word.id));

            // Check if we have a saved shuffle order for this language pair and level
            const nativeLang = await AsyncStorage.getItem('@native_language') || 'unknown';
            const targetLang = await AsyncStorage.getItem('@target_language') || 'unknown';
            const shuffleOrderKey = `@shuffle_order_${nativeLang}_${targetLang}_${level}`;
            const savedOrderJson = await AsyncStorage.getItem(shuffleOrderKey);

            let orderedWords: VocabularyWord[];

            if (savedOrderJson && !forceReload) {
                // Use saved shuffle order
                const savedOrder: number[] = JSON.parse(savedOrderJson);
                // Rebuild words array in saved order, filtering out any that no longer exist or are learned
                orderedWords = savedOrder
                    .map(id => unlearnedWords.find(w => w.id === id))
                    .filter((w): w is VocabularyWord => w !== undefined);

                // If saved order doesn't match current unlearned words, add any new words at the end
                const savedIds = new Set(savedOrder);
                const newWords = unlearnedWords.filter(w => !savedIds.has(w.id));
                if (newWords.length > 0) {
                    orderedWords = [...orderedWords, ...shuffleArray(newWords)];
                    // Update saved order with new words
                    await AsyncStorage.setItem(shuffleOrderKey, JSON.stringify(orderedWords.map(w => w.id)));
                }

                console.log(`Using saved shuffle order for level ${level}`);
            } else {
                // First time or force reload - shuffle and save order
                orderedWords = shuffleArray(unlearnedWords);
                await AsyncStorage.setItem(shuffleOrderKey, JSON.stringify(orderedWords.map(w => w.id)));
                console.log(`Created new shuffle order for level ${level}`);
            }

            setWords(orderedWords);

            // Resume from last saved word ID (find its position in ordered array)
            const lastWordId = await getLastWordId();
            let resumeIndex = 0;
            if (lastWordId !== null) {
                const foundIndex = orderedWords.findIndex(w => w.id === lastWordId);
                if (foundIndex !== -1) {
                    resumeIndex = foundIndex;
                    console.log(`Resuming from word ID ${lastWordId} at position ${foundIndex}`);
                }
            }
            setCurrentWordIndex(resumeIndex);

            // Update counts - these should now be guaranteed correct
            const learned = await getLearnedCount(level);
            const total = await getTotalWords(level);
            setLearnedCount(learned);
            setTotalCount(total);

            hasInitiallyLoaded.current = true;

            console.log(`Loaded ${orderedWords.length} unlearned words from ${vocabulary.length} total for level ${level} (${learned} learned)`);
        } catch (error) {
            console.error('Error loading data:', error);
            // Set safe defaults on error
            setLearnedCount(0);
            setTotalCount(0);
            setWords([]);
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
                    // Find the word - must validate level/language match
                    const level = await getCurrentLevel();
                    const vocabulary = await getStoredVocabulary(level);
                    const pendingWord = vocabulary.find(w => w.id === pendingWordId);

                    if (pendingWord) {
                        // Put the pending word at the front
                        const otherWords = words.filter(w => w.id !== pendingWordId);
                        setWords([pendingWord, ...otherWords]);
                        setCurrentWordIndex(0);
                        console.log(`Showing word from notification: ${pendingWord.word}`);
                    } else {
                        console.log(`[HomeScreen] Pending word ${pendingWordId} not found in current level - likely due to level/language change`);
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
                return { code: currentLevel, description: t('level.beginner') };
            case 'intermediate':
                return { code: currentLevel, description: t('level.intermediate') };
            case 'advanced':
                return { code: currentLevel, description: t('level.advanced') };
            default:
                return { code: currentLevel, description: t('level.beginner') };
        }
    };

    const levelDisplay = getLevelDisplay();

    const currentWord = words[currentWordIndex];
    const nextWord = words[(currentWordIndex + 1) % Math.max(words.length, 1)];

    // Initialize bees when component mounts or word changes
    useEffect(() => {
        if (currentWord && !isLoading && words.length > 0) {
            // Check if current word is favorite
            const checkFavoriteStatus = async () => {
                const fav = await isFavorite(currentWord.id, currentLevel);
                setIsCurrentWordFavorite(fav);
            };
            checkFavoriteStatus();

            // Generate new positions
            const newPositions = generateBeePositions();
            setBeePositions(newPositions);

            // Animate them in after a short delay
            setTimeout(() => {
                animateBeesIn(newPositions);
            }, 300);
        }
    }, [currentWordIndex, currentWord, isLoading, words.length, generateBeePositions, animateBeesIn, currentLevel]);

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

        // Trigger bees to fly away first
        if (beePositions.length > 0) {
            animateBeesAway(beePositions);
        }

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

                // Increment session count and check for ad
                sessionLearnedCount.current += 1;
                console.log(`Session learned count: ${sessionLearnedCount.current}`);

                if (sessionLearnedCount.current % 10 === 0) {
                    console.log('Triggering Interstitial Ad');
                    await showInterstitial();
                }

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
    }, [currentWord, currentLevel, currentWordIndex, words.length, loadData, position, beePositions, animateBeesAway]);

    const resetPosition = useCallback(() => {
        Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 5,
        }).start();
    }, [position]);

    // Load interstitial on mount
    useEffect(() => {
        loadInterstitial();
    }, []);

    // Update refs when functions change
    useEffect(() => {
        swipeCardRef.current = swipeCard;
        resetPositionRef.current = resetPosition;
    }, [swipeCard, resetPosition]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gesture) => {
                // Allow TouchableOpacity children to handle taps by not using Capture
                // Only take over for swipe gestures (larger movement threshold)
                return Math.abs(gesture.dx) > 15 || Math.abs(gesture.dy) > 15;
            },
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

    const handleToggleFavorite = async () => {
        if (currentWord) {
            if (isCurrentWordFavorite) {
                await removeFromFavorites(currentWord.id, currentLevel);
                setIsCurrentWordFavorite(false);
                console.log('Removed from favorites:', currentWord.word);
            } else {
                await addToFavorites(currentWord, currentLevel);
                setIsCurrentWordFavorite(true);
                console.log('Added to favorites:', currentWord.word, `(${currentLevel})`);
            }
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
                    <View style={styles.cardContentAbove}>
                        {/* Upper Section - Word and Translation */}
                        <View style={styles.favoriteButton}>
                            <View style={{ width: 26, height: 26, justifyContent: 'center', alignItems: 'center' }}>
                                <Feather name="star" size={24} color={colors.primary} />
                            </View>
                        </View>
                        <View style={styles.cardUpperSection}>
                            <Text
                                style={[styles.wordTitle, { color: colors.text }]}
                                adjustsFontSizeToFit
                                numberOfLines={1}
                            >
                                {nextWord.word}
                            </Text>
                            <View style={styles.translationRow}>
                                <View style={{ position: 'absolute', left: scale(36) - 35 }}>
                                    <MaterialIcons name="translate" size={22} color={colors.primary} />
                                </View>
                                <Text style={[styles.translationText, { color: colors.primary }]}>{nextWord.translation}</Text>
                            </View>
                        </View>

                        {/* Lower Section - Example Sentences with Gray Background */}
                        <View style={[styles.cardLowerSection, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                            <View style={styles.exampleSentencesContainer}>
                                <Text style={[styles.cardExampleText, { color: colors.text }]}>
                                    {nextWord.sentence1}
                                </Text>
                                <View style={[styles.thinDivider, { backgroundColor: colors.border }]} />
                                <Text style={[styles.cardTranslationText, { color: colors.textSecondary }]}>
                                    {nextWord.nativeSentence1}
                                </Text>

                                {/* Audio button - positioned in corner */}
                                <View style={[styles.cardAudioButton]}>
                                    <MaterialIcons name="volume-up" size={18} color={colors.primary} />
                                </View>
                            </View>

                            {/* More Example Button placeholder */}
                            <View style={[styles.fullWidthButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                                <Text style={[styles.fullWidthButtonText, { color: colors.text }]}>{t('home.moreExample')}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    // Loading state - return null to let splash screen handle it
    if (isLoading) {
        return null;
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
                        {totalCount > 0 ? t('home.levelComplete') : t('home.noVocabulary')}
                    </Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        {totalCount > 0
                            ? t('home.levelCompleteDesc', { count: totalCount, level: currentLevel })
                            : t('home.setupRequired')
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
                                {learnedCount}/{totalCount} {t('home.words')}
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
                {/* Wrapper for vertical centering */}
                <View style={styles.cardStackContainer}>
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
                                        <Text style={[styles.skipText, { color: isDarkMode ? '#ff8a8a' : '#ff6b6bff' }]}>{t('home.skip')}</Text>
                                    </View>
                                </Animated.View>

                                {/* Learned Overlay */}
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
                                    {/* Favorite Button - Moved to root of content to ensure clickability */}
                                    <TouchableOpacity
                                        style={styles.favoriteButton}
                                        onPress={handleToggleFavorite}
                                        activeOpacity={0.7}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <View style={{ width: 26, height: 26, justifyContent: 'center', alignItems: 'center' }}>
                                            {isCurrentWordFavorite && (
                                                <View style={{ position: 'absolute' }}>
                                                    <Ionicons name="star" size={22} color={colors.primary} />
                                                </View>
                                            )}
                                            <Feather name="star" size={24} color={colors.primary} />
                                        </View>
                                    </TouchableOpacity>

                                    {/* Upper Section - Word and Translation */}
                                    <View style={styles.cardUpperSection}>

                                        <TouchableOpacity
                                            onPress={async () => {
                                                console.log('Word button pressed:', currentWord.word);
                                                try {
                                                    await Speech.stop(); // Stop any ongoing speech
                                                    await Speech.speak(currentWord.word, {
                                                        language: 'en-US',
                                                        pitch: 1.0,
                                                        rate: 0.75,
                                                    });
                                                    console.log('Speech started successfully');
                                                } catch (error) {
                                                    console.error('Speech error:', error);
                                                }
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[styles.wordTitle, { color: colors.text }]}
                                                adjustsFontSizeToFit
                                                numberOfLines={1}
                                            >
                                                {currentWord.word}
                                            </Text>
                                        </TouchableOpacity>
                                        <View style={styles.translationRow}>
                                            <View style={{ position: 'absolute', left: scale(36) - 35 }}>
                                                <MaterialIcons name="translate" size={22} color={colors.primary} />
                                            </View>
                                            <Text style={[styles.translationText, { color: colors.primary }]}>{currentWord.translation}</Text>
                                        </View>
                                    </View>

                                    {/* Lower Section - Example Sentences with Gray Background */}
                                    <View style={[styles.cardLowerSection, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                                        <View style={styles.exampleSentencesContainer}>
                                            {/* Example Sentence */}
                                            <Text style={[styles.cardExampleText, { color: colors.text }]}>
                                                {currentWord.sentence1}
                                            </Text>

                                            {/* Thin Divider Line */}
                                            <View style={[styles.thinDivider, { backgroundColor: colors.border }]} />

                                            {/* Translation */}
                                            <Text style={[styles.cardTranslationText, { color: colors.textSecondary }]}>
                                                {currentWord.nativeSentence1}
                                            </Text>

                                            {/* Audio button - positioned in corner */}
                                            <TouchableOpacity
                                                style={[styles.cardAudioButton]}
                                                onPress={async () => {
                                                    console.log('Sentence button pressed:', currentWord.sentence1);
                                                    try {
                                                        await Speech.stop(); // Stop any ongoing speech
                                                        await Speech.speak(currentWord.sentence1, {
                                                            language: 'en-US',
                                                            pitch: 1.0,
                                                            rate: 0.75,
                                                        });
                                                        console.log('Speech started successfully');
                                                    } catch (error) {
                                                        console.error('Speech error:', error);
                                                    }
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <MaterialIcons name="volume-up" size={18} color={colors.primary} />
                                            </TouchableOpacity>
                                        </View>

                                        {/* More Example Button - Full Width at Bottom */}
                                        <TouchableOpacity
                                            style={[styles.fullWidthButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
                                            onPress={() => navigation.navigate('ExampleSentences', {
                                                word: currentWord.word,
                                                translation: currentWord.translation,
                                                sentence1: currentWord.sentence1,
                                                sentence2: currentWord.sentence2,
                                                nativeSentence1: currentWord.nativeSentence1,
                                                nativeSentence2: currentWord.nativeSentence2
                                            })}
                                        >
                                            <Text style={[styles.fullWidthButtonText, { color: colors.text }]}>{t('home.moreExample')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            {/* Bees - Moved outside heroCard to avoid clipping by overflow:hidden */}
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
                                        source={beeAnimation}
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




            {/* Banner Ad */}
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: insets.bottom > 0 ? 0 : 10, backgroundColor: colors.background }}>
                <SafeBannerAd
                    unitId={AD_IDS.BANNER}
                    requestOptions={{
                        requestNonPersonalizedAdsOnly: true,
                    }}
                />
            </View>
        </View >
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
        paddingVertical: scale(16),
        paddingHorizontal: scale(20),
    },
    headerTitle: {
        fontSize: moderateScale(22),
        fontFamily: HEADER_FONT_FAMILY,
        letterSpacing: scale(6),
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
        fontSize: moderateScale(26),
    },
    levelSubtext: {
        fontFamily: FONT_FAMILY,
        fontSize: 14,
    },
    goalValue: {
        fontFamily: FONT_FAMILY,
        fontSize: moderateScale(12),
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
    wordTitle: {
        fontFamily: FONT_FAMILY,
        fontSize: moderateScale(36),
        marginBottom: scale(4),
        letterSpacing: 1,
        textAlign: 'center',
        paddingHorizontal: 40,
        maxWidth: '100%',
    },
    translationRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Center content horizontally
        marginBottom: 24,
        position: 'relative', // For absolute positioning of icon
    },
    translationText: {
        fontFamily: FONT_FAMILY,
        fontSize: moderateScale(24),
        fontWeight: '500',
        paddingHorizontal: 40,
        maxWidth: '100%',
        textAlign: 'center',
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
    loadingLottie: {
        width: 100,
        height: 92,
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
    wordTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cardUpperSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 10,
    },
    cardLowerSection: {
        width: '100%',
        paddingTop: 20,
        paddingHorizontal: 0,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
    },
    exampleSentencesContainer: {
        width: '100%',
        paddingHorizontal: 20,
        paddingBottom: 12,
        alignItems: 'center',
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
    cardAudioButton: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        width: 32,
        height: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
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
        width: 35,
        height: 35,
        zIndex: 300,
    },
    beeAnim: {
        width: 35,
        height: 35,
    },
});
