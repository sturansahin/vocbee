// src/features/progress/data/dto.ts
// Layer: data | Feature: progress. Raw Firestore shapes (docs/refactor-v2/34 §3-4).
// Timestamp/FieldValue are imported TYPE-ONLY (erased at runtime) so this module pulls in NO Firestore SDK
// and stays unit-testable without an emulator. Actual serverTimestamp() is applied by the repository.

import type { FieldValue, Timestamp } from 'firebase/firestore';
import type { Level } from '../domain/types';

// ─── v2 main user doc (users/{uid}) — must stay compatible with firestore.rules validUserDocument ───
export type NotificationSettingsDoc = {
  enabled: boolean;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  frequencyMinutes: number;
  autoMarkLearned: boolean;
} | { enabled: false };

export type StreakDoc = {
  currentStreak: number;
  longestStreak: number;
  brokenStreak: number | null;
  lastQualifiedDay: string | null;
  lastQualifiedAt: string | null;
};

export type ProgressSummaryDoc = {
  byLevel: Partial<Record<Level, { learnedCount: number; totalCount?: number; percent?: number }>>;
  totalLearnedCount: number;
  overallPercent?: number;
  updatedAt?: Timestamp | FieldValue;
};

export type UserDocV2 = {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  createdAt?: Timestamp | FieldValue;
  lastActiveAt?: Timestamp | FieldValue;           // NEW (07 §3) — must be added to rules hasOnly before write
  setupCompleted?: boolean;
  preferences?: { nativeLanguage: string; targetLanguage: string; level: string };
  notificationSettings?: NotificationSettingsDoc;  // unchanged, stays on main doc
  streak?: StreakDoc;                              // small, stays on main doc
  progressSummary?: ProgressSummaryDoc;            // NEW (07 §3)
  syncMeta?: { version?: number; updatedAt?: Timestamp | FieldValue; updatedByDeviceId?: string };
  lastActiveDeviceId?: string;
  schemaVersion?: 2;                               // NEW — must be added to rules hasOnly before write
  activeLevel?: Level;
  progressMigration?: {
    state: 'mirroring' | 'verified' | 'cleanup-ready';
    source: 'legacy-mirror' | 'backfill';
    legacyMirrorEnabled: boolean;
    migratedAt: Timestamp | FieldValue;
    lastLegacyMirrorAt: Timestamp | FieldValue;
    verifiedAt?: Timestamp | FieldValue;
  };
  // TRANSITION: legacy 'progress' field is KEPT (dual-read/write); never deleted in this phase.
  progress?: LegacyProgressDoc | null;
  favorites?: Array<{ id: number; level: Level }>; // existing; max 1000 (rules)
};

// ─── users/{uid}/progressByLevel/{level}  (doc id = 'A1'..'C1') ───
export type ProgressByLevelDoc = {
  level: Level;
  learnedWordIds: number[];
  favoriteWordIds?: number[];
  wrongWordIds?: number[];                 // OPTIONAL — only if SRS ships (not now)
  lastWordId: number;
  learnedCount: number;
  vocabularySchemaVersion: number;
  updatedAt: Timestamp | FieldValue;
  updatedByDeviceId?: string;
  version?: number;
};

// Structural write model = the DTO without server-managed updatedAt. The pure adapter produces this;
// the repository finalizes it with serverTimestamp() at write time. Keeps adapters SDK-free + testable.
export type ProgressByLevelWriteModel = Omit<ProgressByLevelDoc, 'updatedAt'>;

// ─── LEGACY (current production shape) — source: firestore.rules validProgress + SyncService + progressService ───
export type LegacyProgressDoc = {
  currentLevel?: string;                       // 'A1'..'C1'
  learnedWords?: Record<string, number[]>;     // { A1: [1,2,3], A2: [...] }  ← the growing field
  lastWordIndex?: number;
  lastSync?: unknown;                          // Timestamp | string (inconsistent — 07 §2)
};

// AsyncStorage legacy shapes (services/storage.ts UserProgress + services/progressService.ts UserProgress)
export type LegacyLocalUserProgress = {
  currentLevel: string;
  learnedWords: { [level: string]: number[] };
  lastUpdated: string;
};
