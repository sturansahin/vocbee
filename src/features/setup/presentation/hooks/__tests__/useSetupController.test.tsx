import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Animated } from 'react-native';

import type { SetupFacade } from '../../../application/setupContracts';
import { useSetupController } from '../useSetupController';

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockReset = jest.fn();
const mockShowAlert = jest.fn();
const mockRefreshNotificationSettings = jest.fn(async () => undefined);
const mockRouteParams: { detectedLevel?: string } = {};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: mockNavigate,
    reset: mockReset,
  }),
  useRoute: () => ({ params: mockRouteParams }),
}));

jest.mock('@features/notifications', () => ({
  DEFAULT_NOTIFICATION_FREQUENCY_KEY: 'every2hours',
}));

jest.mock('@features/auth', () => ({
  useAuth: () => ({
    user: {
      uid: 'user-1',
      email: 'vocbee@example.com',
      displayName: 'VocBee User',
    },
    refreshNotificationSettings: mockRefreshNotificationSettings,
  }),
}));

jest.mock('@shared/ui', () => ({
  useAlert: () => ({ showAlert: mockShowAlert }),
}));

function makeFacade(overrides: Partial<SetupFacade> = {}): SetupFacade {
  return {
    getNotificationPermissionGranted: jest.fn(async () => false),
    requestNotificationPermission: jest.fn(async () => true),
    openSystemSettings: jest.fn(async () => undefined),
    complete: jest.fn(async () => undefined),
    ...overrides,
  };
}

describe('useSetupController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete mockRouteParams.detectedLevel;
    jest.spyOn(Animated, 'timing').mockImplementation(
      () =>
        ({
          start: (callback?: Animated.EndCallback) => callback?.({ finished: true }),
          stop: jest.fn(),
          reset: jest.fn(),
        }) as never,
    );
    jest.spyOn(Animated, 'spring').mockImplementation(
      () =>
        ({
          start: (callback?: Animated.EndCallback) => callback?.({ finished: true }),
          stop: jest.fn(),
          reset: jest.fn(),
        }) as never,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('walks the successful setup flow and persists the selected values', async () => {
    const facade = makeFacade();
    const { result, unmount } = renderHook(() => useSetupController(facade));

    await waitFor(() => {
      expect(facade.getNotificationPermissionGranted).toHaveBeenCalledTimes(1);
    });

    act(() => result.current.setNativeLanguage('turkish'));
    await act(async () => result.current.handleNext());
    expect(result.current.currentStep).toBe(2);

    act(() => result.current.setTargetLanguage('english'));
    await act(async () => result.current.handleNext());
    expect(result.current.currentStep).toBe(3);

    act(() => result.current.setLevel('beginner'));
    await act(async () => result.current.handleNext());
    expect(result.current.currentStep).toBe(4);

    await act(async () => result.current.handleNext());
    expect(result.current.currentStep).toBe(5);

    await act(async () => result.current.handleNext());

    expect(facade.complete).toHaveBeenCalledWith(
      expect.objectContaining({
        nativeLanguage: 'turkish',
        targetLanguage: 'english',
        level: 'beginner',
        notificationPermissionGranted: true,
        startHour: '09',
        startMinute: '00',
        endHour: '21',
        endMinute: '00',
        frequency: 'every2hours',
        user: {
          uid: 'user-1',
          email: 'vocbee@example.com',
          displayName: 'VocBee User',
        },
      }),
      mockRefreshNotificationSettings,
    );
    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });

    unmount();
  });

  it('offers a continue-without-notifications fallback when permission is denied', async () => {
    const facade = makeFacade({
      requestNotificationPermission: jest.fn(async () => false),
    });
    const { result, unmount } = renderHook(() => useSetupController(facade));

    act(() => result.current.setNativeLanguage('turkish'));
    await act(async () => result.current.handleNext());
    act(() => result.current.setTargetLanguage('english'));
    await act(async () => result.current.handleNext());
    act(() => result.current.setLevel('beginner'));
    await act(async () => result.current.handleNext());
    await act(async () => result.current.handleNext());

    expect(mockShowAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'setup.notificationsDisabled',
        message: 'setup.notificationsDisabledDesc',
        buttons: expect.any(Array),
      }),
    );

    const alert = mockShowAlert.mock.calls[0][0];
    await act(async () => alert.buttons[1].onPress());

    await waitFor(() => {
      expect(facade.complete).toHaveBeenCalledWith(
        expect.objectContaining({ notificationPermissionGranted: false }),
        mockRefreshNotificationSettings,
      );
    });

    unmount();
  });

  it('uses the requested schedule defaults and updates combined time fields', () => {
    const facade = makeFacade();
    const { result, unmount } = renderHook(() => useSetupController(facade));

    expect(result.current.startTime).toBe('09:00');
    expect(result.current.endTime).toBe('21:00');
    expect(result.current.frequency).toBe('every2hours');

    act(() => {
      result.current.setStartTime('10:00');
      result.current.setEndTime('20:00');
      result.current.setFrequency('every3hours');
    });

    expect(result.current.startTime).toBe('10:00');
    expect(result.current.endTime).toBe('20:00');
    expect(result.current.frequency).toBe('every3hours');

    unmount();
  });
});
