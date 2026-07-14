import { DEFAULT_NOTIFICATION_SETTINGS } from '@features/notifications';
import type { UserProfileRepository } from '@features/profile';
import type { SyncOrchestrator } from '@features/sync';

import { DefaultAuthFacade } from '../AuthFacade';
import type {
  AuthFacadeDependencies,
  AuthLocalStore,
  AuthNotificationGateway,
  AuthProgressGateway,
} from '../contracts';
import type { AccountDeletionClient, AuthRepository } from '../../data/contracts';
import type { AuthUser } from '../../domain/types';

const user: AuthUser = {
  uid: 'user-1',
  email: 'user@example.com',
  displayName: 'VocBee User',
  photoURL: null,
};

function makeDependencies(): AuthFacadeDependencies {
  const authRepository: AuthRepository = {
    configure: jest.fn(),
    getCurrentUser: jest.fn(() => user),
    onAuthStateChanged: jest.fn(() => jest.fn()),
    signUpWithEmail: jest.fn(async () => user),
    signInWithEmail: jest.fn(async () => user),
    signInWithGoogle: jest.fn(async () => ({ user })),
    signInWithApple: jest.fn(async () => ({ user })),
    updateCurrentUserProfile: jest.fn(async () => undefined),
    signOut: jest.fn(async () => undefined),
    disconnectProviderSessions: jest.fn(async () => undefined),
    sendPasswordReset: jest.fn(async () => undefined),
    deleteAuthUser: jest.fn(async () => undefined),
    getIdToken: jest.fn(async () => 'token'),
    getLastSignInTimeMs: jest.fn(() => Date.now()),
  };
  const profileRepository: UserProfileRepository = {
    getCachedProfile: jest.fn(async () => ({
      name: 'VocBee User',
      image: null,
      email: 'user@example.com',
    })),
    cacheProfile: jest.fn(async () => undefined),
    fetchProfileFromRemote: jest.fn(async () => null),
    saveProfile: jest.fn(async () => undefined),
    createUserDocument: jest.fn(async () => undefined),
    deleteUserDocument: jest.fn(async () => undefined),
  };
  const sync: SyncOrchestrator = {
    shouldSync: jest.fn(async () => false),
    syncAll: jest.fn(async () => true),
    forceSync: jest.fn(async () => true),
    autoSync: jest.fn(async () => undefined),
    getActiveDeviceId: jest.fn(async () => 'device-1'),
    createUserDocument: jest.fn(async () => undefined),
    fetchAndSaveUserData: jest.fn(async () => ({
      uid: user.uid,
      email: user.email ?? '',
      setupCompleted: true,
    })),
    syncNotificationSettings: jest.fn(async () => undefined),
    syncAuthProfile: jest.fn(async () => undefined),
  };
  const localStore: AuthLocalStore = {
    getLocalUserData: jest.fn(async () => ({
      uid: user.uid,
      email: user.email ?? '',
      setupCompleted: true,
    })),
    saveUserData: jest.fn(async () => undefined),
    clear: jest.fn(async () => undefined),
    getDeviceId: jest.fn(async () => 'device-1'),
  };
  const notifications: AuthNotificationGateway = {
    getSettings: jest.fn(async () => DEFAULT_NOTIFICATION_SETTINGS),
    saveSettings: jest.fn(async () => undefined),
    cancelAll: jest.fn(async () => undefined),
    clearTracked: jest.fn(async () => undefined),
  };
  const progress: AuthProgressGateway = {
    resetWithoutSync: jest.fn(async () => undefined),
  };
  const accountDeletion: AccountDeletionClient = {
    deleteAccount: jest.fn(async () => false),
  };
  return {
    authRepository,
    profileRepository,
    sync,
    localStore,
    notifications,
    progress,
    accountDeletion,
    getGoogleErrorMessage: jest.fn(() => 'google error'),
  };
}

describe('DefaultAuthFacade', () => {
  it('returns a clean signed-out snapshot after loading global notification settings', async () => {
    const dependencies = makeDependencies();
    const result = await new DefaultAuthFacade(dependencies).bootstrapSession(null);

    expect(result.userData).toBeNull();
    expect(result.profile).toEqual({ name: '', image: null, email: '' });
    expect(result.connectionError).toBe(false);
    expect(dependencies.sync.fetchAndSaveUserData).not.toHaveBeenCalled();
  });

  it('uses completed same-device cache without a remote restore', async () => {
    const dependencies = makeDependencies();
    const result = await new DefaultAuthFacade(dependencies).bootstrapSession(user);

    expect(result.userData?.setupCompleted).toBe(true);
    expect(result.profile.name).toBe('VocBee User');
    expect(dependencies.sync.fetchAndSaveUserData).not.toHaveBeenCalled();
    expect(result.connectionError).toBe(false);
  });

  it('refreshes remotely when lastActiveDeviceId belongs to another device', async () => {
    const dependencies = makeDependencies();
    (dependencies.sync.getActiveDeviceId as jest.Mock).mockResolvedValue('device-other');
    const result = await new DefaultAuthFacade(dependencies).bootstrapSession(user);

    expect(dependencies.sync.fetchAndSaveUserData).toHaveBeenCalledWith(user.uid);
    expect(dependencies.notifications.getSettings).toHaveBeenCalledTimes(2);
    expect(result.userData?.setupCompleted).toBe(true);
  });

  it('preserves setup-incomplete routing result when email sign-in has no profile document', async () => {
    const dependencies = makeDependencies();
    (dependencies.sync.fetchAndSaveUserData as jest.Mock).mockResolvedValue(null);
    const result = await new DefaultAuthFacade(dependencies).signIn('user@example.com', 'secret');

    expect(result.setupCompleted).toBe(false);
    expect((dependencies.localStore.clear as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      (dependencies.notifications.cancelAll as jest.Mock).mock.invocationCallOrder[0]
    );
  });

  it('performs force-sync and complete cleanup before Firebase sign-out', async () => {
    const dependencies = makeDependencies();
    await new DefaultAuthFacade(dependencies).signOut(user);

    expect(dependencies.sync.forceSync).toHaveBeenCalledWith(user.uid);
    expect(dependencies.notifications.cancelAll).toHaveBeenCalled();
    expect(dependencies.notifications.clearTracked).toHaveBeenCalled();
    expect(dependencies.localStore.clear).toHaveBeenCalled();
    expect(dependencies.progress.resetWithoutSync).toHaveBeenCalled();
    expect(dependencies.authRepository.signOut).toHaveBeenCalled();
    expect(dependencies.authRepository.disconnectProviderSessions).toHaveBeenCalled();
  });

  it('maps Firebase email sign-in failures to the existing public error message', async () => {
    const dependencies = makeDependencies();
    (dependencies.authRepository.signInWithEmail as jest.Mock).mockRejectedValue({
      code: 'auth/wrong-password',
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(
      new DefaultAuthFacade(dependencies).signIn('user@example.com', 'bad')
    ).rejects.toThrow('Incorrect password.');
    consoleSpy.mockRestore();
  });
});
