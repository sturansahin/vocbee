// src/devtools/scenarios/index.ts
// A "scenario" is a named, declarative bundle of fixture data + flags describing one app state
// combination (auth state, setup state, monetization state, progress shape, loading/error/empty).
// Scenarios are pure data — no side effects, no SDK calls. `mockProviders/` consumes a scenario
// to render real screens against fake context values.

import type { UserData } from '@shared/storage';
import {
  fixtureError,
  fixtureFavorites,
  fixtureLegacyProgress,
  fixtureNotificationSettingsDisabled,
  fixtureNotificationSettingsEnabled,
  fixtureProgressByLevel,
  fixtureProgressDefault,
  fixtureStreakActive,
  fixtureUserDataLoggedInComplete,
  fixtureUserDataSetupIncomplete,
} from '../fixtures';

export type ScenarioId =
  | 'default'
  | 'loading'
  | 'empty'
  | 'error'
  | 'loggedOut'
  | 'loggedIn'
  | 'setupIncomplete'
  | 'premium'
  | 'freeWithAds'
  | 'legacyProgress'
  | 'progressByLevel';

export interface DevToolsScenario {
  id: ScenarioId;
  label: string;
  description: string;
  auth: {
    user: { uid: string } | null;
    userData: UserData | null;
    isLoading: boolean;
    connectionError: boolean;
  };
  monetization: {
    isAdFree: boolean;
    isLoading: boolean;
  };
  progress: {
    shape: 'legacy' | 'progressByLevel' | 'empty';
    legacy?: {
      currentLevel: string;
      learnedWords: Record<string, number[]>;
      lastWordIndex: number;
    };
    byLevel?: typeof fixtureProgressByLevel;
  };
  notificationSettings: typeof fixtureNotificationSettingsEnabled;
  favorites: number[];
  streak: typeof fixtureStreakActive | null;
  simulatedError: Error | null;
}

const baseLoggedIn = {
  uid: fixtureUserDataLoggedInComplete.uid,
};

export const SCENARIOS: Record<ScenarioId, DevToolsScenario> = {
  default: {
    id: 'default',
    label: 'Default (logged in, setup complete)',
    description: 'Baseline happy-path state: authenticated user, setup completed, free tier with ads, mid-progress.',
    auth: { user: baseLoggedIn, userData: fixtureUserDataLoggedInComplete, isLoading: false, connectionError: false },
    monetization: { isAdFree: false, isLoading: false },
    progress: { shape: 'legacy', legacy: fixtureProgressDefault },
    notificationSettings: fixtureNotificationSettingsEnabled,
    favorites: fixtureFavorites,
    streak: fixtureStreakActive,
    simulatedError: null,
  },
  loading: {
    id: 'loading',
    label: 'Loading',
    description: 'Auth + monetization stuck in loading state (spinners / skeletons should show).',
    auth: { user: baseLoggedIn, userData: null, isLoading: true, connectionError: false },
    monetization: { isAdFree: false, isLoading: true },
    progress: { shape: 'empty' },
    notificationSettings: fixtureNotificationSettingsEnabled,
    favorites: [],
    streak: null,
    simulatedError: null,
  },
  empty: {
    id: 'empty',
    label: 'Empty state',
    description: 'Logged in, setup complete, but zero progress/favorites/streak — tests empty-state UI.',
    auth: { user: baseLoggedIn, userData: fixtureUserDataLoggedInComplete, isLoading: false, connectionError: false },
    monetization: { isAdFree: false, isLoading: false },
    progress: { shape: 'empty' },
    notificationSettings: fixtureNotificationSettingsDisabled,
    favorites: [],
    streak: null,
    simulatedError: null,
  },
  error: {
    id: 'error',
    label: 'Error state',
    description: 'Simulated connection/data error — tests error banners/ConnectionErrorScreen paths.',
    auth: { user: baseLoggedIn, userData: null, isLoading: false, connectionError: true },
    monetization: { isAdFree: false, isLoading: false },
    progress: { shape: 'empty' },
    notificationSettings: fixtureNotificationSettingsEnabled,
    favorites: [],
    streak: null,
    simulatedError: fixtureError,
  },
  loggedOut: {
    id: 'loggedOut',
    label: 'Logged out',
    description: 'No authenticated user — tests Onboarding/Login flows.',
    auth: { user: null, userData: null, isLoading: false, connectionError: false },
    monetization: { isAdFree: false, isLoading: false },
    progress: { shape: 'empty' },
    notificationSettings: fixtureNotificationSettingsEnabled,
    favorites: [],
    streak: null,
    simulatedError: null,
  },
  loggedIn: {
    id: 'loggedIn',
    label: 'Logged in',
    description: 'Authenticated user with completed setup, default progress.',
    auth: { user: baseLoggedIn, userData: fixtureUserDataLoggedInComplete, isLoading: false, connectionError: false },
    monetization: { isAdFree: false, isLoading: false },
    progress: { shape: 'legacy', legacy: fixtureProgressDefault },
    notificationSettings: fixtureNotificationSettingsEnabled,
    favorites: fixtureFavorites,
    streak: fixtureStreakActive,
    simulatedError: null,
  },
  setupIncomplete: {
    id: 'setupIncomplete',
    label: 'Setup incomplete',
    description: 'Logged in but has not finished onboarding/setup — tests SetupScreens routing.',
    auth: { user: baseLoggedIn, userData: fixtureUserDataSetupIncomplete, isLoading: false, connectionError: false },
    monetization: { isAdFree: false, isLoading: false },
    progress: { shape: 'empty' },
    notificationSettings: fixtureNotificationSettingsEnabled,
    favorites: [],
    streak: null,
    simulatedError: null,
  },
  premium: {
    id: 'premium',
    label: 'Premium (ad-free)',
    description: 'RevenueCat "premium" entitlement active — ads should be hidden everywhere.',
    auth: { user: baseLoggedIn, userData: fixtureUserDataLoggedInComplete, isLoading: false, connectionError: false },
    monetization: { isAdFree: true, isLoading: false },
    progress: { shape: 'legacy', legacy: fixtureProgressDefault },
    notificationSettings: fixtureNotificationSettingsEnabled,
    favorites: fixtureFavorites,
    streak: fixtureStreakActive,
    simulatedError: null,
  },
  freeWithAds: {
    id: 'freeWithAds',
    label: 'Free (with ads)',
    description: 'No premium entitlement — banner/interstitial/app-open ad paths should be active.',
    auth: { user: baseLoggedIn, userData: fixtureUserDataLoggedInComplete, isLoading: false, connectionError: false },
    monetization: { isAdFree: false, isLoading: false },
    progress: { shape: 'legacy', legacy: fixtureProgressDefault },
    notificationSettings: fixtureNotificationSettingsEnabled,
    favorites: fixtureFavorites,
    streak: fixtureStreakActive,
    simulatedError: null,
  },
  legacyProgress: {
    id: 'legacyProgress',
    label: 'Legacy progress shape',
    description: 'Multi-level learnedWords map (the only shape production code writes today).',
    auth: { user: baseLoggedIn, userData: fixtureUserDataLoggedInComplete, isLoading: false, connectionError: false },
    monetization: { isAdFree: false, isLoading: false },
    progress: { shape: 'legacy', legacy: fixtureLegacyProgress },
    notificationSettings: fixtureNotificationSettingsEnabled,
    favorites: fixtureFavorites,
    streak: fixtureStreakActive,
    simulatedError: null,
  },
  progressByLevel: {
    id: 'progressByLevel',
    label: 'progressByLevel (v2 preview, illustrative)',
    description:
      'Illustrative v2 progressByLevel shape from docs/refactor-v2/07+23. No production repository ' +
      'reads/writes this today — for UI preview only, not a live migration.',
    auth: { user: baseLoggedIn, userData: fixtureUserDataLoggedInComplete, isLoading: false, connectionError: false },
    monetization: { isAdFree: false, isLoading: false },
    progress: { shape: 'progressByLevel', byLevel: fixtureProgressByLevel },
    notificationSettings: fixtureNotificationSettingsEnabled,
    favorites: fixtureFavorites,
    streak: fixtureStreakActive,
    simulatedError: null,
  },
};

export const SCENARIO_LIST: DevToolsScenario[] = Object.values(SCENARIOS);
