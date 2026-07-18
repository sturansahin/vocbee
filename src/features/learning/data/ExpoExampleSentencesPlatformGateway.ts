import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { STORAGE_KEYS } from '@shared/storage';

import { getTTSLanguageCode } from '@shared/i18n';
import type { ExampleSentencesPlatformGateway } from '../application/exampleSentencesContracts';

export class ExpoExampleSentencesPlatformGateway implements ExampleSentencesPlatformGateway {
  async getNativeLanguage(): Promise<string> {
    return (await AsyncStorage.getItem(STORAGE_KEYS.NATIVE_LANGUAGE)) || 'English';
  }

  async speak(text: string): Promise<void> {
    const targetLanguage = await AsyncStorage.getItem(STORAGE_KEYS.TARGET_LANGUAGE);
    await Speech.stop();
    await Speech.speak(text, {
      language: getTTSLanguageCode(targetLanguage || 'english'),
      pitch: 1,
      rate: 0.85,
    });
  }
}
