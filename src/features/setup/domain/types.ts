// src/features/setup/domain/types.ts
// Layer: domain | Feature: setup | Pure TS (NO SDK). Matches users/{uid}.preferences shape
// (services/SyncService + firestore.rules validPreferences).

export type UserPreferences = {
  nativeLanguage: string;
  targetLanguage: string;
  level: string; // beginner | intermediate | advanced
};

export type SetupStep = number;
