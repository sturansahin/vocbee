// src/features/learning — public barrel (docs/architecture.md). Pure domain for now.
export * from './domain/types';
export * from './domain/rules';
export * from './domain/grammarTypes';
export * from './domain/grammarRules';
export type { HomeFacade, HomeSessionSnapshot } from './application/contracts';
export type { ExampleSentencesFacade } from './application/exampleSentencesContracts';
export { default as HomeScreen } from './composition/LearningHomeScreen';
export { default as ExampleSentencesScreen } from './composition/LearningExampleSentencesScreen';
export { explainGrammar } from './composition/grammarService';
