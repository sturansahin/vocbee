import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONT_FAMILY } from '../utils/typography';
import { LEVEL_TEST_QUESTIONS } from '../constants';
import { Button } from '../components/UIComponents';

type LevelTestNavProp = StackNavigationProp<RootStackParamList>;

export default function LevelTestScreen() {
    const navigation = useNavigation<LevelTestNavProp>();
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [options, setOptions] = useState<string[]>([]);

    const nativeLanguage = 'tr';

    const currentQuestion = LEVEL_TEST_QUESTIONS[currentQuestionIndex];
    const totalQuestions = LEVEL_TEST_QUESTIONS.length;
    const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;

    // Shuffle options whenever question changes
    useEffect(() => {
        const translation = currentQuestion.translations[nativeLanguage];
        const allOptions = [translation.correct, ...translation.options];
        const shuffled = allOptions.sort(() => Math.random() - 0.5);
        setOptions(shuffled);
    }, [currentQuestionIndex]);

    const handleAnswerSelect = (answer: string) => {
        setSelectedAnswer(answer);
    };

    const handleNext = () => {
        const translation = currentQuestion.translations[nativeLanguage];
        if (selectedAnswer === translation.correct) {
            setCorrectAnswers(prev => prev + 1);
        }

        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
        } else {
            const finalScore = selectedAnswer === translation.correct ? correctAnswers + 1 : correctAnswers;
            setCorrectAnswers(finalScore);
            setShowResult(true);
        }
    };

    const calculateLevel = () => {
        if (correctAnswers >= 6) return 'advanced';
        if (correctAnswers >= 4) return 'intermediate';
        return 'beginner';
    };

    const handleContinue = () => {
        const detectedLevel = calculateLevel();
        navigation.navigate('NativeLanguage', { detectedLevel });
    };

    const levelInfo = calculateLevel() === 'advanced'
        ? { title: 'Advanced', range: 'C1' }
        : calculateLevel() === 'intermediate'
            ? { title: 'Intermediate', range: 'B1-B2' }
            : { title: 'Beginner', range: 'A1-A2' };

    // Result Screen
    if (showResult) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
                <ScrollView style={styles.content} contentContainerStyle={styles.resultContainer}>
                    <View style={styles.resultContent}>
                        <Text style={[styles.resultTitle, { color: colors.text }]}>Test Complete!</Text>
                        <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
                            You answered {correctAnswers} out of {totalQuestions} questions correctly
                        </Text>

                        <View style={[styles.levelResultCard, { backgroundColor: colors.background }]}>
                            <Text style={[styles.levelResultLabel, { color: colors.textSecondary }]}>YOUR LEVEL</Text>
                            <Text style={[styles.levelResultTitle, { color: colors.primary }]}>{levelInfo.title}</Text>
                            <Text style={[styles.levelResultRange, { color: colors.text }]}>{levelInfo.range}</Text>
                        </View>

                        <Text style={[styles.resultMessage, { color: colors.textSecondary }]}>
                            We'll customize your learning experience based on this level.
                        </Text>
                    </View>
                </ScrollView>

                <View style={[styles.bottomButton, { paddingBottom: insets.bottom + 16 }]}>
                    <Button title="Continue" onPress={handleContinue} />
                </View>
            </View>
        );
    }

    // Quiz Screen
    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
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
                    <Text style={[styles.questionText, { color: colors.text }]}>What does this word mean?</Text>
                    <View style={[styles.wordCard, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.wordText, { color: colors.background }]}>{currentQuestion.word.toUpperCase()}</Text>
                    </View>
                </View>

                <View style={styles.optionsContainer}>
                    {options.map((option, index) => {
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
                        title={currentQuestionIndex === totalQuestions - 1 ? "See Results" : "Next"}
                        onPress={handleNext}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
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
    questionCounter: {
        fontFamily: FONT_FAMILY,
        fontSize: 12,
        marginBottom: 6,
        textAlign: 'center',
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
    levelBadge: {
        fontFamily: FONT_FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 16,
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
    resultEmoji: {
        fontSize: 80,
        marginBottom: 10,
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
