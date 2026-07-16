import type { Profile } from '@features/profile';
import type { Level } from '@features/progress';
import type { UserLevel } from '@features/vocabulary';

export type AvatarSource = 'camera' | 'gallery';
export type AvatarPickResult =
  | { status: 'selected'; uri: string }
  | { status: 'cancelled' }
  | { status: 'permission-denied' }
  | { status: 'error'; error: unknown };

export interface AvatarPickerGateway {
  pick(source: AvatarSource): Promise<AvatarPickResult>;
}

export interface SettingsPlatformGateway {
  getAppVersion(): string;
  getCurrentCefrLevel(): Promise<Level>;
  setCurrentCefrLevel(level: Level): Promise<void>;
  requestNotificationPermission(): Promise<boolean>;
  openSystemSettings(): Promise<void>;
  openPrivacyPolicy(): Promise<void>;
  openStoreReview(): Promise<{ opened: boolean }>;
  getSelectedLanguage(): string;
  getDeviceLanguage(): string;
  isUsingSystemLanguage(): Promise<boolean>;
  useSystemLanguage(): Promise<string>;
  changeLanguage(language: string): Promise<void>;
  rescheduleNotificationsIfEnabled(): Promise<void>;
  resetForLanguageChange(userId: string): Promise<void>;
  resetLearningProgress(userId: string): Promise<void>;
}

export interface SettingsFacade {
  getAppVersion(): string;
  loadUserLevel(): Promise<UserLevel>;
  changeUserLevel(level: UserLevel): Promise<void>;
  pickAndUpdateAvatar(
    source: AvatarSource,
    updateProfile: (patch: Partial<Profile>) => Promise<void>
  ): Promise<AvatarPickResult>;
  updateProfileName(
    name: string,
    updateProfile: (patch: Partial<Profile>) => Promise<void>
  ): Promise<'updated' | 'empty' | 'too-short'>;
  requestNotificationPermission(): Promise<boolean>;
  openSystemSettings(): Promise<void>;
  openPrivacyPolicy(): Promise<void>;
  openStoreReview(): Promise<{ opened: boolean }>;
  getSelectedLanguage(): string;
  getDeviceLanguage(): string;
  isUsingSystemLanguage(): Promise<boolean>;
  useSystemLanguage(): Promise<string>;
  changeLanguage(language: string): Promise<void>;
  resetForLanguageChange(userId: string): Promise<void>;
  resetLearningProgress(userId: string): Promise<void>;
}
