// src/app/bootstrap/useAppBootstrap.ts
// Extracted VERBATIM from App.tsx's App() font/splash bootstrap in Phase 2 (docs/architecture.md).
// Same effects, same order, same conditions. Returns `fontsReady` (custom fonts AND icon fonts loaded);
// the caller renders null until this is true — identical to the original gate.

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import {
  useFonts,
  SpecialGothicExpandedOne_400Regular,
} from '@expo-google-fonts/special-gothic-expanded-one';
import { RubikMonoOne_400Regular } from '@expo-google-fonts/rubik-mono-one';
import {
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome5,
  Feather,
  Ionicons,
} from '@expo/vector-icons';

export function useAppBootstrap(): boolean {
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
  return Boolean(fontsLoaded && iconFontsLoaded);
}
