// src/features/setup/domain/rules.ts
// Layer: domain | Feature: setup | Pure TS (NO SDK). docs/refactor-v2/13, /27, /37 §9.

import type { UserPreferences } from './types';

// Supported languages — VERBATIM from firestore.rules validLanguage (21 languages) so client-side
// validation matches what the server rules accept (behavior contract — docs/refactor-v2/03 §2, /09).
export const SUPPORTED_LANGUAGES = [
  'amharic',
  'arabic',
  'chinese',
  'english',
  'french',
  'german',
  'hindi',
  'indonesian',
  'italian',
  'japanese',
  'korean',
  'persian',
  'portuguese',
  'russian',
  'serbian',
  'spanish',
  'swahili',
  'thai',
  'turkish',
  'urdu',
  'vietnamese',
] as const;

// User levels — VERBATIM from firestore.rules validUserLevel / vocabularyService.UserLevel.
export const USER_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

export function isValidLanguage(value: unknown): boolean {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function isValidUserLevel(value: unknown): boolean {
  return typeof value === 'string' && (USER_LEVELS as readonly string[]).includes(value);
}

export function isValidUserPreferences(
  prefs: Partial<UserPreferences> | null | undefined,
): prefs is UserPreferences {
  return (
    !!prefs &&
    isValidLanguage(prefs.nativeLanguage) &&
    isValidLanguage(prefs.targetLanguage) &&
    isValidUserLevel(prefs.level)
  );
}

/** Setup may complete only when both languages + a level are valid (matches setupCompleted gating). */
export function canCompleteSetup(prefs: Partial<UserPreferences> | null | undefined): boolean {
  return isValidUserPreferences(prefs);
}

// ─── Generic step-progression primitives (clamped). The actual SetupScreens conditional jumps stay
// in the screen; these are pure building blocks for a future useSetup hook. ───
export function clampStep(step: number, totalSteps: number): number {
  if (totalSteps < 1) return 1;
  if (!Number.isFinite(step) || step < 1) return 1;
  if (step > totalSteps) return totalSteps;
  return Math.floor(step);
}

export function nextStep(step: number, totalSteps: number): number {
  return clampStep(step + 1, totalSteps);
}

export function prevStep(step: number, totalSteps: number): number {
  return clampStep(step - 1, totalSteps);
}

export function isFirstStep(step: number): boolean {
  return step <= 1;
}

export function isLastStep(step: number, totalSteps: number): boolean {
  return step >= totalSteps;
}
