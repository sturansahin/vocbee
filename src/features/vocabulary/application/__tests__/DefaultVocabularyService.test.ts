import { DefaultVocabularyService } from '../DefaultVocabularyService';
import type { StoredVocabularyByLevel, VocabularyRepository } from '../../data/contracts';
import type { Level, VocabularyWord } from '../../domain/types';

const word = (id: number, value: string): VocabularyWord => ({
  id,
  word: value,
  pronunciation: null,
  translation: value,
  sentence1: `${value} one`,
  sentence2: `${value} two`,
  nativeSentence1: `${value} one`,
  nativeSentence2: `${value} two`,
});

class FakeRepository implements VocabularyRepository {
  assets = new Map<string, VocabularyWord[]>();
  levels: StoredVocabularyByLevel = {};
  legacy: StoredVocabularyByLevel | null = null;
  pair: { native: string; target: string } | null = null;
  version: string | null = '2';
  removedLegacy = false;
  loadAssetWords(language: string, level: Level) {
    return Promise.resolve(this.assets.get(`${language}_${level}`) ?? null);
  }
  getSchemaVersion() {
    return Promise.resolve(this.version);
  }
  setSchemaVersion(version: number) {
    this.version = String(version);
    return Promise.resolve();
  }
  hasStoredVocabulary() {
    return Promise.resolve(Object.keys(this.levels).length > 0 || this.legacy !== null);
  }
  getLanguagePair() {
    return Promise.resolve(this.pair);
  }
  setLanguagePair(native: string, target: string) {
    this.pair = { native, target };
    return Promise.resolve();
  }
  getLevelWords(level: Level) {
    return Promise.resolve(this.levels[level] ?? null);
  }
  getLegacyVocabulary() {
    return Promise.resolve(this.legacy);
  }
  writeLevelWords(entries: StoredVocabularyByLevel) {
    this.levels = { ...this.levels, ...entries };
    return Promise.resolve();
  }
  removeLegacyVocabulary() {
    this.legacy = null;
    this.removedLegacy = true;
    return Promise.resolve();
  }
  clear() {
    this.levels = {};
    this.legacy = null;
    return Promise.resolve();
  }
}

describe('DefaultVocabularyService', () => {
  it('merges target/native assets by id and normalizes pronunciation', async () => {
    const repository = new FakeRepository();
    repository.assets.set('english_A1', [{ ...word(1, 'one'), pronunciation: ' /wʌn/ ' }]);
    repository.assets.set('turkish_A1', [word(1, 'bir')]);
    const result = await new DefaultVocabularyService(repository).mergeVocabulary(
      'turkish',
      'english',
      'A1',
    );
    expect(result[0]).toMatchObject({
      id: 1,
      word: 'one',
      translation: 'bir',
      pronunciation: '/wʌn/',
    });
  });

  it('returns the per-level cache before legacy fallback', async () => {
    const repository = new FakeRepository();
    repository.levels.A1 = [word(1, 'cached')];
    repository.legacy = { A1: [word(2, 'legacy')] };
    await expect(
      new DefaultVocabularyService(repository).getStoredVocabulary('A1'),
    ).resolves.toEqual([word(1, 'cached')]);
    expect(repository.removedLegacy).toBe(false);
  });

  it('migrates the legacy monolith cache without changing its words', async () => {
    const repository = new FakeRepository();
    repository.legacy = { A1: [word(7, 'legacy')] };
    const result = await new DefaultVocabularyService(repository).getStoredVocabulary('A1');
    expect(result).toEqual([word(7, 'legacy')]);
    expect(repository.levels.A1).toEqual(result);
    expect(repository.removedLegacy).toBe(true);
    expect(repository.version).toBe('2');
  });
});
