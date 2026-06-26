// src/features/setup — public barrel (docs/refactor-v2/33 §4). Domain + use-case + contract interface.
export * from './domain/types';
export * from './domain/rules';
export type { SetupPreferencesWriter } from './data/contracts';
export { makeCompleteSetup } from './application/useCases/completeSetup';
