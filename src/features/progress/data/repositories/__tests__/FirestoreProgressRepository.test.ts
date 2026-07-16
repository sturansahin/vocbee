// src/features/progress/data/repositories/__tests__/FirestoreProgressRepository.test.ts
//
// Tests the DUAL-READ branching logic of FirestoreProgressRepository.getProgressByLevel:
//   1. progressByLevel/{level} doc EXISTS -> returned directly (adapted via fromProgressByLevelDoc).
//   2. progressByLevel/{level} MISSING, legacy users/{uid}.progress.learnedWords EXISTS -> adapted fallback.
//   3. NEITHER exists -> null.
//   4. Malformed legacy doc (non-array learnedWords / missing) -> handled gracefully, no throw.
//   5. Duplicate wordIds in legacy -> deduped (delegates to the already-tested adapter).
//   6. Different level requested than the one present in legacy -> only that level's data returned.
//
// firebase/firestore is fully mocked — no real network/emulator calls. This is a PREP-ONLY class
// (⚠️ not wired into any production composition root — see file header), so these tests exercise it
// in isolation via `new FirestoreProgressRepository()`.

const mockGetDoc = jest.fn();
const mockDoc = jest.fn((...args: unknown[]) => ({ __path: args.join('/') }));
const mockSetDoc = jest.fn();
const mockServerTimestamp = jest.fn(() => 'SERVER_TIMESTAMP_SENTINEL');

jest.mock('firebase/firestore', () => ({
    doc: (...args: unknown[]) => mockDoc(...args),
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
    setDoc: (...args: unknown[]) => mockSetDoc(...args),
    serverTimestamp: () => mockServerTimestamp(),
}));

jest.mock('@shared/firebase', () => ({
    db: {},
}));

import { FirestoreProgressRepository } from '../FirestoreProgressRepository';

function mockSnapshot(exists: boolean, data?: unknown) {
    return { exists: () => exists, data: () => data };
}

describe('FirestoreProgressRepository — dual-read branching', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('1. returns the v2 progressByLevel doc directly when it exists', async () => {
        mockGetDoc.mockResolvedValueOnce(
            mockSnapshot(true, {
                level: 'A1',
                learnedWordIds: [1, 2, 3],
                lastWordIndex: 3,
                learnedCount: 3,
                updatedAt: 'ts',
            })
        );

        const repo = new FirestoreProgressRepository();
        const result = await repo.getProgressByLevel('user-a', 'A1');

        expect(result).toEqual({ level: 'A1', learnedWordIds: [1, 2, 3], lastWordIndex: 3, learnedCount: 3 });
        // Only the v2 doc should have been fetched — no legacy fallback read.
        expect(mockGetDoc).toHaveBeenCalledTimes(1);
    });

    it('2. falls back to legacy progress.learnedWords when the v2 doc is missing', async () => {
        mockGetDoc
            .mockResolvedValueOnce(mockSnapshot(false)) // progressByLevel/A1 missing
            .mockResolvedValueOnce(
                mockSnapshot(true, {
                    progress: { currentLevel: 'A1', learnedWords: { A1: [1, 2], A2: [9] }, lastWordIndex: 2 },
                })
            ); // legacy main doc

        const repo = new FirestoreProgressRepository();
        const result = await repo.getProgressByLevel('user-a', 'A1');

        expect(result).toEqual({ level: 'A1', learnedWordIds: [1, 2], lastWordIndex: 2, learnedCount: 2 });
        expect(mockGetDoc).toHaveBeenCalledTimes(2);
    });

    it('3. returns null when neither v2 nor legacy data exists', async () => {
        mockGetDoc
            .mockResolvedValueOnce(mockSnapshot(false)) // progressByLevel missing
            .mockResolvedValueOnce(mockSnapshot(false)); // main doc missing entirely

        const repo = new FirestoreProgressRepository();
        const result = await repo.getProgressByLevel('user-a', 'A1');

        expect(result).toBeNull();
    });

    it('3b. returns null when main doc exists but has no progress field', async () => {
        mockGetDoc
            .mockResolvedValueOnce(mockSnapshot(false))
            .mockResolvedValueOnce(mockSnapshot(true, { email: 'a@b.com' })); // no `progress` key

        const repo = new FirestoreProgressRepository();
        const result = await repo.getProgressByLevel('user-a', 'A1');

        expect(result).toBeNull();
    });

    it('4. malformed legacy doc (learnedWords is not an object) does not throw, returns null', async () => {
        mockGetDoc
            .mockResolvedValueOnce(mockSnapshot(false))
            .mockResolvedValueOnce(
                mockSnapshot(true, { progress: { currentLevel: 'A1', learnedWords: 'not-an-object' } })
            );

        const repo = new FirestoreProgressRepository();
        await expect(repo.getProgressByLevel('user-a', 'A1')).resolves.toBeNull();
    });

    it('4b. malformed legacy doc (progress is null) does not throw, returns null', async () => {
        mockGetDoc
            .mockResolvedValueOnce(mockSnapshot(false))
            .mockResolvedValueOnce(mockSnapshot(true, { progress: null }));

        const repo = new FirestoreProgressRepository();
        await expect(repo.getProgressByLevel('user-a', 'A1')).resolves.toBeNull();
    });

    it('5. duplicate wordIds in legacy learnedWords are deduped via the adapter', async () => {
        mockGetDoc
            .mockResolvedValueOnce(mockSnapshot(false))
            .mockResolvedValueOnce(
                mockSnapshot(true, {
                    progress: { currentLevel: 'A1', learnedWords: { A1: [1, 1, 2, 2, 3] } },
                })
            );

        const repo = new FirestoreProgressRepository();
        const result = await repo.getProgressByLevel('user-a', 'A1');

        expect(result).toEqual({ level: 'A1', learnedWordIds: [1, 2, 3], lastWordIndex: 0, learnedCount: 3 });
    });

    it('6. requesting a different level than currentLevel only returns that level\'s data (lastWordIndex=0)', async () => {
        mockGetDoc
            .mockResolvedValueOnce(mockSnapshot(false)) // progressByLevel/A2 missing
            .mockResolvedValueOnce(
                mockSnapshot(true, {
                    progress: { currentLevel: 'A1', learnedWords: { A1: [1, 2, 3], A2: [10, 20] }, lastWordIndex: 3 },
                })
            );

        const repo = new FirestoreProgressRepository();
        const result = await repo.getProgressByLevel('user-a', 'A2');

        // A2 is not the currentLevel, so lastWordIndex must be 0 (matches adaptLegacyLearnedWordsToProgressByLevelDocs).
        expect(result).toEqual({ level: 'A2', learnedWordIds: [10, 20], lastWordIndex: 0, learnedCount: 2 });
    });

    it('6b. requesting the currentLevel carries the legacy lastWordIndex', async () => {
        mockGetDoc
            .mockResolvedValueOnce(mockSnapshot(false))
            .mockResolvedValueOnce(
                mockSnapshot(true, {
                    progress: { currentLevel: 'B1', learnedWords: { B1: [5, 6] }, lastWordIndex: 7 },
                })
            );

        const repo = new FirestoreProgressRepository();
        const result = await repo.getProgressByLevel('user-a', 'B1');

        expect(result).toEqual({ level: 'B1', learnedWordIds: [5, 6], lastWordIndex: 7, learnedCount: 2 });
    });

    it('getLegacyProgressFallback returns null when the main doc does not exist', async () => {
        mockGetDoc.mockResolvedValueOnce(mockSnapshot(false));
        const repo = new FirestoreProgressRepository();
        expect(await repo.getLegacyProgressFallback('user-a')).toBeNull();
    });

    it('getLegacyProgressFallback returns the raw legacy progress object when present', async () => {
        const legacy = { currentLevel: 'A1', learnedWords: { A1: [1] }, lastWordIndex: 1 };
        mockGetDoc.mockResolvedValueOnce(mockSnapshot(true, { progress: legacy }));
        const repo = new FirestoreProgressRepository();
        expect(await repo.getLegacyProgressFallback('user-a')).toEqual(legacy);
    });

    it('saveProgressByLevel writes ONLY the v2 subcollection doc (merge), never the legacy field', async () => {
        mockSetDoc.mockResolvedValueOnce(undefined);
        const repo = new FirestoreProgressRepository('device-x');

        await repo.saveProgressByLevel('user-a', {
            level: 'A1',
            learnedWordIds: [1, 2],
            lastWordIndex: 2,
            learnedCount: 2,
        });

        expect(mockSetDoc).toHaveBeenCalledTimes(1);
        const [, payload, options] = mockSetDoc.mock.calls[0];
        expect(payload).toMatchObject({
            level: 'A1',
            learnedWordIds: [1, 2],
            lastWordIndex: 2,
            learnedCount: 2,
            updatedByDeviceId: 'device-x',
        });
        expect(options).toEqual({ merge: true });
        // The write path must never touch users/{uid}.progress directly.
        expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users/user-a/progressByLevel/A1');
    });

    it('getProgressSummary returns zeroed summary when the main doc has no progressSummary field', async () => {
        mockGetDoc.mockResolvedValueOnce(mockSnapshot(true, { email: 'a@b.com' }));
        const repo = new FirestoreProgressRepository();
        expect(await repo.getProgressSummary('user-a')).toEqual({ byLevel: {}, overallPercent: 0 });
    });

    it('getProgressSummary returns the stored summary when present', async () => {
        const summary = { byLevel: { A1: { learnedCount: 3, totalCount: 12, percent: 25 } }, overallPercent: 25 };
        mockGetDoc.mockResolvedValueOnce(mockSnapshot(true, { progressSummary: summary }));
        const repo = new FirestoreProgressRepository();
        expect(await repo.getProgressSummary('user-a')).toEqual(summary);
    });
});
