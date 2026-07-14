// Verifies useAppLifecycle preserves the initial-route decision logic and the splash/ready gating
// after extraction. Contexts and all side-effect services are mocked (no Firebase / native SDKs).

import { renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@shared/storage';

const mockAuth: { value: any } = { value: null };
const mockMonetization: { value: any } = { value: { isAdFree: false, isLoading: false } };

jest.mock('@features/auth', () => ({ useAuth: () => mockAuth.value }));
jest.mock('@features/monetization', () => ({ useMonetization: () => mockMonetization.value }));
jest.mock('@features/sync', () => ({ autoSync: jest.fn() }));
jest.mock('../../../../services/notificationService', () => ({
  getNotificationPermissionState: jest.fn(async () => ({ granted: false, canAskAgain: true, status: 'undetermined' })),
  handleNotificationResponse: jest.fn(async () => {}),
  hasSeenNotificationPermissionPrompt: jest.fn(async () => false),
  markNotificationPermissionPromptSeen: jest.fn(async () => {}),
  refillNotifications: jest.fn(async () => {}),
  processDeliveredNotifications: jest.fn(async () => {}),
  requestNotificationPermissions: jest.fn(async () => false),
  scheduleVocabularyNotifications: jest.fn(async () => {}),
  setLastForegroundTime: jest.fn(async () => {}),
  setLastBackgroundTime: jest.fn(async () => {}),
}));
jest.mock('../../../../services/adMobService', () => ({
  initializeAdMob: jest.fn(async () => false),
  checkAndShowAppOpenAd: jest.fn(async () => {}),
  refreshAdInventoryOnForeground: jest.fn(async () => {}),
}));
jest.mock('../../../../services/reviewPromptService', () => ({ recordReviewAppLaunch: jest.fn(async () => {}) }));
jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponseAsync: jest.fn(async () => null),
  clearLastNotificationResponseAsync: jest.fn(async () => {}),
}));

import { useAppLifecycle } from '../useAppLifecycle';

describe('useAppLifecycle — initial route decision', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    mockAuth.value = {
      user: null,
      userData: null,
      isLoading: false,
      connectionError: false,
      notificationSettings: { enabled: true },
    };
    mockMonetization.value = { isAdFree: false, isLoading: false };
  });

  it('starts on splash and exposes the expected shape', () => {
    const { result } = renderHook(() => useAppLifecycle());
    expect(result.current.showSplash).toBe(true);
    expect(result.current.isAppReady).toBe(false);
    expect(result.current.initialRoute).toBe('Onboarding');
    expect(result.current.navigationRef).toBeDefined();
    expect(typeof result.current.setShowSplash).toBe('function');
  });

  it('logged-out + first launch -> Onboarding, becomes ready', async () => {
    const { result } = renderHook(() => useAppLifecycle());
    await waitFor(() => expect(result.current.isAppReady).toBe(true));
    expect(result.current.initialRoute).toBe('Onboarding');
  });

  it('logged-out + onboarding already seen -> Login', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING, 'true');
    const { result } = renderHook(() => useAppLifecycle());
    await waitFor(() => expect(result.current.isAppReady).toBe(true));
    expect(result.current.initialRoute).toBe('Login');
  });

  it('signed-in + complete preferences -> MainTabs', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING, 'true');
    mockAuth.value = {
      ...mockAuth.value,
      user: { uid: 'user-1' },
      userData: {
        uid: 'user-1',
        email: 'user@example.com',
        setupCompleted: false,
        preferences: { nativeLanguage: 'turkish', targetLanguage: 'english', level: 'beginner' },
      },
    };
    const { result } = renderHook(() => useAppLifecycle());
    await waitFor(() => expect(result.current.isAppReady).toBe(true));
    expect(result.current.initialRoute).toBe('MainTabs');
  });

  it('signed-in + incomplete setup -> NativeLanguage', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING, 'true');
    mockAuth.value = {
      ...mockAuth.value,
      user: { uid: 'user-1' },
      userData: { uid: 'user-1', email: 'user@example.com', setupCompleted: false },
    };
    const { result } = renderHook(() => useAppLifecycle());
    await waitFor(() => expect(result.current.isAppReady).toBe(true));
    expect(result.current.initialRoute).toBe('NativeLanguage');
  });
});
