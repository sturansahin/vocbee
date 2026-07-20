import React from 'react';
import { StateLayout, type StateLayoutProps } from './StateLayout';

export type LoadingStateProps = Omit<StateLayoutProps, 'busy' | 'icon'>;

export function LoadingState({ title = 'Loading', ...props }: LoadingStateProps) {
  return <StateLayout busy title={title} {...props} />;
}
