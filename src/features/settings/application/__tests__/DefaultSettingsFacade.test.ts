import type { Level } from '@features/progress';
import type { Profile } from '@features/profile';

import { DefaultSettingsFacade } from '../DefaultSettingsFacade';
import type { AvatarPickerGateway, SettingsPlatformGateway } from '../contracts';
import type { SettingsRepository } from '../../data/contracts';

function makeSubject(avatarResult: Awaited<ReturnType<AvatarPickerGateway['pick']>>) {
  const repository: SettingsRepository = {
    getPreferences: jest.fn(async () => null),
    savePreferences: jest.fn(async () => undefined),
    getAppLanguage: jest.fn(async () => 'en'),
    setAppLanguage: jest.fn(async () => undefined),
    getUserLevel: jest.fn(async () => 'intermediate'),
    setUserLevel: jest.fn(async () => undefined),
  };
  const avatarPicker: AvatarPickerGateway = {
    pick: jest.fn(async () => avatarResult),
  };
  const platform: SettingsPlatformGateway = {
    getAppVersion: jest.fn(() => '1.0.0'),
    getCurrentCefrLevel: jest.fn(async () => 'A1' as Level),
    setCurrentCefrLevel: jest.fn(async () => undefined),
    requestNotificationPermission: jest.fn(async () => true),
    openSystemSettings: jest.fn(async () => undefined),
    openPrivacyPolicy: jest.fn(async () => undefined),
    openStoreReview: jest.fn(async () => ({ opened: true })),
    getSelectedLanguage: jest.fn(() => 'en'),
    getDeviceLanguage: jest.fn(() => 'tr'),
    isUsingSystemLanguage: jest.fn(async () => false),
    useSystemLanguage: jest.fn(async () => 'tr'),
    changeLanguage: jest.fn(async () => undefined),
    rescheduleNotificationsIfEnabled: jest.fn(async () => undefined),
    resetForLanguageChange: jest.fn(async () => undefined),
    resetLearningProgress: jest.fn(async () => undefined),
  };
  return {
    facade: new DefaultSettingsFacade(repository, avatarPicker, platform),
    repository,
    avatarPicker,
    platform,
  };
}

describe('DefaultSettingsFacade', () => {
  it('loads persisted settings and updates the profile name', async () => {
    const { facade } = makeSubject({ status: 'cancelled' });
    const updateProfile = jest.fn(async (_patch: Partial<Profile>) => undefined);

    await expect(facade.loadUserLevel()).resolves.toBe('intermediate');
    await expect(facade.updateProfileName('  Bee User  ', updateProfile)).resolves.toBe('updated');
    expect(updateProfile).toHaveBeenCalledWith({ name: 'Bee User' });
  });

  it('updates the profile image after a successful avatar selection', async () => {
    const { facade } = makeSubject({ status: 'selected', uri: 'file://avatar.jpg' });
    const updateProfile = jest.fn(async (_patch: Partial<Profile>) => undefined);

    await expect(facade.pickAndUpdateAvatar('gallery', updateProfile)).resolves.toEqual({
      status: 'selected',
      uri: 'file://avatar.jpg',
    });
    expect(updateProfile).toHaveBeenCalledWith({ image: 'file://avatar.jpg' });
  });

  it('preserves cancellation without updating the profile', async () => {
    const { facade } = makeSubject({ status: 'cancelled' });
    const updateProfile = jest.fn(async (_patch: Partial<Profile>) => undefined);

    await expect(facade.pickAndUpdateAvatar('camera', updateProfile)).resolves.toEqual({
      status: 'cancelled',
    });
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('converts profile update failures into an avatar error result', async () => {
    const { facade } = makeSubject({ status: 'selected', uri: 'file://avatar.jpg' });
    const error = new Error('profile write failed');
    const updateProfile = jest.fn(async (_patch: Partial<Profile>) => {
      throw error;
    });

    await expect(facade.pickAndUpdateAvatar('gallery', updateProfile)).resolves.toEqual({
      status: 'error',
      error,
    });
  });
});
