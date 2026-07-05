// src/devtools/panels/ScreenTesterPanel.tsx
// Lists every screen in screenRegistry.ts and lets the developer open it inside the DevTools
// navigation stack. Screens render through the REAL provider chain (AuthProvider/
// MonetizationProvider/ThemeProvider from src/app/App.tsx) — see screenRegistry.ts header for why
// there is no fake-data injection here. Selecting a scenario in ScenarioPickerPanel first is
// informational (it does not rewrite what the real screen reads), so notes are shown per screen.

import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SCREEN_REGISTRY, ScreenRegistryEntry } from '../screenRegistry';

export interface ScreenTesterPanelProps {
  onOpenScreen: (entry: ScreenRegistryEntry) => void;
}

export function ScreenTesterPanel({ onOpenScreen }: ScreenTesterPanelProps) {
  return (
    <View style={styles.container} testID="devtools-screen-tester-panel">
      <Text style={styles.title}>Screen Tester</Text>
      <Text style={styles.subtitle}>
        Opens real, unmodified screens inside an isolated DevTools stack (real Auth/Monetization
        providers — this does not inject fixture data into the screen itself).
      </Text>
      <FlatList
        data={SCREEN_REGISTRY}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable
            testID={`devtools-screen-entry-${item.id}`}
            style={styles.row}
            onPress={() => onOpenScreen(item)}
          >
            <Text style={styles.rowLabel}>{item.label}</Text>
            {item.notes ? <Text style={styles.rowNotes}>{item.notes}</Text> : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#666', marginBottom: 12 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowNotes: { fontSize: 11, color: '#888', marginTop: 2 },
});
