// file: src/shared/i18n/__tests__/i18n.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Mock expo-localization
const mockGetLocales = jest.fn();
jest.mock('expo-localization', () => ({
  getLocales: () => mockGetLocales(),
}));

// Mock i18next before importing
jest.mock('i18next', () => {
  const actual = jest.requireActual('i18next');
  return {
    ...actual,
    use: jest.fn().mockReturnThis(),
    init: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    changeLanguage: jest.fn().mockResolvedValue(undefined),
    t: jest.fn((key: string) => key),
  };
});

// Import after mocks
import i18n, {
  detectInitialLanguage,
  getDeviceLanguage,
  isUsingSystemLanguage,
  setAppLanguage,
  setToDeviceLanguage,
  syncLanguageWithSystem,
} from '../i18n';

describe('i18n Service', () => {
  const originalPlatform = Platform.OS;

  beforeEach(async () => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    await AsyncStorage.clear();
    mockGetLocales.mockReturnValue([{ languageCode: 'en' }]);
    (i18n as any).language = 'en';
    (i18n as any).resolvedLanguage = 'en';
    (i18n.changeLanguage as jest.Mock).mockImplementation(async (language: string) => {
      (i18n as any).language = language;
      (i18n as any).resolvedLanguage = language;
    });
  });

  afterAll(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
  });

  describe('getDeviceLanguage', () => {
    it('returns device language when supported', () => {
      mockGetLocales.mockReturnValue([{ languageCode: 'de' }]);

      const result = getDeviceLanguage();

      expect(result).toBe('de');
    });

    it('returns en when device language is not supported', () => {
      mockGetLocales.mockReturnValue([{ languageCode: 'xyz' }]);

      const result = getDeviceLanguage();

      expect(result).toBe('en');
    });

    it('returns en when locales array is empty', () => {
      mockGetLocales.mockReturnValue([]);

      const result = getDeviceLanguage();

      expect(result).toBe('en');
    });

    it('returns en when languageCode is undefined', () => {
      mockGetLocales.mockReturnValue([{ languageCode: undefined }]);

      const result = getDeviceLanguage();

      expect(result).toBe('en');
    });
  });

  describe('setToDeviceLanguage', () => {
    it('removes saved language preference', async () => {
      await AsyncStorage.setItem('@user_language', 'de');
      mockGetLocales.mockReturnValue([{ languageCode: 'fr' }]);

      await setToDeviceLanguage();

      const savedLang = await AsyncStorage.getItem('@user_language');
      expect(savedLang).toBeNull();
    });

    it('returns device language', async () => {
      mockGetLocales.mockReturnValue([{ languageCode: 'es' }]);

      const result = await setToDeviceLanguage();

      expect(result).toBe('es');
    });

    it('returns en on error', async () => {
      mockGetLocales.mockReturnValue([]);

      const result = await setToDeviceLanguage();

      expect(result).toBe('en');
    });
  });

  describe('language preference ownership', () => {
    it('persists only an explicit manual language selection on non-iOS platforms', async () => {
      await setAppLanguage('de-DE');

      await expect(AsyncStorage.getItem('@user_language')).resolves.toBe('de');
      expect(i18n.changeLanguage).toHaveBeenCalledWith('de');
    });

    it('clears the legacy cached language and follows the iOS per-app locale', async () => {
      Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
      await AsyncStorage.setItem('@user_language', 'tr');
      mockGetLocales.mockReturnValue([{ languageCode: 'de' }]);

      await expect(detectInitialLanguage()).resolves.toBe('de');
      await expect(AsyncStorage.getItem('@user_language')).resolves.toBeNull();
    });

    it('reconciles an iOS locale change and records the last applied system language', async () => {
      Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
      await AsyncStorage.multiSet([
        ['@user_language', 'tr'],
        ['@last_system_language', 'tr'],
      ]);
      mockGetLocales.mockReturnValue([{ languageCode: 'de' }]);
      (i18n as any).language = 'tr';
      (i18n as any).resolvedLanguage = 'tr';

      await expect(syncLanguageWithSystem()).resolves.toEqual({
        language: 'de',
        changed: true,
      });
      expect(i18n.changeLanguage).toHaveBeenCalledWith('de');
      await expect(AsyncStorage.getItem('@user_language')).resolves.toBeNull();
      await expect(AsyncStorage.getItem('@last_system_language')).resolves.toBe('de');
    });

    it('does not replace an explicit Android language during system reconciliation', async () => {
      await AsyncStorage.setItem('@user_language', 'tr');
      mockGetLocales.mockReturnValue([{ languageCode: 'de' }]);
      (i18n as any).language = 'tr';
      (i18n as any).resolvedLanguage = 'tr';

      await expect(syncLanguageWithSystem()).resolves.toEqual({
        language: 'tr',
        changed: false,
      });
      expect(i18n.changeLanguage).not.toHaveBeenCalled();
    });
  });

  describe('isUsingSystemLanguage', () => {
    it('returns true when no saved preference', async () => {
      const result = await isUsingSystemLanguage();

      expect(result).toBe(true);
    });

    it('returns false when language is saved', async () => {
      await AsyncStorage.setItem('@user_language', 'de');

      const result = await isUsingSystemLanguage();

      expect(result).toBe(false);
    });

    it('always follows the native per-app language on iOS', async () => {
      Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
      await AsyncStorage.setItem('@user_language', 'de');

      await expect(isUsingSystemLanguage()).resolves.toBe(true);
    });
  });
});
