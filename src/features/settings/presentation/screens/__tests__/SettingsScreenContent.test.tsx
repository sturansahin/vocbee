import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { SettingsFacade } from '../../../application/contracts';
import SettingsScreenContent from '../SettingsScreenContent';

const mockGoBack = jest.fn();
const mockReset = jest.fn();
const mockShowAlert = jest.fn();
const mockUpdateProfileData = jest.fn(async () => undefined);
const mockUpdateNotificationSettings = jest.fn(async () => undefined);

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    reset: mockReset,
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  Ionicons: 'Ionicons',
  Feather: 'Feather',
}));

jest.mock('@expo/vector-icons/FontAwesome5', () => 'FontAwesome5');

jest.mock('../../components/AnimatedSwitch', () => ({
  AnimatedSwitch: () => null,
}));

jest.mock('@shared/theme', () => ({
  COLORS: {
    background: '#ffffff',
    surface: '#ffffff',
    text: '#111111',
    textSecondary: '#666666',
    primary: '#f7b500',
  },
  FONT_FAMILY: 'System',
  useTheme: () => ({
    isDarkMode: false,
    colors: {
      background: '#ffffff',
      surface: '#ffffff',
      surfaceLight: '#f5f5f5',
      text: '#111111',
      textSecondary: '#666666',
      primary: '#f7b500',
      border: '#dddddd',
      error: '#cc0000',
    },
  }),
}));

jest.mock('@shared/ui', () => ({
  useAlert: () => ({ showAlert: mockShowAlert }),
}));

jest.mock('@shared/i18n', () => ({
  LANGUAGES: [{ id: 'english', code: 'en', name: 'English', nativeName: 'English', flagIcon: 1 }],
  LEVELS: [
    { id: 'beginner', range: 'A1-A2' },
    { id: 'intermediate', range: 'B1-B2' },
    { id: 'advanced', range: 'C1' },
  ],
}));

jest.mock('@features/notifications', () => ({
  NOTIFICATION_FREQUENCY_KEYS: [
    'every1hour',
    'every2hours',
    'every3hours',
    'every6hours',
    'onceDaily',
  ],
  getNotificationFrequencyKey: (minutes: number) => (minutes === 60 ? 'every1hour' : 'every2hours'),
  getNotificationFrequencyMinutes: (key: string) => (key === 'every1hour' ? 60 : 120),
}));

jest.mock('@features/auth', () => ({
  useAuth: () => ({
    signOut: jest.fn(async () => undefined),
    deleteAccount: jest.fn(async () => undefined),
    user: { uid: 'user-1' },
    profile: {
      name: 'VocBee User',
      email: 'vocbee@example.com',
      image: null,
    },
    updateProfileData: mockUpdateProfileData,
    notificationSettings: {
      enabled: true,
      startHour: 9,
      startMinute: 0,
      endHour: 21,
      endMinute: 0,
      frequencyMinutes: 120,
      autoMarkLearned: true,
    },
    updateNotificationSettings: mockUpdateNotificationSettings,
  }),
}));

jest.mock('@features/monetization', () => ({
  useMonetization: () => ({
    isAdFree: false,
    isLoading: false,
    activeEntitlement: null,
    presentRemoveAdsPaywall: jest.fn(async () => false),
    restorePurchases: jest.fn(async () => false),
    openCustomerCenter: jest.fn(async () => undefined),
  }),
}));

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function makeFacade(overrides: Partial<SettingsFacade> = {}): SettingsFacade {
  return {
    getAppVersion: jest.fn(() => '1.0.0'),
    loadUserLevel: jest.fn(async () => 'beginner'),
    changeUserLevel: jest.fn(async () => undefined),
    pickAndUpdateAvatar: jest.fn(async () => ({ status: 'cancelled' as const })),
    updateProfileName: jest.fn(async () => 'updated'),
    requestNotificationPermission: jest.fn(async () => true),
    openSystemSettings: jest.fn(async () => undefined),
    openPrivacyPolicy: jest.fn(async () => undefined),
    openStoreReview: jest.fn(async () => ({ opened: true })),
    getSelectedLanguage: jest.fn(() => 'en'),
    getDeviceLanguage: jest.fn(() => 'en'),
    isUsingSystemLanguage: jest.fn(async () => false),
    useSystemLanguage: jest.fn(async () => 'en'),
    changeLanguage: jest.fn(async () => undefined),
    resetForLanguageChange: jest.fn(async () => undefined),
    resetLearningProgress: jest.fn(async () => undefined),
    ...overrides,
  };
}

function renderScreen(facade: SettingsFacade) {
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <SettingsScreenContent facade={facade} />
    </SafeAreaProvider>,
  );
}

describe('SettingsScreenContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders profile, notification, progress, support, and version content', async () => {
    const facade = makeFacade();
    const { getByText } = renderScreen(facade);

    expect(getByText('settings.title')).toBeTruthy();
    expect(getByText('VocBee User')).toBeTruthy();
    expect(getByText('vocbee@example.com')).toBeTruthy();
    expect(getByText('settings.dailyReminder')).toBeTruthy();
    expect(getByText('settings.progress')).toBeTruthy();
    expect(getByText('settings.support')).toBeTruthy();
    expect(getByText('VocBee v1.0.0')).toBeTruthy();

    await waitFor(() => {
      expect(facade.loadUserLevel).toHaveBeenCalledTimes(1);
      expect(facade.isUsingSystemLanguage).toHaveBeenCalledTimes(1);
    });
  });

  it('delegates support actions and profile name updates to the facade', async () => {
    const facade = makeFacade();
    const { getByText, getByPlaceholderText } = renderScreen(facade);

    fireEvent.press(getByText('settings.rateVocBee'));
    fireEvent.press(getByText('settings.privacyPolicy'));

    await waitFor(() => {
      expect(facade.openStoreReview).toHaveBeenCalledTimes(1);
      expect(facade.openPrivacyPolicy).toHaveBeenCalledTimes(1);
    });

    fireEvent.press(getByText('settings.editProfile'));
    fireEvent.changeText(getByPlaceholderText('settings.namePlaceholder'), 'Updated Name');
    fireEvent.press(getByText('common.save'));

    await waitFor(() => {
      expect(facade.updateProfileName).toHaveBeenCalledWith('Updated Name', mockUpdateProfileData);
      expect(mockShowAlert).toHaveBeenCalledWith({
        title: 'common.success',
        message: 'settings.profileUpdated',
      });
    });
  });
});
