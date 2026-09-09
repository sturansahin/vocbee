import { isLevel, VOCABULARY_SCHEMA_VERSION, type Level } from '@features/vocabulary';

import catalogIds from '../generated/catalog-ids.json';
import catalogManifest from '../generated/catalog-manifest.json';

export const GAME_SESSION_SCHEMA_VERSION = 4 as const;
export const GAME_BRIDGE_VERSION = 1 as const;
export const GAME_CATALOG_VERSION = catalogManifest.catalogVersion;
export const GAME_CATALOG_HASH = catalogManifest.catalogHash;

export type GameUiTextV1 = {
  tapToPlay: string;
  readySubtitle: string;
  learnNewWords: string;
  reviewLearnedWords: string;
  notEnoughWords: string;
  wordLabel: string;
  comboTemplate: string;
  correctFeedback: string;
  wrongFeedback: string;
  swipeHint: string;
  pauseTitle: string;
  pauseSubtitle: string;
  resume: string;
  restart: string;
  returnHome: string;
  newRecord: string;
  runCompleted: string;
  scoreTemplate: string;
  bestScoreTemplate: string;
  bestComboTemplate: string;
  heartsTemplate: string;
  playAgain: string;
  startScreen: string;
  noHearts: string;
  wrongWord: string;
  heartsRenewed: string;
};

export type GameTheme = 'light' | 'dark';

export type GameSessionV4 = {
  schemaVersion: typeof GAME_SESSION_SCHEMA_VERSION;
  bridgeVersion: typeof GAME_BRIDGE_VERSION;
  vocabularySchemaVersion: typeof VOCABULARY_SCHEMA_VERSION;
  catalogVersion: number;
  catalogHash: string;
  sessionId: string;
  level: Level;
  nativeLanguage: string;
  targetLanguage: string;
  learnedWordIds: number[];
  reducedMotion?: boolean;
  theme?: GameTheme;
  uiLanguage?: string;
  isRtl?: boolean;
  uiText?: GameUiTextV1;
};

export type BuildGameSessionInput = {
  sessionId: string;
  level: Level;
  nativeLanguage?: string;
  targetLanguage?: string;
  learnedWordIds: readonly number[];
  reducedMotion?: boolean;
  theme?: GameTheme;
  uiLanguage: string;
  isRtl: boolean;
  uiText: GameUiTextV1;
};

const GAME_LANGUAGES = new Set(catalogManifest.languages);
const CATALOG_IDS: Record<Level, ReadonlySet<number>> = {
  A1: new Set(catalogIds.A1),
  A2: new Set(catalogIds.A2),
  B1: new Set(catalogIds.B1),
  B2: new Set(catalogIds.B2),
  C1: new Set(catalogIds.C1),
};
const REQUIRED_FIELDS = [
  'schemaVersion',
  'bridgeVersion',
  'vocabularySchemaVersion',
  'catalogVersion',
  'catalogHash',
  'sessionId',
  'level',
  'nativeLanguage',
  'targetLanguage',
  'learnedWordIds',
] as const;
const OPTIONAL_FIELDS = ['reducedMotion', 'theme', 'uiLanguage', 'isRtl', 'uiText'] as const;
const ALLOWED_FIELDS = new Set<string>([...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]);
const PLAIN_UI_TEXT_FIELDS = [
  'tapToPlay',
  'readySubtitle',
  'learnNewWords',
  'reviewLearnedWords',
  'notEnoughWords',
  'wordLabel',
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
  'playAgain',
  'startScreen',
  'noHearts',
  'wrongWord',
  'heartsRenewed',
] as const;
const TEMPLATE_UI_TEXT_FIELDS = {
  comboTemplate: ['count'],
  scoreTemplate: ['score'],
  bestScoreTemplate: ['score'],
  bestComboTemplate: ['count'],
  heartsTemplate: ['current', 'max'],
} as const;

function isBoundedText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && [...value].length <= maxLength;
}

function isValidTemplate(value: unknown, requiredTokens: readonly string[]): value is string {
  if (!isBoundedText(value, 180)) return false;
  const tokens = Array.from(value.matchAll(/\{([a-z]+)\}/g), (match) => match[1]);
  const remainder = value.replace(/\{[a-z]+\}/g, '');
  return (
    !remainder.includes('{') &&
    !remainder.includes('}') &&
    tokens.every((token) => requiredTokens.includes(token)) &&
    requiredTokens.every((token) => tokens.filter((candidate) => candidate === token).length === 1)
  );
}

export function validateGameUiText(value: unknown): value is GameUiTextV1 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const text = value as Record<string, unknown>;
  if (!PLAIN_UI_TEXT_FIELDS.every((field) => isBoundedText(text[field], 180))) return false;
  return Object.entries(TEMPLATE_UI_TEXT_FIELDS).every(([field, tokens]) =>
    isValidTemplate(text[field], tokens),
  );
}

export function getGameSessionValidationError(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'INVALID_OBJECT';
  const session = value as Record<string, unknown>;
  if (Object.keys(session).some((field) => !ALLOWED_FIELDS.has(field))) return 'UNKNOWN_FIELD';
  if (REQUIRED_FIELDS.some((field) => !(field in session))) return 'MISSING_FIELD';
  if (
    session.schemaVersion !== GAME_SESSION_SCHEMA_VERSION ||
    session.bridgeVersion !== GAME_BRIDGE_VERSION ||
    session.vocabularySchemaVersion !== VOCABULARY_SCHEMA_VERSION
  ) {
    return 'UNSUPPORTED_SCHEMA';
  }
  if (
    !Number.isSafeInteger(session.catalogVersion) ||
    (session.catalogVersion as number) <= 0 ||
    typeof session.catalogHash !== 'string' ||
    !/^[a-f0-9]{64}$/.test(session.catalogHash)
  ) {
    return 'INVALID_CATALOG_METADATA';
  }
  if (
    session.catalogVersion !== GAME_CATALOG_VERSION ||
    session.catalogHash !== GAME_CATALOG_HASH
  ) {
    return 'CATALOG_MISMATCH';
  }
  if (
    typeof session.sessionId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      session.sessionId,
    )
  ) {
    return 'INVALID_SESSION_ID';
  }
  if (!isLevel(session.level)) return 'UNSUPPORTED_LEVEL';
  if (
    typeof session.nativeLanguage !== 'string' ||
    typeof session.targetLanguage !== 'string' ||
    !GAME_LANGUAGES.has(session.nativeLanguage) ||
    !GAME_LANGUAGES.has(session.targetLanguage)
  ) {
    return 'UNSUPPORTED_LANGUAGE';
  }
  if (session.nativeLanguage === session.targetLanguage) return 'SAME_LANGUAGE_PAIR';
  if (!Array.isArray(session.learnedWordIds)) return 'INVALID_LEARNED_WORD_IDS';
  const learnedIds = session.learnedWordIds;
  if (
    learnedIds.some((id) => !Number.isSafeInteger(id) || (id as number) < 0) ||
    new Set(learnedIds).size !== learnedIds.length
  ) {
    return 'INVALID_LEARNED_WORD_IDS';
  }
  if (learnedIds.some((id) => !CATALOG_IDS[session.level as Level].has(id as number))) {
    return 'UNKNOWN_LEARNED_WORD_ID';
  }
  if ('reducedMotion' in session && typeof session.reducedMotion !== 'boolean') {
    return 'INVALID_PRESENTATION_METADATA';
  }
  if ('theme' in session && session.theme !== 'light' && session.theme !== 'dark') {
    return 'INVALID_PRESENTATION_METADATA';
  }
  if (
    'uiLanguage' in session &&
    (typeof session.uiLanguage !== 'string' || !/^[a-z]{2,3}$/.test(session.uiLanguage))
  ) {
    return 'INVALID_PRESENTATION_METADATA';
  }
  if ('isRtl' in session && typeof session.isRtl !== 'boolean') {
    return 'INVALID_PRESENTATION_METADATA';
  }
  if ('uiText' in session && !validateGameUiText(session.uiText)) {
    return 'INVALID_PRESENTATION_METADATA';
  }
  return null;
}

export function validateGameSession(value: unknown): value is GameSessionV4 {
  return getGameSessionValidationError(value) === null;
}

export function buildGameSession(input: BuildGameSessionInput): GameSessionV4 {
  const session: GameSessionV4 = {
    schemaVersion: GAME_SESSION_SCHEMA_VERSION,
    bridgeVersion: GAME_BRIDGE_VERSION,
    vocabularySchemaVersion: VOCABULARY_SCHEMA_VERSION,
    catalogVersion: GAME_CATALOG_VERSION,
    catalogHash: GAME_CATALOG_HASH,
    sessionId: input.sessionId,
    level: input.level,
    nativeLanguage: input.nativeLanguage?.trim() ?? '',
    targetLanguage: input.targetLanguage?.trim() ?? '',
    learnedWordIds: [...input.learnedWordIds].sort((left, right) => left - right),
    reducedMotion: input.reducedMotion ?? false,
    theme: input.theme ?? 'light',
    uiLanguage: input.uiLanguage.trim().toLowerCase(),
    isRtl: input.isRtl,
    uiText: { ...input.uiText },
  };
  const error = getGameSessionValidationError(session);
  if (error) throw new Error(`Invalid game session: ${error}`);
  return session;
}
