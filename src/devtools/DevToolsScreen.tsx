// src/devtools/DevToolsScreen.tsx
// Main menu of the Developer Test Panel. Lets the developer navigate to each panel
// (Screen Tester, Auth State, Storage Debug, Notification Debug, Firestore Model) and pick the
// active scenario used by the read-only preview panels.

import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { DevToolsStackParamList } from './DevToolsNavigator';
import { useSelectedScenario } from './scenarioStore';

type Nav = StackNavigationProp<DevToolsStackParamList, 'DevToolsHome'>;

const MENU_ITEMS: { route: keyof DevToolsStackParamList; label: string; description: string }[] = [
  {
    route: 'ScreenTester',
    label: 'Screens',
    description: 'Open any real screen from screenRegistry.ts',
  },
  {
    route: 'ComponentCatalog',
    label: 'Components',
    description: 'Interactive public primitive variants',
  },
  {
    route: 'StateCatalog',
    label: 'States',
    description: 'Loading, empty, error and offline scenarios',
  },
  {
    route: 'ThemeCatalog',
    label: 'Theme',
    description: 'Light and dark semantic token contracts',
  },
  {
    route: 'ResponsiveCatalog',
    label: 'Responsive',
    description: 'Live orientation and size-class metrics',
  },
  {
    route: 'AccessibilityCatalog',
    label: 'Accessibility',
    description: 'Labels, roles, states and touch targets',
  },
  {
    route: 'MotionCatalog',
    label: 'Motion',
    description: 'Reduced-motion behavior previews',
  },
  {
    route: 'ScenarioPicker',
    label: 'Scenarios',
    description: 'Pick a named fixture scenario for preview panels',
  },
  {
    route: 'AuthState',
    label: 'Auth State',
    description: 'Live auth state (read-only) vs. scenario fixture',
  },
  {
    route: 'StorageDebug',
    label: 'Storage Debug',
    description: 'Inspect real AsyncStorage keys (read-only)',
  },
  {
    route: 'NotificationDebug',
    label: 'Notification Debug',
    description: 'Inspect permission/settings/schedule (read-only)',
  },
  {
    route: 'FirestoreModel',
    label: 'Firestore Model',
    description: 'Offline fixture preview of the users/{uid} doc shape',
  },
];

export function DevToolsScreen() {
  const navigation = useNavigation<Nav>();
  const [scenario] = useSelectedScenario();
  const [touchCount, setTouchCount] = useState(0);

  return (
    <ScrollView style={styles.container} testID="devtools-home-screen">
      <Text style={styles.title}>Developer Test Panel</Text>
      <Text style={styles.subtitle}>
        Internal only — never available in a production build. Active scenario: {scenario.label}
      </Text>
      <Pressable
        accessibilityLabel="Test developer panel touch input"
        accessibilityRole="button"
        onPress={() => setTouchCount((count) => count + 1)}
        style={styles.touchTest}
        testID="devtools-touch-test"
      >
        <Text style={styles.touchTestText}>
          {touchCount === 0 ? 'Touch test - tap here' : `Touch input OK - ${touchCount}`}
        </Text>
      </Pressable>
      {MENU_ITEMS.map((item) => (
        <Pressable
          key={item.route}
          testID={`devtools-menu-${item.route}`}
          style={styles.menuItem}
          onPress={() => navigation.navigate(item.route as any)}
        >
          <Text style={styles.menuItemLabel}>{item.label}</Text>
          <Text style={styles.menuItemDescription}>{item.description}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#666', marginBottom: 20 },
  touchTest: {
    alignItems: 'center',
    backgroundColor: '#e8f7ee',
    borderColor: '#2b9b58',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  touchTestText: { color: '#176a39', fontSize: 14, fontWeight: '700' },
  menuItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuItemLabel: { fontSize: 16, fontWeight: '700' },
  menuItemDescription: { fontSize: 12, color: '#777', marginTop: 2 },
});

export default DevToolsScreen;
