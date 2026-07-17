// src/features/profile/domain/types.ts
// Layer: domain | Feature: profile | Pure TS (NO SDK).
// Matches the profile shape exposed by the auth presentation contract.

export type Profile = {
  name: string;
  image: string | null;
  email: string;
};

// Stable name used by social-auth profile normalization and sync contracts.
export type StoredProfile = Profile;
