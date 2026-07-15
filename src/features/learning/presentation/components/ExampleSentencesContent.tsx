import React from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import type { GrammarResponse } from '../../domain/grammarTypes';
import { moderateScale, styles } from './exampleSentencesStyles';

type Colors = {
  background: string;
  surface: string;
  border: string;
  primary: string;
  text: string;
  textSecondary: string;
};
type Translate = (key: string) => string;

interface ExampleCardProps {
  sentence: string;
  nativeSentence: string;
  colors: Colors;
  onSpeak(): void;
}

export const ExampleCard = React.memo<ExampleCardProps>(({ sentence, nativeSentence, colors, onSpeak }) => (
  <View style={[styles.exampleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <TouchableOpacity
      style={styles.sentenceRow}
      onPress={onSpeak}
      activeOpacity={0.7}
      accessibilityLabel={`${sentence}, tap to hear`}
      accessibilityRole="button"
    >
      <Text style={[styles.exampleText, { color: colors.text }]}>{sentence}</Text>
      <MaterialIcons name="volume-up" size={moderateScale(20)} color={colors.primary} />
    </TouchableOpacity>
    <View style={[styles.exampleDivider, { backgroundColor: colors.border }]} />
    <Text style={[styles.nativeText, { color: colors.textSecondary }]}>{nativeSentence}</Text>
  </View>
));

ExampleCard.displayName = 'ExampleCard';

interface AIExplanationModalProps {
  visible: boolean;
  onClose(): void;
  isLoading: boolean;
  explanation: GrammarResponse | null;
  onRetry(): void;
  colors: Colors;
  isDarkMode: boolean;
  t: Translate;
}

export const AIExplanationModal = React.memo<AIExplanationModalProps>(({
  visible,
  onClose,
  isLoading,
  explanation,
  onRetry,
  colors,
  isDarkMode,
  t,
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleRow}>
            <View style={[styles.aiIconSmall, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="smart-toy" size={moderateScale(16)} color={colors.background} />
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
            <MaterialIcons name="close" size={moderateScale(24)} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.modalScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <LoadingState colors={colors} t={t} />
          ) : explanation ? (
            <ExplanationContent explanation={explanation} colors={colors} isDarkMode={isDarkMode} t={t} />
          ) : (
            <ErrorState colors={colors} onRetry={onRetry} t={t} />
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
));

AIExplanationModal.displayName = 'AIExplanationModal';

const LoadingState = React.memo<{ colors: Colors; t: Translate }>(({ colors, t }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('example.analyzingGrammar')}</Text>
    <Text style={[styles.loadingSubText, { color: colors.textSecondary }]}>{t('example.poweringAi')}</Text>
  </View>
));

LoadingState.displayName = 'LoadingState';

const ErrorState = React.memo<{ colors: Colors; onRetry(): void; t: Translate }>(({ colors, onRetry, t }) => (
  <View style={styles.errorContainer}>
    <Text style={[styles.errorText, { color: colors.textSecondary }]}>{t('example.explanationError')}</Text>
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

const ExplanationContent = React.memo<{
  explanation: GrammarResponse;
  colors: Colors;
  isDarkMode: boolean;
  t: Translate;
}>(({ explanation, colors, isDarkMode, t }) => (
  <View style={styles.resultContainer}>
    <AnalysisSection title={t('example.example1Analysis')} data={explanation.sentence1} colors={colors} isDarkMode={isDarkMode} t={t} />
    <AnalysisSection title={t('example.example2Analysis')} data={explanation.sentence2} colors={colors} isDarkMode={isDarkMode} t={t} />
  </View>
));

ExplanationContent.displayName = 'ExplanationContent';

const AnalysisSection = React.memo<{
  title: string;
  data: GrammarResponse['sentence1'];
  colors: Colors;
  isDarkMode: boolean;
  t: Translate;
}>(({ title, data, colors, isDarkMode, t }) => (
  <View style={styles.analysisSection}>
    <View style={[styles.sectionHeader, { borderLeftColor: colors.primary }]}>
      <Text style={[styles.sectionTitleText, { color: colors.text }]}>{title}</Text>
    </View>
    <View style={[styles.analysisCard, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
      <AnalysisRow label={t('example.structure')} value={data.structure} colors={colors} />
      <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      <AnalysisRow label={t('example.grammar')} value={data.grammar} colors={colors} />
      <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      <AnalysisRow label={t('example.why')} value={data.reason} colors={colors} />
    </View>
  </View>
));

AnalysisSection.displayName = 'AnalysisSection';

const AnalysisRow = React.memo<{ label: string; value: string; colors: Colors }>(({ label, value, colors }) => (
  <View style={styles.analysisRow}>
    <Text style={[styles.label, { color: colors.primary }]}>{label}</Text>
    <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
  </View>
));

AnalysisRow.displayName = 'AnalysisRow';
