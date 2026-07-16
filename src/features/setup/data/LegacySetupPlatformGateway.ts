import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

import {
  getNotificationFrequencyMinutes,
  getNotificationPermissionState,
  requestNotificationPermissions,
  saveNotificationSettings,
  scheduleVocabularyNotifications,
} from '@features/notifications';
import type { UserProfileRepository } from '@features/profile';
import { resetProgress, setCurrentLevel } from '@features/progress';
import { generateVocabulary, getFirstLevelForUserLevel } from '@features/vocabulary';
import { STORAGE_KEYS } from '@shared/storage';

import type {
  SetupCompletionInput,
  SetupPlatformGateway,
} from '../application/setupContracts';

export class LegacySetupPlatformGateway implements SetupPlatformGateway {
  constructor(private readonly profileRepository: UserProfileRepository) {}

  async getNotificationPermissionGranted(): Promise<boolean> {
    const { status } = await getNotificationPermissionState();
    return status === 'granted';
  }

  requestNotificationPermission(): Promise<boolean> {
    return requestNotificationPermissions();
  }

  async openSystemSettings(): Promise<void> {
    await Linking.openSettings();
  }

  async persistCompletion(input: SetupCompletionInput): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_LEVEL, input.level);
    const initialLevel = getFirstLevelForUserLevel(input.level);
    const currentUser = input.user;

    if (currentUser) {
      await AsyncStorage.setItem('@profile_email', currentUser.email || '');
      if (currentUser.displayName) {
        await AsyncStorage.setItem('@profile_name', currentUser.displayName);
      }

      await this.profileRepository.saveSetupCompletion(currentUser.uid, {
        preferences: {
          nativeLanguage: input.nativeLanguage,
          targetLanguage: input.targetLanguage,
          level: input.level,
        },
        initialLevel,
        notificationSettings: input.notificationPermissionGranted
          ? {
              enabled: true,
              startHour: Number.parseInt(input.startHour, 10),
              startMinute: Number.parseInt(input.startMinute, 10),
              endHour: Number.parseInt(input.endHour, 10),
              endMinute: Number.parseInt(input.endMinute, 10),
              frequencyMinutes: getNotificationFrequencyMinutes(input.frequency),
              autoMarkLearned: true,
            }
          : { enabled: false },
      });
    }

    await saveNotificationSettings(
      input.notificationPermissionGranted
        ? {
            enabled: true,
            startHour: Number.parseInt(input.startHour, 10),
            startMinute: Number.parseInt(input.startMinute, 10),
            endHour: Number.parseInt(input.endHour, 10),
            endMinute: Number.parseInt(input.endMinute, 10),
            frequencyMinutes: getNotificationFrequencyMinutes(input.frequency),
            autoMarkLearned: true,
          }
        : { enabled: false },
      true
    );
  }

  async prepareLearningContent(input: SetupCompletionInput): Promise<void> {
    const initialLevel = getFirstLevelForUserLevel(input.level);
    await generateVocabulary(input.nativeLanguage, input.targetLanguage);
    await resetProgress();
    await setCurrentLevel(initialLevel);
    if (input.notificationPermissionGranted) {
      await scheduleVocabularyNotifications();
    }
  }
}
