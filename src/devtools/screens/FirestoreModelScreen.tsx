// src/devtools/screens/FirestoreModelScreen.tsx
import React from 'react';
import { FirestoreModelPanel } from '../panels/FirestoreModelPanel';
import { useSelectedScenario } from '../scenarioStore';

export function FirestoreModelScreen() {
  const [scenario] = useSelectedScenario();
  return <FirestoreModelPanel scenario={scenario} />;
}
