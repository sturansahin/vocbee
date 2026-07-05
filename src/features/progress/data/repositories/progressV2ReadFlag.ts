// src/features/progress/data/repositories/progressV2ReadFlag.ts
// Layer: data | Feature: progress. ADIM 7 — isolated, read-only, feature-flag-gated wiring point for
// FirestoreProgressRepository's dual-read (docs/refactor-v2/07 §13, /08 §3, /34 §9).
//
// ⚠️ NOT CALLED BY ANY PRODUCTION CODE PATH. services/SyncService.ts, services/progressService.ts, and
// screens/HomeScreen.tsx are UNCHANGED by this file — they continue to read/write ONLY the legacy
// users/{uid}.progress shape, exactly as before. This module exists so that a LATER, separately-approved
// step can flip the flag and start reading through the dual-read repository, without requiring another
// code change at that time. Until then, isFirestoreProgressV2ReadEnabled() always returns false and
// readProgressByLevelWithFlag() always takes the "flag disabled" branch (never touches Firestore).
//
// Rollout note: flipping this flag to `true` does NOT require a rules change — getProgressByLevel's
// legacy-fallback path only ever reads users/{uid}.progress, which is already allowed by the current
// (unchanged) firestore.rules. The NEW users/{uid}/progressByLevel/{level} subcollection read is only
// reached if that v2 doc actually exists, which it never will until a separate, approved write-path +
// rules-deploy step (docs/refactor-v2/phase-3-firestore-rules-v2.proposal.md) ships. So enabling the flag
// today would be a no-op in production (always falls through to legacy) — it is a safe default-OFF toggle
// staged ahead of that later step.

import type { Level, LevelProgress } from '../../domain/types';
import { FirestoreProgressRepository } from './FirestoreProgressRepository';

/**
 * Default-OFF. No environment variable / remote config is wired yet (deliberately — introducing one is
 * a separate, reviewable decision). Change this literal (not a call site) when the flag is intentionally
 * flipped for a future step; keep it `false` for this pass.
 */
const FIRESTORE_PROGRESS_V2_READ_ENABLED = false;

export function isFirestoreProgressV2ReadEnabled(): boolean {
  return FIRESTORE_PROGRESS_V2_READ_ENABLED;
}

/**
 * Read-only, flag-gated entry point. When the flag is disabled (default), returns null WITHOUT any
 * Firestore access — callers must keep using the existing legacy read path
 * (services/SyncService.ts / services/progressService.ts) unconditionally. When enabled, delegates to
 * FirestoreProgressRepository.getProgressByLevel (dual-read: v2 subcollection, else legacy fallback).
 *
 * Nothing calls this function yet (see file header) — it is prepared for a later, separately-approved
 * wiring step.
 */
export async function readProgressByLevelWithFlag(
  userId: string,
  level: Level,
  deviceId?: string
): Promise<LevelProgress | null> {
  if (!isFirestoreProgressV2ReadEnabled()) {
    return null;
  }
  const repo = new FirestoreProgressRepository(deviceId);
  return repo.getProgressByLevel(userId, level);
}
