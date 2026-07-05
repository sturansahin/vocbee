// src/devtools/panels/ScenarioPickerPanel.tsx
// Lets the developer pick which named scenario (docs: default/loading/empty/error/loggedOut/
// loggedIn/setupIncomplete/premium/freeWithAds/legacyProgress/progressByLevel) the other panels
// (AuthStatePanel, FirestoreModelPanel) preview. Pure UI state — no side effects.

import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SCENARIO_LIST, ScenarioId } from '../scenarios';

export interface ScenarioPickerPanelProps {
  selectedId: ScenarioId;
  onSelect: (id: ScenarioId) => void;
}

export function ScenarioPickerPanel({ selectedId, onSelect }: ScenarioPickerPanelProps) {
  return (
    <View style={styles.container} testID="devtools-scenario-picker-panel">
      <Text style={styles.title}>Scenarios</Text>
      <FlatList
        data={SCENARIO_LIST}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const active = item.id === selectedId;
          return (
            <Pressable
              testID={`devtools-scenario-entry-${item.id}`}
              style={[styles.row, active ? styles.rowActive : null]}
              onPress={() => onSelect(item.id)}
            >
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowDescription}>{item.description}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowActive: { backgroundColor: '#eef6ff' },
  rowLabel: { fontSize: 14, fontWeight: '600' },
  rowDescription: { fontSize: 11, color: '#777', marginTop: 2 },
});
