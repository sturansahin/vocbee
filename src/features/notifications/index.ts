// src/features/notifications — public barrel (docs/architecture.md).
// Exposes the stable notification public API. Concrete SDK adapters remain internal to composition.

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
export * from './composition/notificationService';
