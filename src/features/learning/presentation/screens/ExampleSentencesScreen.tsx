import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@shared/theme';
import type { RootStackParamList } from '@app/navigation/types';
import type { ExampleSentencesFacade } from '../../application/exampleSentencesContracts';
import type { GrammarResponse } from '../../domain/grammarTypes';
import { AIExplanationModal, ExampleCard } from '../components/ExampleSentencesContent';
import {
  BACK_BUTTON_LEFT,
  HORIZONTAL_PADDING,
  ICON_CONTAINER_SIZE,
  moderateScale,
  scale,
  styles,
} from '../components/exampleSentencesStyles';

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
  const insets = useSafeAreaInsets();
  const { colors, isDarkMode } = useTheme();
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
    setIsAiLoading(true);
    setShowAiModal(true);
    try {
      setAiExplanation(await facade.explainGrammar(sentence1, sentence2));
    } catch (error) {
      console.error('[ExampleSentences] AI Error:', error);
    } finally {
      setIsAiLoading(false);
    }
  }, [aiExplanation, facade, sentence1, sentence2]);

  const dynamicStyles = useMemo(
    () => ({
      topPadding: insets.top + ICON_CONTAINER_SIZE + scale(16),
    }),
    [insets.top],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: dynamicStyles.topPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.titleSection, { paddingHorizontal: HORIZONTAL_PADDING }]}>
          <View style={styles.wordContainer}>
            <TouchableOpacity
              onPress={() => speakText(word)}
              style={[styles.iconButton, { left: 0, position: 'absolute' }]}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Play word pronunciation"
              accessibilityRole="button"
            >
              <MaterialIcons name="volume-up" size={moderateScale(24)} color={colors.primary} />
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

          <View style={styles.translationContainer}>
            <View style={[styles.iconButton, { left: 0, position: 'absolute' }]}>
              <MaterialIcons name="translate" size={moderateScale(22)} color={colors.primary} />
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
        <View style={[styles.examplesSection, { paddingHorizontal: HORIZONTAL_PADDING }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('example.title')}</Text>
          <View style={styles.examplesList}>
            <ExampleCard
              sentence={sentence1}
              nativeSentence={nativeSentence1}
              colors={colors}
              onSpeak={() => speakText(sentence1)}
            />
            <ExampleCard
              sentence={sentence2}
              nativeSentence={nativeSentence2}
              colors={colors}
              onSpeak={() => speakText(sentence2)}
            />
          </View>
        </View>

        <View style={[styles.aiSection, { paddingHorizontal: HORIZONTAL_PADDING }]}>
          <TouchableOpacity
            style={[styles.aiButton, { backgroundColor: colors.primary }]}
            onPress={handleExplainGrammar}
            activeOpacity={0.8}
            accessibilityLabel="Explain grammar with AI"
            accessibilityRole="button"
          >
            <MaterialIcons name="auto-awesome" size={moderateScale(20)} color={colors.background} />
            <Text style={[styles.aiButtonText, { color: colors.background }]}>
              {t('example.explainGrammarBtn')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AIExplanationModal
        visible={showAiModal}
        onClose={() => setShowAiModal(false)}
        isLoading={isAiLoading}
        explanation={aiExplanation}
        onRetry={handleExplainGrammar}
        colors={colors}
        isDarkMode={isDarkMode}
        t={t}
      />

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[styles.backButton, { top: insets.top + scale(8), left: BACK_BUTTON_LEFT }]}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <FontAwesome5 name="arrow-left" size={moderateScale(22)} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}
