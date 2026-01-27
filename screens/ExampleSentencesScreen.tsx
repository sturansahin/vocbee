import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { FONT_FAMILY } from '../utils/typography';
import { RootStackParamList } from '../types';
import * as Speech from 'expo-speech';
import { explainGrammar, GrammarResponse } from '../services/groqService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ExampleSentencesRouteProp = RouteProp<RootStackParamList, 'ExampleSentences'>;

export default function ExampleSentencesScreen() {
    const navigation = useNavigation();
    const route = useRoute<ExampleSentencesRouteProp>();
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();

    // Get word data from route params
    const {
        word,
        translation,
        sentence1,
        sentence2,
        nativeSentence1,
        nativeSentence2
    } = route.params || {
        word: 'Word',
        translation: 'Translation',
        sentence1: 'Example sentence 1',
        sentence2: 'Example sentence 2',
        nativeSentence1: 'Native sentence 1',
        nativeSentence2: 'Native sentence 2'
    };

    // AI State
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiExplanation, setAiExplanation] = useState<GrammarResponse | null>(null);
    const [showAiModal, setShowAiModal] = useState(false);

    const handleExplainGrammar = async () => {
        // Check if we already have the explanation cached in state
        if (aiExplanation) {
            setShowAiModal(true);
            return;
        }

        setIsAiLoading(true);
        setShowAiModal(true);
        try {
            // Get user's native language preference
            const nativeLanguage = await AsyncStorage.getItem('@native_language') || 'Turkish';

            const result = await explainGrammar(sentence1, sentence2, nativeLanguage);
            setAiExplanation(result);
        } catch (error) {
            console.error('AI Error:', error);
            // Fallback is handled by showing null or error state if needed, 
            // but for now we'll just keep the loading state false and maybe show an alert in a real app
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
            >
                {/* Title Section */}
                <View style={styles.titleSection}>
                    <TouchableOpacity
                        style={styles.wordTitleRow}
                        onPress={() => Speech.speak(word, { language: 'en-US' })}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.wordTitle, { color: colors.text }]}>{word}</Text>
                        <MaterialIcons name="volume-up" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    <View style={styles.pronunciationRow}>
                        <MaterialIcons name="translate" size={16} color={colors.primary} />
                        <Text style={[styles.pronunciation, { color: colors.primary }]}>{translation}</Text>
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Examples List */}
                <View style={styles.examplesSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Example Sentences</Text>

                    <View style={styles.examplesList}>
                        {/* Sentence 1 */}
                        <View style={[styles.exampleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <TouchableOpacity
                                style={styles.sentenceRow}
                                onPress={() => Speech.speak(sentence1, { language: 'en-US' })}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.exampleText, { color: colors.text, flex: 1 }]}>
                                    {sentence1}
                                </Text>
                                <MaterialIcons name="volume-up" size={20} color={colors.primary} />
                            </TouchableOpacity>
                            <View style={[styles.exampleDivider, { backgroundColor: colors.border }]} />
                            <Text style={[styles.translationText, { color: colors.textSecondary }]}>
                                {nativeSentence1}
                            </Text>
                        </View>

                        {/* Sentence 2 */}
                        <View style={[styles.exampleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <TouchableOpacity
                                style={styles.sentenceRow}
                                onPress={() => Speech.speak(sentence2, { language: 'en-US' })}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.exampleText, { color: colors.text, flex: 1 }]}>
                                    {sentence2}
                                </Text>
                                <MaterialIcons name="volume-up" size={20} color={colors.primary} />
                            </TouchableOpacity>
                            <View style={[styles.exampleDivider, { backgroundColor: colors.border }]} />
                            <Text style={[styles.translationText, { color: colors.textSecondary }]}>
                                {nativeSentence2}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* AI Assistant Button */}
                <View style={styles.aiSection}>
                    <TouchableOpacity
                        style={[styles.aiButton, { backgroundColor: colors.primary }]}
                        onPress={handleExplainGrammar}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons name="auto-awesome" size={20} color={colors.background} />
                        <Text style={[styles.aiButtonText, { color: colors.background }]}>Explain Grammar with AI</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* AI Explanation Modal */}
            <Modal
                visible={showAiModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowAiModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalTitleRow}>
                                <View style={[styles.aiIconSmall, { backgroundColor: colors.primary }]}>
                                    <MaterialIcons name="smart-toy" size={16} color={colors.background} />
                                </View>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Grammar Explanation</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowAiModal(false)} style={styles.closeButton}>
                                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
                        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
                            {isAiLoading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Analyzing grammar structure...</Text>
                                    <Text style={[styles.loadingSubText, { color: colors.textSecondary }]}>Powering up AI teacher...</Text>
                                </View>
                            ) : aiExplanation ? (
                                <View style={styles.resultContainer}>
                                    {/* Sentence 1 Analysis */}
                                    <View style={styles.analysisSection}>
                                        <View style={[styles.sectionHeader, { borderLeftColor: colors.primary }]}>
                                            <Text style={[styles.sectionTitleText, { color: colors.text }]}>Example 1 Analysis</Text>
                                        </View>

                                        <View style={[styles.analysisCard, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                            <View style={styles.analysisRow}>
                                                <Text style={[styles.label, { color: colors.primary }]}>Structure</Text>
                                                <Text style={[styles.value, { color: colors.text }]}>{aiExplanation.sentence1.structure}</Text>
                                            </View>
                                            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />

                                            <View style={styles.analysisRow}>
                                                <Text style={[styles.label, { color: colors.primary }]}>Grammar</Text>
                                                <Text style={[styles.value, { color: colors.text }]}>{aiExplanation.sentence1.grammar}</Text>
                                            </View>
                                            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />

                                            <View style={styles.analysisRow}>
                                                <Text style={[styles.label, { color: colors.primary }]}>Why?</Text>
                                                <Text style={[styles.value, { color: colors.text }]}>{aiExplanation.sentence1.reason}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Sentence 2 Analysis */}
                                    <View style={styles.analysisSection}>
                                        <View style={[styles.sectionHeader, { borderLeftColor: colors.primary }]}>
                                            <Text style={[styles.sectionTitleText, { color: colors.text }]}>Example 2 Analysis</Text>
                                        </View>

                                        <View style={[styles.analysisCard, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                            <View style={styles.analysisRow}>
                                                <Text style={[styles.label, { color: colors.primary }]}>Structure</Text>
                                                <Text style={[styles.value, { color: colors.text }]}>{aiExplanation.sentence2.structure}</Text>
                                            </View>
                                            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />

                                            <View style={styles.analysisRow}>
                                                <Text style={[styles.label, { color: colors.primary }]}>Grammar</Text>
                                                <Text style={[styles.value, { color: colors.text }]}>{aiExplanation.sentence2.grammar}</Text>
                                            </View>
                                            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />

                                            <View style={styles.analysisRow}>
                                                <Text style={[styles.label, { color: colors.primary }]}>Why?</Text>
                                                <Text style={[styles.value, { color: colors.text }]}>{aiExplanation.sentence2.reason}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.errorContainer}>
                                    <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                                        Unable to load explanation. Please try again.
                                    </Text>
                                    <TouchableOpacity
                                        style={[styles.retryButton, { backgroundColor: `${colors.primary}20` }]}
                                        onPress={handleExplainGrammar}
                                    >
                                        <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Floating Back Button */}
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[styles.backButton, { top: insets.top + 8 }]}
            >
                <FontAwesome5 name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 8,
    },
    backButton: {
        position: 'absolute',
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topBarRight: {
        flexDirection: 'row',
        gap: 12,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 8,
        paddingBottom: 40,
    },
    titleSection: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
    },
    wordTitle: {
        fontFamily: FONT_FAMILY,
        color: '#fff',
        fontSize: 36,
        marginBottom: 8,
    },
    pronunciationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    pronunciation: {
        fontFamily: FONT_FAMILY,
        fontSize: 18,
        fontWeight: '500',
    },
    definition: {
        fontFamily: FONT_FAMILY,
        color: '#d1d5db',
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24,
        maxWidth: 280,
    },
    badges: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 24,
    },
    badgeDark: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#1a2c22',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    badgeTextDark: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#9ca3af',
    },
    badgeGreen: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.2)',
    },
    badgeTextGreen: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#FFD700',
    },
    divider: {
        width: '85%',
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignSelf: 'center',
        marginBottom: 32,
    },
    examplesSection: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    sectionTitle: {
        fontFamily: FONT_FAMILY,
        color: '#fff',
        fontSize: 20,
        marginBottom: 16,
    },
    examplesList: {
        gap: 16,
    },
    exampleCard: {
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
    },
    exampleText: {
        fontFamily: FONT_FAMILY,
        color: '#e5e7eb',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 16,
    },
    highlightWord: {
        fontWeight: 'bold',
    },
    exampleDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        width: '100%',
        marginBottom: 12,
    },
    translationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    translationText: {
        color: '#9ca3af',
        fontSize: 16,
        fontStyle: 'italic',
        flex: 1,
        marginRight: 16,
    },
    aiSection: {
        marginHorizontal: 24,
        marginTop: 16,
    },
    aiCard: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 20,
        overflow: 'hidden',
        position: 'relative',
    },
    aiGlow: {
        position: 'absolute',
        right: -16,
        top: -16,
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
    },
    aiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    aiIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    aiTitle: {
        color: '#fff',
        fontWeight: 'bold',
    },
    aiSubtitle: {
        color: 'rgba(255, 215, 0, 0.8)',
        fontSize: 12,
    },
    aiInput: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    aiInputText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    aiSendButton: {
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        borderRadius: 12,
        padding: 4,
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
    sentenceRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    speakerButtonSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -4,
    },
    // Updated AI Styles
    aiButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        marginTop: 8,
    },
    aiButtonText: {
        fontFamily: FONT_FAMILY,
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '70%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderBottomWidth: 0,
        padding: 24,
        paddingBottom: 40, // Extra padding for safe area
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    modalTitle: {
        fontFamily: FONT_FAMILY,
        fontSize: 20,
        fontWeight: 'bold',
    },
    aiIconSmall: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButton: {
        padding: 4,
    },
    modalScroll: {
        flex: 1,
    },
    modalScrollContent: {
        paddingBottom: 20,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    loadingText: {
        fontFamily: FONT_FAMILY,
        fontSize: 16,
    },
    explanationText: {
        fontFamily: FONT_FAMILY,
        fontSize: 16,
        lineHeight: 26,
    },
    // AI Analysis UI
    resultContainer: {
        gap: 24,
    },
    analysisSection: {
        gap: 12,
    },
    sectionHeader: {
        borderLeftWidth: 3,
        paddingLeft: 12,
    },
    sectionTitleText: {
        fontFamily: FONT_FAMILY,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    analysisCard: {
        borderRadius: 16,
        padding: 16,
    },
    analysisRow: {
        gap: 6,
    },
    label: {
        fontFamily: FONT_FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    value: {
        fontFamily: FONT_FAMILY,
        fontSize: 15,
        lineHeight: 22,
    },
    dividerLine: {
        height: 1,
        width: '100%',
        marginVertical: 12,
        opacity: 0.1,
    },
    loadingSubText: {
        fontFamily: FONT_FAMILY,
        fontSize: 13,
        marginTop: 8,
    },
    errorContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    },
    errorText: {
        fontFamily: FONT_FAMILY,
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    retryText: {
        fontFamily: FONT_FAMILY,
        fontWeight: 'bold',
    },
});
