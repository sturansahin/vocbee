// file: services/__tests__/i18n.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

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
import { getDeviceLanguage, setToDeviceLanguage, isUsingSystemLanguage } from '../i18n';

describe('i18n Service', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await AsyncStorage.clear();
        mockGetLocales.mockReturnValue([{ languageCode: 'en' }]);
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
    });
});
