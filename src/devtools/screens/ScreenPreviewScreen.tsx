// src/devtools/screens/ScreenPreviewScreen.tsx
// Renders the real, unmodified screen selected in ScreenTesterPanel.
//
// Param forwarding: some real screens (LevelTestScreen, ExampleSentencesScreen) call
// `useRoute().params.<field>` directly, expecting the DevTools stack's route params to BE their
// expected shape (not nested under a wrapper key). ScreenTesterScreen therefore navigates to
// "ScreenPreview" with `{ screenId, ...sampleParams }` merged at the top level, and this component
// renders the target screen directly (no extra param-mapping layer, no `useRoute()` override
// needed) so the real screen's own `useRoute()` call sees exactly the params it expects.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { DevToolsStackParamList } from '../DevToolsNavigator';
import { SCREEN_REGISTRY } from '../screenRegistry';

type ScreenPreviewRoute = RouteProp<DevToolsStackParamList, 'ScreenPreview'>;

export function ScreenPreviewScreen() {
  const route = useRoute<ScreenPreviewRoute>();
  const entry = SCREEN_REGISTRY.find(item => item.id === route.params.screenId);

  if (!entry) {
    return (
      <View style={styles.center}>
        <Text>Unknown screen id: {route.params.screenId}</Text>
      </View>
    );
  }

  const ScreenComponent = entry.component;
  return <ScreenComponent />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
