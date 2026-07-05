// src/devtools/panels/FirestoreModelPanel.tsx
// Displays the CURRENT scenario's fixture data shaped as if it were a Firestore `users/{uid}`
// document — for visual/manual comparison against firestore.rules `validUserDocument()`.
//
// SAFETY: this panel NEVER imports `firebase/firestore`, `config/firebase`, or any repository —
// it only serializes local fixture objects (src/devtools/fixtures, scenarios). It cannot read,
// write, or delete any real Firestore document. This directly satisfies the ADIM 1 rules:
// "Dev panel production Firebase/Firestore verisini silememeli" and
// "Dev panel production kullanıcı datasına destructive işlem yapmamalı".

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { DevToolsScenario } from '../scenarios';

export interface FirestoreModelPanelProps {
  scenario: DevToolsScenario;
}

export function FirestoreModelPanel({ scenario }: FirestoreModelPanelProps) {
  const fakeUserDocument = {
    email: scenario.auth.userData?.email ?? null,
    displayName: scenario.auth.userData?.displayName ?? null,
    setupCompleted: scenario.auth.userData?.setupCompleted ?? false,
    preferences: scenario.auth.userData?.preferences ?? null,
    progress:
      scenario.progress.shape === 'legacy'
        ? scenario.progress.legacy
        : scenario.progress.shape === 'progressByLevel'
          ? '(v2 progressByLevel — see subcollection preview below; not written under `progress` today)'
          : null,
    streak: scenario.streak,
    notificationSettings: scenario.notificationSettings,
    favorites: scenario.favorites,
  };

  return (
    <ScrollView style={styles.container} testID="devtools-firestore-model-panel">
      <Text style={styles.title}>Firestore Model Preview (offline fixture only)</Text>
      <Text style={styles.subtitle}>
        This is NOT a live Firestore read. It renders the selected scenario&apos;s fixture data in
        the shape of a `users/{'{'}uid{'}'}` document for comparison against firestore.rules. No
        network call is made.
      </Text>

      <Text style={styles.sectionTitle}>users/{'{uid}'} (legacy shape, matches firestore.rules today)</Text>
      <Text style={styles.value}>{JSON.stringify(fakeUserDocument, null, 2)}</Text>

      {scenario.progress.shape === 'progressByLevel' ? (
        <View>
          <Text style={styles.sectionTitle}>
            users/{'{uid}'}/progressByLevel/{'{level}'} (illustrative v2 preview — docs/refactor-v2/07+23; not
            written by any production repository today)
          </Text>
          <Text style={styles.value}>{JSON.stringify(scenario.progress.byLevel, null, 2)}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#666', marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', marginTop: 12, marginBottom: 4 },
  value: { fontSize: 11, color: '#333', fontFamily: 'monospace' },
});
