import { mergeVocabulary } from '@features/vocabulary';

import { DefaultLevelTestFacade } from '../application/DefaultLevelTestFacade';
import { AsyncStorageLevelTestPreferencesRepository } from '../data/AsyncStorageLevelTestPreferencesRepository';

export const levelTestFacade = new DefaultLevelTestFacade(
  new AsyncStorageLevelTestPreferencesRepository(),
  { getWords: mergeVocabulary },
);
