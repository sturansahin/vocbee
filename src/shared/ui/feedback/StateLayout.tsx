import React, { type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '@shared/theme';
import { AppButton } from '../primitives/AppButton';
import { AppText } from '../primitives/AppText';

export interface StateLayoutProps {
  title: string;
  message?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
  actionLoading?: boolean;
  busy?: boolean;
  accessibilityLabel?: string;
}

export function StateLayout({
  title,
  message,
  icon,
  actionLabel,
  onAction,
  actionLoading,
  busy = false,
  accessibilityLabel = title,
}: StateLayoutProps) {
  const { colors, spacing } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion="polite"
      accessibilityState={{ busy }}
      style={[styles.container, { gap: spacing.lg }]}
    >
      {busy ? <ActivityIndicator color={colors.accent} size="large" /> : icon}
      <AppText accessibilityRole="header" align="center" variant="sectionTitle">
        {title}
      </AppText>
      {message ? (
        <AppText align="center" color="textSecondary">
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <AppButton
          fullWidth={false}
          label={actionLabel}
          loading={actionLoading}
          onPress={onAction}
          variant="outline"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 180,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
