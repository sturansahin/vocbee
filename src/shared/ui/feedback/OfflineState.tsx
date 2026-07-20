import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@shared/theme';
import { StateLayout, type StateLayoutProps } from './StateLayout';

export type OfflineStateProps = Omit<StateLayoutProps, 'busy' | 'icon'> & {
  cached?: boolean;
};

export function OfflineState({ cached = false, accessibilityLabel, ...props }: OfflineStateProps) {
  const { colors } = useTheme();
  return (
    <StateLayout
      accessibilityLabel={
        accessibilityLabel ?? `${props.title}. ${cached ? 'Cached content available' : 'Offline'}`
      }
      icon={<MaterialIcons color={colors.warning} name="wifi-off" size={48} />}
      {...props}
    />
  );
}
