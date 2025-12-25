import React, { useEffect, useCallback, useRef } from 'react';
import { Platform, View, Text } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useFonts, SpecialGothicExpandedOne_400Regular } from '@expo-google-fonts/special-gothic-expanded-one';
import { RubikMonoOne_400Regular } from '@expo-google-fonts/rubik-mono-one';
import { RootStackParamList } from './types';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import {
  configureNotifications,
  handleNotificationResponse,
} from './services/notificationService';

// Screens
import OnboardingScreen from './screens/OnboardingScreen';
import { LoginScreen, SignUpScreen } from './screens/AuthScreens';
import { SetupScreen } from './screens/SetupScreens';
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import ExampleSentencesScreen from './screens/ExampleSentencesScreen';
import LevelTestScreen from './screens/LevelTestScreen';

// Configure notifications globally
configureNotifications();

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator<RootStackParamList>();

// Export font family name for use throughout the app
export const FONT_FAMILY = 'SpecialGothicExpandedOne_400Regular';

export default function App() {
  // Navigation ref for programmatic navigation
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  // Load fonts
  const [fontsLoaded] = useFonts({
    SpecialGothicExpandedOne_400Regular,
    RubikMonoOne_400Regular,
  });

  // Set Android navigation bar to transparent
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('transparent');
      NavigationBar.setButtonStyleAsync('light');
      NavigationBar.setPositionAsync('absolute');
    }
  }, []);

  // Setup notification response listener
  useEffect(() => {
    // Handle notification when app is opened from background/killed state
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      await handleNotificationResponse(response);
      // Navigate to HomeScreen to show the word
      if (navigationRef.current?.isReady()) {
        navigationRef.current.navigate('MainTabs');
      }
    });

    return () => {
      responseSubscription.remove();
    };
  }, []);

  // Hide splash screen when fonts are loaded
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="light" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Onboarding Flow */}
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />

            {/* Auth Flow */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
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
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

