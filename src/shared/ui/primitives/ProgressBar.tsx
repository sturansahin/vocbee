import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@shared/theme';

export interface ProgressBarProps {
  value: number;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({ value, accessibilityLabel, style }: ProgressBarProps) {
  const { colors, radii } = useTheme();
  const normalized = Math.min(1, Math.max(0, value));
  const percentage = Math.round(normalized * 100);

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percentage }}
      style={[
        styles.track,
        { backgroundColor: colors.surfaceMuted, borderRadius: radii.pill },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${percentage}%`,
            backgroundColor: colors.accent,
            borderRadius: radii.pill,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    height: 8,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
