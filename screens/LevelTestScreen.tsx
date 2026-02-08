import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../types';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useTheme } from '../context/ThemeContext';
import { FONT_FAMILY } from '../utils/typography';
import { Button } from '../components/UIComponents';
import { useTranslation } from 'react-i18next';
import { mergeVocabulary, VocabularyWord, Level } from '../services/vocabularyService';

type LevelTestNavProp = StackNavigationProp<RootStackParamList>;
type LevelTestRouteProp = RouteProp<RootStackParamList, 'LevelTest'>;

// Question structure for dynamic test
interface TestQuestion {
    id: number;
    word: string;        // Target language word (question)
    correct: string;     // Native language translation (correct answer)
    options: string[];   // All 4 options including correct
    level: Level;
}

// Number of questions per level for the test
const QUESTIONS_PER_LEVEL: { level: Level; count: number }[] = [
    { level: 'A1', count: 1 },
    { level: 'A2', count: 1 },
    { level: 'B1', count: 1 },
    { level: 'B2', count: 2 },
    { level: 'C1', count: 2 },
];

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Generate test questions from vocabulary
async function generateTestQuestions(
    nativeLanguage: string,
    targetLanguage: string
): Promise<TestQuestion[]> {
    const questions: TestQuestion[] = [];
    let questionId = 1;

    for (const { level, count } of QUESTIONS_PER_LEVEL) {
        try {
            const vocabulary = await mergeVocabulary(nativeLanguage, targetLanguage, level);

            if (vocabulary.length < 4) {
                console.warn(`Not enough words for level ${level}`);
                continue;
            }

            // Shuffle and pick words for questions
            const shuffledWords = shuffleArray(vocabulary);
            const selectedWords = shuffledWords.slice(0, count);

            for (const word of selectedWords) {
                // Get 3 distractors from the same level (excluding current word)
                const distractors = shuffleArray(
                    vocabulary.filter(w => w.id !== word.id)
                ).slice(0, 3).map(w => w.translation);

                // Combine correct answer with distractors and shuffle
                const allOptions = shuffleArray([word.translation, ...distractors]);

                questions.push({
                    id: questionId++,
                    word: word.word,
                    correct: word.translation,
                    options: allOptions,
                    level: level,
                });
            }
        } catch (error) {
            console.error(`Error loading vocabulary for level ${level}:`, error);
        }
    }

    return questions;
}

export default function LevelTestScreen() {
    const navigation = useNavigation<LevelTestNavProp>();
    const route = useRoute<LevelTestRouteProp>();
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { t } = useTranslation();

    const [questions, setQuestions] = useState<TestQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);

    // Load questions on mount
    useEffect(() => {
        const loadQuestions = async () => {
            try {
                setIsLoading(true);

                // First try to get languages from route params (from SetupScreens)
                let nativeLang: string | undefined = route.params?.nativeLanguage;
                let targetLang: string | undefined = route.params?.targetLanguage;

                // Fallback to AsyncStorage if not passed (for existing users re-taking test)
                if (!nativeLang || !targetLang) {
                    const storedNative = await AsyncStorage.getItem('@native_language');
                    const storedTarget = await AsyncStorage.getItem('@target_language');
                    nativeLang = storedNative ?? undefined;
                    targetLang = storedTarget ?? undefined;
                }

                if (!nativeLang || !targetLang) {
                    console.error('Languages not set');
                    navigation.goBack();
                    return;
                }

                const generatedQuestions = await generateTestQuestions(nativeLang, targetLang);

                if (generatedQuestions.length === 0) {
                    console.error('No questions generated');
                    navigation.goBack();
                    return;
                }

                setQuestions(generatedQuestions);
            } catch (error) {
                console.error('Error loading test questions:', error);
                navigation.goBack();
            } finally {
                setIsLoading(false);
            }
        };

        loadQuestions();
    }, [navigation]);

    const currentQuestion = questions[currentQuestionIndex];
    const totalQuestions = questions.length;
    const progressPercent = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

    const handleAnswerSelect = (answer: string) => {
        setSelectedAnswer(answer);
    };

    const handleNext = () => {
        if (!currentQuestion) return;

        if (selectedAnswer === currentQuestion.correct) {
            setCorrectAnswers(prev => prev + 1);
        }

        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
        } else {
            const finalScore = selectedAnswer === currentQuestion.correct ? correctAnswers + 1 : correctAnswers;
            setCorrectAnswers(finalScore);
            setShowResult(true);
        }
    };

    const calculateLevel = useCallback(() => {
        // Scoring based on total questions (7 by default)
        // 0-2 correct = beginner
        // 3-5 correct = intermediate  
        // 6-7 correct = advanced
        const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

        if (percentage >= 80) return 'advanced';
        if (percentage >= 50) return 'intermediate';
        return 'beginner';
    }, [correctAnswers, totalQuestions]);

    const detectedLevel = calculateLevel();

    const handleContinue = () => {
        navigation.navigate('NativeLanguage', { detectedLevel });
    };

    const levelInfo = detectedLevel === 'advanced'
        ? { title: t('levelTest.advanced'), range: 'C1' }
        : detectedLevel === 'intermediate'
            ? { title: t('levelTest.intermediate'), range: 'B1-B2' }
            : { title: t('levelTest.beginner'), range: 'A1-A2' };

    // Loading Screen
    if (isLoading) {
        return (
            <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    {t('common.loading')}
                </Text>
            </View>
        );
    }

    // Result Screen
    if (showResult) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
                <ScrollView style={styles.content} contentContainerStyle={styles.resultContainer}>
                    <View style={styles.resultContent}>
                        <Text style={[styles.resultTitle, { color: colors.text }]}>{t('levelTest.testComplete')}</Text>
                        <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
                            {t('levelTest.resultDesc', { correct: correctAnswers, total: totalQuestions })}
                        </Text>

                        <View style={[styles.levelResultCard, { backgroundColor: colors.background }]}>
                            <Text style={[styles.levelResultLabel, { color: colors.textSecondary }]}>{t('levelTest.yourLevel')}</Text>
                            <Text style={[styles.levelResultTitle, { color: colors.primary }]}>{levelInfo.title}</Text>
                            <Text style={[styles.levelResultRange, { color: colors.text }]}>{levelInfo.range}</Text>
                        </View>

                        <Text style={[styles.resultMessage, { color: colors.textSecondary }]}>
                            {t('levelTest.customizeMessage')}
                        </Text>
                    </View>
                </ScrollView>

                <View style={[styles.bottomButton, { paddingBottom: insets.bottom + 16 }]}>
                    <Button title={t('common.continue')} onPress={handleContinue} />
                </View>
            </View>
        );
    }

    // Quiz Screen
    if (!currentQuestion) {
        return null;
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <FontAwesome5 name="arrow-left" size={24} color={colors.text} />
                </TouchableOpacity>

                <View style={styles.progressWrapper}>
                    <View style={[styles.progressBg, { backgroundColor: colors.surfaceLight }]}>
                        <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: colors.primary }]} />
                    </View>
                </View>

                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.questionSection}>
                    <Text style={[styles.questionText, { color: colors.text }]}>{t('levelTest.questionPrompt')}</Text>
                    <View style={[styles.wordCard, { backgroundColor: colors.primary }]}>
                        <Text
                            style={[styles.wordText, { color: colors.background }]}
                            adjustsFontSizeToFit
                            numberOfLines={1}
                        >
                            {currentQuestion.word.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.optionsContainer}>
                    {currentQuestion.options.map((option, index) => {
                        const isSelected = selectedAnswer === option;
                        return (
                            <TouchableOpacity
                                key={index}
                                onPress={() => handleAnswerSelect(option)}
                                style={[
                                    styles.optionButton,
                                    { backgroundColor: colors.surface, borderColor: colors.border },
                                    isSelected && { borderColor: colors.primary, backgroundColor: `${colors.primary}15` }
                                ]}
                            >
                                <View style={[
                                    styles.optionRadio,
                                    { borderColor: colors.border },
                                    isSelected && { borderColor: colors.primary }
                                ]}>
                                    {isSelected && <View style={[styles.optionRadioInner, { backgroundColor: colors.primary }]} />}
                                </View>
                                <Text style={[styles.optionText, { color: colors.text }, isSelected && { color: colors.primary }]}>
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={[styles.bottomButton, { paddingBottom: insets.bottom + 16 }]}>
                {selectedAnswer && (
                    <Button
                        title={currentQuestionIndex === totalQuestions - 1 ? t('levelTest.seeResults') : t('levelTest.next')}
                        onPress={handleNext}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontFamily: FONT_FAMILY,
        fontSize: 16,
        marginTop: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center'
    },
    progressWrapper: {
        flex: 1,
        paddingHorizontal: 16,
    },
    headerSpacer: {
        width: 44,
    },
    progressBg: {
        height: 6,
        borderRadius: 3,
        width: '100%',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    questionSection: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    questionText: {
        fontFamily: FONT_FAMILY,
        fontSize: 18,
        marginBottom: 24,
        textAlign: 'center',
    },
    wordCard: {
        paddingHorizontal: 32,
        paddingVertical: 20,
        borderRadius: 20,
        marginBottom: 32,
        maxWidth: '90%',
        alignSelf: 'center',
    },
    wordText: {
        fontFamily: FONT_FAMILY,
        fontSize: 32,
        letterSpacing: 2,
    },
    optionsContainer: {
        gap: 12,
        paddingBottom: 100,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: 16,
        borderWidth: 2,
        gap: 16,
    },
    optionRadio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionRadioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    optionText: {
        fontFamily: FONT_FAMILY,
        fontSize: 16,
        flex: 1,
    },
    bottomButton: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 32,
    },
    // Result Screen Styles
    resultContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: 40,
    },
    resultContent: {
        alignItems: 'center',
        gap: 20,
    },
    resultTitle: {
        fontFamily: FONT_FAMILY,
        fontSize: 32,
        textAlign: 'center',
    },
    resultSubtitle: {
        fontFamily: FONT_FAMILY,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    levelResultCard: {
        paddingVertical: 30,
        paddingHorizontal: 40,
        borderRadius: 24,
        alignItems: 'center',
        marginVertical: 20,
    },
    levelResultLabel: {
        fontFamily: FONT_FAMILY,
        fontSize: 12,
        letterSpacing: 2,
        marginBottom: 8,
    },
    levelResultTitle: {
        fontFamily: FONT_FAMILY,
        fontSize: 36,
        marginBottom: 4,
    },
    levelResultRange: {
        fontFamily: FONT_FAMILY,
        fontSize: 18,
        marginTop: 8,
    },
    resultMessage: {
        fontFamily: FONT_FAMILY,
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 20,
        marginTop: 10,
    },
});
