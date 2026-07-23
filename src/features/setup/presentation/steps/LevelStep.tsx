import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme, type ThemeColors } from '@shared/theme';
import { AppText, SelectionRow } from '@shared/ui';

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
  const { colors: themeColors, radii } = useTheme();

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
      <Pressable
        accessibilityRole="button"
        onPress={onPressTakeTest}
        style={({ pressed }) => [
          styles.testRow,
          {
            backgroundColor: pressed ? themeColors.surfaceMuted : themeColors.surface,
            borderColor: themeColors.borderDefault,
            borderRadius: radii.md,
          },
        ]}
        testID="setup-take-level-test"
      >
        <View
          style={[
            styles.testIcon,
            { backgroundColor: themeColors.accentSoft, borderRadius: radii.sm },
          ]}
        >
          <MaterialIcons color={themeColors.accent} name="quiz" size={20} />
        </View>
        <AppText style={styles.testText} variant="bodyStrong">
          {t('setup.takeTest')}
        </AppText>
        <MaterialIcons color={themeColors.textSecondary} name="chevron-right" size={20} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 12,
    gap: 12,
  },
  levels: {
    gap: 8,
  },
  testRow: {
    minHeight: 54,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  testIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  testText: {
    flex: 1,
    flexShrink: 1,
  },
});

export default LevelStep;
