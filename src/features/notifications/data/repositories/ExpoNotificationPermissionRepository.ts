import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from '@shared/storage';

import {
  ANDROID_STREAK_CHANNEL_ID,
  ANDROID_VOCABULARY_CHANNEL_ID,
} from '../../domain/constants';
import type { NotificationPermissionState } from '../../domain/types';
import type { NotificationPermissionRepository } from '../contracts';

export class ExpoNotificationPermissionRepository implements NotificationPermissionRepository {
  async getPermissionState(): Promise<NotificationPermissionState> {
    const permissions = await Notifications.getPermissionsAsync();
    return {
      status: permissions.status,
      granted: permissions.granted,
      canAskAgain: permissions.canAskAgain,
      expires: permissions.expires,
    };
  }

  async requestPermission(): Promise<NotificationPermissionState> {
    const permissions = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return {
      status: permissions.status,
      granted: permissions.granted ?? permissions.status === 'granted',
      canAskAgain: permissions.canAskAgain ?? true,
      expires: permissions.expires ?? 'never',
    };
  }

  async hasSeenPrompt(userId: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(
        `${STORAGE_KEYS.NOTIFICATION_PERMISSION_PROMPT_PREFIX}${userId}`
      );
      return value === 'true';
    } catch (error) {
      console.error('[Notifications] Failed to read permission prompt flag:', error);
      return false;
    }
  }

  async markPromptSeen(userId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.NOTIFICATION_PERMISSION_PROMPT_PREFIX}${userId}`,
        'true'
      );
    } catch (error) {
      console.error('[Notifications] Failed to persist permission prompt flag:', error);
    }
  }

  async ensureChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync(ANDROID_VOCABULARY_CHANNEL_ID, {
      name: 'Vocabulary Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFD700',
    });
    await Notifications.setNotificationChannelAsync(ANDROID_STREAK_CHANNEL_ID, {
      name: 'Streak Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF8F1F',
    });
  }
}
