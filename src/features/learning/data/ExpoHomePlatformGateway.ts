import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import type { HomePlatformGateway } from '../application/contracts';

export class ExpoHomePlatformGateway implements HomePlatformGateway {
  getItem(key: string) {
    return AsyncStorage.getItem(key);
  }

  setItem(key: string, value: string) {
    return AsyncStorage.setItem(key, value);
  }

  async speak(text: string, options: { language: string; pitch: number; rate: number }) {
    await Speech.stop();
    Speech.speak(text, options);
  }
}
