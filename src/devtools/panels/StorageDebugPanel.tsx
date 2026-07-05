// src/devtools/panels/StorageDebugPanel.tsx
// Read-only AsyncStorage inspector. Lists all known STORAGE_KEYS and their current stored value
// (raw string) on the REAL device/simulator AsyncStorage. Intentionally has NO clear/delete
// action — this panel must never be able to destructively mutate real local user data
// (see ADIM 1 rule: "Dev panel production kullanıcı datasına destructive işlem yapmamalı").

import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@shared/storage';

interface StorageRow {
  key: string;
  value: string | null;
}

export function StorageDebugPanel() {
  const [rows, setRows] = useState<StorageRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const staticKeys = Object.values(STORAGE_KEYS).filter(
        // Exclude prefix-only entries (they are not real keys by themselves).
        k => !k.endsWith('_') && !k.endsWith('Prefix')
      );
      const entries = await Promise.all(
        staticKeys.map(async key => ({ key, value: await AsyncStorage.getItem(key) }))
      );
      setRows(entries);
    } catch (error) {
      console.error('[DevTools][StorageDebugPanel] Failed to read AsyncStorage', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <View style={styles.container} testID="devtools-storage-debug-panel">
      <Text style={styles.title}>Storage Debug (read-only)</Text>
      <Text style={styles.subtitle}>
        Inspects real on-device AsyncStorage values. No write/clear action exists here by design.
      </Text>
      <Pressable style={styles.refreshButton} onPress={refresh} testID="devtools-storage-refresh">
        <Text style={styles.refreshButtonText}>{loading ? 'Refreshing…' : 'Refresh'}</Text>
      </Pressable>
      <FlatList
        data={rows}
        keyExtractor={item => item.key}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowKey}>{item.key}</Text>
            <Text style={styles.rowValue} numberOfLines={2}>
              {item.value === null ? '(empty)' : item.value}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#666', marginBottom: 12 },
  refreshButton: { backgroundColor: '#eee', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  refreshButtonText: { fontWeight: '600' },
  row: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowKey: { fontSize: 12, fontWeight: '700', color: '#333' },
  rowValue: { fontSize: 11, color: '#666', marginTop: 2 },
});
