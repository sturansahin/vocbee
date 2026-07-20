import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@shared/theme';
import { AppText } from '../primitives/AppText';

export interface FormFieldProps {
  label: string;
  children: ReactNode;
  helperText?: string;
  errorText?: string;
}

export function FormField({ label, children, helperText, errorText }: FormFieldProps) {
  const { spacing } = useTheme();
  return (
    <View style={[styles.container, { gap: spacing.sm }]}>
      <AppText variant="bodyStrong">{label}</AppText>
      {children}
      {errorText || helperText ? (
        <AppText
          accessibilityLiveRegion={errorText ? 'polite' : 'none'}
          color={errorText ? 'danger' : 'textSecondary'}
          variant="caption"
        >
          {errorText ? `Error: ${errorText}` : helperText}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
