import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfileRepository } from '@features/profile';

const mockSaveNotificationSettings = jest.fn(
  async (_settings: unknown, _skipScheduling?: boolean) => undefined
);
const mockScheduleVocabularyNotifications = jest.fn(async () => undefined);
const mockGenerateVocabulary = jest.fn(
  async (_nativeLanguage: string, _targetLanguage: string) => undefined
);
const mockResetProgress = jest.fn(async () => undefined);
const mockSetCurrentLevel = jest.fn(async (_level: string) => undefined);

jest.mock('@features/notifications', () => ({
  getNotificationFrequencyMinutes: () => 120,
  getNotificationPermissionState: jest.fn(async () => ({ status: 'granted' })),
  requestNotificationPermissions: jest.fn(async () => true),
  saveNotificationSettings: (settings: unknown, skipScheduling?: boolean) =>
    mockSaveNotificationSettings(settings, skipScheduling),
  scheduleVocabularyNotifications: () => mockScheduleVocabularyNotifications(),
}));

jest.mock('@features/progress', () => ({
  resetProgress: () => mockResetProgress(),
  setCurrentLevel: (level: string) => mockSetCurrentLevel(level),
}));

jest.mock('@features/vocabulary', () => ({
  generateVocabulary: (nativeLanguage: string, targetLanguage: string) =>
    mockGenerateVocabulary(nativeLanguage, targetLanguage),
  getFirstLevelForUserLevel: () => 'A1',
}));

import { LegacySetupPlatformGateway } from '../LegacySetupPlatformGateway';

function makeProfileRepository(): UserProfileRepository {
  return {
    getCachedProfile: jest.fn(async () => null),
    cacheProfile: jest.fn(async () => undefined),
    fetchProfileFromRemote: jest.fn(async () => null),
    saveProfile: jest.fn(async () => undefined),
    saveSetupCompletion: jest.fn(async () => undefined),
    createUserDocument: jest.fn(async () => undefined),
    deleteUserDocument: jest.fn(async () => undefined),
  };
}

const input = {
  nativeLanguage: 'turkish',
  targetLanguage: 'english',
  level: 'beginner',
  user: {
    uid: 'user-1',
    email: 'bee@example.com',
    displayName: 'Bee',
  },
  notificationPermissionGranted: true,
  startHour: '09',
  startMinute: '00',
  endHour: '21',
  endMinute: '00',
  frequency: 'every2hours' as const,
};

describe('LegacySetupPlatformGateway', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('persists legacy local keys and delegates the remote payload to ProfileRepository', async () => {
    const profileRepository = makeProfileRepository();
    const gateway = new LegacySetupPlatformGateway(profileRepository);

    await gateway.persistCompletion(input);

    await expect(AsyncStorage.getItem('@user_level')).resolves.toBe('beginner');
    await expect(AsyncStorage.getItem('@profile_email')).resolves.toBe('bee@example.com');
    await expect(AsyncStorage.getItem('@profile_name')).resolves.toBe('Bee');
    expect(profileRepository.saveSetupCompletion).toHaveBeenCalledWith('user-1', {
      preferences: {
        nativeLanguage: 'turkish',
        targetLanguage: 'english',
        level: 'beginner',
      },
      initialLevel: 'A1',
      notificationSettings: {
        enabled: true,
        startHour: 9,
        startMinute: 0,
        endHour: 21,
        endMinute: 0,
        frequencyMinutes: 120,
        autoMarkLearned: true,
      },
    });
    expect(mockSaveNotificationSettings).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true, frequencyMinutes: 120 }),
      true
    );
  });

  it('generates vocabulary before resetting and selecting the initial level', async () => {
    const gateway = new LegacySetupPlatformGateway(makeProfileRepository());

    await gateway.prepareLearningContent(input);

    expect(mockGenerateVocabulary).toHaveBeenCalledWith('turkish', 'english');
    expect(mockResetProgress).toHaveBeenCalled();
    expect(mockSetCurrentLevel).toHaveBeenCalledWith('A1');
    expect(mockScheduleVocabularyNotifications).toHaveBeenCalled();
  });
});
