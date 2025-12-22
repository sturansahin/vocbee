import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { FONT_FAMILY } from '../utils/typography';
import { useState } from 'react';

// Sample words for the word card
const SAMPLE_WORDS = [
    { word: 'Serendipity', type: 'noun', definition: 'The occurrence and development of events by chance in a happy or beneficial way.', translation: 'Şans eseri' },
    { word: 'Ephemeral', type: 'adjective', definition: 'Lasting for a very short time.', translation: 'Geçici' },
    { word: 'Resilience', type: 'noun', definition: 'The capacity to recover quickly from difficulties.', translation: 'Dayanıklılık' },
    { word: 'Eloquent', type: 'adjective', definition: 'Fluent or persuasive in speaking or writing.', translation: 'Etkili konuşan' },
    { word: 'Ubiquitous', type: 'adjective', definition: 'Present, appearing, or found everywhere.', translation: 'Her yerde bulunan' },
];

export default function HomeScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();
    const [currentWordIndex, setCurrentWordIndex] = useState(0);

    const currentWord = SAMPLE_WORDS[currentWordIndex];

    const handleNext = () => {
        setCurrentWordIndex((prev) => (prev + 1) % SAMPLE_WORDS.length);
    };

    const handleLearned = () => {
        // In a real app, this would mark the word as learned in the backend
        handleNext();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.primary }]}>VOCBEE</Text>
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

                {/* Hero Card */}
                <View style={[styles.heroCard, { backgroundColor: isDarkMode ? '#c2deb9' : '#a8d4a0' }]}>
                    <View style={styles.cardCenter}>
                        <Text style={styles.wordTitle}>{currentWord.word}</Text>
                        <Text style={styles.wordType}>{currentWord.type}</Text>

                        <Text style={styles.wordDefinition}>
                            {currentWord.definition}
                        </Text>

                        <TouchableOpacity
                            style={styles.exampleButton}
                            onPress={() => navigation.navigate('ExampleSentences', {
                                word: currentWord.word,
                                definition: currentWord.definition,
                                translation: currentWord.translation
                            })}
                        >
                            <Text style={styles.exampleButtonText}>EXAMPLE SENTENCES</Text>
                            <MaterialIcons name="arrow-forward" size={16} color="rgba(18, 32, 23, 0.6)" />
                        </TouchableOpacity>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.cardActions}>
                        <TouchableOpacity
                            style={styles.nextButton}
                            onPress={handleNext}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.nextButtonText}>Next</Text>
                            <MaterialIcons name="arrow-forward" size={20} color="rgba(78, 82, 80, 0.8)" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.learnedButton}
                            onPress={handleLearned}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.learnedButtonText}>Learned</Text>
                            <MaterialIcons name="check" size={20} color="#fff" />

                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 6,
    },
    statsSection: {
        marginBottom: 24,
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
    trophyCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
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
    heroCard: {
        borderRadius: 32,
        padding: 24,
        marginBottom: 20,
        minHeight: 300,
    },
    newWordBadge: {
        alignSelf: 'flex-end',
        backgroundColor: 'rgba(18, 32, 23, 0.15)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 14,
    },
    newWordText: {
        color: '#122017',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    cardCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    wordTitle: {
        fontFamily: FONT_FAMILY,
        color: '#122017',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 4,
        letterSpacing: 1,
    },
    wordType: {
        fontFamily: FONT_FAMILY,
        color: 'rgba(18, 32, 23, 0.5)',
        fontSize: 18,
        fontStyle: 'italic',
        marginBottom: 24,
    },
    wordDefinition: {
        fontFamily: FONT_FAMILY,
        color: '#122017',
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
        backgroundColor: 'rgba(18, 32, 23, 0.15)',
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(18, 32, 23, 0.2)',
    },
    exampleButtonText: {
        fontFamily: FONT_FAMILY,
        color: '#122017',
        fontWeight: '600',
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
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
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
        color: 'rgba(78, 82, 80, 0.8)',
        fontSize: 15,
        fontWeight: 'bold',
    },
    quickStats: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 4,
        textAlign: 'center',
    },
});

