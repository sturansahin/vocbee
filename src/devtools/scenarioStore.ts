// src/devtools/scenarioStore.ts
// Minimal shared "currently selected scenario" state for the DevTools stack. Deliberately NOT a
// new state-management dependency — just a tiny observable holder scoped to this dev-only module.

import { useEffect, useState } from 'react';
import { SCENARIOS, ScenarioId, DevToolsScenario } from './scenarios';

let currentScenarioId: ScenarioId = 'default';
const listeners = new Set<(id: ScenarioId) => void>();

export function getSelectedScenarioId(): ScenarioId {
  return currentScenarioId;
}

export function setSelectedScenarioId(id: ScenarioId): void {
  currentScenarioId = id;
  listeners.forEach(listener => listener(id));
}

export function useSelectedScenario(): [DevToolsScenario, (id: ScenarioId) => void] {
  const [id, setId] = useState<ScenarioId>(currentScenarioId);

  useEffect(() => {
    const listener = (nextId: ScenarioId) => setId(nextId);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return [SCENARIOS[id], setSelectedScenarioId];
}
