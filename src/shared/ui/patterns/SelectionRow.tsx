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

export interface SelectionRowProps extends Omit<
  PressableProps,
  'children' | 'style' | 'accessibilityLabel'
> {
  label: string;
  description?: string;
  selected: boolean;
  leading?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SelectionRow({
  label,
  description,
  selected,
  leading,
  disabled = false,
  style,
  ...props
}: SelectionRowProps) {
  const { colors, radii, spacing } = useTheme();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: Boolean(disabled) }}
      disabled={Boolean(disabled)}
      style={({ pressed }) => [
        styles.row,
        {
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderColor: selected ? colors.accent : colors.borderDefault,
          borderRadius: radii.md,
          backgroundColor: selected ? colors.accentSoft : colors.surface,
          opacity: disabled ? 0.48 : pressed ? 0.75 : 1,
        },
        style,
      ]}
      {...props}
    >
      {leading}
      <View style={styles.copy}>
        <AppText variant="bodyStrong">{label}</AppText>
        {description ? (
          <AppText color="textSecondary" variant="caption">
            {description}
          </AppText>
        ) : null}
      </View>
      <MaterialIcons
        color={selected ? colors.accentPressed : colors.textSecondary}
        name={selected ? 'radio-button-checked' : 'radio-button-unchecked'}
        size={24}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MINIMUM_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});
