import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { NotificationSettings } from '@features/notifications';
import type { AuthFacade } from '../../src/features/auth/application/contracts';
import type { AuthUser } from '../../src/features/auth/domain/types';
import {
  AuthStateProvider,
  useAuth,
} from '../../src/features/auth/presentation/AuthProvider';

const settings: NotificationSettings = {
  enabled: true,
  startHour: 9,
  startMinute: 0,
  endHour: 21,
  endMinute: 0,
  frequencyMinutes: 120,
  autoMarkLearned: true,
};

const user: AuthUser = {
  uid: 'user-1',
  email: 'user@example.com',
  displayName: 'VocBee User',
  photoURL: null,
};

let sessionListener: ((user: AuthUser | null) => void) | null = null;

function makeFacade(overrides: Partial<AuthFacade> = {}): AuthFacade {
  return {
    initialize: jest.fn(),
    subscribe: jest.fn(callback => {
      sessionListener = callback;
      return jest.fn();
    }),
    bootstrapSession: jest.fn(async nextUser => ({
      userData: nextUser
        ? { uid: nextUser.uid, email: nextUser.email ?? '', setupCompleted: true }
        : null,
      profile: nextUser
        ? { name: 'VocBee User', image: null, email: 'user@example.com' }
        : { name: '', image: null, email: '' },
      notificationSettings: settings,
      connectionError: false,
    })),
    signUp: jest.fn(async () => ({ uid: user.uid, email: user.email ?? '' })),
    signIn: jest.fn(),
    signInWithGoogle: jest.fn(),
    signInWithApple: jest.fn(),
    signOut: jest.fn(async () => undefined),
    resetPassword: jest.fn(async () => undefined),
    refreshUserData: jest.fn(),
    retryConnection: jest.fn(),
    deleteAccount: jest.fn(async () => undefined),
    updateProfileData: jest.fn(async (_user, profile, patch) => ({ ...profile, ...patch })),
    updateNotificationSettings: jest.fn(async (_user, current, patch) => ({ ...current, ...patch })),
    refreshNotificationSettings: jest.fn(async () => settings),
    ...overrides,
  };
}

function renderAuth(facade: AuthFacade) {
  return renderHook(() => useAuth(), {
    wrapper: ({ children }) => (
      <AuthStateProvider facade={facade}>{children}</AuthStateProvider>
    ),
  });
}

describe('AuthStateProvider', () => {
  beforeEach(() => {
    sessionListener = null;
  });

  it('keeps initial loading true until the first auth snapshot completes', async () => {
    const facade = makeFacade();
    const { result } = renderAuth(facade);
    expect(result.current.isLoading).toBe(true);

    await act(async () => sessionListener?.(null));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userData).toBeNull();
  });

  it('hydrates signed-in profile and setup-complete user data', async () => {
    const facade = makeFacade();
    const { result } = renderAuth(facade);

    await act(async () => sessionListener?.(user));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userData?.setupCompleted).toBe(true);
    expect(result.current.profile.name).toBe('VocBee User');
  });

  it('surfaces bootstrap failures as a connection error without losing the signed-in session', async () => {
    const facade = makeFacade({
      bootstrapSession: jest.fn(async () => {
        throw new Error('offline');
      }),
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderAuth(facade);

    await act(async () => sessionListener?.(user));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user?.uid).toBe(user.uid);
    expect(result.current.connectionError).toBe(true);
    consoleSpy.mockRestore();
  });

  it('delegates sign-out cleanup and clears profile/user data state', async () => {
    const facade = makeFacade();
    const { result } = renderAuth(facade);
    await act(async () => sessionListener?.(user));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => result.current.signOut());

    expect(facade.signOut).toHaveBeenCalledWith(user);
    expect(result.current.userData).toBeNull();
    expect(result.current.profile).toEqual({ name: '', image: null, email: '' });
  });
});
