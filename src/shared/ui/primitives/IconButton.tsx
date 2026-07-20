import React, { useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { MINIMUM_TOUCH_TARGET } from '@shared/responsive';
import { useTheme } from '@shared/theme';

export type IconButtonVariant = 'default' | 'ghost' | 'accent' | 'destructive';

export interface IconButtonProps extends Omit<
  PressableProps,
  'children' | 'style' | 'accessibilityLabel'
> {
  accessibilityLabel: string;
  icon: ReactNode | ((color: string) => ReactNode);
  variant?: IconButtonVariant;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  accessibilityLabel,
  icon,
  variant = 'ghost',
  size = MINIMUM_TOUCH_TARGET,
  disabled = false,
  style,
  ...props
}: IconButtonProps) {
  const { colors, radii } = useTheme();
  const [focused, setFocused] = useState(false);
  const foreground =
    variant === 'accent'
      ? colors.onAccent
      : variant === 'destructive'
        ? colors.danger
        : colors.textPrimary;
  const background =
    variant === 'accent'
      ? colors.accent
      : variant === 'default'
        ? colors.surfaceMuted
        : colors.transparent;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={Boolean(disabled)}
      hitSlop={4}
      onBlur={(event) => {
        setFocused(false);
        props.onBlur?.(event);
      }}
      onFocus={(event) => {
        setFocused(true);
        props.onFocus?.(event);
      }}
      style={({ pressed }) => [
        styles.base,
        {
          width: Math.max(size, MINIMUM_TOUCH_TARGET),
          height: Math.max(size, MINIMUM_TOUCH_TARGET),
          borderRadius: radii.pill,
          backgroundColor: background,
          borderColor: focused ? colors.focusRing : colors.transparent,
          opacity: disabled ? 0.45 : pressed ? 0.68 : 1,
        },
        focused && styles.focused,
        style,
      ]}
      {...props}
    >
      {typeof icon === 'function' ? icon(foreground) : icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  focused: {
    borderWidth: 2,
  },
});
