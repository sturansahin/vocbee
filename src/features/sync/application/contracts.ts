// src/features/sync/application/contracts.ts
// Layer: application (contracts) | Feature: sync. Interfaces only — PREP (docs/refactor-v2/35 §8).
// The existing services/SyncService.ts keeps running as-is; this defines the target shape for the
// incremental split (SyncOrchestrator calls each feature's repository), preserving the device-id
// conflict rule (lastActiveDeviceId / last-writer) + syncMeta copy-verify + debounce behavior.

export interface SyncRepository {
  /** debounce + @vocbee_needs_sync (services/SyncService.shouldSync). */
  shouldSync(): Promise<boolean>;
  /** users/{uid}.lastActiveDeviceId (services/SyncService.getActiveDeviceIdFromFirebase). */
  getActiveDeviceId(userId: string): Promise<string | null>;
  /** @vocbee_device_id (services/storage.getDeviceId). */
  getLocalDeviceId(): Promise<string>;
}

export interface SyncOrchestrator {
  /** Debounced sync of progress + profile + favorites + notif + streak (services/SyncService.syncToFirestore via autoSync). */
  syncAll(userId: string): Promise<boolean>;
  /** Always-sync (logout/profile change) — services/SyncService.forceSync. */
  forceSync(userId: string): Promise<boolean>;
}
