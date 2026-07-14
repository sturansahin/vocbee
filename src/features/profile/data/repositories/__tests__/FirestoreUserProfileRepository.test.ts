import AsyncStorage from '@react-native-async-storage/async-storage';

const mockDoc = jest.fn((_database: unknown, _collection: string, _id: string) => 'user-ref');
const mockGetDoc = jest.fn((_reference: unknown): Promise<unknown> => Promise.resolve());
const mockSetDoc = jest.fn(
  async (_reference: unknown, _data: unknown, _options?: unknown) => undefined
);
const mockDeleteDoc = jest.fn(async (_reference: unknown) => undefined);

jest.mock('firebase/firestore', () => ({
  doc: (database: unknown, collection: string, id: string) => mockDoc(database, collection, id),
  getDoc: (reference: unknown) => mockGetDoc(reference),
  setDoc: (reference: unknown, data: unknown, options?: unknown) =>
    options === undefined
      ? mockSetDoc(reference, data)
      : mockSetDoc(reference, data, options),
  deleteDoc: (reference: unknown) => mockDeleteDoc(reference),
  serverTimestamp: jest.fn(() => 'server-time'),
}));

jest.mock('../../../../../../config/firebase', () => ({ db: {} }));

import { STORAGE_KEYS } from '@shared/storage';
import { FirestoreUserProfileRepository } from '../FirestoreUserProfileRepository';

describe('FirestoreUserProfileRepository', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('round-trips the exact profile_${uid} cache key', async () => {
    const repository = new FirestoreUserProfileRepository();
    const profile = { name: 'User', image: null, email: 'user@example.com' };

    await repository.cacheProfile('user-1', profile);

    expect(await AsyncStorage.getItem(`${STORAGE_KEYS.PROFILE_PREFIX}user-1`)).toBe(
      JSON.stringify(profile)
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

  it('merge-updates profile fields and delegates document deletion', async () => {
    const repository = new FirestoreUserProfileRepository();

    await repository.saveProfile('user-1', { name: 'Updated', image: null });
    await repository.deleteUserDocument('user-1');

    expect(mockSetDoc).toHaveBeenCalledWith(
      'user-ref',
      { displayName: 'Updated', photoURL: null },
      { merge: true }
    );
    expect(mockDeleteDoc).toHaveBeenCalledWith('user-ref');
  });
});
