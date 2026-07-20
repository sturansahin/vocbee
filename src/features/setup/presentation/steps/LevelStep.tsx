import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { ThemeColors } from '@shared/theme';
import { AppButton, SelectionRow } from '@shared/ui';

export interface LevelOption {
  id: string;
  range: string;
}

export interface LevelStepProps {
  levels: readonly LevelOption[];
  selectedLevel: string;
  colors?: Pick<
    ThemeColors,
    'textPrimary' | 'textSecondary' | 'surface' | 'borderDefault' | 'accent'
  >;
  onSelectLevel: (levelId: string) => void;
  onPressTakeTest: () => void;
}

export function LevelStep({
  levels,
  selectedLevel,
  onSelectLevel,
  onPressTakeTest,
}: LevelStepProps) {
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.levels} accessibilityRole="radiogroup">
        {levels.map((level) => (
          <SelectionRow
            description={`${level.range} · ${t(`level.${level.id}Desc`)}`}
            key={level.id}
            label={t(`level.${level.id}`)}
            onPress={() => onSelectLevel(level.id)}
            selected={selectedLevel === level.id}
            testID={`setup-level-${level.id}`}
          />
        ))}
      </View>
      <AppButton
        label={t('setup.takeTest')}
        leadingIcon={(color) => <MaterialIcons color={color} name="quiz" size={20} />}
        onPress={onPressTakeTest}
        testID="setup-take-level-test"
        variant="ghost"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 100,
    gap: 16,
  },
  levels: {
    gap: 12,
  },
});

export default LevelStep;
