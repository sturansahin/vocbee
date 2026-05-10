import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
    PanResponder,
    Easing,
    AppState,
    AppStateStatus,
    Platform,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { createSwarmAnimation } from '../assets/animations/swarmAnimation';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import Svg, { Polygon } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useMonetization } from '../context/MonetizationContext';
import { FONT_FAMILY } from '../utils/typography';
import { HomeHeader } from '../components/HomeHeader';
import { AppRatingPrompt } from '../components/AppRatingPrompt';
import { VocabularyCardHeader } from '../components/VocabularyCardHeader';
import { StreakAlertContent } from '../components/StreakAlertContent';
import { StreakCelebrationOverlay } from '../components/StreakCelebrationOverlay';
import {
    VocabularyWord,
    Level,
    LEVELS,
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
    saveLastWordId,
    getLastWordId
} from '../services/progressService';
import { addToFavorites, removeFromFavorites, isFavorite } from '../services/favoritesService';
import {
    clearPendingNotificationWord,
    getPendingNotificationWord,
    scheduleStreakReminderNotification,
} from '../services/notificationService';
import { useAlert } from '../components/CustomAlert';
import { SafeBannerAd } from '../components/SafeBannerAd';
import { loadInterstitial, showInterstitial, AD_IDS } from '../services/adMobService';
import { useTranslation } from 'react-i18next';
import { getTTSLanguageCode } from '../constants';
import { STORAGE_KEYS } from '../services/storageKeys';
import {
    DEFAULT_STREAK_SUMMARY,
    getStreakSummary,
    getStreakSummaryFromState,
    getStreakStatusMessageKey,
    recordDailyStudyAction,
    StreakSummary,
} from '../services/streakService';
import HomeTutorialOverlay, { LayoutRect } from '../components/HomeTutorialOverlay';
import {
    getStreakCelebrationMessageKey,
    shouldShowStreakCelebration,
} from '../utils/streakCelebration';
import {
    dismissReviewPrompt,
    getAutomaticReviewPromptDecision,
    markAutomaticReviewPromptPresented,
    openReviewFeedbackEmail,
    openStoreReviewPage,
    recordSatisfactionRating,
    requestNativeReview,
} from '../services/reviewPromptService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const BEE_COLOR: [number, number, number, number] = [1, 0.78, 0.08, 1];
const BEE_STATIC_ANIMATION = createSwarmAnimation(BEE_COLOR, true);
const BEE_ACTIVE_ANIMATION = createSwarmAnimation(BEE_COLOR, false);

// Responsive utilities
const BASE_WIDTH = 393; // iPhone 14 Pro base width
const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

type TutorialLayoutKey = 'card' | 'favoriteButton' | 'word' | 'exampleSentence' | 'moreExample';
type TutorialLayouts = Record<TutorialLayoutKey, LayoutRect>;

interface StreakCelebrationState {
    id: number;
    streakCount: number;
    streakLabel: string;
    message: string;
}

export function getTutorialSwipeNextStep(step: number, direction: 'left' | 'right'): number | null {
    if (step === 1 && direction === 'right') {
        return 2;
    }

    if (step === 2 && direction === 'left') {
        return 3;
    }

    return null;
}

const EMPTY_TUTORIAL_LAYOUT: LayoutRect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
};

const FEATHER_STAR_POINTS = '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2';

function FavoriteStarIcon({
    color,
    filled = false,
    size = 24,
    style,
}: {
    color: string;
    filled?: boolean;
    size?: number;
    style?: any;
}) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
            <Polygon
                points={FEATHER_STAR_POINTS}
                fill={filled ? color : 'none'}
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

export default function HomeScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();
    const { isAdFree, isLoading: isMonetizationLoading } = useMonetization();
    const { showAlert } = useAlert();
    const { t } = useTranslation();
    const shouldShowAds = !isAdFree && !isMonetizationLoading;

    // State
    const [words, setWords] = useState<VocabularyWord[]>([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentLevel, setCurrentLevel] = useState<Level>('A1');
    const [userLevel, setUserLevel] = useState('beginner');
    const [isLoading, setIsLoading] = useState(true);
    const [learnedCount, setLearnedCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [isCurrentWordFavorite, setIsCurrentWordFavorite] = useState(false);
    const [streakSummary, setStreakSummary] = useState<StreakSummary>({
        ...DEFAULT_STREAK_SUMMARY,
    });
    const [streakCelebration, setStreakCelebration] = useState<StreakCelebrationState | null>(null);
    const [reviewPromptVisible, setReviewPromptVisible] = useState(false);

    // TTS language code for target language pronunciation
    const [ttsLanguage, setTtsLanguage] = useState('en-US');

    // Tutorial state
    const [showTutorial, setShowTutorial] = useState(false);
    const [tutorialLayouts, setTutorialLayouts] = useState<TutorialLayouts | null>(null);
    const showTutorialRef = useRef(false);
    const [tutorialStep, setTutorialStep] = useState(1);
    const tutorialStepRef = useRef(1);

    // Tutorial Element Refs
    const cardRef = useRef<any>(null);
    const favoriteRef = useRef<any>(null);
    const wordRef = useRef<View>(null);
    const exampleSentenceRef = useRef<View>(null);
    const moreExampleRef = useRef<any>(null);
    const tutorialMeasureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Ref to track if initial load has been done
    const hasInitiallyLoaded = useRef(false);
    const isInitialHydrationRef = useRef(true);

    // Track session learned words for Interstitial Ad
    const sessionLearnedCount = useRef(0);
    const pendingInterstitialAfterCelebrationRef = useRef(false);
    const streakCelebrationIdRef = useRef(0);
    const reviewPromptInFlightRef = useRef(false);

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
    const beeFlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const loadRequestIdRef = useRef(0);

    const refreshStreak = useCallback(async () => {
        try {
            const summary = await getStreakSummary();
            setStreakSummary(summary);
        } catch (error) {
            console.error('[HomeScreen] Failed to refresh streak:', error);
        }
    }, []);

    const buildStreakCelebration = useCallback((streakCount: number): StreakCelebrationState => {
        return {
            id: ++streakCelebrationIdRef.current,
            streakCount,
            streakLabel: t('home.streakCelebrationLabel'),
            message: t(getStreakCelebrationMessageKey(streakCount), { count: streakCount }),
        };
    }, [t]);

    const handleStreakCelebrationComplete = useCallback(() => {
        setStreakCelebration(null);

        if (pendingInterstitialAfterCelebrationRef.current) {
            pendingInterstitialAfterCelebrationRef.current = false;
            if (shouldShowAds) {
                showInterstitial().catch(error => {
                    console.error('[HomeScreen] Failed to show queued interstitial:', error);
                });
            }
        }
    }, [shouldShowAds]);

    const measureTutorialLayouts = useCallback(({ show = false, delay = 80 }: { show?: boolean; delay?: number } = {}) => {
        if (tutorialMeasureTimeoutRef.current) {
            clearTimeout(tutorialMeasureTimeoutRef.current);
        }

        tutorialMeasureTimeoutRef.current = setTimeout(() => {
            tutorialMeasureTimeoutRef.current = null;

            const layoutRefs: Array<[TutorialLayoutKey, any]> = [
                ['card', cardRef],
                ['favoriteButton', favoriteRef],
                ['word', wordRef],
                ['exampleSentence', exampleSentenceRef],
                ['moreExample', moreExampleRef],
            ];

            const layouts = {} as TutorialLayouts;
            let measuredCount = 0;

            const finishMeasurement = () => {
                measuredCount += 1;

                if (measuredCount === layoutRefs.length) {
                    console.log('[HomeScreen] Measurements complete:', layouts);
                    setTutorialLayouts(layouts);

                    if (show) {
                        setShowTutorial(true);
                        showTutorialRef.current = true;
                    }
                }
            };

            layoutRefs.forEach(([key, ref]) => {
                const measureTarget = ref.current?.getNode ? ref.current.getNode() : ref.current;

                if (measureTarget?.measureInWindow) {
                    measureTarget.measureInWindow((x: number, y: number, width: number, height: number) => {
                        layouts[key] = { x, y, width, height };
                        finishMeasurement();
                    });
                    return;
                }

                if (measureTarget?.measure) {
                    measureTarget.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
                        layouts[key] = { x: pageX ?? x, y: pageY ?? y, width, height };
                        finishMeasurement();
                    });
                    return;
                }

                layouts[key] = { ...EMPTY_TUTORIAL_LAYOUT };
                finishMeasurement();
            });
        }, delay);
    }, []);

    // Generate position for single bee in top-right corner
    const generateBeePositions = useCallback((): BeePosition[] => {
        const cardWidth = SCREEN_WIDTH - 40; // Card container width

        // Single bee positioned in top-right corner area
        const beePosition: BeePosition = {
            id: 0,
            x: cardWidth - 60, // 60px from right edge
            y: 10,              // 20px from top
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

        beeAnimationRef.current?.stop();
        beeAnimationRef.current = animation;
        animation.start(() => {
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

        beeAnimationRef.current?.stop();
        const staggerAnim = Animated.stagger(50, animations);
        beeAnimationRef.current = staggerAnim;
        staggerAnim.start(() => {
            setBeesAnimating(false);
            callback?.();
        });
    }, []);

    const loadData = useCallback(async (forceReload = false) => {
        // Skip if already loaded and not forcing reload
        if (hasInitiallyLoaded.current && !forceReload) {
            return;
        }

        const requestId = ++loadRequestIdRef.current;
        const isStaleRequest = () => requestId !== loadRequestIdRef.current;

        const shouldBlockScreen = !hasInitiallyLoaded.current;
        if (shouldBlockScreen) {
            setIsLoading(true);
        }
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
                        if (!isStaleRequest()) {
                            setLearnedCount(0);
                            setTotalCount(0);
                            setWords([]);
                        }
                        return;
                    }
                    console.log(`Verified: ${testVocab.length} words generated for level ${level}`);
                } else {
                    console.log('No stored language preferences found');
                    if (!isStaleRequest()) {
                        setLearnedCount(0);
                        setTotalCount(0);
                        setWords([]);
                    }
                    return;
                }
            }

            // Get current level
            const level = await getCurrentLevel();

            // Get user level display
            const savedUserLevel = await AsyncStorage.getItem('@user_level');

            // Get vocabulary for current level
            const vocabulary = await getStoredVocabulary(level);

            // Validate vocabulary is not empty
            if (vocabulary.length === 0) {
                console.warn(`No vocabulary available for level ${level}`);
                if (!isStaleRequest()) {
                    setLearnedCount(0);
                    setTotalCount(0);
                    setWords([]);
                }
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

            // Resume from last saved word ID (find its position in ordered array)
            const lastWordId = await getLastWordId();
            const pending = await getPendingNotificationWord();
            const matchingPendingWordId =
                pending &&
                (!pending.level || pending.level === level) &&
                (!pending.targetLanguage || pending.targetLanguage === targetLang) &&
                orderedWords.some(word => word.id === pending.wordId)
                    ? pending.wordId
                    : null;
            const resumeWordId = matchingPendingWordId ?? lastWordId;
            let resumeIndex = 0;
            if (resumeWordId !== null) {
                const foundIndex = orderedWords.findIndex(w => w.id === resumeWordId);
                if (foundIndex !== -1) {
                    resumeIndex = foundIndex;
                    console.log(`Resuming from word ID ${resumeWordId} at position ${foundIndex}`);
                }
            }

            // Update counts - these should now be guaranteed correct
            const learned = await getLearnedCount(level);
            const total = await getTotalWords(level);
            const latestStreakSummary = await getStreakSummary();

            if (isStaleRequest()) {
                return;
            }

            setCurrentLevel(level);
            if (savedUserLevel) {
                setUserLevel(savedUserLevel);
            }
            setTtsLanguage(getTTSLanguageCode(targetLang));
            setWords(orderedWords);
            setCurrentWordIndex(resumeIndex);
            setLearnedCount(learned);
            setTotalCount(total);
            setStreakSummary(latestStreakSummary);

            if (matchingPendingWordId !== null) {
                await saveLastWordId(matchingPendingWordId);
                await clearPendingNotificationWord();
                console.log(`[HomeScreen] Applied pending word ${matchingPendingWordId} during load`);
            }

            hasInitiallyLoaded.current = true;

            console.log(`Loaded ${orderedWords.length} unlearned words from ${vocabulary.length} total for level ${level} (${learned} learned)`);
        } catch (error) {
            console.error('Error loading data:', error);
            // Set safe defaults on error
            if (!isStaleRequest()) {
                setLearnedCount(0);
                setTotalCount(0);
                setWords([]);
            }
        } finally {
            if (!isStaleRequest() && shouldBlockScreen) {
                isInitialHydrationRef.current = false;
                setIsLoading(false);
            }
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

    const consumePendingNotificationWord = useCallback(async (): Promise<boolean> => {
        const pending = await getPendingNotificationWord();
        if (pending === null) return false;

        if (isLoading) {
            console.log('[HomeScreen] Pending word deferred - initial data still loading');
            return false;
        }

        const { wordId, level: pendingLevel, targetLanguage } = pending;

        // Validate level and language match before showing
        const currentLevelValue = await getCurrentLevel();
        if (pendingLevel && pendingLevel !== currentLevelValue) {
            console.log(`[HomeScreen] Pending word ${wordId} ignored - level changed (${pendingLevel} -> ${currentLevelValue})`);
            await clearPendingNotificationWord();
            return false;
        }

        const currentTargetLanguage = await AsyncStorage.getItem(STORAGE_KEYS.TARGET_LANGUAGE);
        if (targetLanguage && currentTargetLanguage && targetLanguage !== currentTargetLanguage) {
            console.log(`[HomeScreen] Pending word ${wordId} ignored - language changed (${targetLanguage} -> ${currentTargetLanguage})`);
            await clearPendingNotificationWord();
            return false;
        }

        const level = pendingLevel && LEVELS.includes(pendingLevel as Level)
            ? (pendingLevel as Level)
            : currentLevelValue;
        const existingWordIndex = words.findIndex(w => w.id === wordId);
        if (existingWordIndex !== -1) {
            await saveLastWordId(wordId);
            setCurrentWordIndex(existingWordIndex);
            await clearPendingNotificationWord();
            console.log(`Showing word from notification: ${words[existingWordIndex].word}`);
            return true;
        }

        const vocabulary = await getStoredVocabulary(level);
        const pendingWord = vocabulary.find(w => w.id === wordId);

        if (!pendingWord) {
            console.log(`[HomeScreen] Pending word ${wordId} not found yet - will retry after data sync`);
            return false;
        }

        await saveLastWordId(wordId);
        setWords(prevWords => {
            const otherWords = prevWords.filter(w => w.id !== wordId);
            return [pendingWord, ...otherWords];
        });
        setCurrentWordIndex(0);
        await clearPendingNotificationWord();
        console.log(`Showing word from notification: ${pendingWord.word}`);
        return true;
    }, [isLoading, words]);

    const checkAndUpdate = useCallback(async (retryPending: boolean = false) => {
        let handledPending = await consumePendingNotificationWord();

        if (!handledPending && retryPending) {
            // Response listener can write pending word slightly after Home resumes.
            await new Promise<void>(resolve => setTimeout(() => resolve(), 250));
            handledPending = await consumePendingNotificationWord();
        }

        if (handledPending) {
            await refreshStreak();
            return;
        }

        if (hasInitiallyLoaded.current) {
            // Check if level has changed
            const newLevel = await getCurrentLevel();
            if (newLevel !== currentLevel) {
                // Level changed, reload everything
                hasInitiallyLoaded.current = false;
                await loadData(true);
                return;
            } else {
                await updateCounts();
            }
        }
        await refreshStreak();
    }, [consumePendingNotificationWord, currentLevel, loadData, refreshStreak, updateCounts]);

    // Update counts on focus and check if level changed or pending notification word
    useFocusEffect(
        useCallback(() => {
            checkAndUpdate(true).catch(error => {
                console.error('[HomeScreen] Focus update failed:', error);
            });
        }, [checkAndUpdate])
    );

    // Also check on app resume because Home can stay mounted without getting a new focus event.
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                checkAndUpdate(true).catch(error => {
                    console.error('[HomeScreen] Resume update failed:', error);
                });
            }
        });

        return () => subscription.remove();
    }, [checkAndUpdate]);

    // When initial data load completes, retry pending notification consumption once more.
    useEffect(() => {
        if (!isLoading) {
            checkAndUpdate(true).catch(error => {
                console.error('[HomeScreen] Post-load update failed:', error);
            });
        }
    }, [isLoading, checkAndUpdate]);

    // Check for Home screen tutorial
    useEffect(() => {
        if (!isLoading && words.length > 0) {
            console.log('[HomeScreen] Checking tutorial flag... words.length:', words.length);
            AsyncStorage.getItem(STORAGE_KEYS.HAS_SEEN_HOME_TUTORIAL).then(val => {
                console.log(`[HomeScreen] HAS_SEEN_HOME_TUTORIAL value in storage is:`, val);
                if (val !== 'true') {
                    console.log('[HomeScreen] Will trigger tutorial in 500ms...');
                    measureTutorialLayouts({ show: true, delay: 500 });
                }
            });
        }
    }, [isLoading, words.length, measureTutorialLayouts]);

    useEffect(() => {
        if (!showTutorial || tutorialStep <= 2) return;
        measureTutorialLayouts({ delay: 60 });
    }, [showTutorial, tutorialStep, currentWordIndex, measureTutorialLayouts]);

    const handleTutorialComplete = async () => {
        setShowTutorial(false);
        showTutorialRef.current = false;
        setTutorialStep(1);
        tutorialStepRef.current = 1;
        await AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_HOME_TUTORIAL, 'true');
    };

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
    const initialLoadingPlaceholderColor = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
    const initialLoadingAccentColor = isDarkMode ? 'rgba(255,200,20,0.22)' : 'rgba(255,200,20,0.28)';
    const streakAccentColor = '#FF8F1F';
    const streakTextColor = streakSummary.completedToday ? streakAccentColor : colors.text;
    const streakAccessibilityLabel = t('home.streakAccessibilityLabel', { count: streakSummary.currentStreak });
    const statsContainerStyle = [
        styles.statsBlurContainer,
        {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.72)',
            borderWidth: isDarkMode ? 0 : 1,
            borderColor: isDarkMode ? 'transparent' : colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDarkMode ? 0 : 0.04,
            shadowRadius: 8,
            elevation: isDarkMode ? 0 : 2,
        },
    ];
    const renderStatsContainer = (children: React.ReactNode) => {
        if (Platform.OS === 'android') {
            return <View style={statsContainerStyle}>{children}</View>;
        }

        return (
            <BlurView
                intensity={isDarkMode ? 20 : 32}
                tint={isDarkMode ? "dark" : "light"}
                style={statsContainerStyle}
            >
                {children}
            </BlurView>
        );
    };

    const handleStreakPress = useCallback(() => {
        const statusMessage = t(getStreakStatusMessageKey(streakSummary.status));

        showAlert({
            title: t('home.streakTitle'),
            content: (
                <StreakAlertContent
                    statusMessage={statusMessage}
                    currentLabel={t('home.currentStreakLabel')}
                    bestLabel={t('home.bestStreakLabel')}
                    currentValue={streakSummary.currentStreak}
                    bestValue={streakSummary.longestStreak}
                />
            ),
        });
    }, [showAlert, streakSummary.status, streakSummary.currentStreak, streakSummary.longestStreak, t]);

    const showStoreOpenError = useCallback(() => {
        showAlert({
            title: t('common.error'),
            message: t('reviewPrompt.storeOpenError', {
                defaultValue: 'We could not open the store review page. Please try again later.',
            }),
        });
    }, [showAlert, t]);

    const handleReviewPromptDismiss = useCallback(async () => {
        setReviewPromptVisible(false);
        await dismissReviewPrompt();
    }, []);

    const handleReviewRateInStore = useCallback(async (rating: number) => {
        setReviewPromptVisible(false);
        await recordSatisfactionRating(rating);
        const result = await openStoreReviewPage('automatic-rating-prompt');

        if (!result.opened) {
            showStoreOpenError();
        }
    }, [showStoreOpenError]);

    const handleReviewFeedback = useCallback(async (rating?: number) => {
        setReviewPromptVisible(false);
        await recordSatisfactionRating(rating ?? 0);
        const opened = await openReviewFeedbackEmail(rating);

        if (!opened) {
            showAlert({
                title: t('common.error'),
                message: t('reviewPrompt.feedbackOpenError', {
                    defaultValue: 'We could not open your email app. Please contact support@vocbee.com.',
                }),
            });
        }
    }, [showAlert, t]);

    const maybeShowAutomaticReviewPrompt = useCallback(async ({
        nextLearnedCount,
        nextSessionLearnedCount,
        isBusy,
    }: {
        nextLearnedCount: number;
        nextSessionLearnedCount: number;
        isBusy: boolean;
    }) => {
        if (reviewPromptVisible || reviewPromptInFlightRef.current) {
            return;
        }

        reviewPromptInFlightRef.current = true;

        try {
            const decision = await getAutomaticReviewPromptDecision({
                totalLearnedCount: nextLearnedCount,
                sessionLearnedCount: nextSessionLearnedCount,
                isTutorialVisible: showTutorialRef.current,
                isBusy,
            });

            if (!decision.shouldPrompt) {
                return;
            }

            if (decision.mode === 'native') {
                await requestNativeReview();
                return;
            }

            await markAutomaticReviewPromptPresented('satisfactionShown');
            setReviewPromptVisible(true);
        } catch (error) {
            console.warn('[HomeScreen] Review prompt check failed', error);
        } finally {
            reviewPromptInFlightRef.current = false;
        }
    }, [reviewPromptVisible]);

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
            if (beeFlightTimeoutRef.current) {
                clearTimeout(beeFlightTimeoutRef.current);
            }

            beeFlightTimeoutRef.current = setTimeout(() => {
                beeFlightTimeoutRef.current = null;
                animateBeesIn(newPositions);
            }, 300);
        }

        return () => {
            if (beeFlightTimeoutRef.current) {
                clearTimeout(beeFlightTimeoutRef.current);
                beeFlightTimeoutRef.current = null;
            }
        };
    }, [currentWordIndex, currentWord, isLoading, words.length, generateBeePositions, animateBeesIn, currentLevel]);

    useEffect(() => {
        return () => {
            if (beeFlightTimeoutRef.current) {
                clearTimeout(beeFlightTimeoutRef.current);
            }
            if (tutorialMeasureTimeoutRef.current) {
                clearTimeout(tutorialMeasureTimeoutRef.current);
            }
            beeAnimationRef.current?.stop?.();
        };
    }, []);

    // Swipe animation setup
    const position = useRef(new Animated.ValueXY()).current;
    
    // Tutorial Card Animation
    const tutorialAnimRef = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        if (!showTutorial) {
            tutorialAnimRef.current?.stop();
            return;
        }

        if (tutorialStep === 1) {
            tutorialAnimRef.current?.stop();
            tutorialAnimRef.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(position, {
                        toValue: { x: 30, y: 0 },
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false, // Position depends on PanResponder layout setup
                    }),
                    Animated.timing(position, {
                        toValue: { x: 0, y: 0 },
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                ])
            );
            tutorialAnimRef.current.start();
        } else if (tutorialStep === 2) {
            tutorialAnimRef.current?.stop();
            tutorialAnimRef.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(position, {
                        toValue: { x: -30, y: 0 },
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                    Animated.timing(position, {
                        toValue: { x: 0, y: 0 },
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                ])
            );
            tutorialAnimRef.current.start();
        } else {
            tutorialAnimRef.current?.stop();
            Animated.spring(position, {
                toValue: { x: 0, y: 0 },
                useNativeDriver: false,
                friction: 5,
            }).start();
        }

        return () => {
            tutorialAnimRef.current?.stop();
        };
    }, [showTutorial, tutorialStep, position]);

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
        const tutorialNextStep = showTutorialRef.current
            ? getTutorialSwipeNextStep(tutorialStepRef.current, direction)
            : null;
        const isTutorialPracticeSwipe = tutorialNextStep !== null;

        // Practice swipes in the tutorial should only teach the gesture.
        if (!isTutorialPracticeSwipe && beePositions.length > 0) {
            animateBeesAway(beePositions);
        }

        Animated.timing(position, {
            toValue: { x, y: 0 },
            duration: 300,
            useNativeDriver: false,
        }).start(async () => {
            if (isTutorialPracticeSwipe) {
                requestAnimationFrame(() => {
                    position.setValue({ x: 0, y: 0 });

                    if (showTutorialRef.current) {
                        setTutorialStep(tutorialNextStep);
                        tutorialStepRef.current = tutorialNextStep;
                    }
                });
                return;
            }

            const swipedWord = currentWord;
            const wasLastWord = currentWordIndex >= words.length - 1;

            // Advance UI immediately to avoid showing the previous word
            if (!wasLastWord) {
                setCurrentWordIndex(prev => prev + 1);
            }

            // Reset card position on the next frame so the new word renders first
            requestAnimationFrame(() => {
                position.setValue({ x: 0, y: 0 });
                
                // Advance tutorial step after card has reset, to prevent animation conflicts
                if (showTutorialRef.current) {
                    const nextTutorialStep = getTutorialSwipeNextStep(tutorialStepRef.current, direction);
                    if (nextTutorialStep !== null) {
                        setTutorialStep(nextTutorialStep);
                        tutorialStepRef.current = nextTutorialStep;
                    }
                }
            });

            // Side effects (storage/progress) can run after UI has advanced
            if (direction === 'right' && swipedWord) {
                await markWordAsLearned(currentLevel, swipedWord.id);
                const nextLearnedCount = learnedCount + 1;
                setLearnedCount(prev => prev + 1);

                const streakUpdate = await recordDailyStudyAction();
                setStreakSummary(getStreakSummaryFromState(streakUpdate.state));
                scheduleStreakReminderNotification().catch(error => {
                    console.error('[HomeScreen] Failed to refresh streak reminder notification:', error);
                });
                const shouldCelebrate = shouldShowStreakCelebration(streakUpdate.didIncrement);

                if (shouldCelebrate) {
                    setStreakCelebration(buildStreakCelebration(streakUpdate.state.currentStreak));
                }

                // Increment session count and check for ad
                const nextSessionLearnedCount = sessionLearnedCount.current + 1;
                sessionLearnedCount.current = nextSessionLearnedCount;
                console.log(`Session learned count: ${nextSessionLearnedCount}`);

                const shouldShowInterstitial = nextSessionLearnedCount % 10 === 0;
                if (shouldShowInterstitial && shouldShowAds) {
                    console.log('Triggering Interstitial Ad');
                    if (shouldCelebrate) {
                        pendingInterstitialAfterCelebrationRef.current = true;
                    } else {
                        await showInterstitial();
                    }
                }

                const newLevel = await checkAndAdvanceLevel();
                if (newLevel !== currentLevel) {
                    console.log(`Advanced to level ${newLevel}`);
                    setCurrentLevel(newLevel);
                    await loadData(true);
                    return;
                }

                await maybeShowAutomaticReviewPrompt({
                    nextLearnedCount,
                    nextSessionLearnedCount,
                    isBusy: shouldCelebrate || shouldShowInterstitial,
                });
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
    }, [buildStreakCelebration, currentWord, currentLevel, currentWordIndex, words.length, learnedCount, loadData, maybeShowAutomaticReviewPrompt, position, beePositions, animateBeesAway, shouldShowAds]);

    const resetPosition = useCallback(() => {
        Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 5,
        }).start();
    }, [position]);

    // Load interstitial on mount
    useEffect(() => {
        if (shouldShowAds) {
            void loadInterstitial();
        }
    }, [shouldShowAds]);

    // Update refs when functions change
    useEffect(() => {
        swipeCardRef.current = swipeCard;
        resetPositionRef.current = resetPosition;
    }, [swipeCard, resetPosition]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gesture) => {
                if (showTutorialRef.current && tutorialStepRef.current > 2) return false;
                // Allow TouchableOpacity children to handle taps by not using Capture
                // Only take over for swipe gestures (larger movement threshold)
                return Math.abs(gesture.dx) > 15 || Math.abs(gesture.dy) > 15;
            },
            onPanResponderGrant: () => {
                tutorialAnimRef.current?.stop();
            },
            onPanResponderMove: (_, gesture) => {
                position.setValue({ x: gesture.dx, y: gesture.dy * 0.3 });
            },
            onPanResponderRelease: (_, gesture) => {
                if (showTutorialRef.current) {
                    if (tutorialStepRef.current === 1 && gesture.dx <= SWIPE_THRESHOLD) {
                        resetPositionRef.current?.();
                        return;
                    }
                    if (tutorialStepRef.current === 2 && gesture.dx >= -SWIPE_THRESHOLD) {
                        resetPositionRef.current?.();
                        return;
                    }
                    if (tutorialStepRef.current > 2) {
                        resetPositionRef.current?.();
                        return;
                    }
                }

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
        if (showTutorialRef.current && tutorialStepRef.current === 3) {
            setTutorialStep(4);
            tutorialStepRef.current = 4;
        }
        
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

    const handleWordPress = async () => {
        if (!currentWord) return;

        if (showTutorialRef.current && tutorialStepRef.current === 4) {
            setTutorialStep(5);
            tutorialStepRef.current = 5;
        }

        console.log('Word button pressed:', currentWord.word);
        try {
            await Speech.stop();
            await Speech.speak(currentWord.word, {
                language: ttsLanguage,
                pitch: 1.0,
                rate: 0.75,
            });
            console.log('Speech started successfully');
        } catch (error) {
            console.error('Speech error:', error);
        }
    };

    const handleExampleSentencePress = async () => {
        if (!currentWord) return;

        if (showTutorialRef.current && tutorialStepRef.current === 5) {
            setTutorialStep(6);
            tutorialStepRef.current = 6;
        }

        console.log('Example sentence pressed:', currentWord.sentence1);
        try {
            await Speech.stop();
            await Speech.speak(currentWord.sentence1, {
                language: ttsLanguage,
                pitch: 1.0,
                rate: 0.75,
            });
            console.log('Speech started successfully');
        } catch (error) {
            console.error('Speech error:', error);
        }
    };

    const handleMoreExamplePress = () => {
        if (!currentWord) return;

        if (showTutorialRef.current && tutorialStepRef.current === 6) {
            handleTutorialComplete();
        }

        navigation.navigate('ExampleSentences', {
            word: currentWord.word,
            pronunciation: currentWord.pronunciation ?? null,
            translation: currentWord.translation,
            sentence1: currentWord.sentence1,
            sentence2: currentWord.sentence2,
            nativeSentence1: currentWord.nativeSentence1,
            nativeSentence2: currentWord.nativeSentence2
        });
    };

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
                    onPress={handleToggleFavorite}
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
                    <TouchableOpacity onPress={handleWordPress} activeOpacity={0.7} style={styles.tutorialWordTouchable}>
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
                    <TouchableOpacity onPress={handleExampleSentencePress} activeOpacity={0.7} style={styles.tutorialSentenceTouchable}>
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
                    onPress={handleMoreExamplePress}
                    activeOpacity={0.85}
                >
                    <Text style={[styles.fullWidthButtonText, { color: colors.text }]}>{t('home.moreExample')}</Text>
                </TouchableOpacity>
            );
        }

        return null;
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

                        {/* Lower Section - Example Sentences with Gray Background */}
                        <View style={[styles.cardLowerSectionStruct, { zIndex: 1 }]}>
                            {/* Background extracted */}
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

    // Keep a themed home skeleton visible only during the very first hydration
    // so launch stays stable without showing a second splash-like screen.
    if (isLoading && isInitialHydrationRef.current) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
                <HomeHeader
                    titleColor={colors.text}
                    iconColor={colors.text}
                    streakCount={0}
                    streakCompletedToday={false}
                    streakAtRisk={false}
                    streakTextColor={colors.text}
                    streakAccentColor={streakAccentColor}
                    placeholderColor={initialLoadingPlaceholderColor}
                    showPlaceholders
                />

                {renderStatsContainer(
                    <View style={styles.statsSection}>
                        <View style={styles.levelRow}>
                            <View style={[styles.loadingLine, styles.loadingLevelBadge, { backgroundColor: initialLoadingAccentColor }]} />
                            <View style={[styles.loadingLine, styles.loadingLevelText, { backgroundColor: initialLoadingPlaceholderColor }]} />
                            <View style={[styles.loadingLine, styles.loadingGoalText, { backgroundColor: initialLoadingPlaceholderColor }]} />
                        </View>
                        <View
                            style={[
                                styles.progressBg,
                                {
                                    backgroundColor: isDarkMode ? '#2c2c2e' : colors.surfaceLight,
                                    borderWidth: isDarkMode ? 0 : 1,
                                    borderColor: isDarkMode ? 'transparent' : colors.border,
                                }
                            ]}
                        >
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        backgroundColor: initialLoadingAccentColor,
                                        width: '38%',
                                        shadowOpacity: 0,
                                        shadowRadius: 0,
                                        elevation: 0,
                                    }
                                ]}
                            />
                        </View>
                    </View>
                )}

                <View style={styles.cardArea}>
                    <View style={styles.cardStackContainer}>
                        <View
                            style={[
                                styles.cardContainer,
                                {
                                    transform: [
                                        { scale: 0.95 },
                                        { translateY: 12 },
                                    ],
                                    zIndex: 5,
                                    opacity: 0.55,
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.heroCard,
                                    {
                                        backgroundColor: colors.surface,
                                        borderColor: colors.border,
                                        borderWidth: 1,
                                    }
                                ]}
                            />
                        </View>

                        <View style={[styles.cardContainer, { zIndex: 10 }]}>
                            <View
                                style={[
                                    styles.heroCard,
                                    {
                                        backgroundColor: colors.surface,
                                        borderColor: colors.border,
                                        borderWidth: 0.5,
                                    }
                                ]}
                            >
                                <View style={styles.cardContentAbove}>
                                    <View style={styles.favoriteButton}>
                                        <View style={[styles.loadingFavoritePlaceholder, { backgroundColor: initialLoadingPlaceholderColor }]} />
                                    </View>

                                    <View style={styles.cardUpperSection}>
                                        <View style={[styles.loadingLine, styles.loadingWordPlaceholder, { backgroundColor: initialLoadingPlaceholderColor }]} />
                                        <View style={[styles.loadingLine, styles.loadingPronunciationPlaceholder, { backgroundColor: initialLoadingPlaceholderColor }]} />
                                        <View style={[styles.loadingLine, styles.loadingTranslationPlaceholder, { backgroundColor: initialLoadingAccentColor }]} />
                                    </View>

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
                                            <View style={[styles.loadingLine, styles.loadingSentencePlaceholder, { backgroundColor: initialLoadingPlaceholderColor }]} />
                                            <View style={[styles.thinDivider, { backgroundColor: colors.border }]} />
                                            <View style={[styles.loadingLine, styles.loadingSentenceTranslationPlaceholder, { backgroundColor: initialLoadingPlaceholderColor }]} />
                                        </View>

                                        <View style={[styles.fullWidthButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                                            <View style={[styles.loadingLine, styles.loadingButtonPlaceholder, { backgroundColor: initialLoadingPlaceholderColor }]} />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {shouldShowAds && (
                    <View style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: insets.bottom > 0 ? 0 : 10, backgroundColor: colors.background }}>
                        <View style={[styles.loadingBannerPlaceholder, { backgroundColor: initialLoadingPlaceholderColor }]} />
                    </View>
                )}
            </View>
        );
    }

    // No words state
    if (words.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
                <HomeHeader
                    titleColor={colors.text}
                    iconColor={colors.text}
                    streakCount={streakSummary.currentStreak}
                    streakCompletedToday={streakSummary.completedToday}
                    streakAtRisk={streakSummary.atRisk}
                    streakTextColor={streakTextColor}
                    streakAccentColor={streakAccentColor}
                    streakAccessibilityLabel={streakAccessibilityLabel}
                    onPressStreak={handleStreakPress}
                    onPressFavorites={() => navigation.navigate('Favorites')}
                    onPressSettings={() => navigation.navigate('Settings')}
                />

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
            <HomeHeader
                titleColor={colors.text}
                iconColor={colors.text}
                streakCount={streakSummary.currentStreak}
                streakCompletedToday={streakSummary.completedToday}
                streakAtRisk={streakSummary.atRisk}
                streakTextColor={streakTextColor}
                streakAccentColor={streakAccentColor}
                streakAccessibilityLabel={streakAccessibilityLabel}
                onPressStreak={handleStreakPress}
                onPressFavorites={() => navigation.navigate('Favorites')}
                onPressSettings={() => navigation.navigate('Settings')}
            />

            {/* Stats Section */}
            {renderStatsContainer(
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
                        <View
                            style={[
                                styles.progressBg,
                                {
                                    backgroundColor: isDarkMode ? '#2c2c2e' : colors.surfaceLight,
                                    borderWidth: isDarkMode ? 0 : 1,
                                    borderColor: isDarkMode ? 'transparent' : colors.border,
                                }
                            ]}
                        >
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
            )}

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
                                    // Steps 1 & 2 keep the card above the dim layer so swipe guidance stays interactive.
                                    // Steps 3-6 move the card below the overlay; only cloned focus targets render above it.
                                    zIndex: (showTutorial && tutorialStep <= 2) ? 10000 : 10,
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
                                        ref={favoriteRef}
                                        style={[styles.favoriteButton, { zIndex: (showTutorial && tutorialStep === 3) ? 100 : 1 }]}
                                        onPress={handleToggleFavorite}
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

                                    {/* Upper Section - Word and Translation */}
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
                                        onPressWord={handleWordPress}
                                    />

                                    {/* Lower Section - Example Sentences with Gray Background */}
                                    <View style={[styles.cardLowerSectionStruct, { zIndex: (showTutorial && tutorialStep >= 5) ? 100 : 1 }]}>
                                        {/* Background extracted so elements can escape zIndex context */}
                                        <View style={[
                                            StyleSheet.absoluteFillObject,
                                            {
                                                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                                borderBottomLeftRadius: 32,
                                                borderBottomRightRadius: 32,
                                            }
                                        ]} />

                                        <View style={styles.exampleSentencesContainer}>
                                            {/* Example Sentence */}
                                            <View
                                                ref={exampleSentenceRef}
                                                collapsable={false}
                                                style={{ width: '100%', zIndex: (showTutorial && tutorialStep === 5) ? 100 : 1 }}
                                            >
                                                <TouchableOpacity
                                                    onPress={handleExampleSentencePress}
                                                    activeOpacity={0.75}
                                                    style={styles.exampleSentenceTouchable}
                                                >
                                                    <Text style={[styles.cardExampleText, { color: colors.text }]}>
                                                        {currentWord.sentence1}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>

                                            {/* Thin Divider Line */}
                                            <View style={[styles.thinDivider, { backgroundColor: colors.border }]} />

                                            {/* Translation */}
                                            <Text style={[styles.cardTranslationText, { color: colors.textSecondary }]}>
                                                {currentWord.nativeSentence1}
                                            </Text>
                                        </View>

                                        {/* More Example Button - Full Width at Bottom */}
                                        <TouchableOpacity
                                            ref={moreExampleRef}
                                            style={[styles.fullWidthButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', zIndex: (showTutorial && tutorialStep === 6) ? 100 : 1 }]}
                                            onPress={handleMoreExamplePress}
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
                                        key={`${bee.id}-${beesAnimating ? 'animated' : 'static'}`}
                                        source={beesAnimating ? BEE_ACTIVE_ANIMATION : BEE_STATIC_ANIMATION}
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
            {shouldShowAds && (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: insets.bottom > 0 ? 0 : 10, backgroundColor: colors.background }}>
                    <SafeBannerAd unitId={AD_IDS.BANNER} />
                </View>
            )}

            {/* Tutorial Overlay */}
            {showTutorial && tutorialLayouts && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 9000 }]} pointerEvents="box-none">
                    <HomeTutorialOverlay
                        visible={showTutorial}
                        onComplete={handleTutorialComplete}
                        currentStep={tutorialStep}
                        renderHighlight={renderTutorialHighlight}
                        onNext={() => {
                            if (tutorialStep < 6) {
                                setTutorialStep(prev => {
                                    const next = prev + 1;
                                    tutorialStepRef.current = next;
                                    return next;
                                });
                            } else {
                                handleTutorialComplete();
                            }
                        }}
                        layouts={tutorialLayouts}
                    />
                </View>
            )}

            <StreakCelebrationOverlay
                visible={streakCelebration !== null}
                celebrationKey={streakCelebration?.id ?? 0}
                streakCount={streakCelebration?.streakCount ?? 0}
                streakLabel={streakCelebration?.streakLabel ?? ''}
                message={streakCelebration?.message ?? ''}
                onComplete={handleStreakCelebrationComplete}
            />
            <AppRatingPrompt
                visible={reviewPromptVisible}
                onDismiss={handleReviewPromptDismiss}
                onRateInStore={handleReviewRateInStore}
                onSendFeedback={handleReviewFeedback}
            />
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    loadingLine: {
        borderRadius: 999,
    },
    loadingLevelBadge: {
        width: 48,
        height: 18,
    },
    loadingLevelText: {
        width: 112,
        height: 14,
    },
    loadingGoalText: {
        width: 92,
        height: 14,
        marginLeft: 'auto',
    },
    loadingFavoritePlaceholder: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    loadingWordPlaceholder: {
        width: '62%',
        maxWidth: 220,
        height: moderateScale(34),
        marginBottom: scale(8),
    },
    loadingPronunciationPlaceholder: {
        width: '48%',
        maxWidth: 180,
        height: moderateScale(16),
        marginBottom: 12,
    },
    loadingTranslationPlaceholder: {
        width: '42%',
        maxWidth: 150,
        height: moderateScale(22),
        marginBottom: 24,
    },
    loadingSentencePlaceholder: {
        width: '78%',
        height: 16,
    },
    loadingSentenceTranslationPlaceholder: {
        width: '68%',
        height: 14,
    },
    loadingButtonPlaceholder: {
        width: 148,
        height: 14,
    },
    loadingBannerPlaceholder: {
        width: SCREEN_WIDTH - 48,
        maxWidth: 360,
        height: 52,
        borderRadius: 16,
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
