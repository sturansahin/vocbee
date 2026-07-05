// src/devtools/index.ts
// Public surface of the devtools module. `src/app/App.tsx` should only ever need `DevToolsRoot`
// and `isDevToolsEnabled` from this barrel — everything else is internal wiring.

export { isDevToolsEnabled } from './guard';
export { DevToolsRoot } from './DevToolsRoot';
export { DevToolsNavigator } from './DevToolsNavigator';
export type { DevToolsStackParamList } from './DevToolsNavigator';
export { DevToolsScreen } from './DevToolsScreen';
export { SCREEN_REGISTRY, assertNoDuplicateScreenIds } from './screenRegistry';
export type { ScreenRegistryEntry } from './screenRegistry';
export { SCENARIOS, SCENARIO_LIST } from './scenarios';
export type { ScenarioId, DevToolsScenario } from './scenarios';
