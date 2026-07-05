// src/devtools/screens/ScenarioPickerScreen.tsx
import React from 'react';
import { ScenarioPickerPanel } from '../panels/ScenarioPickerPanel';
import { useSelectedScenario } from '../scenarioStore';

export function ScenarioPickerScreen() {
  const [scenario, setScenarioId] = useSelectedScenario();
  return <ScenarioPickerPanel selectedId={scenario.id} onSelect={setScenarioId} />;
}
