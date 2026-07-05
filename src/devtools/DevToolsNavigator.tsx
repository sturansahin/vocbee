// src/devtools/DevToolsNavigator.tsx
// A COMPLETELY INDEPENDENT navigation stack for the Developer Test Panel.
//
// This is intentionally NOT part of `RootStackParamList` / `RootNavigator` (types.ts,
// src/app/navigation/RootNavigator.tsx are untouched by this module — see ADIM 1 rule: "Production
// navigation flow değiştirme"). DevToolsNavigator owns its own `NavigationContainer`, so it can be
// mounted/unmounted as a sibling overlay of the real app without ever registering a route inside
// the production stack. It is only ever mounted from `src/app/App.tsx` behind
// `isDevToolsEnabled` (see guard.ts) — see DevToolsRoot.tsx for the mount point.

import React from 'react';
import { Pressable, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { DevToolsScreen } from './DevToolsScreen';
import {
  AuthStateScreen,
  FirestoreModelScreen,
  ScenarioPickerScreen,
  ScreenPreviewScreen,
  ScreenTesterScreen,
} from './screens';
import { StorageDebugPanel } from './panels/StorageDebugPanel';
import { NotificationDebugPanel } from './panels/NotificationDebugPanel';

export type DevToolsStackParamList = {
  DevToolsHome: undefined;
  ScreenTester: undefined;
  ScreenPreview: { screenId: string } & Record<string, unknown>;
  ScenarioPicker: undefined;
  AuthState: undefined;
  StorageDebug: undefined;
  NotificationDebug: undefined;
  FirestoreModel: undefined;
};

const Stack = createStackNavigator<DevToolsStackParamList>();

export interface DevToolsNavigatorProps {
  /** Called when the developer requests to close/exit the DevTools overlay. */
  onClose: () => void;
}

export function DevToolsNavigator({ onClose }: DevToolsNavigatorProps) {
  return (
    <NavigationContainer independent>
      <Stack.Navigator
        initialRouteName="DevToolsHome"
        screenOptions={{
          headerShown: true,
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen
          name="DevToolsHome"
          component={DevToolsScreen}
          options={{
            title: 'DevTools',
            headerLeft: () => null,
            headerRight: () => <CloseButton onPress={onClose} />,
          }}
        />
        <Stack.Screen name="ScreenTester" component={ScreenTesterScreen} options={{ title: 'Screen Tester' }} />
        <Stack.Screen name="ScreenPreview" component={ScreenPreviewScreen} options={{ title: 'Screen Preview' }} />
        <Stack.Screen name="ScenarioPicker" component={ScenarioPickerScreen} options={{ title: 'Scenarios' }} />
        <Stack.Screen name="AuthState" component={AuthStateScreen} options={{ title: 'Auth State' }} />
        <Stack.Screen name="StorageDebug" component={StorageDebugPanel} options={{ title: 'Storage Debug' }} />
        <Stack.Screen name="NotificationDebug" component={NotificationDebugPanel} options={{ title: 'Notification Debug' }} />
        <Stack.Screen name="FirestoreModel" component={FirestoreModelScreen} options={{ title: 'Firestore Model' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function CloseButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" testID="devtools-close-button" style={{ paddingHorizontal: 12 }}>
      <Text style={{ fontWeight: '700' }}>Close</Text>
    </Pressable>
  );
}

export default DevToolsNavigator;
