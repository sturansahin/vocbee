// Verifies AppProviders renders the provider chain in the EXACT contracted order
// (docs/architecture.md) and passes children through. Heavy providers are mocked
// (AuthProvider would otherwise touch Firebase), so this isolates the composition/order.

import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaProvider: ({ children }: any) => <View testID="safe-area">{children}</View> };
});
jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return {
    GestureHandlerRootView: ({ children }: any) => <View testID="gesture-root">{children}</View>,
  };
});
jest.mock('@shared/theme', () => {
  const { View } = require('react-native');
  return { ThemeProvider: ({ children }: any) => <View testID="theme">{children}</View> };
});
jest.mock('@features/auth', () => {
  const { View } = require('react-native');
  return { AuthProvider: ({ children }: any) => <View testID="auth">{children}</View> };
});
jest.mock('@features/monetization', () => {
  const { View } = require('react-native');
  return {
    MonetizationProvider: ({ children }: any) => <View testID="monetization">{children}</View>,
  };
});
jest.mock('@shared/ui', () => {
  const { View } = require('react-native');
  return {
    AlertProvider: ({ children }: any) => <View testID="alert">{children}</View>,
    ErrorBoundary: ({ children }: any) => <View testID="error-boundary">{children}</View>,
    OfflineNotice: () => <View testID="offline-notice" />,
  };
});

import { AppProviders } from '../AppProviders';

function collectTestIds(node: any, ids: string[] = []): string[] {
  if (!node) return ids;
  if (Array.isArray(node)) {
    node.forEach((child) => collectTestIds(child, ids));
    return ids;
  }
  if (node.props && node.props.testID) ids.push(node.props.testID);
  if (node.children) collectTestIds(node.children, ids);
  return ids;
}

describe('AppProviders', () => {
  it('renders the provider chain in the exact contracted order and passes children through', () => {
    const { toJSON, getByText } = render(
      <AppProviders>
        <Text>CHILD_CONTENT</Text>
      </AppProviders>,
    );

    // children reach the bottom of the chain
    expect(getByText('CHILD_CONTENT')).toBeTruthy();

    // pre-order testID traversal must match the binding provider order
    const ids = collectTestIds(toJSON());
    expect(ids).toEqual([
      'safe-area',
      'theme',
      'alert',
      'auth',
      'monetization',
      'error-boundary',
      'gesture-root',
      'offline-notice',
    ]);
  });
});
