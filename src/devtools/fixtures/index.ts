// src/devtools/fixtures/index.ts
// Static fake data used by devtools scenarios/mock providers. Nothing here touches
// Firebase/Firestore/AsyncStorage — pure in-memory objects only.
//
// Shape note: `UserData` (src/shared/storage/storage.ts) only carries
// { uid, email, displayName, setupCompleted, preferences }. Progress, streak, favorites and
// notification settings are separate domains (services/progressService, streakService,
// favoritesService, notificationService) — fixtured separately below to match real usage.

import type { UserData } from '@shared/storage';

export const FIXTURE_UID = 'devtools-fake-uid';

export const fixtureUserDataLoggedInComplete: UserData = {
  uid: FIXTURE_UID,
  email: 'devtools@example.com',
  displayName: 'DevTools User',
  setupCompleted: true,
  preferences: {
    nativeLanguage: 'turkish',
    targetLanguage: 'english',
    level: 'beginner',
  },
};

export const fixtureUserDataSetupIncomplete: UserData = {
  uid: FIXTURE_UID,
  email: 'devtools@example.com',
  displayName: 'DevTools User',
  setupCompleted: false,
};

export const fixtureUserDataLoggedOut: null = null;

// Legacy progress shape — matches firestore.rules `validProgress()` / services/progressService.ts
// (currentLevel + learnedWords map + lastWordIndex). It remains the safe-default production shape
// and is retained during the dual-write compatibility window.
export const fixtureLegacyProgress = {
  currentLevel: 'B1',
  learnedWords: {
    A1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    A2: [1, 2, 3],
    B1: [1],
  },
  lastWordIndex: 1,
};

export const fixtureProgressDefault = {
  currentLevel: 'A1',
  learnedWords: { A1: [1, 2, 3, 4, 5] },
  lastWordIndex: 5,
};

export const fixtureProgressEmpty = {
  currentLevel: 'A1',
  learnedWords: {},
  lastWordIndex: 0,
};

// "progressByLevel" fixture models the rollout-gated v2 shape. Devtools remains fixture-only and
// never reads or writes live Firestore data.
export const fixtureProgressByLevel = {
  A1: {
    level: 'A1' as const,
    learnedWordIds: [1, 2, 3, 4, 5],
    lastWordId: 5,
    learnedCount: 5,
    vocabularySchemaVersion: 2,
    version: 2,
  },
  A2: { level: 'A2' as const, learnedWordIds: [], lastWordId: 0, learnedCount: 0, vocabularySchemaVersion: 2, version: 2 },
  B1: { level: 'B1' as const, learnedWordIds: [], lastWordId: 0, learnedCount: 0, vocabularySchemaVersion: 2, version: 2 },
  B2: { level: 'B2' as const, learnedWordIds: [], lastWordId: 0, learnedCount: 0, vocabularySchemaVersion: 2, version: 2 },
  C1: { level: 'C1' as const, learnedWordIds: [], lastWordId: 0, learnedCount: 0, vocabularySchemaVersion: 2, version: 2 },
};

export const fixtureStreakActive = {
  currentStreak: 3,
  longestStreak: 7,
  brokenStreak: null,
  lastQualifiedDay: null,
  lastQualifiedAt: null,
};

export const fixtureStreakBroken = {
  currentStreak: 0,
  longestStreak: 7,
  brokenStreak: 4,
  lastQualifiedDay: null,
  lastQualifiedAt: null,
};

export const fixtureNotificationSettingsEnabled = {
  enabled: true,
  startHour: 9,
  startMinute: 0,
  endHour: 21,
  endMinute: 0,
  frequencyMinutes: 120,
  autoMarkLearned: false,
};

export const fixtureNotificationSettingsDisabled = {
  enabled: false,
  startHour: 9,
  startMinute: 0,
  endHour: 21,
  endMinute: 0,
  frequencyMinutes: 360,
  autoMarkLearned: false,
};

export const fixtureFavorites = [1, 3, 7];

export const fixtureError = new Error('DevTools fixture error: simulated failure for error-state testing');
