// src/features/profile/domain/types.ts
// Layer: domain | Feature: profile | Pure TS (NO SDK).
// Matches the existing ProfileData / StoredProfile shape used in context/AuthContext.tsx.

export type Profile = {
  name: string;
  image: string | null;
  email: string;
};

// Backwards-compatible name used by the legacy social-auth helpers. Keeping the
// alias in the domain layer lets the root compatibility shim expose the exact
// old type without owning any implementation.
export type StoredProfile = Profile;
