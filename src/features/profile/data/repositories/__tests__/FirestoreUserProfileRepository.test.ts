import AsyncStorage from '@react-native-async-storage/async-storage';

const mockDoc = jest.fn((_database: unknown, _collection: string, _id: string) => 'user-ref');
const mockGetDoc = jest.fn((_reference: unknown): Promise<unknown> => Promise.resolve());
const mockSetDoc = jest.fn(
  async (_reference: unknown, _data: unknown, _options?: unknown) => undefined,
);
const mockCollection = jest.fn((_reference: unknown, _collection: string) => 'progress-ref');
const mockGetDocs = jest.fn(async (_reference: unknown) => ({
  docs: [{ ref: 'progress-a1-ref' }, { ref: 'progress-a2-ref' }],
}));
const mockBatchDelete = jest.fn((_reference: unknown) => undefined);
const mockBatchSet = jest.fn((_reference: unknown, _data: unknown, _options: unknown) => undefined);
const mockBatchCommit = jest.fn(async () => undefined);
const mockWriteBatch = jest.fn(() => ({
  delete: mockBatchDelete,
  set: mockBatchSet,
  commit: mockBatchCommit,
}));

jest.mock('firebase/firestore', () => ({
  doc: (database: unknown, collection: string, id: string) => mockDoc(database, collection, id),
  getDoc: (reference: unknown) => mockGetDoc(reference),
  setDoc: (reference: unknown, data: unknown, options?: unknown) =>
    options === undefined ? mockSetDoc(reference, data) : mockSetDoc(reference, data, options),
  collection: (reference: unknown, collection: string) => mockCollection(reference, collection),
  getDocs: (reference: unknown) => mockGetDocs(reference),
  writeBatch: () => mockWriteBatch(),
  serverTimestamp: jest.fn(() => 'server-time'),
}));

jest.mock('@shared/firebase', () => ({ db: {} }));

import { STORAGE_KEYS } from '@shared/storage';
import { FirestoreUserProfileRepository } from '../FirestoreUserProfileRepository';

describe('FirestoreUserProfileRepository', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_PROGRESS_SYNC_MODE;
    await AsyncStorage.clear();
  });

  it('round-trips the exact profile_${uid} cache key', async () => {
    const repository = new FirestoreUserProfileRepository();
    const profile = { name: 'User', image: null, email: 'user@example.com' };

    await repository.cacheProfile('user-1', profile);

    expect(await AsyncStorage.getItem(`${STORAGE_KEYS.PROFILE_PREFIX}user-1`)).toBe(
      JSON.stringify(profile),
    );
    expect(await repository.getCachedProfile('user-1')).toEqual(profile);
  });

  it('maps remote Firestore profile fields without leaking the DTO', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        displayName: 'Remote User',
        photoURL: 'https://image.example/avatar.png',
        email: 'remote@example.com',
      }),
    });
    const repository = new FirestoreUserProfileRepository();

    await expect(repository.fetchProfileFromRemote('user-1')).resolves.toEqual({
      name: 'Remote User',
      image: 'https://image.example/avatar.png',
      email: 'remote@example.com',
    });
  });

  it('creates the legacy-compatible users/{uid} seed only when missing', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    const repository = new FirestoreUserProfileRepository();

    await repository.createUserDocument('user-1', 'user@example.com', 'User', null);

    expect(mockSetDoc).toHaveBeenCalledWith('user-ref', {
      email: 'user@example.com',
      displayName: 'User',
      photoURL: null,
      createdAt: 'server-time',
      setupCompleted: false,
      preferences: null,
      progress: null,
      streak: null,
    });
  });

  it('merge-updates profile fields and recursively deletes known progress documents', async () => {
    const repository = new FirestoreUserProfileRepository();

    await repository.saveProfile('user-1', { name: 'Updated', image: null });
    await repository.deleteUserDocument('user-1');

    expect(mockSetDoc).toHaveBeenCalledWith(
      'user-ref',
      { displayName: 'Updated', photoURL: null },
      { merge: true },
    );
    expect(mockCollection).toHaveBeenCalledWith('user-ref', 'progressByLevel');
    expect(mockBatchDelete.mock.calls).toEqual([
      ['progress-a1-ref'],
      ['progress-a2-ref'],
      ['user-ref'],
    ]);
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  it('merge-persists the setup completion payload through the profile repository', async () => {
    const repository = new FirestoreUserProfileRepository();

    await repository.saveSetupCompletion('user-1', {
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

    expect(mockSetDoc).toHaveBeenCalledWith(
      'user-ref',
      {
        setupCompleted: true,
        preferences: {
          nativeLanguage: 'turkish',
          targetLanguage: 'english',
          level: 'beginner',
        },
        progress: {
          currentLevel: 'A1',
          learnedWords: {},
          lastSync: 'server-time',
        },
        notificationSettings: {
          enabled: true,
          startHour: 9,
          startMinute: 0,
          endHour: 21,
          endMinute: 0,
          frequencyMinutes: 120,
          autoMarkLearned: true,
        },
      },
      { merge: true },
    );
  });

  it('atomically dual-writes setup progress when the rollout mode is enabled', async () => {
    process.env.EXPO_PUBLIC_PROGRESS_SYNC_MODE = 'dual';
    const repository = new FirestoreUserProfileRepository();

    await repository.saveSetupCompletion('user-1', {
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

    expect(mockSetDoc).not.toHaveBeenCalled();
    expect(mockBatchSet).toHaveBeenCalledTimes(6);
    expect(mockBatchSet.mock.calls[0][1]).toMatchObject({
      activeLevel: 'A1',
      schemaVersion: 2,
      progressSummary: { totalLearnedCount: 0 },
      syncMeta: { version: 2, updatedByDeviceId: 'setup' },
    });
    expect(mockBatchSet.mock.calls.slice(1).map((call) => call[1])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: 'A1',
          learnedWordIds: [],
          lastWordId: 0,
          learnedCount: 0,
          vocabularySchemaVersion: 2,
          version: 2,
        }),
      ]),
    );
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });
});
