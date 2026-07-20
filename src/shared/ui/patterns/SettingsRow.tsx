import React, { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { MINIMUM_TOUCH_TARGET } from '@shared/responsive';
import { useTheme } from '@shared/theme';
import { AppText } from '../primitives/AppText';

export interface SettingsRowProps extends Omit<
  PressableProps,
  'children' | 'style' | 'accessibilityLabel'
> {
  label: string;
  description?: string;
  value?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  destructive?: boolean;
  showChevron?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SettingsRow({
  label,
  description,
  value,
  leading,
  trailing,
  destructive = false,
  showChevron = false,
  disabled = false,
  style,
  onPress,
  ...props
}: SettingsRowProps) {
  const { colors, spacing } = useTheme();
  const interactive = Boolean(onPress);

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole={interactive ? 'button' : undefined}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled || !interactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
        pressed && { backgroundColor: colors.surfaceMuted },
        disabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {leading}
      <View style={styles.copy}>
        <AppText color={destructive ? 'danger' : 'textPrimary'} variant="bodyStrong">
          {label}
        </AppText>
        {description ? (
          <AppText color="textSecondary" variant="caption">
            {description}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText color="textSecondary" variant="caption">
          {value}
        </AppText>
      ) : null}
      {trailing}
      {showChevron ? (
        <MaterialIcons color={colors.textSecondary} name="chevron-right" size={22} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    minHeight: MINIMUM_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
