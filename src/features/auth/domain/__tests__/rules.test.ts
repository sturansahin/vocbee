// Pure auth domain rules — must match context/AuthContext.tsx logic exactly (behavior contract).
import { isRecentLogin, hasCompletedSetup, RECENT_LOGIN_WINDOW_MS } from '../rules';

describe('auth domain rules', () => {
  describe('isRecentLogin (RECENT_LOGIN_WINDOW_MS = 5 min)', () => {
    const now = 1_700_000_000_000;
    it('is recent within the window (inclusive of the exact edge)', () => {
      expect(isRecentLogin(now, now)).toBe(true);
      expect(isRecentLogin(now - 1000, now)).toBe(true);
      expect(isRecentLogin(now - RECENT_LOGIN_WINDOW_MS, now)).toBe(true);
    });
    it('is NOT recent past the window', () => {
      expect(isRecentLogin(now - RECENT_LOGIN_WINDOW_MS - 1, now)).toBe(false);
    });
    it('is NOT recent when timestamp is non-finite (missing lastSignInTime)', () => {
      expect(isRecentLogin(NaN, now)).toBe(false);
    });
  });

  describe('hasCompletedSetup', () => {
    it('true when setupCompleted is true', () => {
      expect(hasCompletedSetup({ setupCompleted: true })).toBe(true);
    });
    it('true when both native+target preferences exist', () => {
      expect(hasCompletedSetup({ preferences: { nativeLanguage: 'turkish', targetLanguage: 'english' } })).toBe(true);
    });
    it('false otherwise', () => {
      expect(hasCompletedSetup(null)).toBe(false);
      expect(hasCompletedSetup(undefined)).toBe(false);
      expect(hasCompletedSetup({})).toBe(false);
      expect(hasCompletedSetup({ preferences: null })).toBe(false);
      expect(hasCompletedSetup({ preferences: { nativeLanguage: 'turkish' } })).toBe(false);
      expect(hasCompletedSetup({ preferences: { targetLanguage: 'english' } })).toBe(false);
    });
  });
});
