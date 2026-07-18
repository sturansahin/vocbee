// Pure .txt -> VocabularyWord[] adapter (docs/refactor-v2/37 §2).
import { parseVocabularyTxt } from '../wordAdapter';

describe('parseVocabularyTxt', () => {
  it('parses the asset shape { words: [...] }', () => {
    const raw = JSON.stringify({
      words: [
        {
          id: 1,
          word: 'Haus',
          pronunciation: '/haʊs/',
          translation: 'House',
          sentence1: 'a',
          sentence2: 'b',
          nativeSentence1: 'c',
          nativeSentence2: 'd',
        },
      ],
    });
    const words = parseVocabularyTxt(raw);
    expect(words).toHaveLength(1);
    expect(words[0]).toMatchObject({
      id: 1,
      word: 'Haus',
      translation: 'House',
      pronunciation: '/haʊs/',
    });
  });

  it('parses a bare array and defaults missing pronunciation to null', () => {
    const raw = JSON.stringify([
      {
        id: 2,
        word: 'el',
        translation: 'hand',
        sentence1: '',
        sentence2: '',
        nativeSentence1: '',
        nativeSentence2: '',
      },
    ]);
    const words = parseVocabularyTxt(raw);
    expect(words).toHaveLength(1);
    expect(words[0]).toMatchObject({ id: 2, word: 'el', translation: 'hand' });
    expect(words[0].pronunciation).toBeNull();
  });

  it('normalizes blank/whitespace pronunciation to null', () => {
    const raw = JSON.stringify([{ id: 3, word: 'x', translation: 'y', pronunciation: '   ' }]);
    expect(parseVocabularyTxt(raw)[0].pronunciation).toBeNull();
  });

  it('skips malformed rows (bad id / non-string word or translation)', () => {
    const raw = JSON.stringify([
      { id: 'x', word: 'a', translation: 'b' },
      { id: 4, word: 'ok', translation: 'fine' },
      { id: 5, word: 123, translation: 'z' },
    ]);
    const words = parseVocabularyTxt(raw);
    expect(words).toHaveLength(1);
    expect(words[0].id).toBe(4);
  });

  it('defaults missing sentences to empty strings', () => {
    const words = parseVocabularyTxt(JSON.stringify([{ id: 6, word: 'a', translation: 'b' }]));
    expect(words[0]).toMatchObject({
      sentence1: '',
      sentence2: '',
      nativeSentence1: '',
      nativeSentence2: '',
    });
  });

  it('returns [] for non-JSON / empty input without throwing', () => {
    expect(parseVocabularyTxt('not-json')).toEqual([]);
    expect(parseVocabularyTxt('')).toEqual([]);
  });
});
