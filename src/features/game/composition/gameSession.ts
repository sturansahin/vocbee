import * as Crypto from 'expo-crypto';
import { AccessibilityInfo, Appearance } from 'react-native';

import { getCurrentLevel, getLearnedWords } from '@features/progress';
import { getLanguagePair, getStoredVocabulary } from '@features/vocabulary';

import { openGame } from '../../../../modules/vocbee-unity';
import { buildGameSession, validateGameSession, type GameSessionV1 } from '../domain/gameSession';

export async function prepareGameSession(): Promise<GameSessionV1> {
  const [level, languagePair, reducedMotion] = await Promise.all([
    getCurrentLevel(),
    getLanguagePair(),
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false),
  ]);
  const [vocabulary, learnedWordIds] = await Promise.all([
    getStoredVocabulary(level),
    getLearnedWords(level),
  ]);
  const session = buildGameSession({
    sessionId: Crypto.randomUUID(),
    level,
    nativeLanguage: languagePair?.native,
    targetLanguage: languagePair?.target,
    vocabulary,
    learnedWordIds,
    reducedMotion,
    theme: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
  });

  if (!validateGameSession(session)) throw new Error('Invalid game session generated');
  return session;
}

export async function prepareGameSessionJson(): Promise<string> {
  return JSON.stringify(await prepareGameSession());
}

export async function launchGameSession(): Promise<GameSessionV1> {
  const session = await prepareGameSession();
  const result = await openGame(JSON.stringify(session));
  if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
  return session;
}
