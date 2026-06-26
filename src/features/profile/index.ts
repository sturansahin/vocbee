// src/features/profile — public barrel (docs/refactor-v2/33 §4).
// Exposes domain types + repository INTERFACE + use-cases. Does NOT export FirestoreUserProfileRepository (impl).

export * from './domain/types';
export type { UserProfileRepository } from './data/contracts';
export { makeLoadProfile } from './application/useCases/loadProfile';
