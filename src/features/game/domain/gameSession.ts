import {
  isLevel,
  shuffleArray,
  VOCABULARY_SCHEMA_VERSION,
  type Level,
  type VocabularyWord,
} from '@features/vocabulary';

export const GAME_SESSION_SCHEMA_VERSION = 2 as const;
export const GAME_BRIDGE_VERSION = 1 as const;

export type GameUiTextV1 = {
  tapToPlay: string;
  readySubtitle: string;
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

export type GameChoiceV1 = {
  wordId: number;
  text: string;
};

export type GameRoundV1 = {
  roundId: string;
  wordId: number;
  prompt: string;
  choices: [GameChoiceV1, GameChoiceV1, GameChoiceV1];
  correctWordId: number;
};

export type GameTheme = 'light' | 'dark';

export type GameSessionV2 = {
  schemaVersion: typeof GAME_SESSION_SCHEMA_VERSION;
  bridgeVersion: typeof GAME_BRIDGE_VERSION;
  vocabularySchemaVersion: typeof VOCABULARY_SCHEMA_VERSION;
  sessionId: string;
  level: Level;
  nativeLanguage: string;
  targetLanguage: string;
  reducedMotion: boolean;
  theme: GameTheme;
  uiLanguage: string;
  isRtl: boolean;
  uiText: GameUiTextV1;
  contentState: 'ready' | 'placeholder';
  rounds: GameRoundV1[];
};

export type BuildGameSessionInput = {
  sessionId: string;
  level: Level;
  nativeLanguage?: string;
  targetLanguage?: string;
  vocabulary: VocabularyWord[];
  learnedWordIds: number[];
  reducedMotion?: boolean;
  theme?: GameTheme;
  uiLanguage: string;
  isRtl: boolean;
  uiText: GameUiTextV1;
  random?: () => number;
};

type PreparedWord = VocabularyWord & {
  word: string;
  translation: string;
  normalizedWord: string;
  normalizedTranslation: string;
};

function normalizeLabel(value: string): string {
  return value.trim().normalize('NFKC').toLowerCase();
}

function prepareLearnedWords(
  vocabulary: VocabularyWord[],
  learnedWordIds: number[],
): PreparedWord[] {
  const learnedIds = new Set(learnedWordIds);
  const seenIds = new Set<number>();
  const seenLabels = new Set<string>();
  const prepared: PreparedWord[] = [];

  for (const candidate of vocabulary) {
    const word = candidate.word.trim();
    const translation = candidate.translation.trim();
    const normalizedWord = normalizeLabel(word);
    const normalizedTranslation = normalizeLabel(translation);

    if (
      !learnedIds.has(candidate.id) ||
      !Number.isSafeInteger(candidate.id) ||
      candidate.id < 0 ||
      !normalizedWord ||
      !normalizedTranslation ||
      seenIds.has(candidate.id) ||
      seenLabels.has(normalizedWord)
    ) {
      continue;
    }

    seenIds.add(candidate.id);
    seenLabels.add(normalizedWord);
    prepared.push({
      ...candidate,
      word,
      translation,
      normalizedWord,
      normalizedTranslation,
    });
  }

  return prepared;
}

function distractorsFor(target: PreparedWord, words: PreparedWord[]): PreparedWord[] {
  return words.filter(
    (candidate) =>
      candidate.id !== target.id &&
      candidate.normalizedWord !== target.normalizedWord &&
      candidate.normalizedTranslation !== target.normalizedTranslation,
  );
}

function placeholderSession(input: BuildGameSessionInput): GameSessionV2 {
  return {
    schemaVersion: GAME_SESSION_SCHEMA_VERSION,
    bridgeVersion: GAME_BRIDGE_VERSION,
    vocabularySchemaVersion: VOCABULARY_SCHEMA_VERSION,
    sessionId: input.sessionId,
    level: input.level,
    nativeLanguage: input.nativeLanguage?.trim() ?? '',
    targetLanguage: input.targetLanguage?.trim() ?? '',
    reducedMotion: input.reducedMotion ?? false,
    theme: input.theme ?? 'light',
    uiLanguage: input.uiLanguage.trim().toLowerCase(),
    isRtl: input.isRtl,
    uiText: { ...input.uiText },
    contentState: 'placeholder',
    rounds: [],
  };
}

export function buildGameSession(input: BuildGameSessionInput): GameSessionV2 {
  const random = input.random ?? Math.random;
  const nativeLanguage = input.nativeLanguage?.trim() ?? '';
  const targetLanguage = input.targetLanguage?.trim() ?? '';
  const words = prepareLearnedWords(input.vocabulary, input.learnedWordIds);
  const viableTargets = words.filter((target) => distractorsFor(target, words).length >= 2);

  if (!nativeLanguage || !targetLanguage || viableTargets.length < 3) {
    return placeholderSession(input);
  }

  const targets = shuffleArray(viableTargets, random);
  const correctLanes = shuffleArray(
    targets.map((_, index) => index % 3),
    random,
  );
  const rounds = targets.map((target, index): GameRoundV1 => {
    const [firstDistractor, secondDistractor] = shuffleArray(
      distractorsFor(target, words),
      random,
    ).slice(0, 2);
    const correctChoice: GameChoiceV1 = { wordId: target.id, text: target.word };
    const firstChoice: GameChoiceV1 = {
      wordId: firstDistractor.id,
      text: firstDistractor.word,
    };
    const secondChoice: GameChoiceV1 = {
      wordId: secondDistractor.id,
      text: secondDistractor.word,
    };
    const correctLane = correctLanes[index];
    const choices: GameRoundV1['choices'] =
      correctLane === 0
        ? [correctChoice, firstChoice, secondChoice]
        : correctLane === 1
          ? [firstChoice, correctChoice, secondChoice]
          : [firstChoice, secondChoice, correctChoice];

    return {
      roundId: `${input.sessionId}:${index}`,
      wordId: target.id,
      prompt: target.translation,
      choices,
      correctWordId: target.id,
    };
  });

  return {
    ...placeholderSession(input),
    nativeLanguage,
    targetLanguage,
    contentState: 'ready',
    rounds,
  };
}

function isBoundedText(value: unknown, maxLength: number, allowEmpty = false): value is string {
  if (typeof value !== 'string' || [...value].length > maxLength) return false;
  return allowEmpty || value.trim().length > 0;
}

function isSafeWordId(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

const PLAIN_UI_TEXT_FIELDS = [
  'tapToPlay',
  'readySubtitle',
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
  if (!value || typeof value !== 'object') return false;
  const text = value as Record<string, unknown>;
  if (!PLAIN_UI_TEXT_FIELDS.every((field) => isBoundedText(text[field], 180))) return false;
  return Object.entries(TEMPLATE_UI_TEXT_FIELDS).every(([field, tokens]) =>
    isValidTemplate(text[field], tokens),
  );
}

function isValidRound(value: unknown, roundIds: Set<string>): value is GameRoundV1 {
  if (!value || typeof value !== 'object') return false;
  const round = value as Partial<GameRoundV1>;
  if (
    !isBoundedText(round.roundId, 140) ||
    roundIds.has(round.roundId) ||
    !isSafeWordId(round.wordId) ||
    !isSafeWordId(round.correctWordId) ||
    !isBoundedText(round.prompt, 80) ||
    !Array.isArray(round.choices) ||
    round.choices.length !== 3
  ) {
    return false;
  }

  roundIds.add(round.roundId);
  const choiceIds = new Set<number>();
  const choiceLabels = new Set<string>();
  for (const choice of round.choices) {
    if (
      !choice ||
      typeof choice !== 'object' ||
      !isSafeWordId(choice.wordId) ||
      !isBoundedText(choice.text, 80)
    ) {
      return false;
    }
    const normalized = normalizeLabel(choice.text);
    if (choiceIds.has(choice.wordId) || choiceLabels.has(normalized)) return false;
    choiceIds.add(choice.wordId);
    choiceLabels.add(normalized);
  }

  return choiceIds.has(round.correctWordId) && round.wordId === round.correctWordId;
}

export function validateGameSession(value: unknown): value is GameSessionV2 {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<GameSessionV2>;
  if (
    session.schemaVersion !== GAME_SESSION_SCHEMA_VERSION ||
    session.bridgeVersion !== GAME_BRIDGE_VERSION ||
    session.vocabularySchemaVersion !== VOCABULARY_SCHEMA_VERSION ||
    !isBoundedText(session.sessionId, 100) ||
    !isLevel(session.level) ||
    typeof session.reducedMotion !== 'boolean' ||
    (session.theme !== 'light' && session.theme !== 'dark') ||
    !isBoundedText(session.uiLanguage, 12) ||
    !/^[a-z]{2,3}$/.test(session.uiLanguage) ||
    typeof session.isRtl !== 'boolean' ||
    !validateGameUiText(session.uiText) ||
    (session.contentState !== 'ready' && session.contentState !== 'placeholder') ||
    !Array.isArray(session.rounds) ||
    !isBoundedText(session.nativeLanguage, 50, session.contentState === 'placeholder') ||
    !isBoundedText(session.targetLanguage, 50, session.contentState === 'placeholder')
  ) {
    return false;
  }

  if (session.contentState === 'placeholder') return session.rounds.length === 0;
  if (session.rounds.length < 3) return false;

  const roundIds = new Set<string>();
  return session.rounds.every((round) => isValidRound(round, roundIds));
}
