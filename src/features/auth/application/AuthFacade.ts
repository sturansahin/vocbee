import { DEFAULT_NOTIFICATION_SETTINGS, type NotificationSettings } from '@features/notifications';
import { buildStoredProfileFromAuth, type Profile } from '@features/profile';
import type { UserData } from '@shared/storage';

import type {
  AuthActionResult,
  AuthFacade,
  AuthFacadeDependencies,
  AuthStatePayload,
  RetryResult,
} from './contracts';
import { SOCIAL_AUTH_CANCELLED_ERROR, type AuthSignInResult, type AuthUser } from '../domain/types';
import { getAuthErrorMessage, hasCompletedSetup, isRecentLogin } from '../domain/rules';

const EMPTY_PROFILE: Profile = { name: '', image: null, email: '' };

const errorCode = (error: unknown): string =>
  typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code ?? '')
    : '';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error ?? '');

const recentLoginError = (): Error => {
  const error = new Error('Please log out and log in again before deleting your account.');
  (error as Error & { code?: string }).code = 'auth/requires-recent-login';
  return error;
};

export class DefaultAuthFacade implements AuthFacade {
  constructor(private readonly dependencies: AuthFacadeDependencies) {}

  initialize(): void {
    try {
      this.dependencies.authRepository.configure();
    } catch (error) {
      console.error('Google Sign-In configuration error:', error);
    }
  }

  subscribe(callback: (user: AuthUser | null) => void): () => void {
    return this.dependencies.authRepository.onAuthStateChanged(callback);
  }

  private async loadNotificationSettings(): Promise<NotificationSettings> {
    return this.dependencies.notifications.getSettings();
  }

  private async loadCachedProfile(user: AuthUser): Promise<Profile> {
    let cached: Profile | null = null;
    try {
      cached = await this.dependencies.profileRepository.getCachedProfile(user.uid);
    } catch (error) {
      console.error('Error loading stored profile:', error);
    }
    const profile = buildStoredProfileFromAuth({
      existingProfile: cached,
      email: user.email,
      authDisplayName: user.displayName,
      authPhotoURL: user.photoURL,
    });
    await this.dependencies.profileRepository.cacheProfile(user.uid, profile);
    return profile;
  }

  async bootstrapSession(user: AuthUser | null): Promise<AuthStatePayload> {
    let notificationSettings = DEFAULT_NOTIFICATION_SETTINGS;
    try {
      notificationSettings = await this.loadNotificationSettings();
    } catch (error) {
      console.error('Error loading initial notification settings:', error);
    }
    if (!user) {
      return {
        userData: null,
        profile: EMPTY_PROFILE,
        notificationSettings,
        connectionError: false,
      };
    }

    const localData = await this.dependencies.localStore.getLocalUserData();
    const currentDeviceId = await this.dependencies.localStore.getDeviceId();
    const firebaseDeviceId = await this.dependencies.sync.getActiveDeviceId(user.uid);
    const shouldUseCache = !!(
      localData &&
      localData.uid === user.uid &&
      localData.setupCompleted &&
      (firebaseDeviceId === null || currentDeviceId === firebaseDeviceId)
    );

    let userData: UserData | null = localData;
    let connectionError = false;
    if (shouldUseCache) {
      connectionError = firebaseDeviceId === null;
    } else {
      try {
        const fetched = await this.dependencies.sync.fetchAndSaveUserData(user.uid);
        // fetchAndSaveUserData may restore cloud notification settings locally;
        // reload after it, matching the legacy applyFetchedUserData ordering.
        notificationSettings = await this.loadNotificationSettings();
        if (fetched) {
          userData = fetched;
          connectionError = false;
        } else {
          userData = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || undefined,
          };
          await this.dependencies.localStore.saveUserData(userData);
          connectionError = false;
        }
      } catch (error) {
        console.error('[Auth] Error fetching user data:', error);
        if (localData?.setupCompleted) {
          userData = localData;
          connectionError = true;
        } else {
          userData = null;
          connectionError = true;
        }
      }
    }

    let profile = EMPTY_PROFILE;
    try {
      profile = await this.loadCachedProfile(user);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
    return { userData, profile, notificationSettings, connectionError };
  }

  async signUp(email: string, password: string, displayName?: string): Promise<UserData> {
    try {
      await this.dependencies.notifications.cancelAll();
      await this.dependencies.notifications.clearTracked();
      const user = await this.dependencies.authRepository.signUpWithEmail(
        email,
        password,
        displayName,
      );
      await this.dependencies.profileRepository.createUserDocument(user.uid, email, displayName);
      const userData: UserData = { uid: user.uid, email, displayName };
      await this.dependencies.localStore.saveUserData(userData);
      return userData;
    } catch (error) {
      console.error('Sign up error:', error);
      throw new Error(getAuthErrorMessage(errorCode(error)));
    }
  }

  async signIn(email: string, password: string): Promise<AuthActionResult> {
    try {
      const user = await this.dependencies.authRepository.signInWithEmail(email, password);
      await this.dependencies.localStore.clear();
      await this.dependencies.notifications.cancelAll();
      await this.dependencies.notifications.clearTracked();
      const userData = await this.dependencies.sync.fetchAndSaveUserData(user.uid);
      const notificationSettings = await this.loadNotificationSettings();
      const profile = await this.loadCachedProfile(user);
      return {
        userData,
        profile,
        notificationSettings,
        connectionError: false,
        setupCompleted: hasCompletedSetup(userData),
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw new Error(getAuthErrorMessage(errorCode(error)));
    }
  }

  private async completeSocialSignIn(result: AuthSignInResult): Promise<AuthActionResult> {
    const { user, providerProfile = {} } = result;
    const cached = await this.dependencies.profileRepository.getCachedProfile(user.uid);
    const profile = buildStoredProfileFromAuth({
      existingProfile: cached,
      email: providerProfile.email ?? user.email,
      authDisplayName: user.displayName,
      authPhotoURL: user.photoURL,
      preferredDisplayName: providerProfile.displayName,
      preferredPhotoURL: providerProfile.photoURL,
    });

    const normalizedName = providerProfile.displayName?.trim() || null;
    const normalizedPhoto = providerProfile.photoURL?.trim() || null;
    const patch: { displayName?: string; photoURL?: string } = {};
    if (normalizedName && normalizedName !== user.displayName) patch.displayName = normalizedName;
    if (normalizedPhoto && normalizedPhoto !== user.photoURL) patch.photoURL = normalizedPhoto;
    if (Object.keys(patch).length > 0) {
      await this.dependencies.authRepository.updateCurrentUserProfile(patch);
    }

    await this.dependencies.localStore.clear();
    await this.dependencies.notifications.cancelAll();
    await this.dependencies.notifications.clearTracked();
    await this.dependencies.profileRepository.createUserDocument(
      user.uid,
      profile.email,
      profile.name,
      profile.image,
    );
    await this.dependencies.sync.syncAuthProfile(user.uid, {
      email: profile.email,
      displayName: profile.name,
      photoURL: profile.image,
    });
    await this.dependencies.profileRepository.cacheProfile(user.uid, profile);

    const fetched = await this.dependencies.sync.fetchAndSaveUserData(user.uid);
    const notificationSettings = await this.loadNotificationSettings();
    if (fetched) {
      const refreshedProfile =
        (await this.dependencies.profileRepository.getCachedProfile(user.uid)) ?? profile;
      return {
        userData: fetched,
        profile: refreshedProfile,
        notificationSettings,
        connectionError: false,
        setupCompleted: hasCompletedSetup(fetched),
      };
    }

    const fallbackUserData: UserData = {
      uid: user.uid,
      email: profile.email,
      displayName: profile.name || undefined,
    };
    await this.dependencies.localStore.saveUserData(fallbackUserData);
    await this.dependencies.profileRepository.cacheProfile(user.uid, profile);
    return {
      userData: fallbackUserData,
      profile,
      notificationSettings,
      connectionError: false,
      setupCompleted: false,
    };
  }

  async signInWithGoogle(): Promise<AuthActionResult> {
    try {
      return await this.completeSocialSignIn(
        await this.dependencies.authRepository.signInWithGoogle(),
      );
    } catch (error) {
      if (errorMessage(error) === SOCIAL_AUTH_CANCELLED_ERROR) throw error;
      console.error('Google Sign-In error:', error);
      throw new Error(this.dependencies.getGoogleErrorMessage(error));
    }
  }

  async signInWithApple(): Promise<AuthActionResult> {
    try {
      return await this.completeSocialSignIn(
        await this.dependencies.authRepository.signInWithApple(),
      );
    } catch (error) {
      if (errorCode(error) === 'ERR_REQUEST_CANCELED') {
        throw new Error(SOCIAL_AUTH_CANCELLED_ERROR);
      }
      if (errorMessage(error) === SOCIAL_AUTH_CANCELLED_ERROR) throw error;
      console.error('Apple Sign-In error:', error);
      throw new Error('Failed to sign in with Apple. Please try again.');
    }
  }

  async signOut(user: AuthUser | null): Promise<void> {
    if (user) await this.dependencies.sync.forceSync(user.uid);
    await this.dependencies.notifications.cancelAll();
    await this.dependencies.notifications.clearTracked();
    await this.dependencies.localStore.clear();
    await this.dependencies.progress.resetWithoutSync();
    await this.dependencies.authRepository.signOut();
    try {
      await this.dependencies.authRepository.disconnectProviderSessions();
    } catch (error) {
      console.warn('Failed to clear native Google session:', error);
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await this.dependencies.authRepository.sendPasswordReset(email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw new Error(getAuthErrorMessage(errorCode(error)));
    }
  }

  async refreshUserData(user: AuthUser): Promise<RetryResult> {
    const userData = await this.dependencies.sync.fetchAndSaveUserData(user.uid);
    const notificationSettings = await this.loadNotificationSettings();
    return { userData, notificationSettings, connectionError: false };
  }

  async retryConnection(user: AuthUser): Promise<RetryResult> {
    try {
      const result = await this.refreshUserData(user);
      return { ...result, connectionError: !result.userData };
    } catch (error) {
      console.error('[Auth] Retry failed with error:', error);
      return {
        userData: null,
        notificationSettings: await this.loadNotificationSettings(),
        connectionError: true,
      };
    }
  }

  async deleteAccount(user: AuthUser | null): Promise<void> {
    if (!user) throw new Error('No user is currently signed in');
    const lastSignInTime = this.dependencies.authRepository.getLastSignInTimeMs();
    if (lastSignInTime === null || !isRecentLogin(lastSignInTime, Date.now())) {
      throw recentLoginError();
    }

    try {
      const handledRemotely = await this.dependencies.accountDeletion.deleteAccount(() =>
        this.dependencies.authRepository.getIdToken(),
      );
      if (!handledRemotely) {
        await this.dependencies.profileRepository.deleteUserDocument(user.uid);
        await this.dependencies.authRepository.deleteAuthUser();
      }
      await this.dependencies.notifications.cancelAll();
      await this.dependencies.notifications.clearTracked();
      await this.dependencies.localStore.clear({ fullPurge: true });
      await this.dependencies.progress.resetWithoutSync();
      try {
        await this.dependencies.authRepository.disconnectProviderSessions();
      } catch (error) {
        console.warn('Failed to clear native Google session:', error);
      }
    } catch (error) {
      if (errorCode(error) === 'auth/requires-recent-login') throw recentLoginError();
      throw error;
    }
  }

  async updateProfileData(
    user: AuthUser | null,
    profile: Profile,
    patch: Partial<Profile>,
  ): Promise<Profile> {
    if (!user) return profile;
    const next = { ...profile, ...patch };
    await this.dependencies.profileRepository.cacheProfile(user.uid, next);
    return next;
  }

  async updateNotificationSettings(
    user: AuthUser | null,
    current: NotificationSettings,
    patch: Partial<NotificationSettings>,
  ): Promise<NotificationSettings> {
    await this.dependencies.notifications.saveSettings(patch);
    const persisted = await this.dependencies.notifications.getSettings();
    if (user) {
      this.dependencies.sync.syncNotificationSettings(user.uid, persisted).catch((error) => {
        console.error('Error syncing notification settings to Firestore:', error);
      });
    }
    return { ...current, ...persisted };
  }

  refreshNotificationSettings(): Promise<NotificationSettings> {
    return this.loadNotificationSettings();
  }
}
