import { VOCABULARY_SCHEMA_VERSION } from '../domain/constants';
import { mergeVocabularyWords } from '../domain/rules';
import { LEVELS, type Level, type VocabularyWord } from '../domain/types';
import type { StoredVocabularyByLevel, VocabularyRepository } from '../data/contracts';

export class DefaultVocabularyService {
  private schemaSyncPromise: Promise<void> | null = null;

  constructor(private readonly repository: VocabularyRepository) {}

  async getLanguageVocabulary(language: string, level: Level): Promise<VocabularyWord[] | null> {
    try {
      const words = await this.repository.loadAssetWords(language, level);
      if (!words) console.warn(`No vocabulary data for ${language}_${level}`);
      return words;
    } catch (error) {
      console.error(`Error loading vocabulary for ${language}_${level}:`, error);
      return null;
    }
  }

  async mergeVocabulary(
    nativeLanguage: string,
    targetLanguage: string,
    level: Level,
  ): Promise<VocabularyWord[]> {
    const [targetWords, nativeWords] = await Promise.all([
      this.getLanguageVocabulary(targetLanguage, level),
      this.getLanguageVocabulary(nativeLanguage, level),
    ]);
    if (!targetWords) {
      console.warn(`No target vocabulary for ${targetLanguage}_${level}`);
      return [];
    }
    if (!nativeWords) console.warn(`No native vocabulary for ${nativeLanguage}_${level}`);
    return mergeVocabularyWords(targetWords, nativeWords);
  }

  private async writeGeneratedVocabulary(
    nativeLanguage: string,
    targetLanguage: string,
  ): Promise<void> {
    console.log(`Generating vocabulary: ${nativeLanguage} -> ${targetLanguage}`);
    await this.repository.setLanguagePair(nativeLanguage, targetLanguage);
    const entries: StoredVocabularyByLevel = {};
    for (const level of LEVELS) {
      const words = await this.mergeVocabulary(nativeLanguage, targetLanguage, level);
      entries[level] = words;
      console.log(`  ${level}: ${words.length} words`);
    }
    await this.repository.writeLevelWords(entries);
    await this.repository.removeLegacyVocabulary().catch(() => {});
    await this.repository.setSchemaVersion(VOCABULARY_SCHEMA_VERSION);
    console.log('Vocabulary saved to per-level storage');
  }

  async ensureVocabularySchemaCurrent(): Promise<void> {
    if (this.schemaSyncPromise) return this.schemaSyncPromise;
    this.schemaSyncPromise = (async () => {
      const storedVersion = await this.repository.getSchemaVersion();
      if (storedVersion === String(VOCABULARY_SCHEMA_VERSION)) return;
      if (!(await this.repository.hasStoredVocabulary())) {
        await this.repository.setSchemaVersion(VOCABULARY_SCHEMA_VERSION);
        return;
      }
      const pair = await this.repository.getLanguagePair();
      if (!pair) {
        console.warn('[Vocabulary] Schema upgrade skipped - language pair missing');
        return;
      }
      console.log(
        `[Vocabulary] Upgrading cached vocabulary schema ${storedVersion ?? 'unknown'} -> ${VOCABULARY_SCHEMA_VERSION}`,
      );
      await this.writeGeneratedVocabulary(pair.native, pair.target);
    })().finally(() => {
      this.schemaSyncPromise = null;
    });
    return this.schemaSyncPromise;
  }

  async generateVocabulary(nativeLanguage: string, targetLanguage: string): Promise<void> {
    try {
      await this.writeGeneratedVocabulary(nativeLanguage, targetLanguage);
    } catch (error) {
      console.error('Error generating vocabulary:', error);
      throw error;
    }
  }

  async getStoredVocabulary(level: Level): Promise<VocabularyWord[]> {
    try {
      await this.ensureVocabularySchemaCurrent();
      const perLevel = await this.repository.getLevelWords(level);
      if (perLevel) return perLevel;
      const legacy = await this.repository.getLegacyVocabulary();
      if (legacy) {
        console.log('Migrating vocabulary from legacy monolith key to per-level keys');
        await this.repository.writeLevelWords(legacy);
        await this.repository.removeLegacyVocabulary().catch(() => {});
        await this.repository.setSchemaVersion(VOCABULARY_SCHEMA_VERSION);
        return legacy[level] ?? [];
      }
      console.warn('No stored vocabulary found');
      return [];
    } catch (error) {
      console.error('Error getting stored vocabulary:', error);
      return [];
    }
  }

  async isVocabularyGenerated(): Promise<boolean> {
    try {
      return await this.repository.hasStoredVocabulary();
    } catch (error) {
      console.error('Error checking vocabulary:', error);
      return false;
    }
  }

  async getLanguagePair(): Promise<{ native: string; target: string } | null> {
    try {
      return await this.repository.getLanguagePair();
    } catch (error) {
      console.error('Error getting language pair:', error);
      return null;
    }
  }

  async clearVocabulary(): Promise<void> {
    try {
      await this.repository.clear();
      console.log('Vocabulary cleared (per-level + legacy)');
    } catch (error) {
      console.error('Error clearing vocabulary:', error);
    }
  }
}
