// src/features/auth/data/contracts.ts
// Layer: data (contracts) | Feature: auth. Interface only (provider-agnostic AuthUser in/out).
// application/use-cases depend ONLY on this interface (DIP — docs/refactor-v2/06, /33, /35 §1).

import type { AuthUser } from '../domain/types';

export interface AuthRepository {
  getCurrentUser(): AuthUser | null;
  onAuthStateChanged(cb: (user: AuthUser | null) => void): () => void; // returns unsubscribe
  signUpWithEmail(email: string, password: string, displayName?: string): Promise<AuthUser>;
  signInWithEmail(email: string, password: string): Promise<AuthUser>;
  signInWithGoogle(): Promise<AuthUser>;
  signInWithApple(): Promise<AuthUser>;
  signOut(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  deleteAuthUser(): Promise<void>;
  /** Epoch ms of last sign-in (for the RECENT_LOGIN_WINDOW_MS recent-auth rule), or null. */
  getLastSignInTimeMs(): number | null;
}
