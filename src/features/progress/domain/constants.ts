// src/features/progress/domain/constants.ts
// Layer: domain | Feature: progress | Pure TS (NO SDK).

// Firestore schema version for the v2 model (docs/architecture.md). Used for dual-write gating;
// presence on users/{uid} signals the doc has been migrated to progressByLevel.
export const PROGRESS_SCHEMA_VERSION = 2 as const;

// progressByLevel doc version (optimistic concurrency / future migrations). docs/architecture.md
export const PROGRESS_BY_LEVEL_DOC_VERSION = 2 as const;

/** Minimum legacy compatibility window after dual-write reaches production. */
export const PROGRESS_LEGACY_RETENTION_DAYS = 90 as const;
