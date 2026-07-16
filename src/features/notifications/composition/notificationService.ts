import { LEVELS, getStoredVocabulary, type Level } from '@features/vocabulary';
import { getCurrentLevel, getLearnedWords, markWordAsLearned, unmarkWord } from '@features/progress';
import { getStreakState, isStreakCompletedToday } from '@features/streak';
import i18n from '@shared/i18n';

import { DefaultNotificationFacade } from '../application/DefaultNotificationFacade';
import { configureNotificationApplication } from '../application/notificationService';
import { AsyncStorageNotificationTrackingRepository } from '../data/repositories/AsyncStorageNotificationTrackingRepository';
import { ExpoNotificationPermissionRepository } from '../data/repositories/ExpoNotificationPermissionRepository';
import { ExpoNotificationScheduler } from '../data/repositories/ExpoNotificationScheduler';
import { PendingWordRepository } from '../data/repositories/PendingWordRepository';

const permissionRepository = new ExpoNotificationPermissionRepository();
const scheduler = new ExpoNotificationScheduler();
const trackingRepository = new AsyncStorageNotificationTrackingRepository();
const responseHandler = new PendingWordRepository();

configureNotificationApplication({
  permissionRepository,
  scheduler,
  trackingRepository,
  responseHandler,
  getCurrentLevel,
  isLevel: (value: string): value is Level => LEVELS.includes(value as Level),
  getStoredVocabulary,
  getLearnedWords,
  markWordAsLearned,
  unmarkWord,
  getStreakState,
  isStreakCompletedToday: (state, now) => isStreakCompletedToday(state as Awaited<ReturnType<typeof getStreakState>>, now),
  translate: key => i18n.t(key),
});

export const notificationFacade = new DefaultNotificationFacade();

export * from '../application/notificationService';
