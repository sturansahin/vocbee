import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

import {
  buildProgressV2WritePlan,
  getProgressSyncMode,
  isLevel,
  LEVELS,
  PROGRESS_BY_LEVEL_DOC_VERSION,
  PROGRESS_SCHEMA_VERSION,
  progressV2LevelsToLegacy,
  type LevelProgress,
  type ProgressV2WritePlan,
} from '@features/progress';
import { VOCABULARY_SCHEMA_VERSION } from '@features/vocabulary';
import { db } from '@shared/firebase';
import type { SyncRepository } from '../../application/contracts';
import type {
  AuthProfileSyncInput,
  LocalSyncSnapshot,
  RemoteUserDocument,
  SyncNotificationSettings,
} from '../../domain/types';

export class FirestoreSyncRepository implements SyncRepository {
  async getActiveDeviceId(userId: string): Promise<string | null> {
    const snapshot = await getDoc(doc(db, 'users', userId));
    if (!snapshot.exists()) return null;
    return snapshot.data().lastActiveDeviceId || null;
  }

  async getUserDocument(userId: string): Promise<RemoteUserDocument | null> {
    const snapshot = await getDoc(doc(db, 'users', userId));
    if (!snapshot.exists()) return null;
    const remote = snapshot.data() as RemoteUserDocument;
    if (getProgressSyncMode() !== 'dual') return remote;

    const v2Snapshot = await getDocs(collection(db, 'users', userId, 'progressByLevel'));
    const levels = v2Snapshot.docs
      .map(levelSnapshot => this.parseLevelProgress(levelSnapshot.id, levelSnapshot.data()))
      .filter((level): level is LevelProgress => level !== null);
    const activeLevel = isLevel(remote.activeLevel)
      ? remote.activeLevel
      : isLevel(remote.progress?.currentLevel)
        ? remote.progress.currentLevel
        : 'A1';
    const legacyUpdatedAt = this.timestampMillis(remote.progress?.lastSync);
    const oldestV2UpdatedAt = v2Snapshot.docs.length > 0
      ? Math.min(...v2Snapshot.docs.map(
        levelSnapshot => this.timestampMillis(levelSnapshot.data().updatedAt)
      ))
      : 0;
    const needsRepair = !!remote.progress && (
      remote.schemaVersion !== PROGRESS_SCHEMA_VERSION
      || v2Snapshot.docs.length !== LEVELS.length
      || levels.length !== LEVELS.length
      || legacyUpdatedAt > oldestV2UpdatedAt
    );

    if (needsRepair && remote.progress) {
      const plan = this.buildLegacyRepairPlan(remote.progress);
      if (!plan) return remote;
      await this.writeProgressV2(userId, plan, remote.lastActiveDeviceId ?? 'legacy-reconcile');
      const restored = progressV2LevelsToLegacy(plan.activeLevel, plan.levels);
      return { ...remote, progressV2: { ...restored, source: 'legacy-reconciled' } };
    }

    if (levels.length > 0) {
      const restored = progressV2LevelsToLegacy(activeLevel, levels);
      return { ...remote, progressV2: { ...restored, source: 'v2' } };
    }
    return remote;
  }

  async saveSnapshot(userId: string, snapshot: LocalSyncSnapshot, deviceId: string): Promise<void> {
    const timestamp = serverTimestamp();
    const dualMode = getProgressSyncMode() === 'dual';
    const data: Record<string, unknown> = {
      progress: {
        currentLevel: snapshot.currentLevel,
        learnedWords: snapshot.learnedWords,
        lastWordIndex: snapshot.lastWordId ?? 0,
        lastSync: timestamp,
      },
      lastActiveDeviceId: deviceId,
      streak: snapshot.streak,
      syncMeta: {
        version: dualMode ? 2 : 1,
        updatedAt: timestamp,
        updatedByDeviceId: deviceId,
      },
    };
    if (snapshot.profileName) data.displayName = snapshot.profileName;
    if (snapshot.hasProfileImage) data.photoURL = snapshot.profileImage ?? null;
    if (snapshot.notificationSettings) data.notificationSettings = snapshot.notificationSettings;
    if (snapshot.preferences) {
      data.preferences = snapshot.preferences;
      data.setupCompleted = true;
    }
    if (!dualMode) {
      await setDoc(doc(db, 'users', userId), data, { merge: true });
      return;
    }

    const plan = buildProgressV2WritePlan({
      currentLevel: snapshot.currentLevel,
      learnedWords: snapshot.learnedWords,
      lastWordId: snapshot.lastWordId,
      vocabularySchemaVersion: snapshot.vocabularySchemaVersion,
    });
    Object.assign(data, {
      activeLevel: plan.activeLevel,
      schemaVersion: PROGRESS_SCHEMA_VERSION,
      lastActiveAt: timestamp,
      progressSummary: { ...plan.summary, updatedAt: timestamp },
    });
    await this.commitDualWrite(userId, data, plan, deviceId, timestamp);
  }

  private parseLevelProgress(documentId: string, data: Record<string, unknown>): LevelProgress | null {
    if (!isLevel(documentId) || data.level !== documentId || !Array.isArray(data.learnedWordIds)) return null;
    const learnedWordIds = data.learnedWordIds.filter(
      (id): id is number => typeof id === 'number' && Number.isSafeInteger(id) && id >= 0
    );
    if (
      learnedWordIds.length !== data.learnedWordIds.length
      || new Set(learnedWordIds).size !== learnedWordIds.length
      || data.learnedCount !== learnedWordIds.length
      || data.version !== PROGRESS_BY_LEVEL_DOC_VERSION
    ) return null;
    if (
      typeof data.lastWordId !== 'number'
      || !Number.isSafeInteger(data.lastWordId)
      || data.lastWordId < 0
      || typeof data.vocabularySchemaVersion !== 'number'
      || !Number.isSafeInteger(data.vocabularySchemaVersion)
      || data.vocabularySchemaVersion < 1
      || this.timestampMillis(data.updatedAt) === 0
    ) return null;
    return {
      level: documentId,
      learnedWordIds,
      lastWordId: data.lastWordId,
      learnedCount: learnedWordIds.length,
      vocabularySchemaVersion: data.vocabularySchemaVersion,
    };
  }

  private buildLegacyRepairPlan(
    progress: NonNullable<RemoteUserDocument['progress']>
  ): ProgressV2WritePlan | null {
    if (!isLevel(progress.currentLevel) || !this.isStrictLegacyLearnedWords(progress.learnedWords)) {
      return null;
    }
    const lastWordId = progress.lastWordIndex ?? 0;
    if (!Number.isSafeInteger(lastWordId) || lastWordId < 0) return null;
    return buildProgressV2WritePlan({
      currentLevel: progress.currentLevel,
      learnedWords: progress.learnedWords,
      lastWordId,
      vocabularySchemaVersion: VOCABULARY_SCHEMA_VERSION,
    });
  }

  private isStrictLegacyLearnedWords(value: unknown): value is Record<string, number[]> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const entries = Object.entries(value);
    if (entries.some(([level]) => !isLevel(level))) return false;
    return entries.every(([, ids]) => Array.isArray(ids)
      && ids.every(id => typeof id === 'number' && Number.isSafeInteger(id) && id >= 0)
      && new Set(ids).size === ids.length);
  }

  private timestampMillis(value: unknown): number {
    if (value instanceof Date) return value.getTime();
    if (value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
      return (value as { toMillis(): number }).toMillis();
    }
    return 0;
  }

  private levelPayload(level: LevelProgress, deviceId: string, timestamp: unknown) {
    return {
      level: level.level,
      learnedWordIds: level.learnedWordIds,
      lastWordId: level.lastWordId,
      learnedCount: level.learnedCount,
      vocabularySchemaVersion: level.vocabularySchemaVersion,
      updatedAt: timestamp,
      updatedByDeviceId: deviceId,
      version: PROGRESS_BY_LEVEL_DOC_VERSION,
    };
  }

  private async commitDualWrite(
    userId: string,
    mainData: Record<string, unknown>,
    plan: ProgressV2WritePlan,
    deviceId: string,
    timestamp: unknown
  ): Promise<void> {
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', userId), mainData, { merge: true });
    for (const level of plan.levels) {
      batch.set(
        doc(db, 'users', userId, 'progressByLevel', level.level),
        this.levelPayload(level, deviceId, timestamp),
        { merge: true }
      );
    }
    await batch.commit();
  }

  private async writeProgressV2(userId: string, plan: ProgressV2WritePlan, deviceId: string): Promise<void> {
    const timestamp = serverTimestamp();
    await this.commitDualWrite(
      userId,
      {
        activeLevel: plan.activeLevel,
        schemaVersion: PROGRESS_SCHEMA_VERSION,
        lastActiveAt: timestamp,
        progressSummary: { ...plan.summary, updatedAt: timestamp },
      },
      plan,
      deviceId,
      timestamp
    );
  }

  async createUserDocument(
    userId: string,
    email: string,
    displayName?: string,
    photoURL?: string | null
  ): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const snapshot = await getDoc(userRef);
    if (!snapshot.exists()) {
      await setDoc(userRef, {
        email,
        displayName: displayName || '',
        photoURL: photoURL ?? null,
        createdAt: serverTimestamp(),
        setupCompleted: false,
        preferences: null,
        progress: null,
        streak: null,
      });
    }
  }

  async saveNotificationSettings(
    userId: string,
    settings: SyncNotificationSettings,
    deviceId: string
  ): Promise<void> {
    await setDoc(
      doc(db, 'users', userId),
      {
        notificationSettings: settings,
        syncMeta: {
          version: 1,
          updatedAt: serverTimestamp(),
          updatedByDeviceId: deviceId,
        },
      },
      { merge: true }
    );
  }

  async saveAuthProfile(
    userId: string,
    profile: AuthProfileSyncInput,
    deviceId: string
  ): Promise<void> {
    const profileData: Record<string, string | null> = { email: profile.email };
    if (typeof profile.displayName === 'string' && profile.displayName.trim()) {
      profileData.displayName = profile.displayName.trim();
    }
    if (profile.photoURL !== undefined) {
      profileData.photoURL =
        typeof profile.photoURL === 'string' && profile.photoURL.trim()
          ? profile.photoURL.trim()
          : null;
    }
    await setDoc(
      doc(db, 'users', userId),
      {
        ...profileData,
        syncMeta: {
          version: 1,
          updatedAt: serverTimestamp(),
          updatedByDeviceId: deviceId,
        },
      },
      { merge: true }
    );
  }
}
