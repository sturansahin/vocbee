// src/features/progress/domain/constants.ts
// Layer: domain | Feature: progress | Pure TS (NO SDK).

// Firestore schema version for the v2 model (docs/refactor-v2/07, /08). Used for dual-write gating;
// presence on users/{uid} signals the doc has been migrated to progressByLevel.
export const PROGRESS_SCHEMA_VERSION = 2 as const;

// progressByLevel doc version (optimistic concurrency / future migrations). docs/refactor-v2/34 §3.
export const PROGRESS_BY_LEVEL_DOC_VERSION = 1 as const;
