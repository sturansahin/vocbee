import type { NotificationSettings } from '@features/notifications';
import type { Profile, UserProfileRepository } from '@features/profile';
import type { SyncOrchestrator } from '@features/sync';
import type { UserData } from '@shared/storage';

import type { AccountDeletionClient, AuthRepository } from '../data/contracts';
import type { AuthUser } from '../domain/types';

export interface AuthLocalStore {
  getLocalUserData(): Promise<UserData | null>;
  saveUserData(userData: UserData): Promise<void>;
  clear(options?: { fullPurge?: boolean }): Promise<void>;
  getDeviceId(): Promise<string>;
}

export interface AuthNotificationGateway {
  getSettings(): Promise<NotificationSettings>;
  saveSettings(settings: Partial<NotificationSettings>): Promise<void>;
  cancelAll(): Promise<void>;
  clearTracked(): Promise<void>;
}

export interface AuthProgressGateway {
  resetWithoutSync(): Promise<void>;
}

export interface AuthFacadeDependencies {
  authRepository: AuthRepository;
  profileRepository: UserProfileRepository;
  sync: SyncOrchestrator;
  localStore: AuthLocalStore;
  notifications: AuthNotificationGateway;
  progress: AuthProgressGateway;
  accountDeletion: AccountDeletionClient;
  getGoogleErrorMessage(error: unknown): string;
}

export interface AuthStatePayload {
  userData: UserData | null;
  profile: Profile;
  notificationSettings: NotificationSettings;
  connectionError: boolean;
}

export interface AuthActionResult extends AuthStatePayload {
  setupCompleted: boolean;
}

export interface RetryResult {
  userData: UserData | null;
  notificationSettings: NotificationSettings;
  connectionError: boolean;
}

export interface AuthFacade {
  initialize(): void;
  subscribe(callback: (user: AuthUser | null) => void): () => void;
  bootstrapSession(user: AuthUser | null): Promise<AuthStatePayload>;
  signUp(email: string, password: string, displayName?: string): Promise<UserData>;
  signIn(email: string, password: string): Promise<AuthActionResult>;
  signInWithGoogle(): Promise<AuthActionResult>;
  signInWithApple(): Promise<AuthActionResult>;
  signOut(user: AuthUser | null): Promise<void>;
  resetPassword(email: string): Promise<void>;
  refreshUserData(user: AuthUser): Promise<RetryResult>;
  retryConnection(user: AuthUser): Promise<RetryResult>;
  deleteAccount(user: AuthUser | null): Promise<void>;
  updateProfileData(
    user: AuthUser | null,
    profile: Profile,
    patch: Partial<Profile>,
  ): Promise<Profile>;
  updateNotificationSettings(
    user: AuthUser | null,
    current: NotificationSettings,
    patch: Partial<NotificationSettings>,
  ): Promise<NotificationSettings>;
  refreshNotificationSettings(): Promise<NotificationSettings>;
}
