import {
  getFirstLevelForUserLevel,
  getUserLevelFromCefrLevel,
  isUserLevel,
  type UserLevel,
} from '@features/vocabulary';

import type { SettingsRepository } from '../data/contracts';
import type {
  AvatarPickerGateway,
  AvatarPickResult,
  AvatarSource,
  SettingsFacade,
  SettingsPlatformGateway,
} from './contracts';

export class DefaultSettingsFacade implements SettingsFacade {
  constructor(
    private readonly repository: SettingsRepository,
    private readonly avatarPicker: AvatarPickerGateway,
    private readonly platform: SettingsPlatformGateway,
  ) {}

  getAppVersion(): string {
    return this.platform.getAppVersion();
  }

  async loadUserLevel(): Promise<UserLevel> {
    const saved = await this.repository.getUserLevel();
    if (isUserLevel(saved)) return saved;
    const derived = getUserLevelFromCefrLevel(await this.platform.getCurrentCefrLevel());
    await this.repository.setUserLevel(derived);
    return derived;
  }

  async changeUserLevel(level: UserLevel): Promise<void> {
    await this.repository.setUserLevel(level);
    await this.platform.setCurrentCefrLevel(getFirstLevelForUserLevel(level));
    await this.platform.rescheduleNotificationsIfEnabled();
  }

  async pickAndUpdateAvatar(
    source: AvatarSource,
    updateProfile: (patch: { image?: string | null }) => Promise<void>,
  ): Promise<AvatarPickResult> {
    let result: AvatarPickResult;
    try {
      result = await this.avatarPicker.pick(source);
    } catch (error) {
      return { status: 'error', error };
    }
    if (result.status === 'selected') {
      try {
        await updateProfile({ image: result.uri });
      } catch (error) {
        return { status: 'error', error };
      }
    }
    return result;
  }

  async updateProfileName(
    name: string,
    updateProfile: (patch: { name?: string }) => Promise<void>,
  ): Promise<'updated' | 'empty' | 'too-short'> {
    const normalized = name.trim();
    if (!normalized) return 'empty';
    if (normalized.length < 2) return 'too-short';
    await updateProfile({ name: normalized });
    return 'updated';
  }

  requestNotificationPermission(): Promise<boolean> {
    return this.platform.requestNotificationPermission();
  }

  openSystemSettings(): Promise<void> {
    return this.platform.openSystemSettings();
  }

  openPrivacyPolicy(): Promise<void> {
    return this.platform.openPrivacyPolicy();
  }

  openStoreReview(): Promise<{ opened: boolean }> {
    return this.platform.openStoreReview();
  }

  getSelectedLanguage(): string {
    return this.platform.getSelectedLanguage();
  }

  getDeviceLanguage(): string {
    return this.platform.getDeviceLanguage();
  }

  isUsingSystemLanguage(): Promise<boolean> {
    return this.platform.isUsingSystemLanguage();
  }

  useSystemLanguage(): Promise<string> {
    return this.platform.useSystemLanguage();
  }

  changeLanguage(language: string): Promise<void> {
    return this.platform.changeLanguage(language);
  }

  resetForLanguageChange(userId: string): Promise<void> {
    return this.platform.resetForLanguageChange(userId);
  }

  resetLearningProgress(userId: string): Promise<void> {
    return this.platform.resetLearningProgress(userId);
  }
}
