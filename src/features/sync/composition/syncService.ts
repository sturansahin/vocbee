import { DefaultSyncOrchestrator } from '../application/DefaultSyncOrchestrator';
import { LegacySyncDomainGateway } from '../data/gateways/LegacySyncDomainGateway';
import { FirestoreSyncRepository } from '../data/repositories/FirestoreSyncRepository';
import { SharedSyncLocalStore } from '../data/repositories/SharedSyncLocalStore';
import type { AuthProfileSyncInput, SyncNotificationSettings } from '../domain/types';

const syncService = new DefaultSyncOrchestrator({
  repository: new FirestoreSyncRepository(),
  localStore: new SharedSyncLocalStore(),
  domains: new LegacySyncDomainGateway(),
});

export const shouldSync = (): Promise<boolean> => syncService.shouldSync();
export const syncToFirestore = (userId: string): Promise<boolean> => syncService.syncAll(userId);
export const forceSync = (userId: string): Promise<boolean> => syncService.forceSync(userId);
export const autoSync = (userId: string | null): Promise<void> => syncService.autoSync(userId);
export const getActiveDeviceIdFromFirebase = (userId: string): Promise<string | null> =>
  syncService.getActiveDeviceId(userId);
export const createUserDocument = (
  userId: string,
  email: string,
  displayName?: string,
  photoURL?: string | null
): Promise<void> => syncService.createUserDocument(userId, email, displayName, photoURL);
export const fetchAndSaveUserData = (userId: string) => syncService.fetchAndSaveUserData(userId);
export const syncNotificationSettingsToFirestore = (
  userId: string,
  settings: SyncNotificationSettings
): Promise<void> => syncService.syncNotificationSettings(userId, settings);
export const syncAuthProfileToFirestore = (
  userId: string,
  profile: AuthProfileSyncInput
): Promise<void> => syncService.syncAuthProfile(userId, profile);

export { syncService };
