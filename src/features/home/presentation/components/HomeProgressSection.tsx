// src/features/home/presentation/components/HomeProgressSection.tsx
// Pure presentational extraction of the "stats" block (level badge + progress bar) from
// screens/HomeScreen.tsx (ADIM 2, UI-only extraction — docs/refactor-v2/25). Renders either the
// loading-skeleton placeholder lines (isLoading=true) or the real level/progress content
// (isLoading=false) — VERBATIM JSX/styles from the three call sites in the original file
// (initial-hydration skeleton + main render; the "no words" state does not render this block at
// all, matching original behavior). No business logic: all values are passed in as props.

import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { FONT_FAMILY } from '@shared/theme';

export interface HomeProgressSectionProps {
  isLoading: boolean;
  isDarkMode: boolean;
  /** colors.text / colors.textSecondary / colors.primary / colors.surfaceLight / colors.border */
  textColor: string;
  textSecondaryColor: string;
  primaryColor: string;
  surfaceLightColor: string;
  borderColor: string;
  initialLoadingPlaceholderColor: string;
  initialLoadingAccentColor: string;
  levelCode: string;
  levelDescription: string;
  learnedCount: number;
  totalCount: number;
  wordsLabel: string;
  progressPercentage: number;
}

export function HomeProgressSection({
  isLoading,
  isDarkMode,
  textColor,
  textSecondaryColor,
  primaryColor,
  surfaceLightColor,
  borderColor,
  initialLoadingPlaceholderColor,
  initialLoadingAccentColor,
  levelCode,
  levelDescription,
  learnedCount,
  totalCount,
  wordsLabel,
  progressPercentage,
}: HomeProgressSectionProps) {
  if (isLoading) {
    return (
      <View style={styles.statsSection}>
        <View style={styles.levelRow}>
          <View
            style={[
              styles.loadingLine,
              styles.loadingLevelBadge,
              { backgroundColor: initialLoadingAccentColor },
            ]}
          />
          <View
            style={[
              styles.loadingLine,
              styles.loadingLevelText,
              { backgroundColor: initialLoadingPlaceholderColor },
            ]}
          />
          <View
            style={[
              styles.loadingLine,
              styles.loadingGoalText,
              { backgroundColor: initialLoadingPlaceholderColor },
            ]}
          />
        </View>
        <View
          style={[
            styles.progressBg,
            {
              backgroundColor: isDarkMode ? '#2c2c2e' : surfaceLightColor,
              borderWidth: isDarkMode ? 0 : 1,
              borderColor: isDarkMode ? 'transparent' : borderColor,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: initialLoadingAccentColor,
                width: '38%',
                shadowOpacity: 0,
                shadowRadius: 0,
                elevation: 0,
              },
            ]}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.statsSection}>
      <View>
        <View style={styles.levelRow}>
          <Text style={[styles.levelValue, { color: textColor }]}>{levelCode}</Text>
          <Text style={[styles.levelSubtext, { color: textSecondaryColor }]}>
            {levelDescription}
          </Text>
          <Text style={[styles.goalValue, { color: textColor, marginLeft: 'auto' }]}>
            {learnedCount}/{totalCount} {wordsLabel}
          </Text>
        </View>
        <View
          style={[
            styles.progressBg,
            {
              backgroundColor: isDarkMode ? '#2c2c2e' : surfaceLightColor,
              borderWidth: isDarkMode ? 0 : 1,
              borderColor: isDarkMode ? 'transparent' : borderColor,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: primaryColor,
                width: `${progressPercentage}%`,
                shadowColor: '#FFD700',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 6,
                elevation: 5,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 393; // iPhone 14 Pro base width — matches original HomeScreen constant verbatim
const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

const styles = StyleSheet.create({
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  levelValue: {
    fontFamily: FONT_FAMILY,
    fontSize: moderateScale(26),
  },
  levelSubtext: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
  },
  goalValue: {
    fontFamily: FONT_FAMILY,
    fontSize: moderateScale(12),
  },
  progressBg: {
    height: 8,
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  loadingLine: {
    borderRadius: 999,
  },
  loadingLevelBadge: {
    width: 48,
    height: 18,
  },
  loadingLevelText: {
    width: 112,
    height: 14,
  },
  loadingGoalText: {
    width: 92,
    height: 14,
    marginLeft: 'auto',
  },
});

export default HomeProgressSection;
