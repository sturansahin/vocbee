import * as Crypto from 'expo-crypto';
import { AccessibilityInfo, Appearance } from 'react-native';

import { getCurrentLevel, getLearnedWords } from '@features/progress';
import { getLanguagePair } from '@features/vocabulary';
import { getResolvedAppLanguage, i18n, isRTLLanguage } from '@shared/i18n';

import { openGame } from '../../../../modules/vocbee-unity';
import { buildGameSession, type GameSessionV4, type GameUiTextV1 } from '../domain/gameSession';
import { startGameEventCoordinator } from './gameEventCoordinator';

export const GAME_SESSION_JSON_BUDGET_BYTES = 32 * 1024;

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
  }
  return bytes;
}

const GAME_UI_TEXT_KEYS: readonly (keyof GameUiTextV1)[] = [
  'tapToPlay',
  'readySubtitle',
  'learnNewWords',
  'reviewLearnedWords',
  'notEnoughWords',
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

function stringifyGameSession(session: GameSessionV4): string {
  const json = JSON.stringify(session);
  const bytes = utf8ByteLength(json);
  if (bytes > GAME_SESSION_JSON_BUDGET_BYTES) {
    throw new Error(
      `Game session is ${bytes} bytes; maximum is ${GAME_SESSION_JSON_BUDGET_BYTES} bytes`,
    );
  }
  return json;
}

export async function prepareGameSession(): Promise<GameSessionV4> {
  const [level, languagePair, reducedMotion] = await Promise.all([
    getCurrentLevel(),
    getLanguagePair(),
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false),
  ]);
  const learnedWordIds = await getLearnedWords(level);
  const uiLanguage = getResolvedAppLanguage();
  return buildGameSession({
    sessionId: Crypto.randomUUID(),
    level,
    nativeLanguage: languagePair?.native,
    targetLanguage: languagePair?.target,
    learnedWordIds,
    reducedMotion,
    theme: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
    uiLanguage,
    isRtl: isRTLLanguage(uiLanguage),
    uiText: resolveGameUiText(uiLanguage),
  });
}

export async function prepareGameSessionJson(): Promise<string> {
  return stringifyGameSession(await prepareGameSession());
}

export async function launchGameSession(): Promise<GameSessionV4> {
  const session = await prepareGameSession();
  const sessionJson = stringifyGameSession(session);
  const stopEventCoordinator = startGameEventCoordinator(session);

  try {
    const result = await openGame(sessionJson);
    if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
    return session;
  } catch (error) {
    stopEventCoordinator();
    throw error;
  }
}
