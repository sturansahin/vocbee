import Constants from 'expo-constants';
import { Linking } from 'react-native';

import { clearFavoritesOnFirebase } from '@features/favorites';
import {
  cancelAllNotifications,
  getNotificationSettings,
  requestNotificationPermissions,
  scheduleVocabularyNotifications,
} from '@features/notifications';
import { getCurrentLevel, resetProgress, setCurrentLevel } from '@features/progress';
import type { Level } from '@features/progress';
import { openStoreReviewPage } from '@features/review';
import { forceSync } from '@features/sync';
import { clearAllLocalData } from '@shared/storage';
import appConfig from '@/app.json';
import i18n, {
  getDeviceLanguage,
  isUsingSystemLanguage,
  setToDeviceLanguage,
} from '@shared/i18n';

import type { SettingsPlatformGateway } from '../../application/contracts';

const PRIVACY_POLICY_URL = 'https://vocbee.online/privacypolicy';

export class LegacySettingsPlatformGateway implements SettingsPlatformGateway {
  getAppVersion(): string {
    return Constants.expoConfig?.version ?? appConfig.expo.version;
  }

  getCurrentCefrLevel(): Promise<Level> {
    return getCurrentLevel();
  }

  setCurrentCefrLevel(level: Level): Promise<void> {
    return setCurrentLevel(level);
  }

  requestNotificationPermission(): Promise<boolean> {
    return requestNotificationPermissions();
  }

  async openSystemSettings(): Promise<void> {
    await Linking.openSettings();
  }

  async openPrivacyPolicy(): Promise<void> {
    await Linking.openURL(PRIVACY_POLICY_URL);
  }

  openStoreReview(): Promise<{ opened: boolean }> {
    return openStoreReviewPage('settings');
  }

  getSelectedLanguage(): string {
    return i18n.language || 'en';
  }

  getDeviceLanguage(): string {
    return getDeviceLanguage();
  }

  isUsingSystemLanguage(): Promise<boolean> {
    return isUsingSystemLanguage();
  }

  async useSystemLanguage(): Promise<string> {
    const language = await setToDeviceLanguage();
    await this.rescheduleNotificationsIfEnabled();
    return language;
  }

  async changeLanguage(language: string): Promise<void> {
    await i18n.changeLanguage(language);
    await this.rescheduleNotificationsIfEnabled();
  }

  async rescheduleNotificationsIfEnabled(): Promise<void> {
    const settings = await getNotificationSettings();
    if (settings.enabled) await scheduleVocabularyNotifications();
  }

  async resetForLanguageChange(userId: string): Promise<void> {
    if (userId) await clearFavoritesOnFirebase(userId);
    await cancelAllNotifications();
    await clearAllLocalData({ preserveStreak: true });
    await resetProgress();
    await forceSync(userId);
  }

  async resetLearningProgress(userId: string): Promise<void> {
    if (userId) await clearFavoritesOnFirebase(userId);
    await resetProgress();
    await cancelAllNotifications();
    void scheduleVocabularyNotifications().catch(console.error);
    await forceSync(userId);
  }
}
