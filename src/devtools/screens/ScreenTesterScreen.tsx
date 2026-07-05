// src/devtools/screens/ScreenTesterScreen.tsx
// Navigator container for ScreenTesterPanel — pushes the selected registry entry onto the
// DevTools stack under its own route ("ScreenPreview"), passing sampleParams if any.

import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { ScreenTesterPanel } from '../panels/ScreenTesterPanel';
import type { DevToolsStackParamList } from '../DevToolsNavigator';
import type { ScreenRegistryEntry } from '../screenRegistry';

type Nav = StackNavigationProp<DevToolsStackParamList, 'ScreenTester'>;

export function ScreenTesterScreen() {
  const navigation = useNavigation<Nav>();

  const handleOpenScreen = (entry: ScreenRegistryEntry) => {
    navigation.navigate('ScreenPreview', { screenId: entry.id, ...(entry.sampleParams ?? {}) });
  };

  return <ScreenTesterPanel onOpenScreen={handleOpenScreen} />;
}
