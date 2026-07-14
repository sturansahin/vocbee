import {
  clearAllLocalData,
  getDeviceId,
  getLocalUserData,
  saveUserDataLocally,
  type UserData,
} from '@shared/storage';

import type { AuthLocalStore } from '../../application/contracts';

export class SharedAuthLocalStore implements AuthLocalStore {
  getLocalUserData = getLocalUserData;
  getDeviceId = getDeviceId;

  async saveUserData(userData: UserData): Promise<void> {
    await saveUserDataLocally(userData);
  }

  async clear(options?: { fullPurge?: boolean }): Promise<void> {
    await clearAllLocalData(options);
  }
}
