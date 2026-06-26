// src/features/notifications — public barrel (docs/refactor-v2/33 §4).
// Exposes domain (constants/types/rules) + repository/facade INTERFACES. No impl (PREP).

export * from './domain/constants';
export * from './domain/types';
export * from './domain/rules';
export type {
  NotificationPermissionRepository,
  NotificationScheduler,
  NotificationTrackingRepository,
  NotificationResponseHandler,
} from './data/contracts';
export type { NotificationFacade } from './application/contracts';
