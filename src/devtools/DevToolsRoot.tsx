// src/devtools/DevToolsRoot.tsx
// The ONLY component `src/app/App.tsx` needs to import to get the Developer Test Panel.
//
// Renders nothing (`null`) unless `isDevToolsEnabled` (guard.ts) is true — which itself is only
// ever true when `__DEV__` is true (never in a production release build). When enabled, renders a
// small floating launcher button that opens `DevToolsNavigator` as a full-screen overlay with its
// own independent `NavigationContainer` (never touching RootNavigator/RootStackParamList).

import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { isDevToolsEnabled } from './guard';
import { DevToolsNavigator } from './DevToolsNavigator';

export function DevToolsRoot() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isDevToolsEnabled) {
    return null;
  }

  return (
    <>
      <View style={styles.launcherContainer} pointerEvents="box-none">
        <Pressable
          testID="devtools-launcher-button"
          style={styles.launcherButton}
          onPress={() => setIsOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open Developer Test Panel"
        >
          <Text style={styles.launcherButtonText}>DEV</Text>
        </Pressable>
      </View>

      <Modal
        visible={isOpen}
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
        testID="devtools-modal"
      >
        <DevToolsNavigator onClose={() => setIsOpen(false)} />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  launcherContainer: {
    position: 'absolute',
    right: 12,
    bottom: 80,
    zIndex: 9999,
    elevation: 9999,
  },
  launcherButton: {
    backgroundColor: '#111',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    opacity: 0.85,
  },
  launcherButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
});

export default DevToolsRoot;
