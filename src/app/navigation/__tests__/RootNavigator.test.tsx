// Verifies RootNavigator registers EXACTLY the expected routes, in order, with no additions
// (supports the Phase 2 contract: no new routes / flow unchanged). Navigation libs and screen
// modules are mocked so the heavy screens (and their Firebase imports) are never loaded.

import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@react-navigation/native', () => {
  const { View } = require('react-native');
  return {
    NavigationContainer: ({ children }: any) => <View testID="nav-container">{children}</View>,
    DefaultTheme: { colors: {} },
    DarkTheme: { colors: {} },
  };
});

jest.mock('@react-navigation/stack', () => {
  const { View } = require('react-native');
  return {
    createStackNavigator: () => ({
      Navigator: ({ children }: any) => <View testID="navigator">{children}</View>,
      Screen: ({ name }: any) => <View testID={`route:${name}`} />,
    }),
  };
});

jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

jest.mock('../../../../context/ThemeContext', () => ({
  useTheme: () => ({
    isDarkMode: false,
    colors: { primary: '#000', background: '#fff', text: '#000', border: '#ccc' },
  }),
}));

// Mock every screen module so RootNavigator can import them without loading real screens.
jest.mock('../../../../screens/OnboardingScreen', () => () => null);
jest.mock('../../../../screens/AuthScreens', () => ({ LoginScreen: () => null, SignUpScreen: () => null }));
jest.mock('../../../../screens/SetupScreens', () => ({ SetupScreen: () => null }));
jest.mock('../../../../screens/SettingsScreen', () => () => null);
jest.mock('@features/favorites', () => ({ FavoritesScreen: () => null }));
jest.mock('@features/learning', () => ({ HomeScreen: () => null, ExampleSentencesScreen: () => null }));
jest.mock('@features/setup', () => ({ LevelTestScreen: () => null }));
jest.mock('../../../../screens/ForgotPasswordScreen', () => () => null);

import { RootNavigator } from '../RootNavigator';

function collectRouteNames(node: any, names: string[] = []): string[] {
  if (!node) return names;
  if (Array.isArray(node)) {
    node.forEach(child => collectRouteNames(child, names));
    return names;
  }
  const testID: string | undefined = node.props && node.props.testID;
  if (testID && testID.startsWith('route:')) names.push(testID.slice('route:'.length));
  if (node.children) collectRouteNames(node.children, names);
  return names;
}

describe('RootNavigator', () => {
  it('registers exactly the expected routes in order', () => {
    const ref = React.createRef<any>();
    const { toJSON } = render(
      <RootNavigator initialRoute="Login" navigationRef={ref} />
    );

    const routes = collectRouteNames(toJSON());
    expect(routes).toEqual([
      'Onboarding',
      'Login',
      'SignUp',
      'ForgotPassword',
      'NativeLanguage',
      'LevelTest',
      'MainTabs',
      'Settings',
      'Favorites',
      'ExampleSentences',
    ]);
  });
});
