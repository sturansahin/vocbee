export * from './domain/types';
export * from './domain/rules';
export type {
  SyncRepository,
  SyncLocalStore,
  SyncDomainGateway,
  SyncOrchestrator,
} from './application/contracts';
export { DefaultSyncOrchestrator } from './application/DefaultSyncOrchestrator';
export {
  autoSync,
  createUserDocument,
  fetchAndSaveUserData,
  forceSync,
  getActiveDeviceIdFromFirebase,
  shouldSync,
  syncAuthProfileToFirestore,
  syncNotificationSettingsToFirestore,
  syncToFirestore,
} from './composition/syncService';
