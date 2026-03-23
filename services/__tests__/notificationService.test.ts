import AsyncStorage from '@react-native-async-storage/async-storage';

const mockGetPermissionsAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockSetNotificationChannelAsync = jest.fn();
const mockCancelAllScheduledNotificationsAsync = jest.fn();
const mockScheduleNotificationAsync = jest.fn();
const mockGetAllScheduledNotificationsAsync = jest.fn();

jest.mock('expo-notifications', () => ({
    getPermissionsAsync: (...args: unknown[]) => mockGetPermissionsAsync(...args),
    requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissionsAsync(...args),
    setNotificationChannelAsync: (...args: unknown[]) => mockSetNotificationChannelAsync(...args),
    cancelAllScheduledNotificationsAsync: (...args: unknown[]) => mockCancelAllScheduledNotificationsAsync(...args),
    scheduleNotificationAsync: (...args: unknown[]) => mockScheduleNotificationAsync(...args),
    getAllScheduledNotificationsAsync: (...args: unknown[]) => mockGetAllScheduledNotificationsAsync(...args),
    setNotificationHandler: jest.fn(),
    AndroidImportance: { HIGH: 'HIGH' },
    SchedulableTriggerInputTypes: { TIME_INTERVAL: 'TIME_INTERVAL' },
}));

jest.mock('../vocabularyService', () => ({
    LEVELS: [],
    getStoredVocabulary: jest.fn(),
}));

jest.mock('../progressService', () => ({
    getCurrentLevel: jest.fn(),
    markWordAsLearned: jest.fn(),
    unmarkWord: jest.fn(),
    getLearnedWords: jest.fn(),
}));

jest.mock('../i18n', () => ({
    __esModule: true,
    default: {
        t: jest.fn(() => 'tap to see examples'),
    },
}));

import { getStoredVocabulary } from '../vocabularyService';
import { getCurrentLevel, getLearnedWords } from '../progressService';
import {
    requestNotificationPermissions,
    scheduleVocabularyNotifications,
} from '../notificationService';
import { STORAGE_KEYS } from '../storageKeys';

describe('notificationService', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await AsyncStorage.clear();

        mockGetAllScheduledNotificationsAsync.mockResolvedValue([]);
        mockCancelAllScheduledNotificationsAsync.mockResolvedValue(undefined);
        mockSetNotificationChannelAsync.mockResolvedValue(undefined);
        mockScheduleNotificationAsync.mockResolvedValue('notification-id');

        (getCurrentLevel as jest.Mock).mockResolvedValue('A1');
        (getLearnedWords as jest.Mock).mockResolvedValue([]);
        (getStoredVocabulary as jest.Mock).mockResolvedValue([
            { id: 1, word: 'hello', translation: 'merhaba' },
            { id: 2, word: 'world', translation: 'dunya' },
        ]);
    });

    it('does not re-request permission when the system prompt is unavailable', async () => {
        mockGetPermissionsAsync.mockResolvedValue({
            status: 'denied',
            granted: false,
            canAskAgain: false,
            expires: 'never',
        });

        const granted = await requestNotificationPermissions();

        expect(granted).toBe(false);
        expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('requests permission when status is undetermined', async () => {
        mockGetPermissionsAsync.mockResolvedValue({
            status: 'undetermined',
            granted: false,
            canAskAgain: true,
            expires: 'never',
        });
        mockRequestPermissionsAsync.mockResolvedValue({
            status: 'granted',
        });

        const granted = await requestNotificationPermissions();

        expect(granted).toBe(true);
        expect(mockRequestPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    it('skips scheduling and clears tracked state when permission is missing', async () => {
        mockGetPermissionsAsync.mockResolvedValue({
            status: 'denied',
            granted: false,
            canAskAgain: false,
            expires: 'never',
        });
        await AsyncStorage.setItem(
            STORAGE_KEYS.NOTIFICATION_SETTINGS,
            JSON.stringify({ enabled: true })
        );
        await AsyncStorage.setItem(
            STORAGE_KEYS.TRACKED_NOTIFICATIONS,
            JSON.stringify([{ notificationId: 'stale-id' }])
        );

        await scheduleVocabularyNotifications();

        expect(mockCancelAllScheduledNotificationsAsync).toHaveBeenCalled();
        expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
        expect(await AsyncStorage.getItem(STORAGE_KEYS.TRACKED_NOTIFICATIONS)).toBeNull();
    });

    it('schedules notifications when permission and prerequisites are present', async () => {
        mockGetPermissionsAsync.mockResolvedValue({
            status: 'granted',
            granted: true,
            canAskAgain: true,
            expires: 'never',
        });
        await AsyncStorage.setItem(
            STORAGE_KEYS.NOTIFICATION_SETTINGS,
            JSON.stringify({
                enabled: true,
                startHour: 9,
                startMinute: 0,
                endHour: 21,
                endMinute: 0,
                frequencyMinutes: 120,
                autoMarkLearned: true,
            })
        );
        await AsyncStorage.setItem(STORAGE_KEYS.TARGET_LANGUAGE, 'en');

        await scheduleVocabularyNotifications();

        expect(mockScheduleNotificationAsync).toHaveBeenCalled();
        expect(mockCancelAllScheduledNotificationsAsync).toHaveBeenCalled();
        expect(await AsyncStorage.getItem(STORAGE_KEYS.TRACKED_NOTIFICATIONS)).not.toBeNull();
    });
});
