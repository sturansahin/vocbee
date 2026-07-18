const mockDoc = jest.fn((...parts: unknown[]) => parts.slice(1).join('/'));
const mockCollection = jest.fn((...parts: unknown[]) => parts.slice(1).join('/'));
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockSetDoc = jest.fn();
const mockBatchSet = jest.fn();
const mockBatchCommit = jest.fn(async () => undefined);
const mockWriteBatch = jest.fn(() => ({ set: mockBatchSet, commit: mockBatchCommit }));
const mockTransactionSet = jest.fn();
const mockRunTransaction = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...parts: unknown[]) => mockCollection(...parts),
  doc: (...parts: unknown[]) => mockDoc(...parts),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  runTransaction: (...args: unknown[]) => mockRunTransaction(...args),
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

const levelDocs = (updatedAt = 20) =>
  ['A1', 'A2', 'B1', 'B2', 'C1'].map((level) => ({
    id: level,
    exists: () => true,
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

const missingLevelDoc = (level: string) => ({
  id: level,
  exists: () => false,
  data: () => undefined,
});

function mockReconciliationTransaction(
  userData: Record<string, unknown>,
  docs: ReturnType<typeof levelDocs>,
): void {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
  const byLevel = new Map(docs.map((document) => [document.id, document]));
  const snapshots = [
    remoteSnapshot(userData),
    ...levels.map((level) => byLevel.get(level) ?? missingLevelDoc(level)),
  ];
  mockRunTransaction.mockImplementationOnce(async (_db, update) => {
    let readIndex = 0;
    return update({
      get: jest.fn(async () => snapshots[readIndex++]),
      set: mockTransactionSet,
    });
  });
}

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
    expect(mockBatchSet.mock.calls.slice(1).map((call) => call[1])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: 'A2',
          learnedWordIds: [8],
          lastWordId: 8,
          learnedCount: 1,
          vocabularySchemaVersion: 2,
          version: 2,
        }),
      ]),
    );
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  it('prefers a complete and newer v2 view without rewriting it', async () => {
    process.env.EXPO_PUBLIC_PROGRESS_SYNC_MODE = 'dual';
    mockGetDoc.mockResolvedValueOnce(
      remoteSnapshot({
        schemaVersion: 2,
        activeLevel: 'A2',
        progress: {
          currentLevel: 'A2',
          learnedWords: { A1: [1] },
          lastWordIndex: 1,
          lastSync: { toMillis: () => 10 },
        },
      }),
    );
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
    const remoteData = {
      schemaVersion: 1,
      activeLevel: 'A1',
      lastActiveDeviceId: 'legacy-device',
      progress: {
        currentLevel: 'A1',
        learnedWords: { A1: [3, 1] },
        lastWordIndex: 3,
        lastSync: { toMillis: () => 30 },
      },
    };
    mockGetDoc.mockResolvedValueOnce(remoteSnapshot(remoteData));
    mockGetDocs.mockResolvedValueOnce({ docs: levelDocs(20).slice(0, 1) });
    mockReconciliationTransaction(remoteData, levelDocs(20).slice(0, 1));

    const remote = await new FirestoreSyncRepository().getUserDocument('user-a');

    expect(remote?.progressV2).toEqual({
      currentLevel: 'A1',
      learnedWords: { A1: [1, 3], A2: [], B1: [], B2: [], C1: [] },
      lastWordId: 3,
      source: 'legacy-reconciled',
    });
    expect(mockTransactionSet).toHaveBeenCalledTimes(6);
    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
  });

  it('repairs a stale complete v2 view after a legacy-only client write without rewriting legacy', async () => {
    process.env.EXPO_PUBLIC_PROGRESS_SYNC_MODE = 'dual';
    const remoteData = {
      schemaVersion: 2,
      activeLevel: 'A2',
      lastActiveDeviceId: 'legacy-device',
      progress: {
        currentLevel: 'A2',
        learnedWords: { A1: [1, 2], A2: [9, 8] },
        lastWordIndex: 9,
        lastSync: { toMillis: () => 30 },
      },
    };
    mockGetDoc.mockResolvedValueOnce(remoteSnapshot(remoteData));
    mockGetDocs.mockResolvedValueOnce({ docs: levelDocs(20) });
    mockReconciliationTransaction(remoteData, levelDocs(20));

    const remote = await new FirestoreSyncRepository().getUserDocument('user-a');

    expect(remote?.progressV2).toEqual({
      currentLevel: 'A2',
      learnedWords: { A1: [1, 2], A2: [8, 9], B1: [], B2: [], C1: [] },
      lastWordId: 9,
      source: 'legacy-reconciled',
    });
    expect(mockTransactionSet).toHaveBeenCalledTimes(6);
    expect(mockTransactionSet.mock.calls[0][1]).not.toHaveProperty('progress');
    expect(mockTransactionSet.mock.calls[0][2]).toEqual({ merge: true });
    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
  });

  it('fails closed instead of rewriting malformed legacy progress', async () => {
    process.env.EXPO_PUBLIC_PROGRESS_SYNC_MODE = 'dual';
    mockGetDoc.mockResolvedValueOnce(
      remoteSnapshot({
        schemaVersion: 1,
        progress: {
          currentLevel: 'A1',
          learnedWords: { A1: [1, 1] },
          lastWordIndex: 1,
        },
      }),
    );
    mockGetDocs.mockResolvedValueOnce({ docs: [] });

    const remote = await new FirestoreSyncRepository().getUserDocument('user-a');

    expect(remote?.progressV2).toBeUndefined();
    expect(mockWriteBatch).not.toHaveBeenCalled();
  });
});
