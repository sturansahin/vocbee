// src/features/setup — public barrel (docs/refactor-v2/33 §4). Domain + use-case + contract interface.
export * from './domain/types';
export * from './domain/rules';
export * from './domain/levelTestTypes';
export * from './domain/levelTestRules';
export type { SetupPreferencesWriter } from './data/contracts';
export type { LevelTestFacade } from './application/levelTestContracts';
export { makeCompleteSetup } from './application/useCases/completeSetup';
export { default as LevelTestScreen } from './composition/SetupLevelTestScreen';
