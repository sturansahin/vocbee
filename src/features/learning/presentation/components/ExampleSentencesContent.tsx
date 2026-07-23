import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { ThemeColors } from '@shared/theme';
import { AppButton, AppModal, ErrorState, LoadingState } from '@shared/ui';
import type { GrammarResponse } from '../../domain/grammarTypes';
import { styles } from './exampleSentencesStyles';

type Translate = (key: string, options?: Record<string, unknown>) => string;

interface ExampleCardProps {
  sentence: string;
  nativeSentence: string;
  colors: ThemeColors;
  onSpeak(): void;
}

export const ExampleCard = React.memo<ExampleCardProps>(
  ({ sentence, nativeSentence, colors, onSpeak }) => (
    <View
      style={[
        styles.exampleCard,
        { backgroundColor: colors.surface, borderColor: colors.borderDefault },
      ]}
    >
      <TouchableOpacity
        style={styles.sentenceRow}
        hitSlop={4}
        onPress={onSpeak}
        activeOpacity={0.7}
        accessibilityLabel={sentence}
        accessibilityHint="Plays the sentence pronunciation"
        accessibilityRole="button"
      >
        <Text style={[styles.exampleText, { color: colors.textPrimary }]}>{sentence}</Text>
        <MaterialIcons name="volume-up" size={20} color={colors.accent} />
      </TouchableOpacity>
      <View style={[styles.exampleDivider, { backgroundColor: colors.borderDefault }]} />
      <Text style={[styles.nativeText, { color: colors.textSecondary }]}>{nativeSentence}</Text>
    </View>
  ),
);

ExampleCard.displayName = 'ExampleCard';

interface AIExplanationModalProps {
  visible: boolean;
  onClose(): void;
  isLoading: boolean;
  explanation: GrammarResponse | null;
  onRetry(): void;
  colors: ThemeColors;
  isDarkMode: boolean;
  reducedMotion?: boolean;
  t: Translate;
}

export const AIExplanationModal = React.memo<AIExplanationModalProps>(
  ({
    visible,
    onClose,
    isLoading,
    explanation,
    onRetry,
    colors,
    isDarkMode,
    reducedMotion = false,
    t,
  }) => (
    <AppModal
      animationType={reducedMotion ? 'none' : 'fade'}
      visible={visible}
      title={t('example.grammarExplanationTitle')}
      onRequestClose={onClose}
      actions={
        <AppButton
          fullWidth={false}
          label={t('common.close', { defaultValue: 'Close' })}
          onPress={onClose}
          variant="secondary"
        />
      }
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <LoadingState title={t('example.analyzingGrammar')} message={t('example.poweringAi')} />
        </View>
      ) : explanation ? (
        <ExplanationContent
          explanation={explanation}
          colors={colors}
          isDarkMode={isDarkMode}
          t={t}
        />
      ) : (
        <ErrorState
          title={t('example.explanationError')}
          retryLabel={t('example.retry')}
          onRetry={onRetry}
        />
      )}
    </AppModal>
  ),
);

AIExplanationModal.displayName = 'AIExplanationModal';

const ExplanationContent = React.memo<{
  explanation: GrammarResponse;
  colors: ThemeColors;
  isDarkMode: boolean;
  t: Translate;
}>(({ explanation, colors, isDarkMode, t }) => (
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

const AnalysisSection = React.memo<{
  title: string;
  data: GrammarResponse['sentence1'];
  colors: ThemeColors;
  isDarkMode: boolean;
  t: Translate;
}>(({ title, data, colors, isDarkMode, t }) => (
  <View style={styles.analysisSection}>
    <View style={[styles.sectionHeader, { borderLeftColor: colors.accent }]}>
      <Text style={[styles.sectionTitleText, { color: colors.textPrimary }]}>{title}</Text>
    </View>
    <View
      style={[
        styles.analysisCard,
        {
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        },
      ]}
    >
      <AnalysisRow label={t('example.structure')} value={data.structure} colors={colors} />
      <View style={[styles.dividerLine, { backgroundColor: colors.borderDefault }]} />
      <AnalysisRow label={t('example.grammar')} value={data.grammar} colors={colors} />
      <View style={[styles.dividerLine, { backgroundColor: colors.borderDefault }]} />
      <AnalysisRow label={t('example.why')} value={data.reason} colors={colors} />
    </View>
  </View>
));

AnalysisSection.displayName = 'AnalysisSection';

const AnalysisRow = React.memo<{
  label: string;
  value: string;
  colors: ThemeColors;
}>(({ label, value, colors }) => (
  <View style={styles.analysisRow}>
    <Text style={[styles.label, { color: colors.accent }]}>{label}</Text>
    <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
  </View>
));

AnalysisRow.displayName = 'AnalysisRow';
