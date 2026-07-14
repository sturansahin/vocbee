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

jest.mock('../guard', () => ({
  get isDevToolsEnabled() {
    return guardState.isDevToolsEnabled;
  },
}));

jest.mock('../../../screens/OnboardingScreen', () => () => null);
jest.mock('../../../screens/AuthScreens', () => ({ LoginScreen: () => null, SignUpScreen: () => null }));
jest.mock('../../../screens/SetupScreens', () => ({ SetupScreen: () => null }));
jest.mock('../../../screens/HomeScreen', () => () => null);
jest.mock('../../../screens/SettingsScreen', () => () => null);
jest.mock('../../../screens/FavoritesScreen', () => () => null);
jest.mock('../../../screens/ExampleSentencesScreen', () => () => null);
jest.mock('../../../screens/LevelTestScreen', () => () => null);
jest.mock('../../../screens/ForgotPasswordScreen', () => () => null);
jest.mock('@features/auth', () => ({
  useAuth: () => ({ user: null, userData: null, isLoading: false, isAuthenticated: false, connectionError: false }),
}));

import React from 'react';
import { render } from '@testing-library/react-native';
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
});
