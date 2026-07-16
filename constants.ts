// Phase 9 removal target: compatibility-only public re-export.
export * from '@shared/theme';
export {
  getTTSLanguageCode,
  LANGUAGES,
  LEVELS,
  TTS_LANGUAGE_MAP,
} from '@shared/i18n';

// Level Test: Questions are now dynamically generated from vocabulary files
// via generateTestQuestions() in LevelTestScreen.tsx — supports all 21 languages.
