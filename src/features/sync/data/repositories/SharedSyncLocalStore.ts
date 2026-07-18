import {
  clearSyncFlag,
  getDeviceId,
  getLastSyncTime,
  needsSync,
  saveUserDataLocally,
  setLastSyncTime,
  type UserData,
} from '@shared/storage';

import type { SyncLocalStore } from '../../application/contracts';

export class SharedSyncLocalStore implements SyncLocalStore {
  needsSync = needsSync;
  getLastSyncTime = getLastSyncTime;
  setLastSyncTime = setLastSyncTime;
  clearSyncFlag = clearSyncFlag;
  getDeviceId = getDeviceId;

  async saveUserData(userData: UserData): Promise<void> {
    await saveUserDataLocally(userData);
  }
}
