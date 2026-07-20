import React from 'react';
import { StyleSheet, Switch, View, type SwitchProps } from 'react-native';
import { MINIMUM_TOUCH_TARGET } from '@shared/responsive';
import { useTheme } from '@shared/theme';

export interface AppSwitchProps extends Omit<SwitchProps, 'accessibilityRole'> {
  accessibilityLabel: string;
}

export function AppSwitch({
  accessibilityLabel,
  value = false,
  disabled = false,
  ...props
}: AppSwitchProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.target}>
      <Switch
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
        disabled={disabled}
        ios_backgroundColor={colors.borderDefault}
        thumbColor={value ? colors.onAccent : colors.surfaceElevated}
        trackColor={{ false: colors.borderDefault, true: colors.accent }}
        value={value}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  target: {
    minWidth: MINIMUM_TOUCH_TARGET,
    minHeight: MINIMUM_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
