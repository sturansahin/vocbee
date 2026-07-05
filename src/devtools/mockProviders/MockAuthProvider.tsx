// src/devtools/mockProviders/MockAuthProvider.tsx
// Provides a fake, AuthContextType-shaped value for devtools panels (AuthStatePanel, fixture
// previews, unit tests). This is a devtools-only module; it is never imported by production code
// paths (see src/devtools/guard.ts contract).
//
// IMPORTANT SCOPE NOTE: real screens (HomeScreen, SettingsScreen, AuthScreens, SetupScreens) import
// `useAuth` directly from `context/AuthContext` and `useMonetization` directly from
// `@features/monetization` — this module does NOT monkey-patch those hooks and cannot make a real
// screen "believe" it is logged in with fixture data at runtime (there is no injection seam in
// AuthContext/MonetizationProvider today, and creating one is out of scope — no AuthContext
// refactor). Consequently `ScreenTesterPanel` renders real screens through the REAL provider chain
// (AuthProvider/MonetizationProvider/ThemeProvider) exactly as production does; this module's fake
// value is used for (a) devtools-only preview panels that display fixture data read-only, and
// (b) unit tests (mock provider render smoke test). All mutating methods are no-op stubs that log
// to the console — this harness can NEVER write to real Firebase/Firestore or delete real user data.

import React, { createContext, ReactNode, useMemo } from 'react';
import type { DevToolsScenario } from '../scenarios';

// Minimal shape compatible with what screens actually read from useAuth() in practice
// (see context/AuthContext.tsx AuthContextType). Kept structurally compatible without importing
// the real context module (which would pull in Firebase).
export interface MockAuthValue {
  user: { uid: string } | null;
  userData: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  connectionError: boolean;
  signUp: (...args: any[]) => Promise<void>;
  signIn: (...args: any[]) => Promise<{ setupCompleted: boolean }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ setupCompleted: boolean }>;
  signInWithApple: () => Promise<{ setupCompleted: boolean }>;
  resetPassword: (...args: any[]) => Promise<void>;
  refreshUserData: () => Promise<void>;
  retryConnection: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  profile: { name: string; image: string | null; email: string };
  updateProfileData: (...args: any[]) => Promise<void>;
  notificationSettings: any;
  updateNotificationSettings: (...args: any[]) => Promise<void>;
  refreshNotificationSettings: () => Promise<void>;
}

function noopAsync(label: string) {
  return async (..._args: any[]) => {
    console.log(`[DevTools][MockAuthProvider] blocked no-op call: ${label} (fixture data is never written to Firebase)`);
  };
}

export function buildMockAuthValue(scenario: DevToolsScenario): MockAuthValue {
  return {
    user: scenario.auth.user,
    userData: scenario.auth.userData,
    isLoading: scenario.auth.isLoading,
    isAuthenticated: !!scenario.auth.user,
    connectionError: scenario.auth.connectionError,
    signUp: noopAsync('signUp'),
    signIn: async () => {
      console.log('[DevTools][MockAuthProvider] blocked no-op call: signIn');
      return { setupCompleted: !!scenario.auth.userData?.setupCompleted };
    },
    signOut: noopAsync('signOut'),
    signInWithGoogle: async () => {
      console.log('[DevTools][MockAuthProvider] blocked no-op call: signInWithGoogle');
      return { setupCompleted: !!scenario.auth.userData?.setupCompleted };
    },
    signInWithApple: async () => {
      console.log('[DevTools][MockAuthProvider] blocked no-op call: signInWithApple');
      return { setupCompleted: !!scenario.auth.userData?.setupCompleted };
    },
    resetPassword: noopAsync('resetPassword'),
    refreshUserData: noopAsync('refreshUserData'),
    retryConnection: noopAsync('retryConnection'),
    deleteAccount: noopAsync('deleteAccount'),
    profile: {
      name: scenario.auth.userData?.displayName || 'DevTools User',
      image: null,
      email: scenario.auth.userData?.email || 'devtools@example.com',
    },
    updateProfileData: noopAsync('updateProfileData'),
    notificationSettings: scenario.notificationSettings,
    updateNotificationSettings: noopAsync('updateNotificationSettings'),
    refreshNotificationSettings: noopAsync('refreshNotificationSettings'),
  };
}

// A context object with the SAME shape apps could consume, but entirely local to devtools.
// Screens under test keep using the real `useAuth()` from context/AuthContext — this component
// does not monkey-patch that module. It exists so devtools panels themselves can read/display
// the active fake auth value without duplicating scenario plumbing.
export const MockAuthContext = createContext<MockAuthValue | undefined>(undefined);

export function MockAuthProvider({
  scenario,
  children,
}: {
  scenario: DevToolsScenario;
  children: ReactNode;
}) {
  const value = useMemo(() => buildMockAuthValue(scenario), [scenario]);
  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
}
