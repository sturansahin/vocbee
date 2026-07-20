import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '@app/navigation/types';
import { useReducedMotion } from '@shared/responsive';
import { useTheme } from '@shared/theme';
import { AppButton, AppHeader, AppScrollView } from '@shared/ui';
import type { ExampleSentencesFacade } from '../../application/exampleSentencesContracts';
import type { GrammarResponse } from '../../domain/grammarTypes';
import { AIExplanationModal, ExampleCard } from '../components/ExampleSentencesContent';
import { styles } from '../components/exampleSentencesStyles';

type ExampleSentencesRouteProp = RouteProp<RootStackParamList, 'ExampleSentences'>;

export interface ExampleSentencesScreenProps {
  facade: ExampleSentencesFacade;
}

export function getDisplayPronunciation(pronunciation?: string | null): string | null {
  if (typeof pronunciation !== 'string') return null;
  const trimmed = pronunciation.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default function ExampleSentencesScreen({ facade }: ExampleSentencesScreenProps) {
  const navigation = useNavigation();
  const route = useRoute<ExampleSentencesRouteProp>();
  const { colors, isDarkMode } = useTheme();
  const reducedMotion = useReducedMotion();
  const { t } = useTranslation();
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
  const explanationInFlight = useRef(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<GrammarResponse | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  const speakText = useCallback(
    async (text: string) => {
      try {
        await facade.speak(text);
      } catch (error) {
        console.error('[ExampleSentences] Speech error:', error);
      }
    },
    [facade],
  );

  const handleExplainGrammar = useCallback(async () => {
    if (aiExplanation) {
      setShowAiModal(true);
      return;
    }
    if (explanationInFlight.current) return;
    explanationInFlight.current = true;
    setIsAiLoading(true);
    setShowAiModal(true);
    try {
      setAiExplanation(await facade.explainGrammar(sentence1, sentence2));
    } catch (error) {
      console.error('[ExampleSentences] AI Error:', error);
    } finally {
      explanationInFlight.current = false;
      setIsAiLoading(false);
    }
  }, [aiExplanation, facade, sentence1, sentence2]);

  return (
    <>
      <AppScrollView contentContainerStyle={localStyles.content}>
        <AppHeader
          title={t('example.title')}
          backAccessibilityLabel={t('common.back')}
          onBack={() => navigation.goBack()}
        />

        <View style={styles.titleSection}>
          <View style={styles.wordContainer}>
            <TouchableOpacity
              accessibilityHint={t('example.playPronunciation', {
                defaultValue: 'Plays the word pronunciation',
              })}
              accessibilityLabel={word}
              accessibilityRole="button"
              onPress={() => void speakText(word)}
              activeOpacity={0.7}
              style={styles.wordTouchable}
            >
              <Text style={[styles.wordTitle, { color: colors.textPrimary }]}>{word}</Text>
            </TouchableOpacity>
            <MaterialIcons name="volume-up" size={24} color={colors.accent} />
          </View>

          {displayPronunciation ? (
            <Text style={[styles.pronunciationText, { color: colors.textSecondary }]}>
              {displayPronunciation}
            </Text>
          ) : null}

          <View style={styles.translationContainer}>
            <MaterialIcons name="translate" size={22} color={colors.accent} />
            <Text style={[styles.translationText, { color: colors.accent }]}>{translation}</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.borderDefault }]} />
        <View style={styles.examplesSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('example.title')}
          </Text>
          <View style={styles.examplesList}>
            <ExampleCard
              sentence={sentence1}
              nativeSentence={nativeSentence1}
              colors={colors}
              onSpeak={() => void speakText(sentence1)}
            />
            <ExampleCard
              sentence={sentence2}
              nativeSentence={nativeSentence2}
              colors={colors}
              onSpeak={() => void speakText(sentence2)}
            />
          </View>
        </View>

        <View style={styles.aiSection}>
          <AppButton
            accessibilityLabel={t('example.explainGrammarBtn')}
            label={t('example.explainGrammarBtn')}
            loading={isAiLoading}
            leadingIcon={(color) => <MaterialIcons name="auto-awesome" size={20} color={color} />}
            onPress={handleExplainGrammar}
          />
        </View>
      </AppScrollView>

      <AIExplanationModal
        visible={showAiModal}
        onClose={() => setShowAiModal(false)}
        isLoading={isAiLoading}
        explanation={aiExplanation}
        onRetry={handleExplainGrammar}
        colors={colors}
        isDarkMode={isDarkMode}
        reducedMotion={reducedMotion}
        t={t}
      />
    </>
  );
}

const localStyles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
});
