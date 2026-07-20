// src/features/progress/data/repositories/FirestoreProgressRepository.ts
// Layer: data (repository impl) | Feature: progress.
//
// Compatibility repository retained for focused per-level access and tests. The active application sync
// path now performs rollout-gated v2 reads/writes through FirestoreSyncRepository; this class is not
// independently composed into the runtime graph.
//
// Historical prep notes:
//   - This class is NOT imported by any running code, NOT exported from the feature barrel
//     (docs/architecture.md), and is NOT instantiated anywhere in production. It performs ZERO I/O
//     until wired in a later, separately-approved step. It exists to make the dual-read design concrete
//     + type-checked, and its dual-read branching (v2 doc present / v2 missing + legacy present /
//     neither present / malformed legacy / duplicate wordId / different level) is now directly unit
//     tested — see data/repositories/__tests__/FirestoreProgressRepository.test.ts (ADIM 7).
//   - saveProgressByLevel writes ONLY the v2 subcollection and NEVER deletes the legacy `progress` field.
//     Production writes require the progressByLevel security rules (see
//     docs/architecture.md) to be deployed + verified first.
//   - No production migration is performed by this file.
//   - An isolated, default-OFF, feature-flag-gated read wrapper exists at
//     data/repositories/progressV2ReadFlag.ts — it is ALSO not called by any production code path.

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@shared/firebase';
import { type Level, type LevelProgress, type ProgressSummary } from '../../domain/types';
import { PROGRESS_BY_LEVEL_DOC_VERSION } from '../../domain/constants';
import type { LegacyProgressDoc, ProgressByLevelDoc, UserDocV2 } from '../dto';
import {
  adaptLegacyLearnedWordsToProgressByLevelDocs,
  fromProgressByLevelDoc,
  toProgressByLevelDoc,
} from '../adapters/progressAdapters';
import type { RemoteProgressRepository } from '../contracts';

export class FirestoreProgressRepository implements RemoteProgressRepository {
  constructor(private readonly deviceId?: string) {}

  /** DUAL-READ: progressByLevel/{level} → if missing, adapt legacy progress.learnedWords[level]. */
  async getProgressByLevel(userId: string, level: Level): Promise<LevelProgress | null> {
    const ref = doc(db, `users/${userId}/progressByLevel/${level}`);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return fromProgressByLevelDoc(snap.data() as ProgressByLevelDoc);
    }

    // Fallback to legacy main-doc field (backward compatibility for un-migrated users).
    const legacy = await this.getLegacyProgressFallback(userId);
    if (!legacy) return null;
    const model = adaptLegacyLearnedWordsToProgressByLevelDocs(legacy, {
      deviceId: this.deviceId,
    }).find((m) => m.level === level);
    if (!model) return null;
    return {
      level,
      learnedWordIds: model.learnedWordIds,
      lastWordId: model.lastWordId,
      learnedCount: model.learnedCount,
      vocabularySchemaVersion: model.vocabularySchemaVersion,
      ...(model.favoriteWordIds ? { favoriteWordIds: model.favoriteWordIds } : {}),
    };
  }

  async getLegacyProgressFallback(userId: string): Promise<LegacyProgressDoc | null> {
    const snap = await getDoc(doc(db, `users/${userId}`));
    if (!snap.exists()) return null;
    const data = snap.data() as UserDocV2;
    return (data?.progress as LegacyProgressDoc | undefined) ?? null;
  }

  /** Writes the v2 subcollection doc only (merge). Does NOT touch the legacy field. */
  async saveProgressByLevel(userId: string, progress: LevelProgress): Promise<void> {
    const ref = doc(db, `users/${userId}/progressByLevel/${progress.level}`);
    const dto = toProgressByLevelDoc(progress, serverTimestamp(), {
      deviceId: this.deviceId,
      version: PROGRESS_BY_LEVEL_DOC_VERSION,
    });
    await setDoc(ref, dto, { merge: true });
  }

  async getProgressSummary(userId: string): Promise<ProgressSummary> {
    const snap = await getDoc(doc(db, `users/${userId}`));
    const summary = snap.exists() ? (snap.data() as UserDocV2).progressSummary : undefined;
    if (summary) {
      const totalLearnedCount =
        summary.totalLearnedCount ??
        Object.values(summary.byLevel).reduce(
          (total, entry) => total + (entry?.learnedCount ?? 0),
          0,
        );
      return {
        byLevel: summary.byLevel,
        totalLearnedCount,
        ...(typeof summary.overallPercent === 'number'
          ? { overallPercent: summary.overallPercent }
          : {}),
      };
    }
    return { byLevel: {}, totalLearnedCount: 0 };
  }
}
