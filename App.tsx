import React, { useEffect, useCallback, useRef } from 'react';
import { Platform, View, Text, AppState, AppStateStatus } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Font from 'expo-font';
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
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';

// Configure notifications globally
configureNotifications();

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator<RootStackParamList>();

// Export font family name for use throughout the app
export const FONT_FAMILY = 'SpecialGothicExpandedOne_400Regular';

// AppContent component to access auth context
function AppContent() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const appState = useRef(AppState.currentState);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  // ... existing effects ...

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
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
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && iconFontsLoaded) {
      await SplashScreen.hideAsync();
    }
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
              <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
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
