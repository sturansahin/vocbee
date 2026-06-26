// src/features/profile/domain/types.ts
// Layer: domain | Feature: profile | Pure TS (NO SDK).
// Matches the existing ProfileData / StoredProfile shape used in context/AuthContext.tsx.

export type Profile = {
  name: string;
  image: string | null;
  email: string;
};
