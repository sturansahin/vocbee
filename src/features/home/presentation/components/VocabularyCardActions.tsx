import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '@shared/ui';

export interface VocabularyCardActionsProps {
  skipLabel: string;
  learnedLabel: string;
  disabled?: boolean;
  onSkip: () => void;
  onLearned: () => void;
}

export function VocabularyCardActions({
  skipLabel,
  learnedLabel,
  disabled,
  onSkip,
  onLearned,
}: VocabularyCardActionsProps) {
  return (
    <View
      accessibilityRole="toolbar"
      accessibilityLabel={`${skipLabel} / ${learnedLabel}`}
      style={styles.container}
    >
      <AppButton
        testID="home-skip-action"
        label={skipLabel}
        variant="outline"
        disabled={disabled}
        onPress={onSkip}
        style={styles.action}
      />
      <AppButton
        testID="home-learned-action"
        label={learnedLabel}
        disabled={disabled}
        onPress={onLearned}
        style={styles.action}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  action: {
    flex: 1,
  },
});
