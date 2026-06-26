// src/features/auth/domain/types.ts
// Layer: domain | Feature: auth | Pure TS (NO SDK). A provider-agnostic view of the signed-in user
// (so application/use-cases don't depend on firebase/auth's User type directly — docs/refactor-v2/35 §1).

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export type SocialSignInResult = {
  setupCompleted: boolean;
};
