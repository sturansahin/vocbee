import React, { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@shared/theme';

export interface BottomActionBarProps {
  children: ReactNode;
  includeBottomInset?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function BottomActionBar({
  children,
  includeBottomInset = true,
  style,
}: BottomActionBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.borderDefault,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.md + (includeBottomInset ? insets.bottom : 0),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderTopWidth: 1,
  },
});
