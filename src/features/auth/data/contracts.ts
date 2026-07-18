// src/features/auth/data/contracts.ts
// Layer: data (contracts) | Feature: auth. Interface only (provider-agnostic AuthUser in/out).
// application/use-cases depend ONLY on this interface (DIP — docs/refactor-v2/06, /33, /35 §1).

import type { AuthProfilePatch, AuthSignInResult, AuthUser } from '../domain/types';

export interface AuthRepository {
  configure(): void;
  getCurrentUser(): AuthUser | null;
  onAuthStateChanged(cb: (user: AuthUser | null) => void): () => void; // returns unsubscribe
  signUpWithEmail(email: string, password: string, displayName?: string): Promise<AuthUser>;
  signInWithEmail(email: string, password: string): Promise<AuthUser>;
  signInWithGoogle(): Promise<AuthSignInResult>;
  signInWithApple(): Promise<AuthSignInResult>;
  updateCurrentUserProfile(patch: AuthProfilePatch): Promise<void>;
  signOut(): Promise<void>;
  disconnectProviderSessions(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  deleteAuthUser(): Promise<void>;
  getIdToken(): Promise<string>;
  /** Epoch ms of last sign-in (for the RECENT_LOGIN_WINDOW_MS recent-auth rule), or null. */
  getLastSignInTimeMs(): number | null;
}

export interface AccountDeletionClient {
  /** Returns false only for the intentional development fallback path. */
  deleteAccount(getIdToken: () => Promise<string>): Promise<boolean>;
}
