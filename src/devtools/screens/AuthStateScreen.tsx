// src/devtools/screens/AuthStateScreen.tsx
import React from 'react';
import { AuthStatePanel } from '../panels/AuthStatePanel';
import { useSelectedScenario } from '../scenarioStore';

export function AuthStateScreen() {
  const [scenario] = useSelectedScenario();
  return <AuthStatePanel scenario={scenario} />;
}
