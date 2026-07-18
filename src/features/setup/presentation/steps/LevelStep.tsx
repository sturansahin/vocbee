// src/features/setup/presentation/steps/LevelStep.tsx
// Pure UI extraction of SetupScreens.tsx renderStep3Content (level picker + "take test" link).
// No behavior change: same list, same selection/test-link callbacks, same i18n keys, same styles (verbatim).

import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONT_FAMILY } from '@shared/theme';

export interface LevelOption {
  id: string;
  range: string;
}

export interface LevelStepProps {
  levels: readonly LevelOption[];
  selectedLevel: string;
  colors: { text: string; textSecondary: string; surface: string; border: string; primary: string };
  onSelectLevel: (levelId: string) => void;
  onPressTakeTest: () => void;
}

export const LevelStep: React.FC<LevelStepProps> = ({
  levels,
  selectedLevel,
  colors,
  onSelectLevel,
  onPressTakeTest,
}) => {
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.levelList}>
        {levels.map((lvl) => (
          <TouchableOpacity
            key={lvl.id}
            onPress={() => onSelectLevel(lvl.id)}
            style={[
              styles.levelItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
              selectedLevel === lvl.id && [
                styles.levelItemSelected,
                { borderColor: colors.primary },
              ],
            ]}
          >
            <View style={styles.levelRow}>
              <View
                style={[
                  styles.levelRadio,
                  { borderColor: colors.border },
                  selectedLevel === lvl.id && [
                    styles.levelRadioSelected,
                    { borderColor: colors.primary },
                  ],
                ]}
              >
                {selectedLevel === lvl.id && (
                  <View style={[styles.levelRadioInner, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <View style={styles.levelContent}>
                <View style={styles.levelHeader}>
                  <Text style={[styles.levelTitle, { color: colors.text }]}>
                    {t(`level.${lvl.id}`)}
                  </Text>
                  <View style={[styles.levelBadge, { backgroundColor: `${colors.primary}33` }]}>
                    <Text style={[styles.levelRange, { color: colors.primary }]}>{lvl.range}</Text>
                  </View>
                </View>
                <Text style={[styles.levelDesc, { color: colors.textSecondary }]}>
                  {t(`level.${lvl.id}Desc`)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.testLink} onPress={onPressTakeTest}>
        <MaterialIcons name="quiz" size={20} color={colors.textSecondary} />
        <Text style={[styles.testLinkText, { color: colors.textSecondary }]}>
          {t('setup.takeTest')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Styles copied VERBATIM from screens/SetupScreens.tsx (levelList/levelItem/.../testLink block).
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  levelList: {
    gap: 16,
    paddingBottom: 24,
  },
  levelItem: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  levelItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  levelRadio: {
    marginTop: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelRadioSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  levelRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  levelContent: {
    flex: 1,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  levelTitle: {
    fontFamily: FONT_FAMILY,
    color: '#fff',
    fontSize: 18,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  levelRange: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: COLORS.primary,
  },
  levelDesc: {
    fontFamily: FONT_FAMILY,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  testLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginBottom: 80,
  },
  testLinkText: {
    fontFamily: FONT_FAMILY,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default LevelStep;
