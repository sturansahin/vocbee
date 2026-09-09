import { AccessibilityInfo, Appearance } from 'react-native';
import { gameRunnerTranslations } from '../../../../../locales/gameRunner';

import {
  GAME_SESSION_JSON_BUDGET_BYTES,
  launchGameSession,
  prepareGameSession,
  prepareGameSessionJson,
} from '../gameSession';

const mockGetCurrentLevel = jest.fn();
const mockGetLearnedWords = jest.fn();
const mockGetLanguagePair = jest.fn();
const mockOnGameEvent = jest.fn();
const mockOpenGame = jest.fn();
const mockRemoveListener = jest.fn();
let gameEventListener: ((eventJson: string) => void) | undefined;

jest.mock('expo-crypto', () => ({
  randomUUID: () => '123e4567-e89b-42d3-a456-426614174000',
}));
jest.mock('@features/progress', () => ({
  getCurrentLevel: () => mockGetCurrentLevel(),
  getLearnedWords: (...args: unknown[]) => mockGetLearnedWords(...args),
}));
jest.mock('@features/vocabulary', () => ({
  VOCABULARY_SCHEMA_VERSION: 2,
  getLanguagePair: () => mockGetLanguagePair(),
  isLevel: (value: unknown) => ['A1', 'A2', 'B1', 'B2', 'C1'].includes(value as string),
}));
jest.mock('../../../../../modules/vocbee-unity', () => ({
  onGameEvent: (listener: (eventJson: string) => void) => mockOnGameEvent(listener),
  openGame: (...args: unknown[]) => mockOpenGame(...args),
}));
jest.mock('@shared/i18n', () => {
  const translations = jest.requireActual('../../../../../locales/gameRunner')
    .gameRunnerTranslations as typeof gameRunnerTranslations;
  return {
    getResolvedAppLanguage: () => 'en',
    i18n: {
      getFixedT: (language: keyof typeof translations) => (key: string) => {
        const field = key.replace('game.runner.', '') as keyof (typeof translations)['en'];
        return translations[language][field];
      },
    },
    isRTLLanguage: (language: string) => ['ar', 'fa', 'ur'].includes(language),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  gameEventListener = undefined;
  mockGetCurrentLevel.mockResolvedValue('A1');
  mockGetLanguagePair.mockResolvedValue({ native: 'turkish', target: 'english' });
  mockGetLearnedWords.mockResolvedValue([]);
  mockOpenGame.mockResolvedValue({ ok: true });
  mockOnGameEvent.mockImplementation((listener) => {
    gameEventListener = listener;
    return { remove: mockRemoveListener };
  });
});

it('builds the V4 session from read-only state and presentation preferences', async () => {
  mockGetLearnedWords.mockResolvedValueOnce([42, 1]);
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValueOnce(true);
  jest.spyOn(Appearance, 'getColorScheme').mockReturnValueOnce('dark');

  const session = await prepareGameSession();

  expect(session).toMatchObject({
    schemaVersion: 4,
    catalogVersion: 1,
    nativeLanguage: 'turkish',
    targetLanguage: 'english',
    learnedWordIds: [1, 42],
    reducedMotion: true,
    theme: 'dark',
    uiLanguage: 'en',
    isRtl: false,
    uiText: gameRunnerTranslations.en,
  });
  expect(mockGetLearnedWords).toHaveBeenCalledWith('A1');
  expect(session).not.toHaveProperty('rounds');
  expect(session).not.toHaveProperty('newWords');
  expect(session).not.toHaveProperty('review');
});

it('keeps the complete B2 learned snapshot below 32 KiB without trimming', async () => {
  const learnedWordIds = Array.from({ length: 1_424 }, (_, index) => index + 1);
  mockGetCurrentLevel.mockResolvedValueOnce('B2');
  mockGetLearnedWords.mockResolvedValueOnce(learnedWordIds);

  const sessionJson = await prepareGameSessionJson();
  const session = JSON.parse(sessionJson);

  expect(session.learnedWordIds).toEqual(learnedWordIds);
  expect(Buffer.byteLength(sessionJson, 'utf8')).toBeLessThanOrEqual(
    GAME_SESSION_JSON_BUDGET_BYTES,
  );
});

it('registers the session listener before launch and cleans it up safely', async () => {
  const order: string[] = [];
  mockOnGameEvent.mockImplementationOnce((listener) => {
    order.push('listener');
    gameEventListener = listener;
    return { remove: mockRemoveListener };
  });
  mockOpenGame.mockImplementationOnce(async () => {
    order.push('open');
    return { ok: true };
  });

  const session = await launchGameSession();

  expect(order).toEqual(['listener', 'open']);
  expect(JSON.parse(mockOpenGame.mock.calls[0][0])).toMatchObject({
    schemaVersion: 4,
    sessionId: session.sessionId,
  });
  gameEventListener?.('{bad json');
  gameEventListener?.(
    JSON.stringify({ type: 'finished', sessionId: '00000000-0000-4000-8000-000000000000' }),
  );
  expect(mockRemoveListener).not.toHaveBeenCalled();
  gameEventListener?.(JSON.stringify({ type: 'finished', sessionId: session.sessionId }));
  expect(mockRemoveListener).toHaveBeenCalledTimes(1);

  mockOpenGame.mockResolvedValueOnce({ ok: false, code: 'UNITY_LAUNCH_FAILED', message: 'failed' });
  await expect(launchGameSession()).rejects.toThrow('UNITY_LAUNCH_FAILED: failed');
  expect(mockRemoveListener).toHaveBeenCalledTimes(2);
});
