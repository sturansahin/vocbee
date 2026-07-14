import AsyncStorage from '@react-native-async-storage/async-storage';

const mockGetPermissionsAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockSetNotificationChannelAsync = jest.fn();
const mockCancelAllScheduledNotificationsAsync = jest.fn();
const mockCancelScheduledNotificationAsync = jest.fn();
const mockScheduleNotificationAsync = jest.fn();
const mockGetAllScheduledNotificationsAsync = jest.fn();

jest.mock('expo-notifications', () => ({
    getPermissionsAsync: (...args: unknown[]) => mockGetPermissionsAsync(...args),
    requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissionsAsync(...args),
    setNotificationChannelAsync: (...args: unknown[]) => mockSetNotificationChannelAsync(...args),
    cancelAllScheduledNotificationsAsync: (...args: unknown[]) => mockCancelAllScheduledNotificationsAsync(...args),
    cancelScheduledNotificationAsync: (...args: unknown[]) => mockCancelScheduledNotificationAsync(...args),
    scheduleNotificationAsync: (...args: unknown[]) => mockScheduleNotificationAsync(...args),
    getAllScheduledNotificationsAsync: (...args: unknown[]) => mockGetAllScheduledNotificationsAsync(...args),
    setNotificationHandler: jest.fn(),
    AndroidImportance: { HIGH: 'HIGH' },
    SchedulableTriggerInputTypes: { TIME_INTERVAL: 'TIME_INTERVAL' },
}));

jest.mock('@features/vocabulary', () => ({
    LEVELS: [],
    getStoredVocabulary: jest.fn(),
}));

jest.mock('@features/progress', () => ({
    getCurrentLevel: jest.fn(),
    markWordAsLearned: jest.fn(),
    unmarkWord: jest.fn(),
    getLearnedWords: jest.fn(),
}));

jest.mock('../i18n', () => ({
    __esModule: true,
    default: {
        t: jest.fn((key: string) => ({
            'home.tapToSeeExamples': 'tap to see examples',
            'notifications.streakReminderTitle': 'Keep your streak alive',
            'notifications.streakReminderBody': 'Swipe one word before the day ends',
        }[key] ?? key)),
    },
}));

import { getStoredVocabulary } from '@features/vocabulary';
import { getCurrentLevel, getLearnedWords } from '@features/progress';
import {
    MAX_VOCABULARY_NOTIFICATIONS,
    getNotificationContent,
    requestNotificationPermissions,
    scheduleStreakReminderNotification,
    scheduleVocabularyNotifications,
    setPendingNotificationWord,
    getPendingNotificationWord,
    clearPendingNotificationWord,
} from '../notificationService';
import { STORAGE_KEYS } from '@shared/storage';

describe('notificationService', () => {
    beforeEach(async () => {
        jest.useRealTimers();
        jest.clearAllMocks();
        await AsyncStorage.clear();

        mockGetAllScheduledNotificationsAsync.mockResolvedValue([]);
        mockCancelAllScheduledNotificationsAsync.mockResolvedValue(undefined);
        mockCancelScheduledNotificationAsync.mockResolvedValue(undefined);
        mockSetNotificationChannelAsync.mockResolvedValue(undefined);
        mockScheduleNotificationAsync.mockResolvedValue('notification-id');

        (getCurrentLevel as jest.Mock).mockResolvedValue('A1');
        (getLearnedWords as jest.Mock).mockResolvedValue([]);
        (getStoredVocabulary as jest.Mock).mockResolvedValue([
            { id: 1, word: 'hello', pronunciation: '/həˈloʊ/', translation: 'merhaba' },
            { id: 2, word: 'world', translation: 'dunya' },
        ]);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('formats notification body without pronunciation', () => {
        expect(
            getNotificationContent({
                id: 1,
                word: 'hello',
                pronunciation: '/həˈloʊ/',
                translation: 'merhaba',
                sentence1: '',
                sentence2: '',
                nativeSentence1: '',
                nativeSentence2: '',
            }).body
        ).toBe('hello - merhaba, tap to see examples');

        expect(
            getNotificationContent({
                id: 2,
                word: 'world',
                translation: 'dunya',
                sentence1: '',
                sentence2: '',
                nativeSentence1: '',
                nativeSentence2: '',
            }).body
        ).toBe('world - dunya, tap to see examples');
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
        (getStoredVocabulary as jest.Mock).mockResolvedValue([
            { id: 1, word: 'hello', pronunciation: '/həˈloʊ/', translation: 'merhaba' },
        ]);

        await scheduleVocabularyNotifications();

        expect(mockScheduleNotificationAsync).toHaveBeenCalled();
        expect(mockCancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
        expect(await AsyncStorage.getItem(STORAGE_KEYS.TRACKED_NOTIFICATIONS)).not.toBeNull();
        const scheduledPayload = mockScheduleNotificationAsync.mock.calls
            .map(call => call[0])
            .find(payload => payload.content.data.kind === 'vocabulary')!;
        expect(scheduledPayload).toBeTruthy();
        expect(scheduledPayload.content.body).toBe('hello - merhaba, tap to see examples');
        expect(scheduledPayload.content.data.pronunciation).toBe('/həˈloʊ/');
    });
    it('reserves one notification slot for the streak reminder', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date(2026, 3, 12, 0, 0, 0));

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
                startHour: 0,
                startMinute: 0,
                endHour: 0,
                endMinute: 0,
                frequencyMinutes: 60,
                autoMarkLearned: true,
            })
        );
        await AsyncStorage.setItem(STORAGE_KEYS.TARGET_LANGUAGE, 'en');
        (getStoredVocabulary as jest.Mock).mockResolvedValue(
            Array.from({ length: 100 }, (_, index) => ({
                id: index + 1,
                word: `word-${index + 1}`,
                translation: `translation-${index + 1}`,
            }))
        );

        await scheduleVocabularyNotifications();

        const scheduledPayloads = mockScheduleNotificationAsync.mock.calls.map(call => call[0]);
        expect(scheduledPayloads.filter(payload => payload.content.data.kind === 'vocabulary')).toHaveLength(
            MAX_VOCABULARY_NOTIFICATIONS
        );
        expect(scheduledPayloads.filter(payload => payload.content.data.kind === 'streak')).toHaveLength(1);
        expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(64);

        jest.useRealTimers();
    });

    it('moves the streak reminder to tomorrow when today is already complete', async () => {
        const now = new Date(2026, 3, 12, 12, 0, 0);
        mockGetPermissionsAsync.mockResolvedValue({
            status: 'granted',
            granted: true,
            canAskAgain: true,
            expires: 'never',
        });
        await AsyncStorage.setItem(
            STORAGE_KEYS.NOTIFICATION_SETTINGS,
            JSON.stringify({ enabled: true })
        );
        await AsyncStorage.setItem(
            STORAGE_KEYS.STREAK,
            JSON.stringify({
                currentStreak: 1,
                longestStreak: 1,
                brokenStreak: null,
                lastQualifiedDay: '2026-04-12',
                lastQualifiedAt: now.toISOString(),
            })
        );

        await scheduleStreakReminderNotification(now);

        const scheduledPayload = mockScheduleNotificationAsync.mock.calls[0][0];
        expect(scheduledPayload.identifier).toBe('vocbee-streak-reminder');
        expect(scheduledPayload.content.data.kind).toBe('streak');
        expect(scheduledPayload.trigger.seconds).toBe(33 * 60 * 60);
    });

    // ADIM 6 (PR-6.5): pending-notification-word functions now delegate to
    // PendingWordRepository (src/features/notifications/data/repositories). These tests confirm the
    // PUBLIC API (function names/behavior) is unchanged after the delegation, using the real
    // (non-mocked) AsyncStorage + the exact storage key.
    describe('pending notification word (delegated to PendingWordRepository)', () => {
        it('round-trips a word through set -> get -> clear using the real storage key', async () => {
            await setPendingNotificationWord({ wordId: 42, level: 'A1', targetLanguage: 'english' });

            const raw = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_NOTIFICATION_WORD);
            expect(raw).toBe(JSON.stringify({ wordId: 42, level: 'A1', targetLanguage: 'english' }));

            const pending = await getPendingNotificationWord();
            expect(pending).toEqual({ wordId: 42, level: 'A1', targetLanguage: 'english' });

            await clearPendingNotificationWord();
            expect(await getPendingNotificationWord()).toBeNull();
        });

        it('getPendingNotificationWord does not clear the stored value', async () => {
            await setPendingNotificationWord({ wordId: 7 });
            await getPendingNotificationWord();
            expect(await AsyncStorage.getItem(STORAGE_KEYS.PENDING_NOTIFICATION_WORD)).not.toBeNull();
        });

        it('returns null when nothing is pending', async () => {
            expect(await getPendingNotificationWord()).toBeNull();
        });

        it('still parses a legacy plain-numeric-string payload written by an old app version', async () => {
            await AsyncStorage.setItem(STORAGE_KEYS.PENDING_NOTIFICATION_WORD, '123');
            expect(await getPendingNotificationWord()).toEqual({ wordId: 123 });
        });

        it('clearPendingNotificationWord does not throw when nothing is stored', async () => {
            await expect(clearPendingNotificationWord()).resolves.toBeUndefined();
        });
    });
});
