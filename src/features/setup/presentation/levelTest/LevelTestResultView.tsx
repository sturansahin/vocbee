import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { AppButton, AppText, BottomActionBar, Screen, Stack, Surface } from '@shared/ui';

export interface LevelTestResultViewProps {
  title: string;
  description: string;
  levelLabel: string;
  levelTitle: string;
  levelRange: string;
  message: string;
  continueLabel: string;
  onContinue: () => void;
}

export function LevelTestResultView({
  title,
  description,
  levelLabel,
  levelTitle,
  levelRange,
  message,
  continueLabel,
  onContinue,
}: LevelTestResultViewProps) {
  return (
    <Screen edges={['top', 'left', 'right']} testID="level-test-result">
      <ScrollView contentContainerStyle={styles.content}>
        <Stack align="center" gap="xl">
          <AppText accessibilityRole="header" align="center" variant="screenTitle">
            {title}
          </AppText>
          <AppText align="center" color="textSecondary">
            {description}
          </AppText>
          <Surface style={styles.levelCard} tone="muted">
            <AppText align="center" color="textSecondary" variant="caption">
              {levelLabel}
            </AppText>
            <AppText align="center" color="accent" variant="display">
              {levelTitle}
            </AppText>
            <AppText align="center" variant="sectionTitle">
              {levelRange}
            </AppText>
          </Surface>
          <AppText align="center" color="textSecondary">
            {message}
          </AppText>
        </Stack>
      </ScrollView>
      <BottomActionBar>
        <AppButton label={continueLabel} onPress={onContinue} testID="level-test-continue" />
      </BottomActionBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  levelCard: {
    minWidth: 220,
    paddingHorizontal: 32,
    paddingVertical: 28,
    gap: 8,
  },
});
