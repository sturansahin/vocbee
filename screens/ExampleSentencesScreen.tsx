import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { FONT_FAMILY } from '../utils/typography';
import { RootStackParamList } from '../types';
import * as Speech from 'expo-speech';
import { explainGrammar, GrammarResponse } from '../services/groqService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { getTTSLanguageCode } from '../constants';
import { STORAGE_KEYS } from '@shared/storage';

// =============================================================================
// RESPONSIVE UTILITIES
// =============================================================================
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 393; // iPhone 14 Pro base width

/**
 * Scale a size value based on screen width for responsive design
 */
const scale = (size: number): number => (SCREEN_WIDTH / BASE_WIDTH) * size;

/**
 * Moderate scale with a factor for less aggressive scaling on large screens
 */
const moderateScale = (size: number, factor = 0.5): number =>
    size + (scale(size) - size) * factor;

// =============================================================================
// CONSTANTS
// =============================================================================
const HORIZONTAL_PADDING = scale(20);
const ICON_CONTAINER_SIZE = scale(44);
const BACK_BUTTON_LEFT = scale(20);

type ExampleSentencesRouteProp = RouteProp<RootStackParamList, 'ExampleSentences'>;

function getDisplayPronunciation(pronunciation?: string | null): string | null {
    if (typeof pronunciation !== 'string') {
        return null;
    }

    const trimmed = pronunciation.trim();
    return trimmed.length > 0 ? trimmed : null;
}

// =============================================================================
// COMPONENT
// =============================================================================
export default function ExampleSentencesScreen() {
    const navigation = useNavigation();
    const route = useRoute<ExampleSentencesRouteProp>();
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();
    const { t } = useTranslation();

    // Extract word data with defaults
    const {
        word = 'Word',
        pronunciation = null,
        translation = 'Translation',
        sentence1 = 'Example sentence 1',
        sentence2 = 'Example sentence 2',
        nativeSentence1 = 'Native sentence 1',
        nativeSentence2 = 'Native sentence 2',
    } = route.params ?? {};
    const displayPronunciation = getDisplayPronunciation(pronunciation);

    // AI State
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiExplanation, setAiExplanation] = useState<GrammarResponse | null>(null);
    const [showAiModal, setShowAiModal] = useState(false);

    // =============================================================================
    // HANDLERS
    // =============================================================================

    /**
     * Speak text using Text-to-Speech with error handling
     */
    const speakText = useCallback(async (text: string) => {
        try {
            // Resolve TTS language from stored target language
            const targetLang = await AsyncStorage.getItem(STORAGE_KEYS.TARGET_LANGUAGE);
            const ttsLang = getTTSLanguageCode(targetLang || 'english');
            await Speech.stop();
            await Speech.speak(text, {
                language: ttsLang,
                pitch: 1.0,
                rate: 0.85,
            });
        } catch (error) {
            console.error('[ExampleSentences] Speech error:', error);
        }
    }, []);

    /**
     * Handle grammar explanation request with caching
     */
    const handleExplainGrammar = useCallback(async () => {
        // Return cached explanation if available
        if (aiExplanation) {
            setShowAiModal(true);
            return;
        }

        setIsAiLoading(true);
        setShowAiModal(true);

        try {
            const nativeLanguage = await AsyncStorage.getItem(STORAGE_KEYS.NATIVE_LANGUAGE) || 'English';
            const result = await explainGrammar(sentence1, sentence2, nativeLanguage);
            setAiExplanation(result);
        } catch (error) {
            console.error('[ExampleSentences] AI Error:', error);
        } finally {
            setIsAiLoading(false);
        }
    }, [aiExplanation, sentence1, sentence2]);

    /**
     * Close modal handler
     */
    const closeModal = useCallback(() => setShowAiModal(false), []);

    /**
     * Navigate back handler
     */
    const goBack = useCallback(() => navigation.goBack(), [navigation]);

    // =============================================================================
    // MEMOIZED STYLES
    // =============================================================================
    const dynamicStyles = useMemo(() => ({
        iconAlignedLeft: BACK_BUTTON_LEFT,
        topPadding: insets.top + ICON_CONTAINER_SIZE + scale(16),
    }), [insets.top]);

    // =============================================================================
    // RENDER
    // =============================================================================
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: dynamicStyles.topPadding }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Title Section - Aligned with Back Button */}
                <View style={[styles.titleSection, { paddingHorizontal: HORIZONTAL_PADDING }]}>
                    {/* Word Row - Sound Icon on Left, Word in Center */}
                    <View style={styles.wordContainer}>
                        <TouchableOpacity
                            onPress={() => speakText(word)}
                            style={[styles.iconButton, { left: 0, position: 'absolute' }]}
                            activeOpacity={0.7}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            accessibilityLabel="Play word pronunciation"
                            accessibilityRole="button"
                        >
                            <MaterialIcons
                                name="volume-up"
                                size={moderateScale(24)}
                                color={colors.primary}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => speakText(word)}
                            activeOpacity={0.7}
                            style={styles.wordTouchable}
                            accessibilityLabel={`${word}, tap to hear pronunciation`}
                            accessibilityRole="button"
                        >
                            <Text
                                style={[styles.wordTitle, { color: colors.text }]}
                                adjustsFontSizeToFit
                                numberOfLines={1}
                            >
                                {word}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {displayPronunciation ? (
                        <Text
                            style={[styles.pronunciationText, { color: colors.textSecondary }]}
                            numberOfLines={2}
                        >
                            {displayPronunciation}
                        </Text>
                    ) : null}

                    {/* Translation Row - Translate Icon Aligned with Back Button */}
                    <View style={styles.translationContainer}>
                        <View style={[styles.iconButton, { left: 0, position: 'absolute' }]}>
                            <MaterialIcons
                                name="translate"
                                size={moderateScale(22)}
                                color={colors.primary}
                            />
                        </View>

                        <Text
                            style={[styles.translationText, { color: colors.primary }]}
                            adjustsFontSizeToFit
                            numberOfLines={1}
                        >
                            {translation}
                        </Text>
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Examples Section */}
                <View style={[styles.examplesSection, { paddingHorizontal: HORIZONTAL_PADDING }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        {t('example.title')}
                    </Text>

                    <View style={styles.examplesList}>
                        {/* Sentence 1 */}
                        <ExampleCard
                            sentence={sentence1}
                            nativeSentence={nativeSentence1}
                            colors={colors}
                            onSpeak={() => speakText(sentence1)}
                        />

                        {/* Sentence 2 */}
                        <ExampleCard
                            sentence={sentence2}
                            nativeSentence={nativeSentence2}
                            colors={colors}
                            onSpeak={() => speakText(sentence2)}
                        />
                    </View>
                </View>

                {/* AI Assistant Button */}
                <View style={[styles.aiSection, { paddingHorizontal: HORIZONTAL_PADDING }]}>
                    <TouchableOpacity
                        style={[styles.aiButton, { backgroundColor: colors.primary }]}
                        onPress={handleExplainGrammar}
                        activeOpacity={0.8}
                        accessibilityLabel="Explain grammar with AI"
                        accessibilityRole="button"
                    >
                        <MaterialIcons
                            name="auto-awesome"
                            size={moderateScale(20)}
                            color={colors.background}
                        />
                        <Text style={[styles.aiButtonText, { color: colors.background }]}>
                            {t('example.explainGrammarBtn')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* AI Explanation Modal */}
            <AIExplanationModal
                visible={showAiModal}
                onClose={closeModal}
                isLoading={isAiLoading}
                explanation={aiExplanation}
                onRetry={handleExplainGrammar}
                colors={colors}
                isDarkMode={isDarkMode}
                t={t}
            />

            {/* Floating Back Button */}
            <TouchableOpacity
                onPress={goBack}
                style={[
                    styles.backButton,
                    {
                        top: insets.top + scale(8),
                        left: BACK_BUTTON_LEFT,
                    }
                ]}
                accessibilityLabel="Go back"
                accessibilityRole="button"
            >
                <FontAwesome5 name="arrow-left" size={moderateScale(22)} color={colors.text} />
            </TouchableOpacity>
        </View>
    );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface ExampleCardProps {
    sentence: string;
    nativeSentence: string;
    colors: any;
    onSpeak: () => void;
}

/**
 * Reusable example sentence card component
 */
const ExampleCard = React.memo<ExampleCardProps>(({
    sentence,
    nativeSentence,
    colors,
    onSpeak,
}) => (
    <View style={[
        styles.exampleCard,
        { backgroundColor: colors.surface, borderColor: colors.border }
    ]}>
        <TouchableOpacity
            style={styles.sentenceRow}
            onPress={onSpeak}
            activeOpacity={0.7}
            accessibilityLabel={`${sentence}, tap to hear`}
            accessibilityRole="button"
        >
            <Text style={[styles.exampleText, { color: colors.text }]}>
                {sentence}
            </Text>
            <MaterialIcons
                name="volume-up"
                size={moderateScale(20)}
                color={colors.primary}
            />
        </TouchableOpacity>

        <View style={[styles.exampleDivider, { backgroundColor: colors.border }]} />

        <Text style={[styles.nativeText, { color: colors.textSecondary }]}>
            {nativeSentence}
        </Text>
    </View>
));

ExampleCard.displayName = 'ExampleCard';

interface AIExplanationModalProps {
    visible: boolean;
    onClose: () => void;
    isLoading: boolean;
    explanation: GrammarResponse | null;
    onRetry: () => void;
    colors: any;
    isDarkMode: boolean;
    t: (key: string) => string;
}

/**
 * AI Grammar Explanation Modal Component
 */
const AIExplanationModal = React.memo<AIExplanationModalProps>(({
    visible,
    onClose,
    isLoading,
    explanation,
    onRetry,
    colors,
    isDarkMode,
    t,
}) => (
    <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
    >
        <View style={styles.modalOverlay}>
            <View style={[
                styles.modalContent,
                { backgroundColor: colors.surface, borderColor: colors.border }
            ]}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                    <View style={styles.modalTitleRow}>
                        <View style={[styles.aiIconSmall, { backgroundColor: colors.primary }]}>
                            <MaterialIcons
                                name="smart-toy"
                                size={moderateScale(16)}
                                color={colors.background}
                            />
                        </View>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {t('example.grammarExplanationTitle')}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.closeButton}
                        accessibilityLabel="Close modal"
                        accessibilityRole="button"
                    >
                        <MaterialIcons
                            name="close"
                            size={moderateScale(24)}
                            color={colors.textSecondary}
                        />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.modalScroll}
                    contentContainerStyle={styles.modalScrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {isLoading ? (
                        <LoadingState colors={colors} t={t} />
                    ) : explanation ? (
                        <ExplanationContent
                            explanation={explanation}
                            colors={colors}
                            isDarkMode={isDarkMode}
                            t={t}
                        />
                    ) : (
                        <ErrorState colors={colors} onRetry={onRetry} t={t} />
                    )}
                </ScrollView>
            </View>
        </View>
    </Modal>
));

AIExplanationModal.displayName = 'AIExplanationModal';

/**
 * Loading state component for AI modal
 */
const LoadingState = React.memo<{ colors: any; t: (key: string) => string }>(({ colors, t }) => (
    <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t('example.analyzingGrammar')}
        </Text>
        <Text style={[styles.loadingSubText, { color: colors.textSecondary }]}>
            {t('example.poweringAi')}
        </Text>
    </View>
));

LoadingState.displayName = 'LoadingState';

/**
 * Error state component for AI modal
 */
const ErrorState = React.memo<{ colors: any; onRetry: () => void; t: (key: string) => string }>(({ colors, onRetry, t }) => (
    <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {t('example.explanationError')}
        </Text>
        <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: `${colors.primary}20` }]}
            onPress={onRetry}
            accessibilityLabel="Retry loading explanation"
            accessibilityRole="button"
        >
            <Text style={[styles.retryText, { color: colors.primary }]}>{t('example.retry')}</Text>
        </TouchableOpacity>
    </View>
));

ErrorState.displayName = 'ErrorState';

interface ExplanationContentProps {
    explanation: GrammarResponse;
    colors: any;
    isDarkMode: boolean;
    t: (key: string) => string;
}

/**
 * Explanation content component for AI modal
 */
const ExplanationContent = React.memo<ExplanationContentProps>(({
    explanation,
    colors,
    isDarkMode,
    t
}) => (
    <View style={styles.resultContainer}>
        <AnalysisSection
            title={t('example.example1Analysis')}
            data={explanation.sentence1}
            colors={colors}
            isDarkMode={isDarkMode}
            t={t}
        />
        <AnalysisSection
            title={t('example.example2Analysis')}
            data={explanation.sentence2}
            colors={colors}
            isDarkMode={isDarkMode}
            t={t}
        />
    </View>
));

ExplanationContent.displayName = 'ExplanationContent';

interface AnalysisSectionProps {
    title: string;
    data: { structure: string; grammar: string; reason: string };
    colors: any;
    isDarkMode: boolean;
    t: (key: string) => string;
}

/**
 * Analysis section component for grammar explanation
 */
const AnalysisSection = React.memo<AnalysisSectionProps>(({
    title,
    data,
    colors,
    isDarkMode,
    t
}) => (
    <View style={styles.analysisSection}>
        <View style={[styles.sectionHeader, { borderLeftColor: colors.primary }]}>
            <Text style={[styles.sectionTitleText, { color: colors.text }]}>
                {title}
            </Text>
        </View>

        <View style={[
            styles.analysisCard,
            { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }
        ]}>
            <AnalysisRow label={t('example.structure')} value={data.structure} colors={colors} />
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />

            <AnalysisRow label={t('example.grammar')} value={data.grammar} colors={colors} />
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />

            <AnalysisRow label={t('example.why')} value={data.reason} colors={colors} />
        </View>
    </View>
));

AnalysisSection.displayName = 'AnalysisSection';

interface AnalysisRowProps {
    label: string;
    value: string;
    colors: any;
}

/**
 * Single row in analysis section
 */
const AnalysisRow = React.memo<AnalysisRowProps>(({ label, value, colors }) => (
    <View style={styles.analysisRow}>
        <Text style={[styles.label, { color: colors.primary }]}>{label}</Text>
        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
    </View>
));

AnalysisRow.displayName = 'AnalysisRow';

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: scale(40),
    },

    // Back Button
    backButton: {
        position: 'absolute',
        width: ICON_CONTAINER_SIZE,
        height: ICON_CONTAINER_SIZE,
        borderRadius: ICON_CONTAINER_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },

    // Title Section
    titleSection: {
        alignItems: 'center',
        paddingTop: scale(8),
        paddingBottom: scale(24),
    },
    wordContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: scale(12),
        minHeight: ICON_CONTAINER_SIZE,
    },
    iconButton: {
        width: ICON_CONTAINER_SIZE,
        height: ICON_CONTAINER_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    wordTouchable: {
        maxWidth: '70%',
    },
    wordTitle: {
        fontFamily: FONT_FAMILY,
        fontSize: moderateScale(32),
        textAlign: 'center',
    },
    pronunciationText: {
        fontSize: moderateScale(18),
        lineHeight: moderateScale(24),
        fontStyle: 'italic',
        fontWeight: '500',
        letterSpacing: 0.2,
        textAlign: 'center',
        maxWidth: '75%',
        marginBottom: scale(12),
    },
    translationContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: ICON_CONTAINER_SIZE,
    },
    translationText: {
        fontFamily: FONT_FAMILY,
        fontSize: moderateScale(28),
        fontWeight: '500',
        textAlign: 'center',
        maxWidth: '70%',
    },

    divider: {
        width: '85%',
        height: 1,
        alignSelf: 'center',
        marginBottom: scale(32),
    },

    // Examples Section
    examplesSection: {
        marginBottom: scale(16),
    },
    sectionTitle: {
        fontFamily: FONT_FAMILY,
        fontSize: moderateScale(20),
        marginBottom: scale(16),
    },
    examplesList: {
        gap: scale(16),
    },
    exampleCard: {
        padding: scale(20),
        borderRadius: scale(12),
        borderWidth: 1,
    },
    sentenceRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: scale(12),
    },
    exampleText: {
        fontFamily: FONT_FAMILY,
        fontSize: moderateScale(16),
        lineHeight: moderateScale(24),
        flex: 1,
    },
    exampleDivider: {
        height: 1,
        width: '100%',
        marginVertical: scale(12),
    },
    nativeText: {
        fontFamily: FONT_FAMILY,
        fontSize: moderateScale(15),
        fontStyle: 'italic',
        lineHeight: moderateScale(22),
    },

    // AI Section
    aiSection: {
        marginTop: scale(16),
    },
    aiButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: scale(14),
        borderRadius: scale(12),
        gap: scale(8),
    },
    aiButtonText: {
        fontFamily: FONT_FAMILY,
        fontSize: moderateScale(16),
        fontWeight: '600',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '70%',
        borderTopLeftRadius: scale(24),
        borderTopRightRadius: scale(24),
        borderWidth: 1,
        borderBottomWidth: 0,
        padding: scale(24),
        paddingBottom: scale(40),
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: scale(20),
    },
    modalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(10),
    },
    modalTitle: {
        fontFamily: FONT_FAMILY,
        fontSize: moderateScale(20),
    },
    aiIconSmall: {
        width: scale(28),
        height: scale(28),
        borderRadius: scale(14),
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButton: {
        padding: scale(4),
    },
    modalScroll: {
        flex: 1,
    },
    modalScrollContent: {
        paddingBottom: scale(20),
    },

    // Loading State
    loadingContainer: {
        padding: scale(40),
        alignItems: 'center',
        justifyContent: 'center',
        gap: scale(16),
    },
    loadingText: {
        fontFamily: FONT_FAMILY,
        fontSize: moderateScale(16),
    },
    loadingSubText: {
        fontFamily: FONT_FAMILY,
        fontSize: moderateScale(13),
        marginTop: scale(8),
    },

    // Error State
    errorContainer: {
        padding: scale(40),
        alignItems: 'center',
        justifyContent: 'center',
        gap: scale(20),
    },
    errorText: {
        fontFamily: FONT_FAMILY,
        textAlign: 'center',
        fontSize: moderateScale(15),
    },
    retryButton: {
        paddingHorizontal: scale(20),
        paddingVertical: scale(10),
        borderRadius: scale(20),
    },
    retryText: {
        fontFamily: FONT_FAMILY,
        fontSize: moderateScale(14),
        fontWeight: '600',
    },

    // Analysis Section
    resultContainer: {
        gap: scale(24),
    },
    analysisSection: {
        gap: scale(12),
    },
    sectionHeader: {
        borderLeftWidth: 3,
        paddingLeft: scale(12),
    },
    sectionTitleText: {
        fontFamily: FONT_FAMILY,
        fontSize: moderateScale(18),
        letterSpacing: 0.5,
    },
    analysisCard: {
        borderRadius: scale(16),
        padding: scale(16),
    },
    analysisRow: {
        gap: scale(6),
    },
    label: {
        fontFamily: FONT_FAMILY,
        fontSize: moderateScale(12),
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    value: {
        fontFamily: FONT_FAMILY,
        fontSize: moderateScale(15),
        lineHeight: moderateScale(22),
    },
    dividerLine: {
        height: 1,
        width: '100%',
        marginVertical: scale(12),
        opacity: 0.1,
    },
});
