import type { UserData } from '@shared/storage';

import type {
  SyncDomainGateway,
  SyncLocalStore,
  SyncOrchestrator,
  SyncRepository,
} from './contracts';
import type {
  AuthProfileSyncInput,
  RemoteUserDocument,
  SyncNotificationSettings,
} from '../domain/types';
import { isSyncDue } from '../domain/rules';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

export interface SyncOrchestratorDependencies {
  repository: SyncRepository;
  localStore: SyncLocalStore;
  domains: SyncDomainGateway;
  now?: () => number;
}

async function withRetry<T>(
  operation: () => Promise<T>,
  label: string,
  retries = MAX_RETRIES
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `[SyncService] ${label} failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms...`
        );
        await new Promise<void>(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

const toUserData = (userId: string, remote: RemoteUserDocument): UserData =>
  ({
    uid: userId,
    email: remote.email,
    displayName: remote.displayName,
    setupCompleted: remote.setupCompleted,
    preferences: remote.preferences,
  }) as UserData;

export class DefaultSyncOrchestrator implements SyncOrchestrator {
  private readonly now: () => number;

  constructor(private readonly dependencies: SyncOrchestratorDependencies) {
    this.now = dependencies.now ?? Date.now;
  }

  async shouldSync(): Promise<boolean> {
    try {
      const hasChanges = await this.dependencies.localStore.needsSync();
      if (!hasChanges) return false;
      const lastSync = await this.dependencies.localStore.getLastSyncTime();
      return isSyncDue(hasChanges, lastSync, this.now());
    } catch (error) {
      console.error('Error checking sync status:', error);
      return false;
    }
  }

  async syncAll(userId: string): Promise<boolean> {
    try {
      return await withRetry(async () => {
        const snapshot = await this.dependencies.domains.buildLocalSnapshot(userId);
        const deviceId = await this.dependencies.localStore.getDeviceId();
        const results = await Promise.allSettled([
          this.dependencies.repository.saveSnapshot(userId, snapshot, deviceId),
          this.dependencies.domains.syncFavorites(userId, deviceId),
        ]);
        const failures = results.filter(
          (result): result is PromiseRejectedResult => result.status === 'rejected'
        );
        if (failures.length > 0) {
          failures.forEach(result => console.error('[SyncService] Domain sync failed:', result.reason));
          throw new Error('One or more sync domains failed.');
        }
        await this.dependencies.localStore.setLastSyncTime();
        await this.dependencies.localStore.clearSyncFlag();
        return true;
      }, 'syncToFirestore');
    } catch (error) {
      console.error('Error syncing to Firestore after retries:', error);
      return false;
    }
  }

  async forceSync(userId: string): Promise<boolean> {
    return this.syncAll(userId);
  }

  async autoSync(userId: string | null): Promise<void> {
    if (!userId) return;
    try {
      if (await this.shouldSync()) await this.syncAll(userId);
    } catch (error) {
      console.error('Error in auto sync:', error);
    }
  }

  async getActiveDeviceId(userId: string): Promise<string | null> {
    try {
      return await this.dependencies.repository.getActiveDeviceId(userId);
    } catch (error) {
      console.error('Error getting active device ID from Firebase:', error);
      return null;
    }
  }

  async createUserDocument(
    userId: string,
    email: string,
    displayName?: string,
    photoURL?: string | null
  ): Promise<void> {
    try {
      await this.dependencies.repository.createUserDocument(userId, email, displayName, photoURL);
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  }

  async fetchAndSaveUserData(userId: string): Promise<UserData | null> {
    try {
      const remote = await this.dependencies.repository.getUserDocument(userId);
      if (!remote) return null;

      const userData = toUserData(userId, remote);
      const hasUnsyncedLocalChanges = await this.dependencies.localStore.needsSync();
      await this.dependencies.localStore.saveUserData(userData);
      await this.dependencies.domains.cacheRemoteProfile(userId, remote);
      if (hasUnsyncedLocalChanges) {
        console.warn('[SyncService] Local unsynced changes detected; skipping cloud domain restore.');
        return userData;
      }

      await this.dependencies.domains.restoreRemoteDomains(userId, remote);
      await this.dependencies.localStore.clearSyncFlag();
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  async syncNotificationSettings(
    userId: string,
    settings: SyncNotificationSettings
  ): Promise<void> {
    await withRetry(async () => {
      const deviceId = await this.dependencies.localStore.getDeviceId();
      await this.dependencies.repository.saveNotificationSettings(userId, settings, deviceId);
    }, 'syncNotificationSettingsToFirestore');
  }

  async syncAuthProfile(userId: string, profile: AuthProfileSyncInput): Promise<void> {
    await withRetry(async () => {
      const deviceId = await this.dependencies.localStore.getDeviceId();
      await this.dependencies.repository.saveAuthProfile(userId, profile, deviceId);
    }, 'syncAuthProfileToFirestore');
  }
}
