// src/app/navigation/RootNavigator.tsx
// App-level navigation composition (docs/architecture.md).

import React, { useMemo } from 'react';
import {
  DefaultTheme,
  DarkTheme,
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { GameLauncherScreen } from '@app/presentation';
import type { RootStackParamList } from './types';
import { useTheme } from '@shared/theme';
import { FavoritesScreen } from '@features/favorites';
import { ExampleSentencesScreen, HomeScreen } from '@features/learning';
import { ForgotPasswordScreen, LoginScreen, SignUpScreen } from '@features/auth';
import OnboardingScreen from '@features/onboarding';
import SettingsScreen from '@features/settings';
import { LevelTestScreen, SetupScreen } from '@features/setup';

const Stack = createStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  initialRoute: keyof RootStackParamList;
  navigationRef: React.Ref<NavigationContainerRef<RootStackParamList>>;
}

export function RootNavigator({ initialRoute, navigationRef }: RootNavigatorProps) {
  const { isDarkMode, colors } = useTheme();

  const navigationTheme = useMemo(() => {
    const baseTheme = isDarkMode ? DarkTheme : DefaultTheme;

    return {
      ...baseTheme,
      dark: isDarkMode,
      colors: {
        ...baseTheme.colors,
        primary: colors.accent,
        background: colors.background,
        card: colors.background,
        text: colors.textPrimary,
        border: colors.borderDefault,
        notification: colors.accent,
      },
    };
  }, [isDarkMode, colors.accent, colors.background, colors.borderDefault, colors.textPrimary]);

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        {/* Onboarding Flow */}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />

        {/* Auth Flow */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        {/* Setup Flow - Single unified screen with steps */}
        <Stack.Screen name="NativeLanguage" component={SetupScreen} />
        <Stack.Screen name="LevelTest" component={LevelTestScreen} />

        {/* Main App - HomeScreen directly (no tabs) */}
        <Stack.Screen name="MainTabs" component={HomeScreen} />

        {/* Settings Screen */}
        <Stack.Screen name="Settings" component={SettingsScreen} />

        {/* Favorites Screen */}
        <Stack.Screen name="Favorites" component={FavoritesScreen} />

        {/* Unity word game launcher */}
        <Stack.Screen name="Game" component={GameLauncherScreen} />

        {/* Detail Screens */}
        <Stack.Screen name="ExampleSentences" component={ExampleSentencesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default RootNavigator;
