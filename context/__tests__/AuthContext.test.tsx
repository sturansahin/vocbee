// context/__tests__/AuthContext.test.tsx
// Covers ADIM 5 (step 1/4): profile cache read/write/delete + createUserDocument now delegate to
// FirestoreUserProfileRepository instead of inlining AsyncStorage/Firestore calls directly.
// All Firebase SDK calls and services below AuthContext are mocked — this test asserts the PUBLIC
// behavior (updateProfileData, deleteAccount, signUp) still works and that it goes through the
// repository, without touching real Firebase Auth/Firestore.

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';

// ---- Mock the repository this pass wired in ----
// NOTE: jest.mock factories are hoisted above const declarations, so the mock fns must be created
// INSIDE the factory (not referenced from outer consts) — otherwise they'd be undefined when the
// factory runs. We stash them on a shared object so tests can still assert on calls.
const repoMocks: {
    getCachedProfile: jest.Mock;
    cacheProfile: jest.Mock;
    createUserDocument: jest.Mock;
    deleteUserDocument: jest.Mock;
} = {} as any;

jest.mock('../../src/features/profile/data/repositories/FirestoreUserProfileRepository', () => {
    const getCachedProfile = jest.fn(async () => null);
    const cacheProfile = jest.fn(async () => undefined);
    const createUserDocument = jest.fn(async () => undefined);
    const deleteUserDocument = jest.fn(async () => undefined);
    // Expose on the outer-scoped object for assertions (module-level mutation is fine in CJS/Jest).
    (globalThis as any).__profileRepoMocks = { getCachedProfile, cacheProfile, createUserDocument, deleteUserDocument };
    return {
        FirestoreUserProfileRepository: jest.fn().mockImplementation(() => ({
            getCachedProfile,
            cacheProfile,
            fetchProfileFromRemote: jest.fn(async () => null),
            saveProfile: jest.fn(async () => undefined),
            createUserDocument,
            deleteUserDocument,
        })),
    };
});

// ---- Mock Firebase Auth SDK ----
let authStateCallback: ((user: any) => void) | null = null;
const mockSignInWithEmailAndPassword = jest.fn<Promise<any>, any[]>();
const mockCreateUserWithEmailAndPassword = jest.fn<Promise<any>, any[]>();
const mockUpdateProfile = jest.fn<Promise<void>, any[]>(async () => undefined);
const mockDeleteUser = jest.fn<Promise<void>, any[]>(async () => undefined);
const mockFirebaseSignOut = jest.fn<Promise<void>, any[]>(async () => undefined);
const mockSendPasswordResetEmail = jest.fn<Promise<void>, any[]>(async () => undefined);

jest.mock('firebase/auth', () => ({
    createUserWithEmailAndPassword: (...args: any[]) => mockCreateUserWithEmailAndPassword(...args),
    signInWithEmailAndPassword: (...args: any[]) => mockSignInWithEmailAndPassword(...args),
    signOut: (...args: any[]) => mockFirebaseSignOut(...args),
    onAuthStateChanged: (_auth: any, cb: (user: any) => void) => {
        authStateCallback = cb;
        return jest.fn();
    },
    updateProfile: (...args: any[]) => mockUpdateProfile(...args),
    sendPasswordResetEmail: (...args: any[]) => mockSendPasswordResetEmail(...args),
    GoogleAuthProvider: { credential: jest.fn() },
    OAuthProvider: jest.fn().mockImplementation(() => ({ credential: jest.fn() })),
    signInWithCredential: jest.fn(),
    deleteUser: (...args: any[]) => mockDeleteUser(...args),
}));

jest.mock('../../config/firebase', () => ({
    auth: { currentUser: null },
    db: {},
}));

jest.mock('expo-apple-authentication', () => ({
    signInAsync: jest.fn(),
    AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));

jest.mock('../../services/nativeGoogleSignIn', () => ({
    configureNativeGoogleSignIn: jest.fn(),
    disconnectNativeGoogleSession: jest.fn(async () => undefined),
    getNativeGoogleSignInErrorMessage: jest.fn(() => 'error'),
    signInWithNativeGoogle: jest.fn(),
}));

jest.mock('../../services/SyncService', () => ({
    fetchAndSaveUserData: jest.fn(async () => null),
    forceSync: jest.fn(async () => true),
    getActiveDeviceIdFromFirebase: jest.fn(async () => null),
    syncAuthProfileToFirestore: jest.fn(async () => undefined),
    syncNotificationSettingsToFirestore: jest.fn(async () => undefined),
}));

jest.mock('../../services/progressService', () => ({
    resetProgress: jest.fn(async () => undefined),
}));

jest.mock('../../services/notificationService', () => ({
    NotificationSettings: {},
    DEFAULT_NOTIFICATION_SETTINGS: { enabled: false },
    getNotificationSettings: jest.fn(async () => ({ enabled: false })),
    saveNotificationSettings: jest.fn(async () => undefined),
    cancelAllNotifications: jest.fn(async () => undefined),
    clearTrackedNotifications: jest.fn(async () => undefined),
}));

jest.mock('@shared/storage', () => ({
    getLocalUserData: jest.fn(async () => null),
    saveUserDataLocally: jest.fn(async () => undefined),
    clearAllLocalData: jest.fn(async () => undefined),
    getDeviceId: jest.fn(async () => 'device-1'),
}));

function renderAuth() {
    const rendered = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });
    return rendered;
}

async function mountLoggedOut() {
    const rendered = renderAuth();
    await act(async () => {
        authStateCallback?.(null);
    });
    await waitFor(() => expect(rendered.result.current.isLoading).toBe(false));
    return rendered;
}

describe('AuthContext — profile repository delegation (ADIM 5)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Object.assign(repoMocks, (globalThis as any).__profileRepoMocks);
        repoMocks.getCachedProfile.mockResolvedValue(null);
        authStateCallback = null;
    });

    it('does not throw on mount and exposes the same public API shape', async () => {
        const { result } = await mountLoggedOut();

        expect(result.current).toEqual(
            expect.objectContaining({
                user: null,
                userData: null,
                isAuthenticated: false,
                signUp: expect.any(Function),
                signIn: expect.any(Function),
                signOut: expect.any(Function),
                signInWithGoogle: expect.any(Function),
                signInWithApple: expect.any(Function),
                resetPassword: expect.any(Function),
                refreshUserData: expect.any(Function),
                retryConnection: expect.any(Function),
                deleteAccount: expect.any(Function),
                profile: expect.any(Object),
                updateProfileData: expect.any(Function),
                notificationSettings: expect.any(Object),
                updateNotificationSettings: expect.any(Function),
                refreshNotificationSettings: expect.any(Function),
            })
        );
    });

    it('signUp delegates document creation to the repository (createUserDocument)', async () => {
        mockCreateUserWithEmailAndPassword.mockResolvedValue({ user: { uid: 'u1', email: 'a@b.com' } });
        const { result } = await mountLoggedOut();

        await act(async () => {
            await result.current.signUp('a@b.com', 'password123', 'Alice');
        });

        expect(repoMocks.createUserDocument).toHaveBeenCalledWith('u1', 'a@b.com', 'Alice');
    });

    it('updateProfileData delegates to repository.cacheProfile, not raw AsyncStorage', async () => {
        mockCreateUserWithEmailAndPassword.mockResolvedValue({ user: { uid: 'u1', email: 'a@b.com' } });
        const { result } = await mountLoggedOut();

        await act(async () => {
            await result.current.signUp('a@b.com', 'password123', 'Alice');
        });

        // Simulate auth state now having a user (signUp itself does not set `user` state — only onAuthStateChanged does).
        await act(async () => {
            authStateCallback?.({ uid: 'u1', email: 'a@b.com', displayName: 'Alice', photoURL: null, metadata: {} });
        });
        await waitFor(() => expect(result.current.user).not.toBeNull());

        await act(async () => {
            await result.current.updateProfileData({ name: 'Alice Updated' });
        });

        expect(repoMocks.cacheProfile).toHaveBeenCalledWith('u1', expect.objectContaining({ name: 'Alice Updated' }));
    });

    it('deleteAccount (dev fallback path) delegates to repository.deleteUserDocument', async () => {
        const recentUser = {
            uid: 'u1',
            email: 'a@b.com',
            getIdToken: jest.fn(async () => 'token'),
            metadata: { lastSignInTime: new Date().toUTCString() },
        };

        const { result } = await mountLoggedOut();

        await act(async () => {
            authStateCallback?.(recentUser);
        });
        await waitFor(() => expect(result.current.user).not.toBeNull());

        await act(async () => {
            await result.current.deleteAccount();
        });

        expect(repoMocks.deleteUserDocument).toHaveBeenCalledWith('u1');
        expect(mockDeleteUser).toHaveBeenCalled();
    });
});
