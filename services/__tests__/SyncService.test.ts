// file: services/__tests__/SyncService.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock storage module first
jest.mock('../storage', () => ({
    needsSync: jest.fn(),
    getLastSyncTime: jest.fn(),
    setLastSyncTime: jest.fn(),
    clearSyncFlag: jest.fn(),
    getDeviceId: jest.fn(() => Promise.resolve('test-device-id')),
    saveUserDataLocally: jest.fn(),
}));

// Mock Firebase
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    setDoc: jest.fn(),
    getDoc: jest.fn(),
    serverTimestamp: jest.fn(() => 'mock-timestamp'),
}));

jest.mock('../../config/firebase', () => ({
    db: {},
}));

// Mock progressService
jest.mock('../progressService', () => ({
    getUserProgress: jest.fn(),
    getCurrentLevel: jest.fn(),
    restoreProgressFromFirebase: jest.fn(),
    getLastWordId: jest.fn(),
}));

// Mock favoritesService
jest.mock('../favoritesService', () => ({
    restoreFavoritesFromFirebase: jest.fn(),
    syncFavoritesToFirebase: jest.fn(),
    syncFavoritesToFirebaseForUser: jest.fn(),
}));

// Mock vocabularyService
jest.mock('../vocabularyService', () => ({
    getLanguagePair: jest.fn(),
    isVocabularyGenerated: jest.fn(),
    generateVocabulary: jest.fn(),
    getUserLevelFromCefrLevel: jest.fn(() => 'beginner'),
    isUserLevel: jest.fn(() => true),
}));

jest.mock('../notificationService', () => ({
    getNotificationSettings: jest.fn(),
    saveNotificationSettings: jest.fn(),
}));

jest.mock('../streakService', () => ({
    getStreakState: jest.fn(() => Promise.resolve({
        currentStreak: 3,
        longestStreak: 5,
        brokenStreak: null,
        lastQualifiedDay: '2026-04-12',
        lastQualifiedAt: '2026-04-12T09:00:00.000Z',
    })),
    restoreStreakState: jest.fn(),
}));

// Import after mocks
import {
    shouldSync,
    syncToFirestore,
    createUserDocument,
    getActiveDeviceIdFromFirebase,
    fetchAndSaveUserData,
    syncAuthProfileToFirestore,
    syncNotificationSettingsToFirestore,
} from '../SyncService';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { needsSync, getLastSyncTime, setLastSyncTime, clearSyncFlag } from '../storage';
import { getUserProgress, getCurrentLevel, restoreProgressFromFirebase, getLastWordId } from '../progressService';
import { restoreFavoritesFromFirebase, syncFavoritesToFirebaseForUser } from '../favoritesService';
import { getLanguagePair } from '../vocabularyService';
import { getNotificationSettings, saveNotificationSettings } from '../notificationService';
import { restoreStreakState } from '../streakService';
import { STORAGE_KEYS } from '../storageKeys';

describe('SyncService', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await AsyncStorage.clear();
        (doc as jest.Mock).mockReturnValue('doc-ref');
        // Reset storage mocks
        (needsSync as jest.Mock).mockResolvedValue(false);
        (getLastSyncTime as jest.Mock).mockResolvedValue(null);
        (getUserProgress as jest.Mock).mockResolvedValue({});
        (getCurrentLevel as jest.Mock).mockResolvedValue('A1');
        (getLastWordId as jest.Mock).mockResolvedValue(null);
        (getLanguagePair as jest.Mock).mockResolvedValue({
            native: 'turkish',
            target: 'english',
        });
        (getNotificationSettings as jest.Mock).mockResolvedValue(null);
        (syncFavoritesToFirebaseForUser as jest.Mock).mockResolvedValue(undefined);
    });

    describe('shouldSync', () => {
        it('returns false when no changes need syncing', async () => {
            (needsSync as jest.Mock).mockResolvedValue(false);

            const result = await shouldSync();

            expect(result).toBe(false);
        });

        it('returns true when changes exist and no last sync', async () => {
            (needsSync as jest.Mock).mockResolvedValue(true);
            (getLastSyncTime as jest.Mock).mockResolvedValue(null);

            const result = await shouldSync();

            expect(result).toBe(true);
        });

        it('returns true when last sync was more than 24 hours ago', async () => {
            (needsSync as jest.Mock).mockResolvedValue(true);
            const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000);
            (getLastSyncTime as jest.Mock).mockResolvedValue(oldDate);

            const result = await shouldSync();

            expect(result).toBe(true);
        });

        it('returns false when last sync was within the mutation debounce window', async () => {
            (needsSync as jest.Mock).mockResolvedValue(true);
            const recentDate = new Date(Date.now() - 1 * 60 * 1000);
            (getLastSyncTime as jest.Mock).mockResolvedValue(recentDate);

            const result = await shouldSync();

            expect(result).toBe(false);
        });
    });

    describe('syncToFirestore', () => {
        it('clears sync state only after all sync domains succeed', async () => {
            (setDoc as jest.Mock).mockResolvedValue(undefined);

            const result = await syncToFirestore('user123');

            expect(result).toBe(true);
            expect(setDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    progress: expect.objectContaining({
                        currentLevel: 'A1',
                        learnedWords: {},
                    }),
                    syncMeta: expect.objectContaining({
                        version: 1,
                        updatedByDeviceId: 'test-device-id',
                    }),
                }),
                { merge: true }
            );
            expect(syncFavoritesToFirebaseForUser).toHaveBeenCalledWith('user123', 'test-device-id');
            expect(setLastSyncTime).toHaveBeenCalled();
            expect(clearSyncFlag).toHaveBeenCalled();
        });

        it('does not clear sync state when favorites sync fails', async () => {
            const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
                callback();
                return 0 as any;
            });
            (setDoc as jest.Mock).mockResolvedValue(undefined);
            (syncFavoritesToFirebaseForUser as jest.Mock).mockRejectedValue(new Error('favorites failed'));

            const result = await syncToFirestore('user123');

            expect(result).toBe(false);
            expect(setLastSyncTime).not.toHaveBeenCalled();
            expect(clearSyncFlag).not.toHaveBeenCalled();
            setTimeoutSpy.mockRestore();
        });
    });

    describe('createUserDocument', () => {
        beforeEach(() => {
            (setDoc as jest.Mock).mockResolvedValue(undefined);
        });

        it('creates new user document when not exists', async () => {
            (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => false });

            await createUserDocument('user123', 'test@example.com', 'Test User', 'https://image.example/test.png');

            expect(setDoc).toHaveBeenCalled();
            const callArgs = (setDoc as jest.Mock).mock.calls[0][1];
            expect(callArgs).toMatchObject({
                email: 'test@example.com',
                displayName: 'Test User',
                photoURL: 'https://image.example/test.png',
                setupCompleted: false,
                preferences: null,
                progress: null,
                streak: null,
            });
        });

        it('does not create document when already exists', async () => {
            (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true });

            await createUserDocument('user123', 'test@example.com');

            expect(setDoc).not.toHaveBeenCalled();
        });

        it('handles empty display name', async () => {
            (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => false });

            await createUserDocument('user123', 'test@example.com');

            expect(setDoc).toHaveBeenCalled();
            const callArgs = (setDoc as jest.Mock).mock.calls[0][1];
            expect(callArgs.displayName).toBe('');
        });

        it('throws error on Firestore failure', async () => {
            (getDoc as jest.Mock).mockRejectedValueOnce(new Error('Firestore error'));

            await expect(
                createUserDocument('user123', 'test@example.com')
            ).rejects.toThrow('Firestore error');
        });
    });

    describe('getActiveDeviceIdFromFirebase', () => {
        it('returns device ID when exists', async () => {
            (getDoc as jest.Mock).mockResolvedValueOnce({
                exists: () => true,
                data: () => ({ lastActiveDeviceId: 'device_abc123' }),
            });

            const result = await getActiveDeviceIdFromFirebase('user123');

            expect(result).toBe('device_abc123');
        });

        it('returns null when user doc does not exist', async () => {
            (getDoc as jest.Mock).mockResolvedValueOnce({
                exists: () => false,
            });

            const result = await getActiveDeviceIdFromFirebase('user123');

            expect(result).toBeNull();
        });

        it('returns null when device ID not set', async () => {
            (getDoc as jest.Mock).mockResolvedValueOnce({
                exists: () => true,
                data: () => ({}),
            });

            const result = await getActiveDeviceIdFromFirebase('user123');

            expect(result).toBeNull();
        });

        it('returns null on error', async () => {
            (getDoc as jest.Mock).mockRejectedValueOnce(new Error('Error'));

            const result = await getActiveDeviceIdFromFirebase('user123');

            expect(result).toBeNull();
        });
    });

    describe('fetchAndSaveUserData', () => {
        it('restores notification settings from Firebase when present', async () => {
            (getDoc as jest.Mock).mockResolvedValueOnce({
                exists: () => true,
                data: () => ({
                    email: 'test@example.com',
                    displayName: 'Test User',
                    setupCompleted: true,
                    preferences: {
                        nativeLanguage: 'tr',
                        targetLanguage: 'en',
                        level: 'beginner',
                    },
                    progress: {
                        learnedWords: {},
                        currentLevel: 'A1',
                        lastWordIndex: 0,
                    },
                    notificationSettings: {
                        enabled: true,
                        startHour: 8,
                        startMinute: 30,
                        endHour: 20,
                        endMinute: 0,
                        frequencyMinutes: 120,
                        autoMarkLearned: false,
                    },
                    streak: {
                        currentStreak: 4,
                        longestStreak: 7,
                        brokenStreak: null,
                        lastQualifiedDay: '2026-04-12',
                        lastQualifiedAt: '2026-04-12T09:00:00.000Z',
                    },
                }),
            });

            const result = await fetchAndSaveUserData('user123');

            expect(result).toMatchObject({
                uid: 'user123',
                email: 'test@example.com',
                setupCompleted: true,
            });
            expect(saveNotificationSettings).toHaveBeenCalledWith({
                enabled: true,
                startHour: 8,
                startMinute: 30,
                endHour: 20,
                endMinute: 0,
                frequencyMinutes: 120,
                autoMarkLearned: false,
            }, true);
            expect(restoreStreakState).toHaveBeenCalledWith({
                currentStreak: 4,
                longestStreak: 7,
                brokenStreak: null,
                lastQualifiedDay: '2026-04-12',
                lastQualifiedAt: '2026-04-12T09:00:00.000Z',
            });
        });

        it('preserves existing profile values when firestore profile fields are empty', async () => {
            await AsyncStorage.setItem(
                `${STORAGE_KEYS.PROFILE_PREFIX}user123`,
                JSON.stringify({
                    name: 'Existing User',
                    image: 'https://image.example/existing.png',
                    email: 'test@example.com',
                })
            );

            (getDoc as jest.Mock).mockResolvedValueOnce({
                exists: () => true,
                data: () => ({
                    email: 'test@example.com',
                    displayName: '',
                    setupCompleted: false,
                    preferences: null,
                    progress: null,
                }),
            });

            await fetchAndSaveUserData('user123');

            const storedProfile = await AsyncStorage.getItem(`${STORAGE_KEYS.PROFILE_PREFIX}user123`);
            expect(JSON.parse(storedProfile || '{}')).toMatchObject({
                name: 'Existing User',
                image: 'https://image.example/existing.png',
                email: 'test@example.com',
            });
        });

        it('does not overwrite local domain data when local changes are unsynced', async () => {
            (needsSync as jest.Mock).mockResolvedValue(true);
            (getDoc as jest.Mock).mockResolvedValueOnce({
                exists: () => true,
                data: () => ({
                    email: 'test@example.com',
                    displayName: 'Test User',
                    setupCompleted: true,
                    preferences: {
                        nativeLanguage: 'turkish',
                        targetLanguage: 'english',
                        level: 'beginner',
                    },
                    progress: {
                        learnedWords: { A1: [1] },
                        currentLevel: 'A1',
                        lastWordIndex: 1,
                    },
                    notificationSettings: {
                        enabled: true,
                        startHour: 8,
                        startMinute: 0,
                        endHour: 20,
                        endMinute: 0,
                        frequencyMinutes: 120,
                        autoMarkLearned: true,
                    },
                    streak: {
                        currentStreak: 4,
                        longestStreak: 7,
                        brokenStreak: null,
                        lastQualifiedDay: '2026-04-12',
                        lastQualifiedAt: '2026-04-12T09:00:00.000Z',
                    },
                }),
            });

            await fetchAndSaveUserData('user123');

            expect(saveNotificationSettings).not.toHaveBeenCalled();
            expect(restoreStreakState).not.toHaveBeenCalled();
            expect(restoreProgressFromFirebase).not.toHaveBeenCalled();
            expect(restoreFavoritesFromFirebase).not.toHaveBeenCalled();
            expect(clearSyncFlag).not.toHaveBeenCalled();
        });
    });

    describe('syncNotificationSettingsToFirestore', () => {
        it('persists notification settings with merge semantics', async () => {
            (setDoc as jest.Mock).mockResolvedValue(undefined);

            await syncNotificationSettingsToFirestore('user123', {
                enabled: true,
                startHour: 9,
                startMinute: 0,
                endHour: 21,
                endMinute: 0,
                frequencyMinutes: 120,
                autoMarkLearned: true,
            });

            expect(setDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    notificationSettings: {
                        enabled: true,
                        startHour: 9,
                        startMinute: 0,
                        endHour: 21,
                        endMinute: 0,
                        frequencyMinutes: 120,
                        autoMarkLearned: true,
                    },
                    syncMeta: expect.objectContaining({
                        version: 1,
                        updatedByDeviceId: 'test-device-id',
                    }),
                }),
                { merge: true }
            );
        });
    });

    describe('syncAuthProfileToFirestore', () => {
        it('merges provider profile fields into firestore without blanking display name', async () => {
            (setDoc as jest.Mock).mockResolvedValue(undefined);

            await syncAuthProfileToFirestore('user123', {
                email: 'test@example.com',
                displayName: 'VocBee User',
                photoURL: 'https://image.example/provider.png',
            });

            expect(setDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    email: 'test@example.com',
                    displayName: 'VocBee User',
                    photoURL: 'https://image.example/provider.png',
                    syncMeta: expect.objectContaining({
                        version: 1,
                        updatedByDeviceId: 'test-device-id',
                    }),
                }),
                { merge: true }
            );
        });
    });
});
