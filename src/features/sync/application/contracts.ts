import type { UserData } from '@shared/storage';

import type {
  AuthProfileSyncInput,
  LocalSyncSnapshot,
  RemoteUserDocument,
  SyncNotificationSettings,
} from '../domain/types';

export interface SyncRepository {
  getActiveDeviceId(userId: string): Promise<string | null>;
  getUserDocument(userId: string): Promise<RemoteUserDocument | null>;
  saveSnapshot(userId: string, snapshot: LocalSyncSnapshot, deviceId: string): Promise<void>;
  createUserDocument(
    userId: string,
    email: string,
    displayName?: string,
    photoURL?: string | null
  ): Promise<void>;
  saveNotificationSettings(
    userId: string,
    settings: SyncNotificationSettings,
    deviceId: string
  ): Promise<void>;
  saveAuthProfile(userId: string, profile: AuthProfileSyncInput, deviceId: string): Promise<void>;
}

export interface SyncLocalStore {
  needsSync(): Promise<boolean>;
  getLastSyncTime(): Promise<Date | null>;
  setLastSyncTime(): Promise<void>;
  clearSyncFlag(): Promise<void>;
  getDeviceId(): Promise<string>;
  saveUserData(userData: UserData): Promise<void>;
}

export interface SyncDomainGateway {
  buildLocalSnapshot(userId: string): Promise<LocalSyncSnapshot>;
  syncFavorites(userId: string, deviceId: string): Promise<void>;
  cacheRemoteProfile(userId: string, remote: RemoteUserDocument): Promise<void>;
  restoreRemoteDomains(userId: string, remote: RemoteUserDocument): Promise<void>;
}

export interface SyncOrchestrator {
  shouldSync(): Promise<boolean>;
  syncAll(userId: string): Promise<boolean>;
  forceSync(userId: string): Promise<boolean>;
  autoSync(userId: string | null): Promise<void>;
  getActiveDeviceId(userId: string): Promise<string | null>;
  createUserDocument(
    userId: string,
    email: string,
    displayName?: string,
    photoURL?: string | null
  ): Promise<void>;
  fetchAndSaveUserData(userId: string): Promise<UserData | null>;
  syncNotificationSettings(userId: string, settings: SyncNotificationSettings): Promise<void>;
  syncAuthProfile(userId: string, profile: AuthProfileSyncInput): Promise<void>;
}
