import { AccessibilityInfo, Appearance } from 'react-native';

import { prepareGameSession } from '../gameSession';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'session-1' }));
jest.mock('@features/progress', () => ({
  getCurrentLevel: async () => 'A1',
  getLearnedWords: async () => [],
}));
jest.mock('@features/vocabulary', () => ({
  VOCABULARY_SCHEMA_VERSION: 2,
  getLanguagePair: async () => ({ native: 'turkish', target: 'english' }),
  getStoredVocabulary: async () => [],
  isLevel: (value: unknown) => value === 'A1',
  shuffleArray: <T>(values: T[]) => [...values],
}));
jest.mock('../../../../../modules/vocbee-unity', () => ({ openGame: jest.fn() }));

it('passes the platform accessibility and theme preferences into the game session', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValueOnce(true);
  jest.spyOn(Appearance, 'getColorScheme').mockReturnValueOnce('dark');

  await expect(prepareGameSession()).resolves.toMatchObject({
    reducedMotion: true,
    theme: 'dark',
  });
});
