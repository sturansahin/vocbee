// src/devtools/panels/NotificationDebugPanel.tsx
// Read-only notification debug view: current permission state, persisted settings, and count of
// currently scheduled notifications (via expo-notifications' own read API). No cancel/schedule
// action is exposed here — this panel must never mutate real scheduled notifications.

import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import {
  getNotificationPermissionState,
  getNotificationSettings,
  getScheduledNotificationCount,
} from '@features/notifications';

interface NotificationDebugState {
  permission: Awaited<ReturnType<typeof getNotificationPermissionState>> | null;
  settings: Awaited<ReturnType<typeof getNotificationSettings>> | null;
  scheduledCount: number | null;
}

export function NotificationDebugPanel() {
  const [state, setState] = useState<NotificationDebugState>({
    permission: null,
    settings: null,
    scheduledCount: null,
  });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [permission, settings, scheduled] = await Promise.all([
        getNotificationPermissionState(),
        getNotificationSettings(),
        getScheduledNotificationCount(),
      ]);
      setState({ permission, settings, scheduledCount: scheduled });
    } catch (error) {
      console.error('[DevTools][NotificationDebugPanel] Failed to read notification state', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ScrollView style={styles.container} testID="devtools-notification-debug-panel">
      <Text style={styles.title}>Notification Debug (read-only)</Text>
      <Text style={styles.subtitle}>
        Inspects real permission state, persisted settings and scheduled notification count. No
        schedule/cancel action exists here by design.
      </Text>
      <Pressable
        style={styles.refreshButton}
        onPress={refresh}
        testID="devtools-notification-refresh"
      >
        <Text style={styles.refreshButtonText}>{loading ? 'Refreshing…' : 'Refresh'}</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Permission</Text>
      <Text style={styles.value}>
        {state.permission ? JSON.stringify(state.permission, null, 2) : '(not loaded)'}
      </Text>

      <Text style={styles.sectionTitle}>Settings</Text>
      <Text style={styles.value}>
        {state.settings ? JSON.stringify(state.settings, null, 2) : '(not loaded)'}
      </Text>

      <Text style={styles.sectionTitle}>Scheduled notifications</Text>
      <Text style={styles.value}>
        {state.scheduledCount === null ? '(not loaded)' : `${state.scheduledCount} scheduled`}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#666', marginBottom: 12 },
  refreshButton: {
    backgroundColor: '#eee',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshButtonText: { fontWeight: '600' },
  sectionTitle: { fontSize: 13, fontWeight: '700', marginTop: 12, marginBottom: 4 },
  value: { fontSize: 11, color: '#333', fontFamily: 'monospace' },
});
