// src/features/profile — public barrel (docs/architecture.md).
// Exposes domain types + repository INTERFACE + use-cases. Does NOT export FirestoreUserProfileRepository (impl).

export * from './domain/types';
export * from './domain/profileRules';
export type { SetupProfileCompletion, UserProfileRepository } from './data/contracts';
export { makeLoadProfile } from './application/useCases/loadProfile';
export { createUserProfileRepository } from './composition/createUserProfileRepository';
