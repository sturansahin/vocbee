import React, { useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { MINIMUM_TOUCH_TARGET } from '@shared/responsive';
import { useTheme } from '@shared/theme';
import { AppText } from './AppText';

export type AppButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type AppButtonIcon = ReactNode | ((color: string) => ReactNode);

export interface AppButtonProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'style' | 'accessibilityRole'
> {
  label: string;
  onPress: (event?: GestureResponderEvent) => void | Promise<void>;
  variant?: AppButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: AppButtonIcon;
  trailingIcon?: AppButtonIcon;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

function renderIcon(icon: AppButtonIcon | undefined, color: string): ReactNode {
  return typeof icon === 'function' ? icon(color) : icon;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  leadingIcon,
  trailingIcon,
  style,
  labelStyle,
  accessibilityLabel = label,
  ...props
}: AppButtonProps) {
  const { colors, radii, spacing } = useTheme();
  const [focused, setFocused] = useState(false);
  const inFlight = useRef(false);
  const unavailable = disabled || loading;

  const foreground =
    variant === 'primary'
      ? colors.onAccent
      : variant === 'destructive'
        ? colors.onDanger
        : variant === 'ghost'
          ? colors.textSecondary
          : colors.textPrimary;

  const background =
    variant === 'primary'
      ? colors.accent
      : variant === 'secondary'
        ? colors.surfaceMuted
        : variant === 'destructive'
          ? colors.danger
          : colors.transparent;

  const handlePress = async (event: GestureResponderEvent) => {
    if (unavailable || inFlight.current) {
      return;
    }

    inFlight.current = true;
    try {
      await onPress(event);
    } finally {
      inFlight.current = false;
    }
  };

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: unavailable }}
      disabled={unavailable}
      onFocus={(event) => {
        setFocused(true);
        props.onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        props.onBlur?.(event);
      }}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background,
          borderColor:
            variant === 'outline' ? colors.borderStrong : focused ? colors.focusRing : background,
          borderRadius: radii.pill,
          gap: spacing.sm,
          opacity: unavailable ? 0.52 : pressed ? 0.78 : 1,
        },
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        fullWidth && styles.fullWidth,
        focused && styles.focused,
        style,
      ]}
      {...props}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator accessibilityLabel={`${label} loading`} color={foreground} />
        ) : (
          <>
            {renderIcon(leadingIcon, foreground)}
            <AppText variant="button" style={[{ color: foreground }, labelStyle]}>
              {label}
            </AppText>
            {renderIcon(trailingIcon, foreground)}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MINIMUM_TOUCH_TARGET,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  content: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  outline: {
    borderWidth: 1,
  },
  ghost: {
    paddingHorizontal: 12,
  },
  focused: {
    borderWidth: 2,
  },
});
