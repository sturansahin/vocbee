import React from 'react';
import { StateLayout, type StateLayoutProps } from './StateLayout';

export type EmptyStateProps = Omit<StateLayoutProps, 'busy'>;

export function EmptyState(props: EmptyStateProps) {
  return <StateLayout {...props} />;
}
