// file: src/shared/storage/__tests__/storage.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    saveLocalProgress,
    getLocalProgress,
    markAsUnsynced,
    needsSync,
    clearSyncFlag,
    getLastSyncTime,
    setLastSyncTime,
    saveUserDataLocally,
    getLocalUserData,
    clearAllLocalData,
    getDeviceId,
    UserProgress,
    UserData,
} from '@shared/storage';

// AsyncStorage is automatically mocked by jest.setup.js

describe('Storage Service', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await AsyncStorage.clear();
    });

    describe('saveLocalProgress', () => {
        it('saves progress to AsyncStorage', async () => {
            const progress: Partial<UserProgress> = {
                currentLevel: 'B1',
                learnedWords: { A1: [1, 2, 3] },
            };

            await saveLocalProgress(progress);

            const stored = await AsyncStorage.getItem('@vocbee_user_progress');
            expect(stored).toBeTruthy();
            const parsed = JSON.parse(stored!);
            expect(parsed.currentLevel).toBe('B1');
            expect(parsed.learnedWords).toEqual({ A1: [1, 2, 3] });
        });

        it('merges with existing progress', async () => {
            // First save
            await saveLocalProgress({ currentLevel: 'A1', learnedWords: { A1: [1] } });
            
            // Second save
            await saveLocalProgress({ currentLevel: 'A2' });

            const stored = await AsyncStorage.getItem('@vocbee_user_progress');
            const parsed = JSON.parse(stored!);
            expect(parsed.currentLevel).toBe('A2');
            expect(parsed.learnedWords).toEqual({ A1: [1] });
        });

        it('adds lastUpdated timestamp', async () => {
            await saveLocalProgress({ currentLevel: 'A1' });

            const stored = await AsyncStorage.getItem('@vocbee_user_progress');
            const parsed = JSON.parse(stored!);
            expect(parsed.lastUpdated).toBeTruthy();
            expect(new Date(parsed.lastUpdated)).toBeInstanceOf(Date);
        });

        it('marks as unsynced after save', async () => {
            await saveLocalProgress({ currentLevel: 'A1' });

            const syncFlag = await AsyncStorage.getItem('@vocbee_needs_sync');
            expect(syncFlag).toBe('true');
        });
    });

    describe('getLocalProgress', () => {
        it('returns stored progress', async () => {
            const progress = {
                currentLevel: 'B2',
                learnedWords: { B1: [1, 2] },
                lastUpdated: '2024-01-01T00:00:00.000Z',
            };
            await AsyncStorage.setItem('@vocbee_user_progress', JSON.stringify(progress));

            const result = await getLocalProgress();

            expect(result.currentLevel).toBe('B2');
            expect(result.learnedWords).toEqual({ B1: [1, 2] });
        });

        it('returns default progress when nothing stored', async () => {
            const result = await getLocalProgress();

            expect(result.currentLevel).toBe('A1');
            expect(result.learnedWords).toEqual({});
        });

        it('returns default progress on parse error', async () => {
            await AsyncStorage.setItem('@vocbee_user_progress', 'invalid-json');

            const result = await getLocalProgress();

            expect(result.currentLevel).toBe('A1');
        });
    });

    describe('markAsUnsynced', () => {
        it('sets sync flag to true', async () => {
            await markAsUnsynced();

            const flag = await AsyncStorage.getItem('@vocbee_needs_sync');
            expect(flag).toBe('true');
        });
    });

    describe('needsSync', () => {
        it('returns true when flag is set', async () => {
            await AsyncStorage.setItem('@vocbee_needs_sync', 'true');

            const result = await needsSync();

            expect(result).toBe(true);
        });

        it('returns false when flag is not set', async () => {
            const result = await needsSync();

            expect(result).toBe(false);
        });

        it('returns false when flag is false', async () => {
            await AsyncStorage.setItem('@vocbee_needs_sync', 'false');

            const result = await needsSync();

            expect(result).toBe(false);
        });
    });

    describe('clearSyncFlag', () => {
        it('sets sync flag to false', async () => {
            await AsyncStorage.setItem('@vocbee_needs_sync', 'true');

            await clearSyncFlag();

            const flag = await AsyncStorage.getItem('@vocbee_needs_sync');
            expect(flag).toBe('false');
        });
    });

    describe('getLastSyncTime', () => {
        it('returns date when stored', async () => {
            const date = '2024-06-15T10:30:00.000Z';
            await AsyncStorage.setItem('@vocbee_last_sync', date);

            const result = await getLastSyncTime();

            expect(result).toBeInstanceOf(Date);
            expect(result?.toISOString()).toBe(date);
        });

        it('returns null when not stored', async () => {
            const result = await getLastSyncTime();

            expect(result).toBeNull();
        });
    });

    describe('setLastSyncTime', () => {
        it('stores current time', async () => {
            const before = new Date();
            await setLastSyncTime();
            const after = new Date();

            const stored = await AsyncStorage.getItem('@vocbee_last_sync');
            const storedDate = new Date(stored!);

            expect(storedDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(storedDate.getTime()).toBeLessThanOrEqual(after.getTime());
        });
    });

    describe('saveUserDataLocally', () => {
        it('saves user data', async () => {
            const userData: UserData = {
                uid: 'user123',
                email: 'test@example.com',
                displayName: 'Test User',
                setupCompleted: true,
                preferences: {
                    nativeLanguage: 'en',
                    targetLanguage: 'de',
                    level: 'A1',
                },
            };

            await saveUserDataLocally(userData);

            const stored = await AsyncStorage.getItem('@vocbee_user_data');
            const parsed = JSON.parse(stored!);
            expect(parsed.uid).toBe('user123');
            expect(parsed.email).toBe('test@example.com');
        });
    });

    describe('getLocalUserData', () => {
        it('returns stored user data', async () => {
            const userData = {
                uid: 'user456',
                email: 'user@test.com',
            };
            await AsyncStorage.setItem('@vocbee_user_data', JSON.stringify(userData));

            const result = await getLocalUserData();

            expect(result?.uid).toBe('user456');
            expect(result?.email).toBe('user@test.com');
        });

        it('returns null when not stored', async () => {
            const result = await getLocalUserData();

            expect(result).toBeNull();
        });
    });

    describe('clearAllLocalData', () => {
        it('clears all storage keys', async () => {
            // Set up some data
            await AsyncStorage.setItem('@vocbee_user_progress', 'progress');
            await AsyncStorage.setItem('@vocbee_needs_sync', 'true');
            await AsyncStorage.setItem('@vocbee_user_data', 'user');
            await AsyncStorage.setItem('@user_progress', 'user_progress');
            await AsyncStorage.setItem('@vocabulary', 'vocab');
            await AsyncStorage.setItem('profile_user123', 'profile');
            await AsyncStorage.setItem('@VocBee:appReviewPromptState', 'review');

            await clearAllLocalData();

            const progress = await AsyncStorage.getItem('@vocbee_user_progress');
            const sync = await AsyncStorage.getItem('@vocbee_needs_sync');
            const userData = await AsyncStorage.getItem('@vocbee_user_data');

            expect(progress).toBeNull();
            expect(sync).toBeNull();
            expect(userData).toBeNull();
            expect(await AsyncStorage.getItem('profile_user123')).toBeNull();
            expect(await AsyncStorage.getItem('@VocBee:appReviewPromptState')).toBeNull();
        });

        it('preserves device ID by default and removes it on full purge', async () => {
            await AsyncStorage.setItem('@vocbee_device_id', 'device_existing_123');

            await clearAllLocalData();
            expect(await AsyncStorage.getItem('@vocbee_device_id')).toBe('device_existing_123');

            await clearAllLocalData({ fullPurge: true });
            expect(await AsyncStorage.getItem('@vocbee_device_id')).toBeNull();
        });
    });

    describe('getDeviceId', () => {
        it('creates new device ID if not exists', async () => {
            const deviceId = await getDeviceId();

            expect(deviceId).toMatch(/^device_/);
            
            // Should be stored
            const stored = await AsyncStorage.getItem('@vocbee_device_id');
            expect(stored).toBe(deviceId);
        });

        it('returns existing device ID', async () => {
            await AsyncStorage.setItem('@vocbee_device_id', 'device_existing_123');

            const deviceId = await getDeviceId();

            expect(deviceId).toBe('device_existing_123');
        });

        it('generates unique IDs', async () => {
            const id1 = await getDeviceId();
            await AsyncStorage.removeItem('@vocbee_device_id');
            const id2 = await getDeviceId();

            expect(id1).not.toBe(id2);
        });
    });
});
