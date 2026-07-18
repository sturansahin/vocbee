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
  return !!(
    data?.setupCompleted ||
    (data?.preferences?.nativeLanguage && data?.preferences?.targetLanguage)
  );
}

export function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign in is not enabled.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
}

export type LoginValidationError = 'fillAllFields';
export type RegistrationValidationError =
  | 'fillAllFields'
  | 'invalidEmail'
  | 'passwordsMismatch'
  | 'passwordTooShort'
  | 'acceptPrivacyRequired';
export type ForgotPasswordValidationError = 'enterEmail' | 'invalidEmail';

export function validateLogin(email: string, password: string): LoginValidationError | null {
  return !email || !password ? 'fillAllFields' : null;
}

export function validateRegistration(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  hasAcceptedPrivacyPolicy: boolean;
}): RegistrationValidationError | null {
  if (!input.name || !input.email || !input.password || !input.confirmPassword) {
    return 'fillAllFields';
  }
  if (!/\S+@\S+\.\S+/.test(input.email)) return 'invalidEmail';
  if (input.password !== input.confirmPassword) return 'passwordsMismatch';
  if (input.password.length < 6) return 'passwordTooShort';
  if (!input.hasAcceptedPrivacyPolicy) return 'acceptPrivacyRequired';
  return null;
}

export function validateForgotPassword(email: string): ForgotPasswordValidationError | null {
  if (!email) return 'enterEmail';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : 'invalidEmail';
}
