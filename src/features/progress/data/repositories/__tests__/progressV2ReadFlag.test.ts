// src/features/progress/data/repositories/__tests__/progressV2ReadFlag.test.ts
// Confirms the isolated feature-flag wrapper is safe-by-default: when disabled (the shipped default),
// it returns null WITHOUT touching Firestore at all — no getDoc call, no FirestoreProgressRepository
// instantiation side effects reach the network.

const mockGetDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
    setDoc: jest.fn(),
    serverTimestamp: jest.fn(),
}));

jest.mock('@shared/firebase', () => ({
    db: {},
}));

import { isFirestoreProgressV2ReadEnabled, readProgressByLevelWithFlag } from '../progressV2ReadFlag';

describe('progressV2ReadFlag — safe default-OFF wiring', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        delete process.env.EXPO_PUBLIC_PROGRESS_SYNC_MODE;
    });

    it('uses the shared reviewed rollout value', () => {
        process.env.EXPO_PUBLIC_PROGRESS_SYNC_MODE = 'dual';
        expect(isFirestoreProgressV2ReadEnabled()).toBe(true);
    });

    it('the flag defaults to disabled', () => {
        expect(isFirestoreProgressV2ReadEnabled()).toBe(false);
    });

    it('readProgressByLevelWithFlag returns null and never touches Firestore when disabled', async () => {
        const result = await readProgressByLevelWithFlag('user-a', 'A1');
        expect(result).toBeNull();
        expect(mockGetDoc).not.toHaveBeenCalled();
    });
});
