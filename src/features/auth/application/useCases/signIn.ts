// src/features/auth/application/useCases/signIn.ts
// Layer: application | Feature: auth. Depends ONLY on the AuthRepository interface (DIP — docs/refactor-v2/33, /35).
// This is the SDK-free, fake-testable core of email sign-in. The broader orchestration currently in
// AuthContext.signIn (clearAllLocalData / cancel notifications / fetch user data) is migrated incrementally
// in a later step with device QA — kept here minimal + verified.

import type { AuthRepository } from '../../data/contracts';
import type { AuthUser } from '../../domain/types';

export function makeSignIn(authRepo: AuthRepository) {
  return async function signIn(email: string, password: string): Promise<AuthUser> {
    return authRepo.signInWithEmail(email, password);
  };
}
