import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import resources from '../../../locales';
import { STORAGE_KEYS } from '@shared/storage';
import { applyRTLLayout } from './rtl';

const USER_LANGUAGE_KEY = STORAGE_KEYS.USER_LANGUAGE;
const LAST_SYSTEM_LANGUAGE_KEY = STORAGE_KEYS.LAST_SYSTEM_LANGUAGE;
const supportedLanguages = Object.keys(resources);

export function normalizeLanguageCode(language?: string | null): string | null {
  const normalized = language?.trim().toLowerCase().split(/[-_]/)[0];
  return normalized && supportedLanguages.includes(normalized) ? normalized : null;
}

// Get the current OS/per-app language and constrain it to translations bundled by VocBee.
export const getDeviceLanguage = (): string => {
  return normalizeLanguageCode(getLocales()[0]?.languageCode) ?? 'en';
};

export function getResolvedAppLanguage(): string {
  return normalizeLanguageCode(i18n.resolvedLanguage || i18n.language) ?? 'en';
}

export async function detectInitialLanguage(): Promise<string> {
  // iOS already owns per-app language selection. Old versions cached the detected
  // language as if it were a manual choice, which prevented iOS Settings changes
  // from taking effect. Clear that ambiguous legacy value on every iOS launch.
  if (Platform.OS === 'ios') {
    await AsyncStorage.removeItem(USER_LANGUAGE_KEY);
    return getDeviceLanguage();
  }

  const savedLanguage = normalizeLanguageCode(await AsyncStorage.getItem(USER_LANGUAGE_KEY));
  return savedLanguage ?? getDeviceLanguage();
}

const LANGUAGE_DETECTOR = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      callback(await detectInitialLanguage());
    } catch (error) {
      console.log('Error reading language', error);
      callback('en');
    }
  },
  init: () => {},
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

// Apply RTL layout when language changes (e.g. user switches to Arabic/Persian/Urdu)
i18n.on('languageChanged', (lng: string) => {
  applyRTLLayout(lng);
});

export interface SystemLanguageSyncResult {
  language: string;
  changed: boolean;
}

export const setAppLanguage = async (language: string): Promise<string> => {
  const normalized = normalizeLanguageCode(language);
  if (!normalized) {
    throw new Error(`Unsupported app language: ${language}`);
  }

  // On iOS, the per-app language selected in Settings is authoritative.
  if (Platform.OS === 'ios') {
    return setToDeviceLanguage();
  }

  await AsyncStorage.setItem(USER_LANGUAGE_KEY, normalized);
  await i18n.changeLanguage(normalized);
  return normalized;
};

// Set app to use device language (removes saved preference)
export const setToDeviceLanguage = async (): Promise<string> => {
  try {
    // Remove saved preference so app uses device language
    await AsyncStorage.removeItem(USER_LANGUAGE_KEY);
    const deviceLang = getDeviceLanguage();
    await i18n.changeLanguage(deviceLang);
    return deviceLang;
  } catch (error) {
    console.log('Error setting device language', error);
    return 'en';
  }
};

export const syncLanguageWithSystem = async (): Promise<SystemLanguageSyncResult> => {
  const savedLanguage = await AsyncStorage.getItem(USER_LANGUAGE_KEY);
  const shouldFollowSystem = Platform.OS === 'ios' || savedLanguage === null;
  const currentLanguage = normalizeLanguageCode(i18n.resolvedLanguage || i18n.language);

  if (!shouldFollowSystem) {
    return {
      language: currentLanguage ?? normalizeLanguageCode(savedLanguage) ?? 'en',
      changed: false,
    };
  }

  if (Platform.OS === 'ios' && savedLanguage !== null) {
    await AsyncStorage.removeItem(USER_LANGUAGE_KEY);
  }

  const systemLanguage = getDeviceLanguage();
  const lastSystemLanguage = normalizeLanguageCode(
    await AsyncStorage.getItem(LAST_SYSTEM_LANGUAGE_KEY),
  );
  const changed = currentLanguage !== systemLanguage || lastSystemLanguage !== systemLanguage;

  if (currentLanguage !== systemLanguage) {
    await i18n.changeLanguage(systemLanguage);
  }
  await AsyncStorage.setItem(LAST_SYSTEM_LANGUAGE_KEY, systemLanguage);

  return { language: systemLanguage, changed };
};

// Check if using system default (no saved preference)
export const isUsingSystemLanguage = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') return true;

  try {
    const savedLanguage = await AsyncStorage.getItem(USER_LANGUAGE_KEY);
    return savedLanguage === null;
  } catch (error) {
    return true;
  }
};

export default i18n;
