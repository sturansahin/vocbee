import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '@app/navigation/types';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { FONT_FAMILY, useTheme } from '@shared/theme';
import { Button } from '@shared/ui';
import { useTranslation } from 'react-i18next';
import type { LevelTestFacade } from '../../application/levelTestContracts';
import type { LevelTestQuestion } from '../../domain/levelTestTypes';

type LevelTestNavProp = StackNavigationProp<RootStackParamList>;
type LevelTestRouteProp = RouteProp<RootStackParamList, 'LevelTest'>;

export interface LevelTestScreenProps {
  facade: LevelTestFacade;
}

export default function LevelTestScreen({ facade }: LevelTestScreenProps) {
  const navigation = useNavigation<LevelTestNavProp>();
  const route = useRoute<LevelTestRouteProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [questions, setQuestions] = useState<LevelTestQuestion[]>([]);
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

        setQuestions(await facade.loadQuestions(route.params));
      } catch (error) {
        console.error('Error loading test questions:', error);
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [facade, navigation, route.params]);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progressPercent =
    totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNext = () => {
    if (!currentQuestion) return;

    if (selectedAnswer === currentQuestion.correct) {
      setCorrectAnswers((prev) => prev + 1);
    }

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      const finalScore =
        selectedAnswer === currentQuestion.correct ? correctAnswers + 1 : correctAnswers;
      setCorrectAnswers(finalScore);
      setShowResult(true);
    }
  };

  const detectedLevel = facade.detectLevel(correctAnswers, totalQuestions);

  const handleContinue = () => {
    navigation.navigate('NativeLanguage', { detectedLevel });
  };

  const levelInfo =
    detectedLevel === 'advanced'
      ? { title: t('levelTest.advanced'), range: 'C1' }
      : detectedLevel === 'intermediate'
        ? { title: t('levelTest.intermediate'), range: 'B1-B2' }
        : { title: t('levelTest.beginner'), range: 'A1-A2' };

  // Loading Screen
  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.loadingContainer,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
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
      <View
        style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
      >
        <ScrollView style={styles.content} contentContainerStyle={styles.resultContainer}>
          <View style={styles.resultContent}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>
              {t('levelTest.testComplete')}
            </Text>
            <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
              {t('levelTest.resultDesc', { correct: correctAnswers, total: totalQuestions })}
            </Text>

            <View style={[styles.levelResultCard, { backgroundColor: colors.background }]}>
              <Text style={[styles.levelResultLabel, { color: colors.textSecondary }]}>
                {t('levelTest.yourLevel')}
              </Text>
              <Text style={[styles.levelResultTitle, { color: colors.primary }]}>
                {levelInfo.title}
              </Text>
              <Text style={[styles.levelResultRange, { color: colors.text }]}>
                {levelInfo.range}
              </Text>
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
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.progressWrapper}>
          <View style={[styles.progressBg, { backgroundColor: colors.surfaceLight }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercent}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionSection}>
          <Text style={[styles.questionText, { color: colors.text }]}>
            {t('levelTest.questionPrompt')}
          </Text>
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
                  isSelected && {
                    borderColor: colors.primary,
                    backgroundColor: `${colors.primary}15`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.optionRadio,
                    { borderColor: colors.border },
                    isSelected && { borderColor: colors.primary },
                  ]}
                >
                  {isSelected && (
                    <View style={[styles.optionRadioInner, { backgroundColor: colors.primary }]} />
                  )}
                </View>
                <Text
                  style={[
                    styles.optionText,
                    { color: colors.text },
                    isSelected && { color: colors.primary },
                  ]}
                >
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
            title={
              currentQuestionIndex === totalQuestions - 1
                ? t('levelTest.seeResults')
                : t('levelTest.next')
            }
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
    justifyContent: 'center',
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
