import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@shared/theme';
import { StateLayout, type StateLayoutProps } from './StateLayout';

export type ErrorStateProps = Omit<StateLayoutProps, 'busy' | 'icon'> & {
  retryLabel?: string;
  onRetry?: () => void | Promise<void>;
};

export function ErrorState({ retryLabel, onRetry, ...props }: ErrorStateProps) {
  const { colors } = useTheme();
  return (
    <StateLayout
      actionLabel={retryLabel}
      icon={<MaterialIcons color={colors.danger} name="error-outline" size={48} />}
      onAction={onRetry}
      {...props}
    />
  );
}
