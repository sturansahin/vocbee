// src/features/setup/presentation/steps/index.ts
// Barrel — pure UI step components extracted from screens/SetupScreens.tsx (ADIM 4).
// All state/handlers/refs/animated values/modals stay in the parent screen; these components
// only receive props and render structure. No business logic here.

export { NativeLanguageStep } from './NativeLanguageStep';
export type { NativeLanguageStepProps, LanguageOption } from './NativeLanguageStep';

export { TargetLanguageStep } from './TargetLanguageStep';
export type { TargetLanguageStepProps } from './TargetLanguageStep';

export { LevelStep } from './LevelStep';
export type { LevelStepProps, LevelOption } from './LevelStep';

export { NotificationPermissionStep } from './NotificationPermissionStep';
export type { NotificationPermissionStepProps } from './NotificationPermissionStep';

export { NotificationScheduleStartStep } from './NotificationScheduleStartStep';
export type { NotificationScheduleStartStepProps } from './NotificationScheduleStartStep';

export { NotificationScheduleEndStep } from './NotificationScheduleEndStep';
export type { NotificationScheduleEndStepProps } from './NotificationScheduleEndStep';

export { SetupCompleteStep } from './SetupCompleteStep';
export type { SetupCompleteStepProps } from './SetupCompleteStep';
