import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@shared/storage';

import { normalizeNotificationSettings } from '../../domain/rules';
import type { NotificationSettings, TrackedNotification } from '../../domain/types';
import type { NotificationTrackingRepository } from '../contracts';

export class AsyncStorageNotificationTrackingRepository implements NotificationTrackingRepository {
  async getTracked(): Promise<TrackedNotification[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.TRACKED_NOTIFICATIONS);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.error('[Notifications] Error loading tracked notifications:', error);
      return [];
    }
  }

  async saveTracked(notifications: TrackedNotification[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRACKED_NOTIFICATIONS, JSON.stringify(notifications));
    } catch (error) {
      console.error('[Notifications] Error saving tracked notifications:', error);
    }
  }

  clearTracked(): Promise<void> {
    return AsyncStorage.removeItem(STORAGE_KEYS.TRACKED_NOTIFICATIONS);
  }

  async getSettings(): Promise<NotificationSettings> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      return normalizeNotificationSettings(raw ? JSON.parse(raw) : null);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      return normalizeNotificationSettings();
    }
  }

  async saveSettings(settings: NotificationSettings): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(settings));
  }

  setLastForegroundTime(timestamp: number): Promise<void> {
    return AsyncStorage.setItem(STORAGE_KEYS.LAST_FOREGROUND_TIME, timestamp.toString());
  }

  setLastBackgroundTime(timestamp: number): Promise<void> {
    return AsyncStorage.setItem(STORAGE_KEYS.LAST_BACKGROUND_TIME, timestamp.toString());
  }

  async getLastForegroundTime(): Promise<number> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.LAST_FOREGROUND_TIME);
      return value ? parseInt(value, 10) : 0;
    } catch {
      return 0;
    }
  }

  async getLastBackgroundTime(): Promise<number> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.LAST_BACKGROUND_TIME);
      return value ? parseInt(value, 10) : 0;
    } catch {
      return 0;
    }
  }

  getContentVersion(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_CONTENT_VERSION);
  }

  setContentVersion(version: number): Promise<void> {
    return AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_CONTENT_VERSION, String(version));
  }

  getTargetLanguage(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.TARGET_LANGUAGE);
  }

  getStoredCurrentLevel(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.CURRENT_LEVEL);
  }
}
