// src/devtools/__tests__/DevToolsRoot.test.tsx
// Production-disabled behavior test: DevToolsRoot must render nothing when isDevToolsEnabled is
// false, and must render the launcher when it is true. This directly tests the "Dev panel
// production build'de görünmemeli" requirement at the component level.
//
// Real screen modules are mocked (same convention as
// src/app/navigation/__tests__/RootNavigator.test.tsx) because DevToolsRoot -> DevToolsNavigator ->
// screens/index -> ScreenTesterScreen -> screenRegistry.ts imports the real screens, and
// AuthScreens.tsx / AuthStatePanel.tsx transitively import `firebase/auth` (ESM build unparsable
// outside jest-expo's transform scope for this isolated test file).
//
// Guard control: instead of reloading modules with `jest.resetModules()`/`jest.isolateModules`
// (which creates a SEPARATE `react` module instance per reload and breaks hooks with
// "Invalid hook call" when combined with a single statically-imported `react-test-renderer`), we
// use a single static `jest.mock('../guard', ...)` backed by a mutable holder object. Both test
// cases share the same React/module instances; only the guard's exported value changes between
// cases.

const guardState = { isDevToolsEnabled: true };

// The global Jest setup replaces useNavigation with a no-op mock for isolated screen tests.
// DevTools interaction tests need the real navigation context so button presses exercise the
// actual independent stack rather than a mocked navigate() function.
jest.mock('@react-navigation/native', () => jest.requireActual('@react-navigation/native'));

jest.mock('../guard', () => ({
  get isDevToolsEnabled() {
    return guardState.isDevToolsEnabled;
  },
}));
jest.mock('../panels/NotificationDebugPanel', () => ({
  NotificationDebugPanel: () => null,
}));

jest.mock('@features/favorites', () => ({ FavoritesScreen: () => null }));
jest.mock('@features/learning', () => ({
  HomeScreen: () => {
    const React = require('react');
    const { Pressable, Text } = require('react-native');
    const { useNavigation } = require('@react-navigation/native');
    const navigation = useNavigation();

    return React.createElement(
      Pressable,
      {
        testID: 'devtools-mock-home-open-settings',
        onPress: () => navigation.navigate('Settings'),
      },
      React.createElement(Text, null, 'Open settings'),
    );
  },
  ExampleSentencesScreen: () => null,
}));
jest.mock('@features/onboarding', () => () => null);
jest.mock('@features/settings', () => () => {
  const React = require('react');
  const { View } = require('react-native');
  return React.createElement(View, { testID: 'devtools-mock-settings-screen' });
});
jest.mock('@features/setup', () => ({ LevelTestScreen: () => null, SetupScreen: () => null }));
jest.mock('@features/auth', () => ({
  ForgotPasswordScreen: () => null,
  LoginScreen: () => null,
  SignUpScreen: () => null,
  useAuth: () => ({
    user: null,
    userData: null,
    isLoading: false,
    isAuthenticated: false,
    connectionError: false,
  }),
}));

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { DevToolsRoot } from '../DevToolsRoot';

describe('DevToolsRoot (production guard behavior)', () => {
  it('renders null when isDevToolsEnabled is false (production behavior)', () => {
    guardState.isDevToolsEnabled = false;

    const { toJSON, queryByTestId } = render(<DevToolsRoot />);

    expect(toJSON()).toBeNull();
    expect(queryByTestId('devtools-launcher-button')).toBeNull();
  });

  it('renders the launcher button when isDevToolsEnabled is true (dev behavior)', () => {
    guardState.isDevToolsEnabled = true;

    const { queryByTestId } = render(<DevToolsRoot />);

    expect(queryByTestId('devtools-launcher-button')).toBeTruthy();
  });

  it('opens the panel and navigates when a menu button is pressed', async () => {
    guardState.isDevToolsEnabled = true;

    const { getByTestId } = render(<DevToolsRoot />);

    fireEvent.press(getByTestId('devtools-launcher-button'));
    expect(getByTestId('devtools-home-screen')).toBeTruthy();

    fireEvent.press(getByTestId('devtools-touch-test'));
    expect(getByTestId('devtools-touch-test')).toHaveTextContent('Touch input OK - 1');

    fireEvent.press(getByTestId('devtools-menu-ScreenTester'));

    await waitFor(() => {
      expect(getByTestId('devtools-screen-tester-panel')).toBeTruthy();
    });

    fireEvent.press(getByTestId('devtools-screen-entry-Home'));
    await waitFor(() => {
      expect(getByTestId('devtools-mock-home-open-settings')).toBeTruthy();
    });

    fireEvent.press(getByTestId('devtools-mock-home-open-settings'));
    await waitFor(() => {
      expect(getByTestId('devtools-mock-settings-screen')).toBeTruthy();
    });

    // Let React Navigation's mocked native animation completion callbacks settle inside act.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });
  });

  it('closes the panel when the header close button is pressed', () => {
    guardState.isDevToolsEnabled = true;

    const { getByTestId, queryByTestId } = render(<DevToolsRoot />);

    fireEvent.press(getByTestId('devtools-launcher-button'));
    fireEvent.press(getByTestId('devtools-close-button'));

    expect(queryByTestId('devtools-home-screen')).toBeNull();
  });
});
