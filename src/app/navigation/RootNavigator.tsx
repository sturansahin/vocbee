// src/app/navigation/RootNavigator.tsx
// Extracted VERBATIM from App.tsx (AppContent's NavigationContainer render) in Phase 2
// (docs/refactor-v2/22). Behavior unchanged: same routes, same order, same theme mapping,
// same screenOptions. No new routes/screens.

import React, { useMemo } from 'react';
import {
  DefaultTheme,
  DarkTheme,
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from '../../../types';
import { useTheme } from '../../../context/ThemeContext';
import { HomeScreen } from '@features/learning';

// Migrated routes use feature public barrels; remaining routes retain compatibility imports until
// their owning completion prompts.
import OnboardingScreen from '../../../screens/OnboardingScreen';
import { LoginScreen, SignUpScreen } from '../../../screens/AuthScreens';
import { SetupScreen } from '../../../screens/SetupScreens';
import SettingsScreen from '../../../screens/SettingsScreen';
import FavoritesScreen from '../../../screens/FavoritesScreen';
import ExampleSentencesScreen from '../../../screens/ExampleSentencesScreen';
import LevelTestScreen from '../../../screens/LevelTestScreen';
import ForgotPasswordScreen from '../../../screens/ForgotPasswordScreen';

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
        primary: colors.primary,
        background: colors.background,
        card: colors.background,
        text: colors.text,
        border: colors.border,
        notification: colors.primary,
      },
    };
  }, [isDarkMode, colors.background, colors.border, colors.primary, colors.text]);

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRoute}
      >
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

        {/* Detail Screens */}
        <Stack.Screen name="ExampleSentences" component={ExampleSentencesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default RootNavigator;
