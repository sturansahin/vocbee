// src/features/learning — public barrel (docs/refactor-v2/33 §4). Pure domain for now.
export * from './domain/types';
export * from './domain/rules';
export type { HomeFacade, HomeSessionSnapshot } from './application/contracts';
export { default as HomeScreen } from './composition/LearningHomeScreen';
