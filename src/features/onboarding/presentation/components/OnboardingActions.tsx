import React from 'react';
import { StyleSheet } from 'react-native';
import { AppButton, Inline } from '@shared/ui';

export interface OnboardingActionsProps {
  isLastStep: boolean;
  onNext: () => void;
  onComplete: () => void | Promise<void>;
  skipLabel: string;
  nextLabel: string;
  startLabel: string;
}

export function OnboardingActions({
  isLastStep,
  onNext,
  onComplete,
  skipLabel,
  nextLabel,
  startLabel,
}: OnboardingActionsProps) {
  if (isLastStep) {
    return <AppButton label={startLabel} onPress={onComplete} testID="onboarding-start" />;
  }

  return (
    <Inline justify="space-between" style={styles.actions}>
      <AppButton
        fullWidth={false}
        label={skipLabel}
        onPress={onComplete}
        testID="onboarding-skip"
        variant="ghost"
      />
      <AppButton fullWidth={false} label={nextLabel} onPress={onNext} testID="onboarding-next" />
    </Inline>
  );
}

const styles = StyleSheet.create({
  actions: {
    width: '100%',
  },
});
