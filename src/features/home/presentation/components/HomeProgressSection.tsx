// src/features/home/presentation/components/HomeProgressSection.tsx
// Pure presentational extraction of the "stats" block (level badge + progress bar) from
// screens/HomeScreen.tsx (ADIM 2, UI-only extraction — docs/architecture.md). Renders either the
// loading-skeleton placeholder lines (isLoading=true) or the real level/progress content
// (isLoading=false) — VERBATIM JSX/styles from the three call sites in the original file
// (initial-hydration skeleton + main render; the "no words" state does not render this block at
// all, matching original behavior). No business logic: all values are passed in as props.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useResponsiveLayout } from '@shared/responsive';
import { FONT_FAMILY } from '@shared/theme';

export interface HomeProgressSectionProps {
  isLoading: boolean;
  isDarkMode: boolean;
  /** Semantic theme colors supplied by the Home screen. */
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
  const { moderateScale } = useResponsiveLayout();
  const levelFontSize = moderateScale(26);
  const goalFontSize = moderateScale(12);

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
              backgroundColor: surfaceLightColor,
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
          <Text
            style={[
              styles.levelValue,
              {
                color: textColor,
                fontSize: levelFontSize,
                lineHeight: Math.ceil(levelFontSize * 1.08),
              },
            ]}
          >
            {levelCode}
          </Text>
          <Text style={[styles.levelSubtext, { color: textSecondaryColor }]}>
            {levelDescription}
          </Text>
          <Text
            style={[
              styles.goalValue,
              {
                color: textColor,
                marginLeft: 'auto',
                fontSize: goalFontSize,
                lineHeight: Math.ceil(goalFontSize * 1.35),
              },
            ]}
          >
            {learnedCount}/{totalCount} {wordsLabel}
          </Text>
        </View>
        <View
          style={[
            styles.progressBg,
            {
              backgroundColor: surfaceLightColor,
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
                shadowColor: primaryColor,
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

const styles = StyleSheet.create({
  statsSection: {
    alignSelf: 'stretch',
    flexGrow: 0,
    flexShrink: 1,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 6,
  },
  levelValue: {
    fontFamily: FONT_FAMILY,
  },
  levelSubtext: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    lineHeight: 18,
  },
  goalValue: {
    fontFamily: FONT_FAMILY,
  },
  progressBg: {
    height: 6,
    width: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
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
