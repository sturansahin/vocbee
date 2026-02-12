import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, Text, AppState, AppStateStatus } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Font from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, SpecialGothicExpandedOne_400Regular } from '@expo-google-fonts/special-gothic-expanded-one';
import { RubikMonoOne_400Regular } from '@expo-google-fonts/rubik-mono-one';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5, Feather, Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from './types';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertProvider } from './components/CustomAlert';
import { autoSync } from './services/SyncService';
import {
  configureNotifications,
  handleNotificationResponse,
  refillNotifications,
  processDeliveredNotifications,
  setLastForegroundTime,
  setLastBackgroundTime,
} from './services/notificationService';
import { STORAGE_KEYS } from './services/storageKeys';
import { requestAdConsent, initializeAdMob, checkAndShowAppOpenAd } from './services/adMobService';

// Screens
import CustomSplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import { LoginScreen, SignUpScreen } from './screens/AuthScreens';
import { SetupScreen } from './screens/SetupScreens';
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import ExampleSentencesScreen from './screens/ExampleSentencesScreen';
import LevelTestScreen from './screens/LevelTestScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';

// Configure notifications globally
configureNotifications();

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator<RootStackParamList>();

// Font family re-exported from typography for backward compat
import { FONT_FAMILY } from './utils/typography';
export { FONT_FAMILY };

// AppContent component to access auth context
function AppContent() {
  const { user, userData, isLoading, connectionError } = useAuth();
  const { isDarkMode } = useTheme();
  const appState = useRef(AppState.currentState);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  const [isAppReady, setIsAppReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Onboarding');
  const [showSplash, setShowSplash] = useState(true);

  // Determine initial route based on app state
  useEffect(() => {
    const determineInitialRoute = async () => {
      try {
        console.log('[App] Determining initial route...');
        // Check if user has seen onboarding
        const hasSeenOnboarding = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING);
        console.log('[App] Has seen onboarding:', hasSeenOnboarding);

        // Wait for auth to finish loading
        if (isLoading) {
          console.log('[App] Auth still loading, waiting...');
          return;
        }
        console.log('[App] Auth loaded. User:', user ? 'logged in' : 'not logged in');
        console.log('[App] userData:', userData ? JSON.stringify({ setupCompleted: userData.setupCompleted, prefs: userData.preferences }) : 'null');

        let route: keyof RootStackParamList = 'Onboarding';

        if (!hasSeenOnboarding) {
          // First time user - show onboarding
          route = 'Onboarding';
        } else if (user) {
          // User is logged in
          // Check if setup is completed by verifying setupCompleted flag OR complete preferences
          const hasCompletedSetup = (userData as any)?.setupCompleted === true ||
            (userData?.preferences?.nativeLanguage && userData?.preferences?.targetLanguage);

          if (hasCompletedSetup) {
            // Setup completed - go to home
            route = 'MainTabs';
          } else {
            // Logged in but setup not completed
            route = 'NativeLanguage';
          }
        } else {
          // Has seen onboarding but not logged in
          route = 'Login';
        }

        console.log('[App] Setting initial route to:', route);
        setInitialRoute(route);
        console.log('[App] App is ready!');
        setIsAppReady(true);
      } catch (error) {
        console.error('Error determining initial route:', error);
        // Default to onboarding on error
        setInitialRoute('Onboarding');
        setIsAppReady(true);
      }
    };

    determineInitialRoute();
  }, [user, userData, isLoading]);

  // Auto-sync setup - run immediately when user is available
  useEffect(() => {
    if (!user) return;

    // Run auto sync immediately
    autoSync(user.uid);
  }, [user]);

  // Handle notification responses
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });

    return () => subscription.remove();
  }, []);

  // Handle app state changes for background sync and notification refill
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        setLastBackgroundTime();
      }
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground - trigger sync if user is logged in
        if (user) {
          autoSync(user.uid);
          // Process delivered notifications first (marks words as learned/ignored)
          // Notifications delivered while app was open will be skipped
          processDeliveredNotifications().then(() => {
            // CRITICAL: Record foreground time AFTER processing delivered notifications
            // This ensures we have a proper baseline for next cycle
            setLastForegroundTime();
            // Then refill notifications to maintain 64 scheduled
            refillNotifications();
          });
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user]);

  // Show splash screen while app is not ready
  console.log('[App] Render - showSplash:', showSplash, 'isAppReady:', isAppReady, 'connectionError:', connectionError);
  if (showSplash || !isAppReady) {
    return <CustomSplashScreen onFinish={() => { console.log('[App] Splash finished'); setShowSplash(false); }} />;
  }

  // Show connection error screen ONLY if there's a connection problem AND no cached user data
  // If we have cached data, show OfflineNotice banner instead (allows offline usage)
  if (connectionError && !userData) {
    return <ConnectionErrorScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
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

import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineNotice } from './components/OfflineNotice';
import { ConnectionErrorScreen } from './components/ConnectionErrorScreen';

// ... existing imports ...

import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  // Load custom fonts
  const [fontsLoaded] = useFonts({
    SpecialGothicExpandedOne_400Regular,
    RubikMonoOne_400Regular,
  });

  // Preload icon fonts
  const [iconFontsLoaded, setIconFontsLoaded] = React.useState(false);

  useEffect(() => {
    async function loadIconFonts() {
      try {
        await Font.loadAsync({
          ...MaterialIcons.font,
          ...MaterialCommunityIcons.font,
          ...FontAwesome5.font,
          ...Feather.font,
          ...Ionicons.font,
        });
        setIconFontsLoaded(true);
      } catch (error) {
        console.error('Error loading icon fonts:', error);
        // Still allow app to start even if icon fonts fail
        setIconFontsLoaded(true);
      }
    }

    loadIconFonts();

    // Initialize AdMob: consent first (UMP/ATT), then SDK, then app-open ad
    requestAdConsent()
      .then(() => initializeAdMob())
      .then(() => checkAndShowAppOpenAd())
      .catch(err => console.error('[App] AdMob init chain error:', err));
  }, []);

  // Set Android navigation bar to transparent
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('transparent');
      NavigationBar.setButtonStyleAsync('light');
      NavigationBar.setPositionAsync('absolute');
    }
  }, []);

  // Hide splash screen when all fonts are loaded
  useEffect(() => {
    const hideSplash = async () => {
      if (fontsLoaded && iconFontsLoaded) {
        try {
          await SplashScreen.hideAsync();
          console.log('[App] Native splash screen hidden');
        } catch (error) {
          console.log('[App] Error hiding splash screen:', error);
        }
      }
    };
    hideSplash();
  }, [fontsLoaded, iconFontsLoaded]);

  // Wait for both custom fonts and icon fonts to load
  if (!fontsLoaded || !iconFontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AlertProvider>
          <AuthProvider>
            <ErrorBoundary>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <OfflineNotice />
                <AppContent />
              </GestureHandlerRootView>
            </ErrorBoundary>
          </AuthProvider>
        </AlertProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
