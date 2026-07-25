// Verifies useAppLifecycle preserves the initial-route decision logic and the splash/ready gating
// after extraction. Contexts and all side-effect services are mocked (no Firebase / native SDKs).

import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, type AppStateStatus } from 'react-native';
import { STORAGE_KEYS } from '@shared/storage';

const mockAuth: { value: any } = { value: null };
const mockMonetization: { value: any } = { value: { isAdFree: false, isLoading: false } };
const mockRescheduleNotifications = jest.fn(async () => {});
const mockSyncLanguageWithSystem = jest.fn(async () => ({
  language: 'en',
  changed: false,
}));

jest.mock('@features/auth', () => ({ useAuth: () => mockAuth.value }));
jest.mock('@shared/i18n', () => ({
  syncLanguageWithSystem: () => mockSyncLanguageWithSystem(),
}));
jest.mock('@features/monetization', () => ({
  useMonetization: () => mockMonetization.value,
  initializeAdMob: jest.fn(async () => false),
  checkAndShowAppOpenAd: jest.fn(async () => {}),
  refreshAdInventoryOnForeground: jest.fn(async () => {}),
}));
jest.mock('@features/sync', () => ({ autoSync: jest.fn() }));
jest.mock('@features/notifications', () => ({
  notificationFacade: {
    getPermissionState: jest.fn(async () => ({
      granted: false,
      canAskAgain: true,
      status: 'undetermined',
    })),
    handleResponse: jest.fn(async () => {}),
    hasSeenPermissionPrompt: jest.fn(async () => false),
    markPermissionPromptSeen: jest.fn(async () => {}),
    refill: jest.fn(async () => {}),
    processDelivered: jest.fn(async () => 0),
    requestPermission: jest.fn(async () => false),
    reschedule: () => mockRescheduleNotifications(),
    setForegroundTime: jest.fn(async () => {}),
    setBackgroundTime: jest.fn(async () => {}),
    addResponseListener: jest.fn(() => ({ remove: jest.fn() })),
    getLastResponse: jest.fn(async () => null),
    clearLastResponse: jest.fn(async () => {}),
  },
}));
jest.mock('@features/review', () => ({ recordReviewAppLaunch: jest.fn(async () => {}) }));
import { useAppLifecycle } from '../useAppLifecycle';

describe('useAppLifecycle — initial route decision', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockSyncLanguageWithSystem.mockResolvedValue({
      language: 'en',
      changed: false,
    });
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

  it('syncs the system language on resume and reschedules localized notifications', async () => {
    let appStateListener: ((state: AppStateStatus) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
      appStateListener = listener;
      return { remove: jest.fn() };
    });
    mockAuth.value = {
      ...mockAuth.value,
      user: { uid: 'user-1' },
      userData: {
        uid: 'user-1',
        email: 'user@example.com',
        setupCompleted: true,
        preferences: { nativeLanguage: 'turkish', targetLanguage: 'english', level: 'beginner' },
      },
    };

    renderHook(() => useAppLifecycle());
    await waitFor(() => expect(mockSyncLanguageWithSystem).toHaveBeenCalledTimes(1));
    mockSyncLanguageWithSystem.mockResolvedValueOnce({
      language: 'de',
      changed: true,
    });

    await act(async () => {
      appStateListener?.('background');
      appStateListener?.('active');
    });

    await waitFor(() => expect(mockSyncLanguageWithSystem).toHaveBeenCalledTimes(2));
    expect(mockRescheduleNotifications).toHaveBeenCalledTimes(1);
  });
});
