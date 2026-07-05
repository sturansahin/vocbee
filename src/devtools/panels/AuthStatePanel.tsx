// src/devtools/panels/AuthStatePanel.tsx
// Shows the CURRENT real auth state (read-only, via useAuth()) side by side with the currently
// selected fixture scenario's auth shape. Read-only — never calls any mutating auth method.

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import type { DevToolsScenario } from '../scenarios';

export interface AuthStatePanelProps {
  scenario: DevToolsScenario;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function AuthStatePanel({ scenario }: AuthStatePanelProps) {
  const { user, userData, isLoading, isAuthenticated, connectionError } = useAuth();

  return (
    <ScrollView style={styles.container} testID="devtools-auth-state-panel">
      <Text style={styles.title}>Auth State (live, read-only)</Text>
      <Row label="isAuthenticated" value={String(isAuthenticated)} />
      <Row label="isLoading" value={String(isLoading)} />
      <Row label="connectionError" value={String(connectionError)} />
      <Row label="user.uid" value={user?.uid ?? '(none)'} />
      <Row label="userData.setupCompleted" value={String((userData as any)?.setupCompleted ?? '(none)')} />

      <Text style={[styles.title, styles.sectionSpacing]}>Selected Scenario Fixture (preview only)</Text>
      <Row label="scenario.id" value={scenario.id} />
      <Row label="scenario.auth.user" value={scenario.auth.user ? scenario.auth.user.uid : '(null / logged out)'} />
      <Row label="scenario.auth.userData.setupCompleted" value={String(scenario.auth.userData?.setupCompleted ?? '(null)')} />
      <Row label="scenario.auth.isLoading" value={String(scenario.auth.isLoading)} />
      <Row label="scenario.auth.connectionError" value={String(scenario.auth.connectionError)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  sectionSpacing: { marginTop: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowLabel: { fontSize: 13, color: '#333', flex: 1 },
  rowValue: { fontSize: 13, color: '#111', fontWeight: '600', flex: 1, textAlign: 'right' },
});
