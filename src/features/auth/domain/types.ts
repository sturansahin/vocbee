// src/features/auth/domain/types.ts
// Layer: domain | Feature: auth | Pure TS (NO SDK). A provider-agnostic view of the signed-in user
// (so application/use-cases don't depend on firebase/auth's User type directly — docs/architecture.md).

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export type AuthProfilePatch = {
  displayName?: string;
  photoURL?: string;
};

export type ProviderProfile = {
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
};

export type AuthSignInResult = {
  user: AuthUser;
  providerProfile?: ProviderProfile;
};

export type AuthProviderKind = 'email' | 'google' | 'apple';

export type EmailSignInRequest = {
  email: string;
  password: string;
};

export const SOCIAL_AUTH_CANCELLED_ERROR = 'AUTH_CANCELLED';
