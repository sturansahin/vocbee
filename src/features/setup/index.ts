// src/features/setup — public barrel (docs/architecture.md). Domain + use-case + contract interface.
export * from './domain/types';
export * from './domain/rules';
export * from './domain/levelTestTypes';
export * from './domain/levelTestRules';
export type { SetupPreferencesWriter } from './data/contracts';
export type { LevelTestFacade } from './application/levelTestContracts';
export type {
  SetupCompletionInput,
  SetupFacade,
  SetupPlatformGateway,
} from './application/setupContracts';
export { DefaultSetupFacade } from './application/DefaultSetupFacade';
export { makeCompleteSetup } from './application/useCases/completeSetup';
export { default as LevelTestScreen } from './composition/SetupLevelTestScreen';
export { NativeLanguageScreen, SetupScreen } from './composition/SetupScreen';
