import { DefaultVocabularyService } from '../application/DefaultVocabularyService';
import { AssetVocabularyRepository } from '../data/repositories/AssetVocabularyRepository';
import type { Level } from '../domain/types';

const service = new DefaultVocabularyService(new AssetVocabularyRepository());

export const getLanguageVocabulary = (language: string, level: Level) => service.getLanguageVocabulary(language, level);
export const mergeVocabulary = (nativeLanguage: string, targetLanguage: string, level: Level) => service.mergeVocabulary(nativeLanguage, targetLanguage, level);
export const ensureVocabularySchemaCurrent = () => service.ensureVocabularySchemaCurrent();
export const generateVocabulary = (nativeLanguage: string, targetLanguage: string) => service.generateVocabulary(nativeLanguage, targetLanguage);
export const getStoredVocabulary = (level: Level) => service.getStoredVocabulary(level);
export const isVocabularyGenerated = () => service.isVocabularyGenerated();
export const getLanguagePair = () => service.getLanguagePair();
export const clearVocabulary = () => service.clearVocabulary();
