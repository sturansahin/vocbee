import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../primitives/AppButton';
import { AppModal } from './AppModal';

export interface AppAlertAction {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
}

export interface AppAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  actions: readonly AppAlertAction[];
  onRequestClose: () => void;
  dismissOnBackdropPress?: boolean;
}

export function AppAlert({
  visible,
  title,
  message,
  actions,
  onRequestClose,
  dismissOnBackdropPress = false,
}: AppAlertProps) {
  return (
    <AppModal
      actions={
        <View style={styles.actions}>
          {actions.map((action) => (
            <AppButton
              key={action.label}
              disabled={action.disabled}
              fullWidth={actions.length === 1}
              label={action.label}
              loading={action.loading}
              onPress={action.onPress}
              variant={action.variant}
            />
          ))}
        </View>
      }
      description={message}
      dismissOnBackdropPress={dismissOnBackdropPress}
      onRequestClose={onRequestClose}
      title={title}
      visible={visible}
    />
  );
}

const styles = StyleSheet.create({
  actions: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
