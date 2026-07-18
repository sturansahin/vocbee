import { useCallback, useEffect, useState } from 'react';
import type { Level, VocabularyWord } from '@features/vocabulary';
import type { HomeFacade } from '../../application/contracts';

interface WordActionOptions {
  facade: HomeFacade;
  word: VocabularyWord | undefined;
  level: Level;
  language: string;
  tutorialStep: number;
  tutorialVisible: boolean;
  setTutorialStep(step: number): void;
}

export function useWordActions(options: WordActionOptions) {
  const { facade, word, level, language, tutorialStep, tutorialVisible, setTutorialStep } = options;
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    let active = true;
    if (!word) {
      setIsFavorite(false);
      return () => {
        active = false;
      };
    }
    facade
      .isFavorite(word.id, level)
      .then((value) => {
        if (active) setIsFavorite(value);
      })
      .catch((error) => console.warn('[HomeScreen] Favorite state could not be loaded', error));
    return () => {
      active = false;
    };
  }, [facade, level, word]);

  const toggleFavorite = useCallback(async () => {
    if (!word) return;
    if (tutorialVisible && tutorialStep === 3) setTutorialStep(4);
    const next = await facade.toggleFavorite(word, level, isFavorite);
    setIsFavorite(next);
  }, [facade, isFavorite, level, setTutorialStep, tutorialStep, tutorialVisible, word]);

  const speakWord = useCallback(async () => {
    if (!word) return;
    if (tutorialVisible && tutorialStep === 4) setTutorialStep(5);
    await facade.speak(word.word, language);
  }, [facade, language, setTutorialStep, tutorialStep, tutorialVisible, word]);

  const speakExample = useCallback(async () => {
    if (!word) return;
    if (tutorialVisible && tutorialStep === 5) setTutorialStep(6);
    await facade.speak(word.sentence1, language);
  }, [facade, language, setTutorialStep, tutorialStep, tutorialVisible, word]);

  return { isFavorite, toggleFavorite, speakWord, speakExample };
}
