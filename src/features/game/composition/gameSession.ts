import * as Crypto from 'expo-crypto';
import { AccessibilityInfo, Appearance } from 'react-native';

import { getCurrentLevel, getLearnedWords } from '@features/progress';
import { getLanguagePair, getStoredVocabulary } from '@features/vocabulary';
import { getResolvedAppLanguage, i18n, isRTLLanguage } from '@shared/i18n';

import { openGame } from '../../../../modules/vocbee-unity';
import {
  buildGameSession,
  validateGameSession,
  type GameSessionV2,
  type GameUiTextV1,
} from '../domain/gameSession';

const MAX_SESSION_JSON_BYTES = 64 * 1024;

function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff && index + 1 < value.length) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4;
        index += 1;
      } else bytes += 3;
    } else bytes += 3;

    if (bytes > MAX_SESSION_JSON_BYTES) return bytes;
  }
  return bytes;
}

const GAME_UI_TEXT_KEYS: readonly (keyof GameUiTextV1)[] = [
  'tapToPlay',
  'readySubtitle',
  'wordLabel',
  'comboTemplate',
  'correctFeedback',
  'wrongFeedback',
  'swipeHint',
  'pauseTitle',
  'pauseSubtitle',
  'resume',
  'restart',
  'returnHome',
  'newRecord',
  'runCompleted',
  'scoreTemplate',
  'bestScoreTemplate',
  'bestComboTemplate',
  'heartsTemplate',
  'playAgain',
  'startScreen',
  'noHearts',
  'wrongWord',
  'heartsRenewed',
];

export function resolveGameUiText(language: string): GameUiTextV1 {
  const translate = i18n.getFixedT(language);
  return Object.fromEntries(
    GAME_UI_TEXT_KEYS.map((key) => [key, translate(`game.runner.${key}`)]),
  ) as GameUiTextV1;
}

function fitSessionToBridge(session: GameSessionV2): GameSessionV2 {
  if (utf8ByteLength(JSON.stringify(session)) <= MAX_SESSION_JSON_BYTES) return session;

  let low = 3;
  let high = session.rounds.length - 1;
  const fits = (roundCount: number) =>
    utf8ByteLength(JSON.stringify({ ...session, rounds: session.rounds.slice(0, roundCount) })) <=
    MAX_SESSION_JSON_BYTES;

  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (fits(middle)) low = middle;
    else high = middle - 1;
  }

  if (!fits(low)) throw new Error('Game session cannot fit the 64 KiB bridge limit');
  return { ...session, rounds: session.rounds.slice(0, low) };
}

export async function prepareGameSession(): Promise<GameSessionV2> {
  const [level, languagePair, reducedMotion] = await Promise.all([
    getCurrentLevel(),
    getLanguagePair(),
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false),
  ]);
  const [vocabulary, learnedWordIds] = await Promise.all([
    getStoredVocabulary(level),
    getLearnedWords(level),
  ]);
  const uiLanguage = getResolvedAppLanguage();
  const session = buildGameSession({
    sessionId: Crypto.randomUUID(),
    level,
    nativeLanguage: languagePair?.native,
    targetLanguage: languagePair?.target,
    vocabulary,
    learnedWordIds,
    reducedMotion,
    theme: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
    uiLanguage,
    isRtl: isRTLLanguage(uiLanguage),
    uiText: resolveGameUiText(uiLanguage),
  });

  if (!validateGameSession(session)) throw new Error('Invalid game session generated');
  return fitSessionToBridge(session);
}

export async function prepareGameSessionJson(): Promise<string> {
  return JSON.stringify(await prepareGameSession());
}

export async function launchGameSession(): Promise<GameSessionV2> {
  const session = await prepareGameSession();
  const result = await openGame(JSON.stringify(session));
  if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
  return session;
}
