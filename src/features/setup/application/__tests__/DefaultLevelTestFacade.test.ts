import type { Level, VocabularyWord } from '@features/vocabulary';

import { DefaultLevelTestFacade } from '../DefaultLevelTestFacade';
import type {
  LevelTestPreferencesRepository,
  LevelTestVocabularySource,
} from '../levelTestContracts';

const words = (level: Level): VocabularyWord[] => [1, 2, 3, 4].map(id => ({
  id: Number(`${level.charCodeAt(0)}${id}`),
  word: `${level}-word-${id}`,
  translation: `${level}-translation-${id}`,
  sentence1: '',
  sentence2: '',
  nativeSentence1: '',
  nativeSentence2: '',
}));

function makeFacade() {
  const preferences: LevelTestPreferencesRepository = {
    getStoredLanguages: jest.fn(async () => ({
      nativeLanguage: 'turkish',
      targetLanguage: 'english',
    })),
  };
  const vocabulary: LevelTestVocabularySource = {
    getWords: jest.fn(async (_native, _target, level) => words(level)),
  };
  return {
    facade: new DefaultLevelTestFacade(preferences, vocabulary, () => 0),
    preferences,
    vocabulary,
  };
}

describe('DefaultLevelTestFacade', () => {
  it('generates all seven questions from route languages', async () => {
    const { facade, preferences, vocabulary } = makeFacade();
    const questions = await facade.loadQuestions({
      nativeLanguage: 'turkish',
      targetLanguage: 'english',
    });

    expect(questions).toHaveLength(7);
    expect(vocabulary.getWords).toHaveBeenCalledTimes(5);
    expect(preferences.getStoredLanguages).not.toHaveBeenCalled();
  });

  it('loads persisted languages when route persistence is unavailable', async () => {
    const { facade, preferences } = makeFacade();
    await expect(facade.loadQuestions()).resolves.toHaveLength(7);
    expect(preferences.getStoredLanguages).toHaveBeenCalledTimes(1);
  });

  it('reports generation failure when no level can provide questions', async () => {
    const { facade, vocabulary } = makeFacade();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.mocked(vocabulary.getWords).mockRejectedValue(new Error('asset unavailable'));

    await expect(facade.loadQuestions({
      nativeLanguage: 'turkish',
      targetLanguage: 'english',
    })).rejects.toThrow('No questions generated');
    expect(errorSpy).toHaveBeenCalledTimes(5);
    errorSpy.mockRestore();
  });
});
