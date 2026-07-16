import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@shared/storage';

import type { OnboardingRepository } from '../application/contracts';

export class AsyncStorageOnboardingRepository implements OnboardingRepository {
  async markSeen(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING, 'true');
  }
}
