const mockDoc = jest.fn((...parts: unknown[]) => parts.slice(1).join('/'));
const mockCollection = jest.fn((...parts: unknown[]) => parts.slice(1).join('/'));
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockSetDoc = jest.fn();
const mockBatchSet = jest.fn();
const mockBatchCommit = jest.fn(async () => undefined);
const mockWriteBatch = jest.fn(() => ({ set: mockBatchSet, commit: mockBatchCommit }));

jest.mock('firebase/firestore', () => ({
  collection: (...parts: unknown[]) => mockCollection(...parts),
  doc: (...parts: unknown[]) => mockDoc(...parts),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  serverTimestamp: jest.fn(() => 'server-time'),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  writeBatch: () => mockWriteBatch(),
}));

jest.mock('@shared/firebase', () => ({ db: {} }));

import type { LocalSyncSnapshot } from '../../../domain/types';
import { FirestoreSyncRepository } from '../FirestoreSyncRepository';

const localSnapshot = (): LocalSyncSnapshot => ({
  currentLevel: 'A2',
  userLevel: 'beginner',
  lastWordId: 8,
  learnedWords: { A1: [1, 2], A2: [8] },
  vocabularySchemaVersion: 2,
  hasProfileImage: false,
  notificationSettings: null,
  streak: { currentStreak: 1 },
  preferences: null,
});

const remoteSnapshot = (data: Record<string, unknown>) => ({
  exists: () => true,
  data: () => data,
});

const levelDocs = (updatedAt = 20) => ['A1', 'A2', 'B1', 'B2', 'C1'].map(level => ({
  id: level,
  data: () => ({
    level,
    learnedWordIds: level === 'A1' ? [1, 2] : level === 'A2' ? [8] : [],
    lastWordId: level === 'A2' ? 8 : 0,
    learnedCount: level === 'A1' ? 2 : level === 'A2' ? 1 : 0,
    vocabularySchemaVersion: 2,
    updatedAt: { toMillis: () => updatedAt },
    version: 2,
  }),
}));

describe('FirestoreSyncRepository progress rollout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_PROGRESS_SYNC_MODE;
  });

  it('keeps the production-safe legacy write as the default', async () => {
    const repository = new FirestoreSyncRepository();
    await repository.saveSnapshot('user-a', localSnapshot(), 'device-a');

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(mockSetDoc.mock.calls[0][1]).toMatchObject({
      progress: { currentLevel: 'A2', lastWordIndex: 8 },
      syncMeta: { version: 1 },
    });
    expect(mockWriteBatch).not.toHaveBeenCalled();
  });

  it('atomically dual-writes legacy progress, summary, and all five v2 docs', async () => {
    process.env.EXPO_PUBLIC_PROGRESS_SYNC_MODE = 'dual';
    const repository = new FirestoreSyncRepository();
    await repository.saveSnapshot('user-a', localSnapshot(), 'device-a');

    expect(mockSetDoc).not.toHaveBeenCalled();
    expect(mockBatchSet).toHaveBeenCalledTimes(6);
    expect(mockBatchSet.mock.calls[0][1]).toMatchObject({
      progress: { currentLevel: 'A2', lastWordIndex: 8 },
      activeLevel: 'A2',
      schemaVersion: 2,
      progressSummary: { totalLearnedCount: 3 },
      syncMeta: { version: 2 },
    });
    expect(mockBatchSet.mock.calls.slice(1).map(call => call[1])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: 'A2', learnedWordIds: [8], lastWordId: 8,
          learnedCount: 1, vocabularySchemaVersion: 2, version: 2,
        }),
      ])
    );
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  it('prefers a complete and newer v2 view without rewriting it', async () => {
    process.env.EXPO_PUBLIC_PROGRESS_SYNC_MODE = 'dual';
    mockGetDoc.mockResolvedValueOnce(remoteSnapshot({
      schemaVersion: 2,
      activeLevel: 'A2',
      progress: {
        currentLevel: 'A2', learnedWords: { A1: [1] }, lastWordIndex: 1,
        lastSync: { toMillis: () => 10 },
      },
    }));
    mockGetDocs.mockResolvedValueOnce({ docs: levelDocs(20) });

    const remote = await new FirestoreSyncRepository().getUserDocument('user-a');

    expect(remote?.progressV2).toEqual({
      currentLevel: 'A2',
      learnedWords: { A1: [1, 2], A2: [8], B1: [], B2: [], C1: [] },
      lastWordId: 8,
      source: 'v2',
    });
    expect(mockWriteBatch).not.toHaveBeenCalled();
  });

  it('repairs an incomplete or stale v2 view from retained legacy data', async () => {
    process.env.EXPO_PUBLIC_PROGRESS_SYNC_MODE = 'dual';
    mockGetDoc.mockResolvedValueOnce(remoteSnapshot({
      schemaVersion: 1,
      activeLevel: 'A1',
      lastActiveDeviceId: 'legacy-device',
      progress: {
        currentLevel: 'A1', learnedWords: { A1: [3, 1] }, lastWordIndex: 3,
        lastSync: { toMillis: () => 30 },
      },
    }));
    mockGetDocs.mockResolvedValueOnce({ docs: levelDocs(20).slice(0, 1) });

    const remote = await new FirestoreSyncRepository().getUserDocument('user-a');

    expect(remote?.progressV2).toEqual({
      currentLevel: 'A1',
      learnedWords: { A1: [1, 3], A2: [], B1: [], B2: [], C1: [] },
      lastWordId: 3,
      source: 'legacy-reconciled',
    });
    expect(mockBatchSet).toHaveBeenCalledTimes(6);
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  it('fails closed instead of rewriting malformed legacy progress', async () => {
    process.env.EXPO_PUBLIC_PROGRESS_SYNC_MODE = 'dual';
    mockGetDoc.mockResolvedValueOnce(remoteSnapshot({
      schemaVersion: 1,
      progress: {
        currentLevel: 'A1', learnedWords: { A1: [1, 1] }, lastWordIndex: 1,
      },
    }));
    mockGetDocs.mockResolvedValueOnce({ docs: [] });

    const remote = await new FirestoreSyncRepository().getUserDocument('user-a');

    expect(remote?.progressV2).toBeUndefined();
    expect(mockWriteBatch).not.toHaveBeenCalled();
  });
});
