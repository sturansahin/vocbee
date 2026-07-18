import { DefaultFavoritesScreenFacade } from '../FavoritesScreenFacade';
import type { FavoriteVocabularyWord, FavoritesScreenSource } from '../FavoritesScreenFacade';

const favorite: FavoriteVocabularyWord = {
  id: 7,
  level: 'B1',
  word: 'Haus',
  translation: 'Ev',
  sentence1: '',
  sentence2: '',
  nativeSentence1: '',
  nativeSentence2: '',
};

describe('DefaultFavoritesScreenFacade', () => {
  it('lists favorites and removes a level-aware item through the application boundary', async () => {
    const source: FavoritesScreenSource = {
      getFavorites: jest.fn(async () => [favorite]),
      removeFromFavorites: jest.fn(async () => undefined),
    };
    const facade = new DefaultFavoritesScreenFacade(source);

    await expect(facade.list()).resolves.toEqual([favorite]);
    await facade.remove(7, 'B1');
    expect(source.removeFromFavorites).toHaveBeenCalledWith(7, 'B1');
  });
});
