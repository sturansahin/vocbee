// src/features/auth — public barrel (docs/refactor-v2/33 §4).
// Exposes domain types/rules, repository INTERFACE, and use-cases.
// Does NOT export FirebaseAuthRepository (data impl) — bound only at a composition root.

export * from './domain/types';
export * from './domain/rules';
export type { AuthRepository } from './data/contracts';
export { makeSignIn } from './application/useCases/signIn';
