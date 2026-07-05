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
// (currentLevel + learnedWords map + lastWordIndex). This is the ONLY shape currently written by
// production code (docs/refactor-v2/phase-9-firestore-cleanup-plan.md §0).
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

// "progressByLevel" fixture models the v2 shape described in docs/refactor-v2/07 + 23 for
// dev-panel preview purposes only. No production repository reads/writes this shape today
// (see docs/refactor-v2/phase-9-firestore-cleanup-plan.md §0) — this is illustrative fixture data,
// not a live migration path.
export const fixtureProgressByLevel = {
  A1: { level: 'A1' as const, learnedWordIds: [1, 2, 3, 4, 5], lastWordIndex: 5, learnedCount: 5 },
  A2: { level: 'A2' as const, learnedWordIds: [], lastWordIndex: 0, learnedCount: 0 },
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
