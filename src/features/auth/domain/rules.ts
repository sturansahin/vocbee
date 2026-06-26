// src/features/auth/domain/rules.ts
// Layer: domain | Feature: auth | Pure TS (NO SDK — docs/refactor-v2/33).
// Verbatim-equivalent extraction of the rules currently inlined in context/AuthContext.tsx
// (behavior contract — docs/refactor-v2/03 §3, /24 §9). Values MUST match the existing logic.

// Recent-login window for sensitive operations (account deletion). Matches AuthContext.RECENT_LOGIN_WINDOW_MS.
export const RECENT_LOGIN_WINDOW_MS = 5 * 60 * 1000;

/**
 * True when the user's last sign-in is within the recent-login window.
 * Mirrors AuthContext.assertRecentLogin: a non-finite timestamp (e.g. missing lastSignInTime) is NOT recent.
 *   AuthContext throws when: !Number.isFinite(t) || (now - t) > WINDOW  → i.e. recent when finite && (now - t) <= WINDOW
 */
export function isRecentLogin(lastSignInTimeMs: number, nowMs: number): boolean {
  return Number.isFinite(lastSignInTimeMs) && nowMs - lastSignInTimeMs <= RECENT_LOGIN_WINDOW_MS;
}

export interface SetupCompletionData {
  setupCompleted?: boolean;
  preferences?: { nativeLanguage?: string; targetLanguage?: string } | null;
}

/**
 * True when setup is complete. Mirrors AuthContext.hasCompletedSetup EXACTLY:
 *   !!(setupCompleted || (preferences.nativeLanguage && preferences.targetLanguage))
 */
export function hasCompletedSetup(data: SetupCompletionData | null | undefined): boolean {
  return !!(data?.setupCompleted || (data?.preferences?.nativeLanguage && data?.preferences?.targetLanguage));
}
