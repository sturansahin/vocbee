import React, { useId, useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { MINIMUM_TOUCH_TARGET } from '@shared/responsive';
import { useTheme } from '@shared/theme';
import { AppText } from './AppText';

export interface AppInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  helperText?: string;
  errorText?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  passwordVisibilityLabels?: {
    show: string;
    hide: string;
  };
}

export function AppInput({
  label,
  helperText,
  errorText,
  leading,
  trailing,
  containerStyle,
  inputStyle,
  secureTextEntry,
  passwordVisibilityLabels = { show: 'Show password', hide: 'Hide password' },
  editable = true,
  ...props
}: AppInputProps) {
  const { colors, radii, spacing, typography } = useTheme();
  const generatedId = useId().replace(/:/g, '');
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const inputId = props.nativeID ?? `input-${generatedId}`;
  const supportingText = errorText ?? helperText;

  return (
    <View style={[styles.container, { gap: spacing.sm }, containerStyle]}>
      <AppText nativeID={`${inputId}-label`} variant="bodyStrong">
        {label}
      </AppText>
      <View
        style={[
          styles.inputFrame,
          {
            backgroundColor: colors.surface,
            borderColor: errorText
              ? colors.danger
              : focused
                ? colors.focusRing
                : colors.borderDefault,
            borderRadius: radii.md,
            paddingHorizontal: spacing.lg,
          },
          !editable && { backgroundColor: colors.surfaceMuted },
        ]}
      >
        {leading}
        <TextInput
          accessibilityHint={supportingText}
          accessibilityLabel={label}
          accessibilityState={{ disabled: !editable }}
          editable={editable}
          nativeID={inputId}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          placeholderTextColor={colors.textDisabled}
          secureTextEntry={secureTextEntry && !passwordVisible}
          selectionColor={colors.accent}
          style={[
            styles.input,
            typography.input,
            { color: editable ? colors.textPrimary : colors.textDisabled },
            inputStyle,
          ]}
          {...props}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityLabel={
              passwordVisible ? passwordVisibilityLabels.hide : passwordVisibilityLabels.show
            }
            accessibilityRole="button"
            hitSlop={4}
            onPress={() => setPasswordVisible((visible) => !visible)}
            style={styles.passwordToggle}
          >
            <AppText color="textSecondary" variant="caption">
              {passwordVisible ? 'Hide' : 'Show'}
            </AppText>
          </Pressable>
        ) : (
          trailing
        )}
      </View>
      {supportingText ? (
        <AppText
          accessibilityLiveRegion={errorText ? 'polite' : 'none'}
          color={errorText ? 'danger' : 'textSecondary'}
          nativeID={`${inputId}-support`}
          variant="caption"
        >
          {errorText ? `Error: ${errorText}` : supportingText}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputFrame: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    gap: 8,
  },
  input: {
    minHeight: MINIMUM_TOUCH_TARGET,
    flex: 1,
    paddingVertical: 8,
  },
  passwordToggle: {
    minWidth: MINIMUM_TOUCH_TARGET,
    minHeight: MINIMUM_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
