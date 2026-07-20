import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import type { LevelTestQuestion } from '../../domain/levelTestTypes';
import {
  AppButton,
  AppText,
  BottomActionBar,
  IconButton,
  ProgressBar,
  Screen,
  SelectionRow,
  Stack,
  Surface,
} from '@shared/ui';
import { useTheme } from '@shared/theme';

export interface LevelTestQuestionViewProps {
  question: LevelTestQuestion;
  currentIndex: number;
  total: number;
  selectedAnswer: string | null;
  prompt: string;
  nextLabel: string;
  onBack: () => void;
  onSelect: (answer: string) => void;
  onNext: () => void;
}

export function LevelTestQuestionView({
  question,
  currentIndex,
  total,
  selectedAnswer,
  prompt,
  nextLabel,
  onBack,
  onSelect,
  onNext,
}: LevelTestQuestionViewProps) {
  const { colors } = useTheme();
  return (
    <Screen
      contentStyle={styles.screenContent}
      edges={['top', 'left', 'right']}
      testID="level-test-question"
    >
      <View style={styles.header}>
        <IconButton
          accessibilityLabel="Exit level test"
          icon={(color) => <FontAwesome5 color={color} name="arrow-left" size={22} />}
          onPress={onBack}
        />
        <ProgressBar
          accessibilityLabel={`Question ${currentIndex + 1} of ${total}`}
          style={styles.progress}
          value={(currentIndex + 1) / Math.max(total, 1)}
        />
        <View style={styles.headerSide} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Stack align="center" gap="2xl">
          <AppText align="center" variant="sectionTitle">
            {prompt}
          </AppText>
          <Surface style={[styles.wordCard, { backgroundColor: colors.accent }]}>
            <AppText
              adjustsFontSizeToFit
              align="center"
              color="onAccent"
              numberOfLines={1}
              variant="display"
            >
              {question.word.toUpperCase()}
            </AppText>
          </Surface>
        </Stack>
        <View accessibilityRole="radiogroup" style={styles.options}>
          {question.options.map((option) => (
            <SelectionRow
              key={option}
              label={option}
              onPress={() => onSelect(option)}
              selected={selectedAnswer === option}
              testID={`level-test-option-${option}`}
            />
          ))}
        </View>
      </ScrollView>
      <BottomActionBar>
        {selectedAnswer ? (
          <AppButton label={nextLabel} onPress={onNext} testID="level-test-next" />
        ) : null}
      </BottomActionBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 0,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerSide: {
    width: 44,
  },
  progress: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingVertical: 24,
    gap: 32,
  },
  wordCard: {
    maxWidth: '92%',
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  options: {
    gap: 12,
    paddingBottom: 32,
  },
});
