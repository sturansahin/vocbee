import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import resources from '../locales';

const LANGUAGE_DETECTOR = {
    type: 'languageDetector' as const,
    async: true,
    detect: async (callback: (lang: string) => void) => {
        try {
            // 1. Check for manually selected language
            const savedLanguage = await AsyncStorage.getItem('@user_language');
            if (savedLanguage) {
                return callback(savedLanguage);
            }

            // 2. Check device language
            const deviceLanguage = getLocales()[0]?.languageCode;

            // Check if we support this language, otherwise fallback to 'en'
            // The resources object keys are our supported languages
            const supportedLanguages = Object.keys(resources);

            if (deviceLanguage && supportedLanguages.includes(deviceLanguage)) {
                return callback(deviceLanguage);
            }

            return callback('en');
        } catch (error) {
            console.log('Error reading language', error);
            callback('en');
        }
    },
    init: () => { },
    cacheUserLanguage: async (language: string) => {
        try {
            await AsyncStorage.setItem('@user_language', language);
        } catch (error) {
            console.log('Error saving language', error);
        }
    },
};

i18n
    .use(LANGUAGE_DETECTOR)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // react already safes from xss
        },
        react: {
            useSuspense: false, // helpful for React Native
        },
    });

// Get device language code
export const getDeviceLanguage = (): string => {
    const deviceLanguage = getLocales()[0]?.languageCode;
    const supportedLanguages = Object.keys(resources);

    if (deviceLanguage && supportedLanguages.includes(deviceLanguage)) {
        return deviceLanguage;
    }
    return 'en';
};

// Set app to use device language (removes saved preference)
export const setToDeviceLanguage = async (): Promise<string> => {
    try {
        // Remove saved preference so app uses device language
        await AsyncStorage.removeItem('@user_language');
        const deviceLang = getDeviceLanguage();
        await i18n.changeLanguage(deviceLang);
        return deviceLang;
    } catch (error) {
        console.log('Error setting device language', error);
        return 'en';
    }
};

// Check if using system default (no saved preference)
export const isUsingSystemLanguage = async (): Promise<boolean> => {
    try {
        const savedLanguage = await AsyncStorage.getItem('@user_language');
        return savedLanguage === null;
    } catch (error) {
        return true;
    }
};

export default i18n;
