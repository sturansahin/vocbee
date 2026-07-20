import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@shared/theme';
import { AppText } from '../primitives/AppText';
import { Surface } from '../primitives/Surface';

export interface ToastRegionProps {
  message?: string;
  tone?: 'default' | 'success' | 'danger';
}

export function ToastRegion({ message, tone = 'default' }: ToastRegionProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  if (!message) {
    return null;
  }

  const backgroundColor =
    tone === 'success'
      ? colors.success
      : tone === 'danger'
        ? colors.danger
        : colors.surfaceElevated;
  const textColor = tone === 'success' || tone === 'danger' ? colors.onDanger : colors.textPrimary;

  return (
    <View pointerEvents="none" style={[styles.region, { top: insets.top + 8 }]}>
      <Surface
        accessibilityLiveRegion="polite"
        elevation="floating"
        style={[styles.toast, { backgroundColor }]}
      >
        <AppText style={{ color: textColor }} variant="bodyStrong">
          {message}
        </AppText>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  region: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9000,
    alignItems: 'center',
  },
  toast: {
    maxWidth: 560,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
