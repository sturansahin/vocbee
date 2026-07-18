// src/features/progress/data/repositories/progressV2ReadFlag.ts
// Layer: data | Feature: progress. Compatibility wrapper for focused per-level reads. The active sync
// repository owns runtime dual-read/reconcile behavior; this wrapper follows the same safe rollout mode
// so there is only one configuration switch.

import type { Level, LevelProgress } from '../../domain/types';
import { getProgressSyncMode } from '../../application/progressRollout';
import { FirestoreProgressRepository } from './FirestoreProgressRepository';

export function isFirestoreProgressV2ReadEnabled(): boolean {
  return getProgressSyncMode() === 'dual';
}

/**
 * Read-only, flag-gated entry point. When the flag is disabled (default), returns null WITHOUT any
 * Firestore access — callers must keep using the existing legacy read path
 * (services/SyncService.ts / services/progressService.ts) unconditionally. When enabled, delegates to
 * FirestoreProgressRepository.getProgressByLevel (dual-read: v2 subcollection, else legacy fallback).
 *
 * Nothing in the active runtime currently calls this compatibility wrapper.
 */
export async function readProgressByLevelWithFlag(
  userId: string,
  level: Level,
  deviceId?: string,
): Promise<LevelProgress | null> {
  if (!isFirestoreProgressV2ReadEnabled()) {
    return null;
  }
  const repo = new FirestoreProgressRepository(deviceId);
  return repo.getProgressByLevel(userId, level);
}
