import React, { useEffect, useCallback } from 'react';
import { Platform, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, SpecialGothicExpandedOne_400Regular } from '@expo-google-fonts/special-gothic-expanded-one';
import { COLORS } from './constants';
import { RootStackParamList, MainTabParamList } from './types';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Screens
import OnboardingScreen from './screens/OnboardingScreen';
import { LoginScreen, SignUpScreen } from './screens/AuthScreens';
import { SetupScreen } from './screens/SetupScreens';
import HomeScreen from './screens/HomeScreen';
import FlashcardScreen from './screens/FlashcardScreen';
import SettingsScreen from './screens/SettingsScreen';
import ExampleSentencesScreen from './screens/ExampleSentencesScreen';

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Export font family name for use throughout the app
export const FONT_FAMILY = 'SpecialGothicExpandedOne_400Regular';

function MainTabNavigator() {
  const { colors, isDarkMode } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 20,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialIcons name="home" size={28} color={color} />,
          tabBarLabelStyle: { fontFamily: FONT_FAMILY, fontSize: 10, letterSpacing: 0.5 },
        }}
      />
      <Tab.Screen
        name="Flashcards"
        component={FlashcardScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialIcons name="style" size={28} color={color} />,
          tabBarLabelStyle: { fontFamily: FONT_FAMILY, fontSize: 10, letterSpacing: 0.5 },
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialIcons name="settings" size={28} color={color} />,
          tabBarLabelStyle: { fontFamily: FONT_FAMILY, fontSize: 10, letterSpacing: 0.5 },
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  // Load fonts
  const [fontsLoaded] = useFonts({
    SpecialGothicExpandedOne_400Regular,
  });

  // Set Android navigation bar to transparent
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('transparent');
      NavigationBar.setButtonStyleAsync('light');
      NavigationBar.setPositionAsync('absolute');
    }
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
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Onboarding Flow */}
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />

            {/* Auth Flow */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            {/* Setup Flow - Single unified screen with steps */}
            <Stack.Screen name="NativeLanguage" component={SetupScreen} />

            {/* Main App */}
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />

            {/* Detail Screens */}
            <Stack.Screen name="ExampleSentences" component={ExampleSentencesScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
