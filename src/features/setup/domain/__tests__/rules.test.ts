// Pure setup domain rules. Validation mirrors firestore.rules (21 languages, beginner/intermediate/advanced).
import {
  isValidLanguage,
  isValidUserLevel,
  isValidUserPreferences,
  canCompleteSetup,
  clampStep,
  nextStep,
  prevStep,
  isFirstStep,
  isLastStep,
  SUPPORTED_LANGUAGES,
  USER_LEVELS,
} from '../rules';

describe('setup domain rules', () => {
  describe('language / level validation', () => {
    it('validates the 21 supported languages', () => {
      expect(SUPPORTED_LANGUAGES).toHaveLength(21);
      expect(isValidLanguage('english')).toBe(true);
      expect(isValidLanguage('turkish')).toBe(true);
      expect(isValidLanguage('klingon')).toBe(false);
      expect(isValidLanguage('')).toBe(false);
      expect(isValidLanguage(123)).toBe(false);
    });
    it('validates user levels (CEFR codes are NOT user levels)', () => {
      expect(USER_LEVELS).toEqual(['beginner', 'intermediate', 'advanced']);
      expect(isValidUserLevel('beginner')).toBe(true);
      expect(isValidUserLevel('advanced')).toBe(true);
      expect(isValidUserLevel('A1')).toBe(false);
      expect(isValidUserLevel('expert')).toBe(false);
    });
  });

  describe('isValidUserPreferences / canCompleteSetup', () => {
    it('true for complete, valid preferences', () => {
      const p = { nativeLanguage: 'turkish', targetLanguage: 'english', level: 'beginner' };
      expect(isValidUserPreferences(p)).toBe(true);
      expect(canCompleteSetup(p)).toBe(true);
    });
    it('false when any field is missing or invalid', () => {
      expect(canCompleteSetup(null)).toBe(false);
      expect(canCompleteSetup(undefined)).toBe(false);
      expect(canCompleteSetup({})).toBe(false);
      expect(canCompleteSetup({ nativeLanguage: 'turkish', targetLanguage: 'english' })).toBe(
        false,
      );
      expect(
        canCompleteSetup({ nativeLanguage: 'turkish', targetLanguage: 'english', level: 'A1' }),
      ).toBe(false);
      expect(
        canCompleteSetup({
          nativeLanguage: 'klingon',
          targetLanguage: 'english',
          level: 'beginner',
        }),
      ).toBe(false);
    });
  });

  describe('step primitives', () => {
    it('clampStep clamps to [1, total]', () => {
      expect(clampStep(0, 7)).toBe(1);
      expect(clampStep(3, 7)).toBe(3);
      expect(clampStep(9, 7)).toBe(7);
      expect(clampStep(NaN, 7)).toBe(1);
    });
    it('next/prev clamp at boundaries', () => {
      expect(nextStep(1, 7)).toBe(2);
      expect(nextStep(7, 7)).toBe(7);
      expect(prevStep(3, 7)).toBe(2);
      expect(prevStep(1, 7)).toBe(1);
    });
    it('first/last', () => {
      expect(isFirstStep(1)).toBe(true);
      expect(isFirstStep(2)).toBe(false);
      expect(isLastStep(7, 7)).toBe(true);
      expect(isLastStep(6, 7)).toBe(false);
    });
  });
});
